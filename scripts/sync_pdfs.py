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
COURSES_JSON_PATH = ROOT_DIR / "data" / "processed" / "courses.json"
PDF_DIR = ROOT_DIR / "web" / "public" / "pdfs"

def download_and_validate_pdf(url: str, course_id: str) -> bytes:
    """
    Downloads a PDF securely, validating size and magic bytes.
    Returns the file bytes if valid, or None if it fails security checks.
    """
    try:
        # Pre-flight check: Headers
        with requests.get(url, stream=True, timeout=10) as r:
            r.raise_for_status()
            
            # 1. Content-Length Header check
            content_length = r.headers.get("Content-Length")
            if content_length and int(content_length) > MAX_FILE_SIZE_BYTES:
                print(f"⚠️ SKIPPED {course_id}: Header claims size > 5MB ({content_length} bytes)")
                return None

            downloaded_bytes = bytearray()
            
            # 2. Streaming check
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    downloaded_bytes.extend(chunk)
                    if len(downloaded_bytes) > MAX_FILE_SIZE_BYTES:
                        print(f"⚠️ ABORTED {course_id}: Stream exceeded 5MB limit! Possible zip bomb.")
                        return None
            
            file_data = bytes(downloaded_bytes)

            # 3. Magic Bytes check
            if not file_data.startswith(PDF_MAGIC_BYTES):
                print(f"⚠️ REJECTED {course_id}: File does not start with %PDF magic bytes.")
                return None

            return file_data

    except Exception as e:
        print(f"❌ ERROR downloading {course_id}: {str(e)}")
        return None

def main():
    print("🚀 Starting Secure PDF Sync Pipeline (Local Storage)")
    
    if not COURSES_JSON_PATH.exists():
        print(f"❌ ERROR: Cannot find courses.json at {COURSES_JSON_PATH}")
        return

    # Create the target directory if it doesn't exist
    os.makedirs(PDF_DIR, exist_ok=True)

    with open(COURSES_JSON_PATH, "r", encoding="utf-8") as f:
        courses = json.load(f)

    total_bytes_processed = 0
    success_count = 0
    skip_count = 0

    print(f"📦 Found {len(courses)} courses to process.")
    
    for course in courses:
        course_id = course.get("id")
        pdf_url = course.get("documents", {}).get("url")

        if not pdf_url:
            continue

        target_path = PDF_DIR / f"{course_id}.pdf"
        
        # Skip if already downloaded
        if target_path.exists():
            print(f"⏭️ SKIPPED {course_id}: Already exists locally.")
            continue

        print(f"Processing {course_id}...", end=" ", flush=True)

        # Download securely
        pdf_bytes = download_and_validate_pdf(pdf_url, course_id)
        
        if pdf_bytes:
            # Save to local file
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

        # Rate limit
        time.sleep(DELAY_BETWEEN_REQUESTS)

    print("\n🎉 Pipeline Complete!")
    print(f"Successfully downloaded: {success_count} PDFs")
    print(f"Skipped/Rejected/Existing: {skip_count}")
    print(f"Total New Storage Used: {total_bytes_processed / (1024*1024):.2f} MB")

if __name__ == "__main__":
    main()
