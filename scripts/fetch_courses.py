import requests
import json
import os
import sys
from pathlib import Path
import time

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

def main():
    repo_root = Path(__file__).parent.parent
    output_dir = repo_root / "data" / "raw"
    output_dir.mkdir(parents=True, exist_ok=True)

    print("Fetching active courses...")
    active_courses = fetch_courses(ignore_effective_dating=False)
    with open(output_dir / "courses_raw.json", "w", encoding="utf-8") as f:
        json.dump(active_courses, f, ensure_ascii=False)
    print(f"Saved {len(active_courses)} active courses.")

    print("Fetching ALL historical course versions...")
    all_courses = fetch_courses(ignore_effective_dating=True)
    with open(output_dir / "courses_all_versions_raw.json", "w", encoding="utf-8") as f:
        json.dump(all_courses, f, ensure_ascii=False)
    print(f"Saved {len(all_courses)} historical course versions.")

    print("Fetching document metadata...")
    documents = fetch_documents()
    with open(output_dir / "documents_raw.json", "w", encoding="utf-8") as f:
        json.dump(documents, f, ensure_ascii=False)
    print(f"Saved {len(documents)} document records.")

    print("Fetch complete.")

if __name__ == "__main__":
    main()
