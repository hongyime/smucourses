"""
Probe CourseDog APIs to understand the full data shape.
This script fetches a small sample and dumps it for analysis.
"""
import requests
import json
import sys
from pathlib import Path

BASE_URL = "https://app.coursedog.com/api/v1"
INSTITUTION = "smu_peoplesoft"
CATALOG_ID = "uWo7JLgaLmgvZNKHLPy1"

# All columns we want to request (discovered from the questions template API)
ALL_COLUMNS = ",".join([
    "name",
    "code",
    "subjectCode",
    "courseNumber",
    "longName",
    "description",
    "id",
    "deprecatedCourseGroupId",
    "courseGroupId",
    "departments",
    "attributes",
    "gradeMode",
    "requisites",
    "credits",
    "components",
    "topics",
    "consent",
    "dropConsent",
    "status",
    "catalogPrint",
    "effectiveStartDate",
    "effectiveEndDate",
    "learningOutcomes",
    "college",
    "customFields.catalogAttributes",
    "customFields.rawCourseId",
    "customFields.crseOfferNbr",
    "customFields.disciplineSpecificCompetencies",
    "customFields.graduateLearningOutcomes",
    "customFields.standardLearningOutcomes",
    "customFields.courseType",
])

HEADERS = {
    "accept": "application/json",
    "content-type": "application/json",
    "origin": "https://ccms.smu.edu.sg",
    "referer": "https://ccms.smu.edu.sg/",
    "x-requested-with": "catalog",
}

def probe_course_search(limit=3):
    """Fetch a small sample of courses with all columns."""
    url = f"{BASE_URL}/cm/{INSTITUTION}/courses/search/%24filters"
    params = {
        "catalogId": CATALOG_ID,
        "skip": 0,
        "limit": limit,
        "orderBy": "code",
        "formatDependents": "false",
        "ignoreEffectiveDating": "false",
        "ignoreTotalCount": "false",
        "columns": ALL_COLUMNS,
    }
    # Filter: Active courses with catalogPrint=true
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
                }
            ]
        }]
    }

    print(f"[1/3] Fetching {limit} courses from search API...")
    resp = requests.post(url, params=params, headers=HEADERS, json=body, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    print(f"  Total courses available: {data.get('listLength', '?')}")
    print(f"  Returned: {len(data.get('data', []))} courses")
    return data


def probe_course_search_all_versions(limit=3):
    """Fetch with ignoreEffectiveDating=true to see historical versions."""
    url = f"{BASE_URL}/cm/{INSTITUTION}/courses/search/%24filters"
    params = {
        "catalogId": CATALOG_ID,
        "skip": 0,
        "limit": limit,
        "orderBy": "code",
        "formatDependents": "false",
        "ignoreEffectiveDating": "true",  # <-- key difference
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
                }
            ]
        }]
    }

    print(f"\n[2/3] Fetching {limit} courses with ALL versions (ignoreEffectiveDating=true)...")
    resp = requests.post(url, params=params, headers=HEADERS, json=body, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    print(f"  Total courses (all versions): {data.get('listLength', '?')}")
    print(f"  Returned: {len(data.get('data', []))} courses")
    return data


def probe_documents(limit=5):
    """Fetch a sample of documents."""
    url = f"https://ccms.coursedog.com/api/v1/sy/{INSTITUTION}/documents/"
    print(f"\n[3/3] Fetching documents list...")
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    docs = data.get("data", [])
    print(f"  Total documents: {len(docs)}")

    # Count how many have course info vs orphans
    with_course = sum(1 for d in docs if d.get("course"))
    without_course = sum(1 for d in docs if not d.get("course"))
    print(f"  With course mapping: {with_course}")
    print(f"  Orphans (no course): {without_course}")

    # Show unique terms
    terms = set(d.get("startTerm") for d in docs if d.get("startTerm"))
    print(f"  Unique terms: {sorted(terms)}")

    return {"total": len(docs), "sample": docs[:limit], "terms": sorted(terms)}


def main():
    output_dir = Path(__file__).parent.parent / "data" / "raw"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Probe 1: Course search (current versions)
    current = probe_course_search(limit=3)

    # Probe 2: Course search (all versions)
    all_versions = probe_course_search_all_versions(limit=5)

    # Probe 3: Documents
    doc_info = probe_documents(limit=5)

    # Save the full probe results
    probe_output = {
        "current_courses_sample": current.get("data", [])[:3],
        "current_courses_total": current.get("listLength"),
        "all_versions_sample": all_versions.get("data", [])[:5],
        "all_versions_total": all_versions.get("listLength"),
        "documents_info": doc_info,
    }

    output_file = output_dir / "api_probe_results.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(probe_output, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Full probe results saved to: {output_file}")
    print(f"\nKey findings:")
    print(f"  - Active courses (current): {current.get('listLength', '?')}")
    print(f"  - Active courses (all versions): {all_versions.get('listLength', '?')}")
    print(f"  - Documents (syllabi PDFs): {doc_info['total']}")
    print(f"  - Terms with syllabi: {doc_info['terms']}")

    # Print a sample course's fields so we can see what's populated
    if current.get("data"):
        sample = current["data"][0]
        print(f"\n📋 Sample course: {sample.get('code', '?')} — {sample.get('longName', '?')}")
        print(f"  Fields present: {sorted(sample.keys())}")

        # Check which fields are populated vs empty
        populated = [k for k, v in sample.items() if v not in (None, "", [], {})]
        empty = [k for k, v in sample.items() if v in (None, "", [], {})]
        print(f"  Populated fields ({len(populated)}): {populated}")
        print(f"  Empty fields ({len(empty)}): {empty}")

        # Check credits structure
        if sample.get("credits"):
            print(f"\n  💰 Credits structure: {json.dumps(sample['credits'], indent=4)}")
        if sample.get("components"):
            print(f"\n  🧩 Components structure: {json.dumps(sample['components'], indent=4)}")
        if sample.get("requisites"):
            print(f"\n  📌 Requisites structure: {json.dumps(sample['requisites'], indent=4)}")


if __name__ == "__main__":
    main()
