import os
import sys
import argparse
import requests
import json
from pathlib import Path
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time
import random
import signal

# Thread-safe lock for file writes
write_lock = threading.Lock()
shutdown_event = threading.Event()

def get_filename_from_cd(content_disposition):
    if not content_disposition:
        return None
    # Look for filename* (RFC 5987) or filename
    fname = re.findall(r"filename\*?=['\"]?(?:UTF-8'')?([^;\"']+)['\"]?", content_disposition)
    if fname:
        return requests.utils.unquote(fname[0])
    return None

def get_metadata_title(pdf_content):
    try:
        import fitz
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        title = doc.metadata.get("title")
        doc.close()
        if title and title.strip():
            return title.strip()
    except Exception:
        pass
    return None

def download_document(i, total, item, output_dir, tracking_file, downloaded_ids, max_retries=5):
    if shutdown_event.is_set():
        return "interrupted"

    doc_id = item.get("_id")
    if not doc_id:
        return False
    
    if doc_id in downloaded_ids:
        return "skipped"

    pdf_url = f"https://ccms.coursedog.com/api/v1/sy/smu_peoplesoft/documents/{doc_id}/pdf"
    
    attempt = 0
    while attempt <= max_retries:
        if shutdown_event.is_set():
            return "interrupted"

        try:
            res = requests.get(pdf_url, stream=True, timeout=30)
            
            # If we hit a rate limit (429) or server error (5xx), we should retry
            if res.status_code == 429 or 500 <= res.status_code < 600:
                res.raise_for_status() # Trigger the except block
            
            res.raise_for_status()
            
            cd_header = res.headers.get("Content-Disposition")
            filename = get_filename_from_cd(cd_header)
            
            content = res.content
            if not filename:
                filename = get_metadata_title(content)
            
            if not filename:
                filename = f"{doc_id}.pdf"
            
            if not filename.lower().endswith(".pdf"):
                filename += ".pdf"
            
            # Sanitize filename for writing to disk
            filename = re.sub(r'[\s]+', ' ', filename).strip()
            filename = re.sub(r'\s+-\s*|\s*-\s+|_+\s+|\s+_+', '_', filename)
            filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
            
            # Smart Parsing: Split by spaces and underscores to find Course and Term
            parts = [p.strip().upper() for p in re.split(r'[\s_]+', re.sub(r'\.pdf$', '', filename, flags=re.IGNORECASE)) if p.strip()]
            
            term = "Unknown_Term"
            course = "Unknown_Course"
            
            for p in parts:
                # Match Standard Term (e.g., 2410, 2532, 2233)
                if re.match(r'^2[0-9]{3}$', p):
                    term = p
                # Match Complex Term (e.g., AY2526, AY2025-26, 2025FA)
                elif re.match(r'^AY\d{2,4}', p) or re.match(r'^20\d{2}[A-Z]{2}$', p):
                    term = p
                # Match Course (e.g., MGMT6070, IS105S, COR-CS2232, FNCE305)
                elif re.match(r'^[A-Z]{2,5}-?[A-Z]*\d{2,4}[A-Z]?$', p):
                    # Ensure we aren't accidentally catching a term like AY2526 as a course
                    if not p.startswith("AY2") and not p.startswith("202"):
                        course = p
            
            # Normalize Term string for the folder name
            term_folder = term
            if len(term) >= 3 and term[:2].isdigit() and not term.startswith("AY"):
                year = "20" + term[:2]
                t_digit = term[2:3]
                if t_digit.isdigit():
                    term_folder = f"{year} Term {t_digit}"
                else:
                    term_folder = year
            
            # Target Structure: Output / Course / Term
            if course != "Unknown_Course":
                target_subfolder = output_dir / course / term_folder
            else:
                target_subfolder = output_dir / "Unsorted"

            with write_lock:
                target_subfolder.mkdir(parents=True, exist_ok=True)
                
            file_path = target_subfolder / filename
            
            if file_path.exists():
                with write_lock:
                    if doc_id not in downloaded_ids:
                        downloaded_ids.add(doc_id)
                        with open(tracking_file, "a") as f:
                            f.write(f"{doc_id}\n")
                return "skipped"

            if shutdown_event.is_set():
                return "interrupted"

            with open(file_path, "wb") as f:
                f.write(content)
            
            with write_lock:
                with open(tracking_file, "a") as f:
                    f.write(f"{doc_id}\n")
                downloaded_ids.add(doc_id)
                
            return f"Saved: {file_path.name}"
            
        except (requests.exceptions.RequestException, ConnectionResetError) as e:
            attempt += 1
            if attempt > max_retries or shutdown_event.is_set():
                return f"Error: Max retries exceeded ({e})" if not shutdown_event.is_set() else "interrupted"
            
            wait_time = (2 ** attempt) + (random.uniform(0, 1))
            if hasattr(e, 'response') and e.response is not None and e.response.status_code == 429:
                wait_time += 10 
            
            # Sleep in small increments to remain responsive to shutdown_event
            for _ in range(int(wait_time * 10)):
                if shutdown_event.is_set():
                    break
                time.sleep(0.1)
            continue
        except Exception as e:
            return f"Error: {e}"

