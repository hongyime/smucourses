import json
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SCRIPTS_DIR.parent
sys.path.insert(0, str(SCRIPTS_DIR))

import fetch_bids  # noqa: E402
from json_io import load_json, write_bytes_atomic, write_json_atomic  # noqa: E402


class JsonSafetyTests(unittest.TestCase):
    def test_atomic_write_replaces_complete_json_and_removes_temporary_file(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "artifact.json"
            path.write_text('{"old": true}', encoding="utf-8")

            write_json_atomic(path, {"new": [1, 2, 3]})

            self.assertEqual(json.loads(path.read_text(encoding="utf-8")), {"new": [1, 2, 3]})
            self.assertFalse((path.parent / ".artifact.json.tmp").exists())

    def test_corrupt_existing_json_is_refused_without_replacement(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "courses_raw.json"
            corrupt = '{"incomplete":'
            path.write_text(corrupt, encoding="utf-8")

            with self.assertRaises(ValueError):
                load_json(path, list)

            self.assertEqual(path.read_text(encoding="utf-8"), corrupt)

    def test_atomic_binary_write_replaces_complete_pdf(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "syllabus.pdf"
            path.write_bytes(b"partial")

            write_bytes_atomic(path, b"%PDF-1.7 complete")

            self.assertEqual(path.read_bytes(), b"%PDF-1.7 complete")
            self.assertFalse((path.parent / ".syllabus.pdf.tmp").exists())


class BidCollectionTests(unittest.TestCase):
    def test_failed_request_is_not_cached_while_a_valid_empty_response_is(self):
        failed = fetch_bids.collect_course(
            "ACCT101",
            {"26"},
            request=lambda endpoint, data: None,
            pause=lambda _: None,
        )
        empty = fetch_bids.collect_course(
            "ACCT101",
            {"26"},
            request=lambda endpoint, data: [],
            pause=lambda _: None,
        )

        self.assertIsNone(failed)
        self.assertEqual(empty, {})

    def test_only_active_undergraduate_courses_are_collected(self):
        courses = [
            {"code": "ACCT.101", "status": "Active", "customFields": {"courseType": "Undergraduate"}},
            {"code": "MGMT.100", "status": "Inactive", "customFields": {"courseType": "Undergraduate"}},
            {"code": "LAW.500", "status": "Active", "customFields": {"courseType": "Graduate"}},
            {"code": "CORE.100", "status": "Active", "attributes": ["Level : Undergraduate"]},
        ]

        self.assertEqual(fetch_bids.active_undergraduate_codes(courses), {"ACCT101", "CORE100"})

    def test_bid_history_keeps_current_and_two_preceding_academic_years(self):
        years = fetch_bids.retained_academic_years(date(2026, 11, 14))
        history = {
            "ACCT101": {"Professor": {"2310": {"A": []}, "2410": {"A": []}, "2610": {"A": []}}},
            "OLD100": {"Professor": {"2610": {"A": []}}},
        }

        retained = fetch_bids.keep_current_bid_history(history, {"ACCT101"}, years)

        self.assertEqual(years, {"24", "25", "26"})
        self.assertEqual(set(retained), {"ACCT101"})
        self.assertEqual(set(retained["ACCT101"]["Professor"]), {"2410", "2610"})


class DataContractTests(unittest.TestCase):
    def test_browse_indexes_cover_their_filter_options(self):
        data_dir = REPO_ROOT / "web" / "src" / "data"
        courses = json.loads((data_dir / "search_index.json").read_text(encoding="utf-8"))
        professors = json.loads((data_dir / "professor_search_index.json").read_text(encoding="utf-8"))
        schools = json.loads((data_dir / "schools.json").read_text(encoding="utf-8"))

        required_course_fields = {
            "id", "code", "name", "longName", "subjectCode", "school", "level",
            "areas", "tracks", "gradeMode", "credits", "component", "requisites", "description",
        }
        required_professor_fields = {
            "id", "name", "schools", "levels", "areas", "tracks", "totalClasses", "photoUrl",
        }
        school_ids = {school["id"] for school in schools}

        self.assertTrue(courses)
        self.assertTrue(professors)
        self.assertTrue(all(required_course_fields <= course.keys() for course in courses))
        self.assertTrue(all(isinstance(course["school"], dict) for course in courses))
        self.assertTrue(all(course["school"]["id"] in school_ids for course in courses))
        self.assertTrue(all(required_professor_fields <= professor.keys() for professor in professors))
        self.assertTrue(all("history" not in professor for professor in professors))
