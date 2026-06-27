import os
import json
import time
import requests
from pathlib import Path

# --- CONFIGURATION & FAILSAFES ---
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024       # 5 MB anti-zip bomb cap
DELAY_BETWEEN_REQUESTS = 0.5                # 0.5s rate limit
PDF_MAGIC_BYTES = b"%PDF"                   # Standard PDF header

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DOCUMENTS_JSON_PATH = ROOT_DIR / "data" / "documents_raw.json"
PDF_DIR = ROOT_DIR / "web" / "public" / "pdfs"

def download_and_validate_pdf(url: str, doc_id: str) -> bytes:
    """
    Downloads a PDF securely, validating size and magic bytes.
    """
    try:
        with requests.get(url, stream=True, timeout=10) as r:
            r.raise_for_status()
            
            content_length = r.headers.get("Content-Length")
            if content_length and int(content_length) > MAX_FILE_SIZE_BYTES:
                print(f"⚠️ SKIPPED {doc_id}: Size > 5MB ({content_length} bytes)")
                return None

            downloaded_bytes = bytearray()
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    downloaded_bytes.extend(chunk)
                    if len(downloaded_bytes) > MAX_FILE_SIZE_BYTES:
                        print(f"⚠️ ABORTED {doc_id}: Stream exceeded 5MB limit!")
                        return None
            
            file_data = bytes(downloaded_bytes)
            if not file_data.startswith(PDF_MAGIC_BYTES):
                print(f"⚠️ REJECTED {doc_id}: File does not start with %PDF")
                return None

            return file_data

    except Exception as e:
        print(f"❌ ERROR downloading {doc_id}: {str(e)}")
        return None

def main():
    print("🚀 Starting Secure PDF Sync Pipeline (Local Storage)")
    
    if not DOCUMENTS_JSON_PATH.exists():
        print(f"❌ ERROR: Cannot find documents_raw.json at {DOCUMENTS_JSON_PATH}")
        return

    os.makedirs(PDF_DIR, exist_ok=True)

    with open(DOCUMENTS_JSON_PATH, "r", encoding="utf-8") as f:
        documents = json.load(f)

    total_bytes_processed = 0
    success_count = 0
    skip_count = 0

    print(f"📦 Found {len(documents)} document records to process.")
    
    for doc in documents:
        doc_id = doc.get("_id")
        if not doc_id:
            continue
            
        pdf_url = f"https://ccms.coursedog.com/api/v1/sy/smu_peoplesoft/documents/{doc_id}/pdf"
        target_path = PDF_DIR / f"{doc_id}.pdf"
        
        # Skip if already downloaded
        if target_path.exists():
            print(f"⏭️ SKIPPED {doc_id}: Already exists locally.")
            skip_count += 1
            continue

        print(f"Processing {doc_id}...", end=" ", flush=True)

        pdf_bytes = download_and_validate_pdf(pdf_url, doc_id)
        
        if pdf_bytes:
            file_size = len(pdf_bytes)
            total_bytes_processed += file_size
            
            try:
                with open(target_path, "wb") as f:
                    f.write(pdf_bytes)
                print(f"✅ Saved ({file_size / 1024:.1f} KB)")
                success_count += 1
            except Exception as e:
                print(f"❌ Save failed: {str(e)}")
        else:
            skip_count += 1

        time.sleep(DELAY_BETWEEN_REQUESTS)

    print("\n🎉 Pipeline Complete!")
    print(f"Successfully downloaded: {success_count} PDFs")
    print(f"Skipped/Rejected/Existing: {skip_count}")
    print(f"Total New Storage Used: {total_bytes_processed / (1024*1024):.2f} MB")

if __name__ == "__main__":
    main()