def main():
    parser = argparse.ArgumentParser(description="SMU Course PDF Scraper")
    parser.add_argument("--output-dir", default="Y:/courses", help="Directory to save PDFs")
    parser.add_argument("--restart", action="store_true", help="Restart from scratch (clear history)")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of downloads (0 for no limit)")
    parser.add_argument("--workers", type=int, default=10, help="Number of parallel downloads")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    try:
        output_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"Error creating directory {output_dir}: {e}")
        output_dir = Path("downloads")
        output_dir.mkdir(exist_ok=True)

    tracking_file = output_dir / "downloaded_pdfs.txt"
    if args.restart and tracking_file.exists():
        tracking_file.unlink()
    
    # Prompt for number of workers if not explicitly provided as a command line arg
    # Note: We check if it's default 10 to see if user might want to override via menu
    # But to be cleaner, let's just always ask if running interactively
    try:
        worker_input = input("\nHow many parallel tracks? (default 10): ").strip()
        if worker_input:
            args.workers = int(worker_input)
    except (ValueError, EOFError):
        pass # Keep default

    downloaded_ids = set()
    if tracking_file.exists():
        with open(tracking_file, "r") as f:
            downloaded_ids = set(line.strip() for line in f if line.strip())

    print(f"Fetching document list...")
    api_url = "https://ccms.coursedog.com/api/v1/sy/smu_peoplesoft/documents/"
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json().get("data", [])
    except Exception as e:
        print(f"Error fetching document list: {e}")
        return

    total = len(data)
    print(f"Found {total} documents.")

    all_available_file = output_dir / "all_available_pdfs.txt"
    all_ids = [item.get("_id") for item in data if item.get("_id")]
    existing_all = set()
    if all_available_file.exists():
        with open(all_available_file, "r") as f:
            existing_all = set(line.strip() for line in f if line.strip())
    new_all = existing_all.union(set(all_ids))
    with open(all_available_file, "w") as f:
        for id_val in sorted(new_all):
            f.write(f"{id_val}\n")

    print(f"Starting parallel download with {args.workers} workers...")
    
    download_queue = []
    if args.limit > 0:
        current_count = 0
        for item in data:
            if current_count >= args.limit:
                break
            doc_id = item.get("_id")
            if doc_id not in downloaded_ids:
                download_queue.append(item)
                current_count += 1
    else:
        download_queue = [item for item in data if item.get("_id") not in downloaded_ids]

    total_to_download = len(download_queue)
    if total_to_download == 0:
        print("Everything already downloaded.")
        return

    print(f"Queued {total_to_download} new documents. (Ctrl+C to stop)")

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(download_document, i, total, item, output_dir, tracking_file, downloaded_ids): (i, item.get("_id")) for i, item in enumerate(download_queue, 1)}
        
        try:
            completed = 0
            for future in as_completed(futures):
                if shutdown_event.is_set():
                    break
                i, doc_id = futures[future]
                result = future.result()
                completed += 1
                
                if result == "skipped":
                    pass
                elif result == "interrupted":
                    pass
                elif result.startswith("Saved:"):
                    print(f"[{completed}/{total_to_download}] {result}")
                elif result.startswith("Error:"):
                    print(f"[{completed}/{total_to_download}] Error downloading {doc_id}: {result[7:]}")
        except KeyboardInterrupt:
            print("\n[!] Ctrl+C detected. Shutting down gracefully...")
            shutdown_event.set()
            # Python 3.9+ can cancel pending futures
            executor.shutdown(wait=False, cancel_futures=True)
            print("Cleanup complete. Some active threads may take a few seconds to exit.")

    if not shutdown_event.is_set():
        print("\nProcess complete!")
    else:
        print("\nProcess stopped by user.")

if __name__ == "__main__":
    main()
