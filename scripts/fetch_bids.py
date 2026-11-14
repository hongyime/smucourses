import json
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path
from typing import Any, Callable

from json_io import load_json, write_json_atomic


REPO_ROOT = Path(__file__).resolve().parent.parent
COURSES_FILE = REPO_ROOT / "data" / "courses_raw.json"
OUTPUT_FILE = REPO_ROOT / "data" / "bidding_raw.json"
BASE_URL = "https://www.smumods.sg/api/trpc"
Request = Callable[[str, dict[str, str]], Any | None]


def normalize_code(code: str) -> str:
    return code.replace(".", "").replace(" ", "")


def active_undergraduate_codes(courses: list[dict[str, Any]]) -> set[str]:
    """Return the active undergraduate codes supplied by Coursedog."""
    codes = set()
    for course in courses:
        custom_fields = course.get("customFields") or {}
        attributes = course.get("attributes") or []
        is_undergraduate = custom_fields.get("courseType") == "Undergraduate" or (
            "Level : Undergraduate" in attributes
        )
        code = course.get("code")
        if course.get("status") == "Active" and is_undergraduate and isinstance(code, str):
            codes.add(normalize_code(code))
    return codes


def retained_academic_years(today: date | None = None) -> set[str]:
    """Return this academic year and its two predecessors (AY starts in August)."""
    today = today or date.today()
    academic_year_start = today.year if today.month >= 8 else today.year - 1
    return {f"{(academic_year_start - offset) % 100:02d}" for offset in range(3)}


def keep_current_bid_history(
    bid_data: dict[str, Any], active_codes: set[str], academic_years: set[str]
) -> dict[str, dict[str, dict[str, dict[str, Any]]]]:
    """Drop inactive courses and bid terms outside the retained academic-year window."""
    retained: dict[str, dict[str, dict[str, dict[str, Any]]]] = {}
    for code in active_codes:
        course_data = bid_data.get(code)
        if not isinstance(course_data, dict):
            continue

        instructors: dict[str, dict[str, dict[str, Any]]] = {}
        for instructor, terms in course_data.items():
            if not isinstance(terms, dict):
                continue
            current_terms = {
                term: sections
                for term, sections in terms.items()
                if isinstance(term, str) and term[:2] in academic_years and isinstance(sections, dict)
            }
            if current_terms:
                instructors[instructor] = current_terms
        retained[code] = instructors
    return retained


def make_request(endpoint: str, input_data: dict[str, str]) -> Any | None:
    trpc_payload = {"0": {"json": input_data}}
    encoded_input = urllib.parse.quote(json.dumps(trpc_payload))
    url = f"{BASE_URL}/{endpoint}?batch=1&input={encoded_input}"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
    )

    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                data = json.loads(response.read().decode())
            if (
                isinstance(data, list)
                and data
                and isinstance(data[0], dict)
                and isinstance(data[0].get("result"), dict)
                and isinstance(data[0]["result"].get("data"), dict)
                and "json" in data[0]["result"]["data"]
            ):
                return data[0]["result"]["data"]["json"]
            return None
        except urllib.error.HTTPError as error:
            if error.code == 429:
                print(f"Rate limited on {endpoint}, waiting...")
                time.sleep(5)
                continue
            print(f"HTTP Error {error.code} on {endpoint}")
            break
        except Exception as error:
            print(f"Error on {endpoint}: {error}")
            if attempt < 2:
                time.sleep(2)
    return None


def collect_course(
    code: str,
    academic_years: set[str],
    request: Request = make_request,
    pause: Callable[[float], None] = time.sleep,
) -> dict[str, Any] | None:
    """Collect one course; None means a failed request and must not be cached."""
    instructors = request("bidAnalytics.getInstructors", {"moduleCode": code})
    pause(0.1)
    if instructors is None:
        return None
    if not instructors:
        return {}

    course_data: dict[str, Any] = {}
    for instructor in instructors:
        if not instructor:
            continue
        instructor_data: dict[str, Any] = {}
        terms = request(
            "bidAnalytics.getTermsAvailable", {"moduleCode": code, "instructor": instructor}
        )
        pause(0.1)
        if terms is None:
            return None

        for term in terms:
            if not isinstance(term, str) or term[:2] not in academic_years:
                continue
            term_data: dict[str, Any] = {}
            sections = request(
                "bidAnalytics.getSections",
                {"moduleCode": code, "instructor": instructor, "term": term},
            )
            pause(0.1)
            if sections is None:
                return None

            for section in sections:
                chart = request(
                    "bidAnalytics.getChartData",
                    {
                        "moduleCode": code,
                        "instructor": instructor,
                        "term": term,
                        "section": section,
                    },
                )
                pause(0.1)
                if chart is None:
                    return None
                if chart:
                    term_data[section] = chart

            if term_data:
                instructor_data[term] = term_data

        if instructor_data:
            course_data[instructor] = instructor_data
    return course_data


def main() -> None:
    if not COURSES_FILE.exists():
        print(f"Courses file not found at {COURSES_FILE}")
        return

    active_codes = active_undergraduate_codes(load_json(COURSES_FILE, list))
    if not active_codes:
        print("No active undergraduate courses found.")
        return
    print(f"Found {len(active_codes)} active undergraduate courses.")

    academic_years = retained_academic_years()
    all_bid_data: dict[str, Any] = {}
    if OUTPUT_FILE.exists():
        all_bid_data = load_json(OUTPUT_FILE, dict)
        all_bid_data = keep_current_bid_history(all_bid_data, active_codes, academic_years)
        print(f"Resuming from {len(all_bid_data)} retained courses.")

    module_codes = sorted(active_codes)
    fetched = 0
    for count, code in enumerate(module_codes, start=1):
        if code in all_bid_data:
            continue

        print(f"[{count}/{len(module_codes)}] Fetching {code}...")
        course_data = collect_course(code, academic_years)
        if course_data is None:
            print(f"Retrying {code} on the next run because a bid request failed.")
            continue

        all_bid_data[code] = course_data
        fetched += 1
        if fetched % 10 == 0:
            write_json_atomic(OUTPUT_FILE, all_bid_data, indent=2)

    write_json_atomic(OUTPUT_FILE, all_bid_data, separators=(",", ":"))
    print("Done fetching bid data!")


if __name__ == "__main__":
    main()
