import os
import json
import time
import requests
import boto3
from botocore.client import Config
from pathlib import Path
from dotenv import load_dotenv

# --- CONFIGURATION & FAILSAFES ---
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024       # 5 MB anti-zip bomb cap
MAX_GLOBAL_SIZE_BYTES = int(1.5 * 1024 * 1024 * 1024) # 1.5 GB global cap for R2 bucket
DELAY_BETWEEN_REQUESTS = 0.5                # 0.5s rate limit
PDF_MAGIC_BYTES = b"%PDF"                   # Standard PDF header

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT_DIR / "web" / ".env.local"
COURSES_JSON_PATH = ROOT_DIR / "data" / "processed" / "courses.json"

# Load environment variables
load_dotenv(ENV_PATH)

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")

if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME]):
    print("❌ ERROR: Missing R2 credentials in web/.env.local")
    exit(1)

# Initialize R2 client via Boto3
s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4"),
)

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
    print("🚀 Starting Secure PDF Sync Pipeline to Cloudflare R2")
    
    if not COURSES_JSON_PATH.exists():
        print(f"❌ ERROR: Cannot find courses.json at {COURSES_JSON_PATH}")
        return

    with open(COURSES_JSON_PATH, "r", encoding="utf-8") as f:
        courses = json.load(f)

    total_bytes_processed = 0
    success_count = 0
    skip_count = 0

    print(f"📦 Found {len(courses)} courses to process.")
    
    for course in courses:
        # 1. Global Failsafe Check
        if total_bytes_processed > MAX_GLOBAL_SIZE_BYTES:
            print("🚨 CRITICAL: Global limit of 2GB reached! Terminating pipeline to protect billing limits.")
            break

        course_id = course.get("id")
        pdf_url = course.get("documents", {}).get("url")

        if not pdf_url:
            continue

        print(f"Processing {course_id}...", end=" ", flush=True)

        # Download securely
        pdf_bytes = download_and_validate_pdf(pdf_url, course_id)
        
        if pdf_bytes:
            # Update global tracker
            file_size = len(pdf_bytes)
            total_bytes_processed += file_size

            # Upload to R2
            object_key = f"syllabi/{course_id}.pdf"
            try:
                s3.put_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=object_key,
                    Body=pdf_bytes,
                    ContentType="application/pdf"
                )
                print(f"✅ Uploaded ({file_size / 1024:.1f} KB) - Total: {total_bytes_processed / (1024*1024):.2f} MB")
                success_count += 1
            except Exception as e:
                print(f"❌ Upload failed: {str(e)}")
        else:
            skip_count += 1

        # Rate limit
        time.sleep(DELAY_BETWEEN_REQUESTS)

    print("\n🎉 Pipeline Complete!")
    print(f"Successfully uploaded: {success_count} PDFs")
    print(f"Skipped/Rejected: {skip_count}")
    print(f"Total Storage Used: {total_bytes_processed / (1024*1024):.2f} MB / 2048.00 MB")

if __name__ == "__main__":
    main()
