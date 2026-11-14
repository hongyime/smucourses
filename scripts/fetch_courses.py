import requests
import sys
from pathlib import Path
import time
from json_io import load_json, write_json_atomic

BASE_URL = "https://app.coursedog.com/api/v1"
INSTITUTION = "smu_peoplesoft"
CATALOG_ID = "uWo7JLgaLmgvZNKHLPy1"

ALL_COLUMNS = ",".join([
    "name", "code", "subjectCode", "courseNumber", "longName", "description", 
    "id", "deprecatedCourseGroupId", "courseGroupId", "departments", 
    "attributes", "gradeMode", "requisites", "credits", "components", 
    "topics", "consent", "dropConsent", "status", "catalogPrint", 
    "effectiveStartDate", "effectiveEndDate", "learningOutcomes", "college", 
    "customFields.catalogAttributes", "customFields.rawCourseId", 
    "customFields.crseOfferNbr", "customFields.disciplineSpecificCompetencies", 
    "customFields.graduateLearningOutcomes", "customFields.standardLearningOutcomes", 
    "customFields.courseType"
])

HEADERS = {
    "accept": "application/json",
    "content-type": "application/json",
    "origin": "https://ccms.smu.edu.sg",
    "referer": "https://ccms.smu.edu.sg/",
    "x-requested-with": "catalog",
}

def fetch_courses(ignore_effective_dating=False, limit=50000):
    url = f"{BASE_URL}/cm/{INSTITUTION}/courses/search/%24filters"
    params = {
        "catalogId": CATALOG_ID,
        "skip": 0,
        "limit": limit,
        "orderBy": "code",
        "formatDependents": "false",
        "ignoreEffectiveDating": "true" if ignore_effective_dating else "false",
        "ignoreTotalCount": "false",
        "columns": ALL_COLUMNS,
    }
    body = {
        "condition": "AND",
        "filters": [{
            "condition": "and",
            "id": "probe",
            "filters": [
                {
                    "id": "status-course",
                    "condition": "field",
                    "name": "status",
                    "inputType": "select",
                    "group": "course",
                    "type": "is",
                    "value": "Active",
                    "customField": False,
                },
                {
                    "id": "catalogPrint-course",
                    "condition": "field",
                    "name": "catalogPrint",
                    "inputType": "boolean",
                    "group": "course",
                    "type": "is",
                    "value": True,
                    "customField": False,
                },
                {
                    "id": "subjectCode-course",
                    "condition": "field",
                    "name": "subjectCode",
                    "inputType": "subjectCodeSelect",
                    "group": "course",
                    "type": "doesNotContain",
                    "value": "X",
                    "customField": False,
                },
                {
                    "id": "departments-course-1",
                    "condition": "field",
                    "name": "departments",
                    "inputType": "select",
                    "group": "course",
                    "type": "isNot",
                    "value": ["OCS"],
                    "customField": False,
                },
                {
                    "id": "departments-course-2",
                    "condition": "field",
                    "name": "departments",
                    "inputType": "select",
                    "group": "course",
                    "type": "isNot",
                    "value": ["C4SR"],
                    "customField": False,
                }
            ]
        }]
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = requests.post(url, params=params, headers=HEADERS, json=body, timeout=60)
            resp.raise_for_status()
            return resp.json().get("data", [])
        except requests.exceptions.RequestException as e:
            print(f"Error fetching courses: {e}. Retrying ({attempt+1}/{max_retries})...")
            time.sleep(5)
    
    print("Failed to fetch courses after max retries.")
    sys.exit(1)

def fetch_documents():
    url = f"https://ccms.coursedog.com/api/v1/sy/{INSTITUTION}/documents/"
    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, timeout=60)
            resp.raise_for_status()
            return resp.json().get("data", [])
        except requests.exceptions.RequestException as e:
            print(f"Error fetching documents: {e}. Retrying ({attempt+1}/{max_retries})...")
            time.sleep(5)
    
    print("Failed to fetch documents after max retries.")
    sys.exit(1)

def merge_data(existing_list, new_list, id_key="id"):
    merged_map = {}
    for item in existing_list:
        if id_key in item:
            merged_map[item[id_key]] = item
            
    added_count = 0
    updated_count = 0
    
    for item in new_list:
        if id_key in item:
            item_id = item[id_key]
            if item_id not in merged_map:
                added_count += 1
            else:
                updated_count += 1
            merged_map[item_id] = item # Update with latest info
            
    print(f"  -> Added {added_count} new records.")
    print(f"  -> Updated {updated_count} existing records.")
    print(f"  -> Preserved {len(merged_map) - added_count - updated_count} historical records (likely deleted by SMU).")
    
    return list(merged_map.values())

def load_existing(file_path):
    if file_path.exists():
        return load_json(file_path, list)
    return []

def main():
    repo_root = Path(__file__).parent.parent
    output_dir = repo_root / "data"
    output_dir.mkdir(parents=True, exist_ok=True)

    active_file = output_dir / "courses_raw.json"
    all_file = output_dir / "courses_all_versions_raw.json"
    docs_file = output_dir / "documents_raw.json"

    # Validate every existing artifact before replacing any of them.
    load_existing(active_file)
    existing_all = load_existing(all_file)
    existing_docs = load_existing(docs_file)

    # 1. Active Courses
    print("Fetching active courses...")
    new_active = fetch_courses(ignore_effective_dating=False)
    write_json_atomic(active_file, new_active, ensure_ascii=False)
    print(f"Saved {len(new_active)} active courses.\n")

    # 2. All Historical Courses
    print("Fetching ALL historical course versions...")
    new_all = fetch_courses(ignore_effective_dating=True)
    merged_all = merge_data(existing_all, new_all, id_key="id")
    write_json_atomic(all_file, merged_all, ensure_ascii=False)
    print(f"Saved {len(merged_all)} historical course versions.\n")

    # 3. Documents (PDF Metadata)
    print("Fetching document metadata...")
    new_docs = fetch_documents()
    merged_docs = merge_data(existing_docs, new_docs, id_key="_id")
    write_json_atomic(docs_file, merged_docs, ensure_ascii=False)
    print(f"Saved {len(merged_docs)} document records.\n")

    print("Fetch and Smart Merge complete!")

if __name__ == "__main__":
    main()
