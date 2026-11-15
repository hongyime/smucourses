import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import archive_syllabi  # noqa: E402


def document(document_id, start_term="2410"):
    result = {"_id": document_id}
    if start_term is not None:
        result["startTerm"] = start_term
    return result


class SyllabiArchiveTests(unittest.TestCase):
    def test_buckets_terms_by_academic_year_and_leaves_missing_terms_unassigned(self):
        self.assertEqual(archive_syllabi.bucket_for_document(document("a", "2410")), "AY24-25")
        self.assertEqual(archive_syllabi.bucket_for_document(document("b", "2520")), "AY25-26")
        self.assertEqual(archive_syllabi.bucket_for_document(document("c", None)), "unassigned")
        self.assertEqual(archive_syllabi.bucket_for_document(document("d", "unknown")), "unassigned")

    def test_manifest_makes_reruns_a_no_op(self):
        manifest = archive_syllabi.empty_manifest()
        manifest["parts"] = {"AY24-25": ["syllabi-AY24-25-001.zip"]}
        manifest["documents"] = {"already": "syllabi-AY24-25-001.zip"}

        self.assertEqual(archive_syllabi.pending_documents([document("already")], manifest), {})

    def test_blank_release_pointer_allows_the_first_backfill(self):
        self.assertIsNone(
            archive_syllabi.index_asset_from_body(
                "Backup export.\n\n<!-- syllabi-archive-index:  -->"
            )
        )

    def test_a_document_id_is_appended_once(self):
        with tempfile.TemporaryDirectory() as directory:
            manifest = archive_syllabi.empty_manifest()
            calls = []
            updates = list(
                archive_syllabi.iter_archive_parts(
                    "AY24-25",
                    [document("once"), document("once")],
                    manifest,
                    None,
                    Path(directory),
                    set(),
                    downloader=lambda document_id: calls.append(document_id) or b"%PDF-1.7",
                )
            )

            self.assertEqual(calls, ["once"])
            self.assertEqual(len(updates), 1)
            with zipfile.ZipFile(updates[0].path) as archive:
                self.assertEqual(archive.namelist(), ["once.pdf"])

    def test_invalid_oversized_and_not_found_downloads_stay_unindexed_for_a_later_retry(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(archive_syllabi.time, "sleep"):
                for failed_download in (None, b"not a PDF", None):
                    manifest = archive_syllabi.empty_manifest()
                    updates = list(
                        archive_syllabi.iter_archive_parts(
                            "AY24-25",
                            [document("retry")],
                            manifest,
                            None,
                            Path(directory),
                            set(),
                            downloader=lambda _: failed_download,
                        )
                    )
                    self.assertEqual(updates, [])
                    self.assertNotIn("retry", manifest["documents"])

                updates = list(
                    archive_syllabi.iter_archive_parts(
                        "AY24-25",
                        [document("retry")],
                        manifest,
                        None,
                        Path(directory),
                        set(),
                        downloader=lambda _: b"%PDF-1.7",
                    )
                )
                self.assertEqual(len(updates), 1)
                self.assertIn("retry", manifest["documents"])

    def test_corrupt_current_zip_is_rejected_before_replacement(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "syllabi-AY24-25-001.zip"
            source.write_bytes(b"not a zip")
            manifest = {
                "version": 1,
                "parts": {"AY24-25": [source.name]},
                "documents": {"old": source.name},
            }

            with self.assertRaises(archive_syllabi.ArchiveError):
                list(
                    archive_syllabi.iter_archive_parts(
                        "AY24-25",
                        [document("new")],
                        manifest,
                        source,
                        Path(directory) / "out",
                        {source.name},
                        downloader=lambda _: b"%PDF-1.7",
                    )
                )

    def test_size_rollover_starts_the_next_numbered_part(self):
        with tempfile.TemporaryDirectory() as directory:
            manifest = archive_syllabi.empty_manifest()
            updates = list(
                archive_syllabi.iter_archive_parts(
                    "AY24-25",
                    [document("first"), document("second")],
                    manifest,
                    None,
                    Path(directory),
                    set(),
                    downloader=lambda _: b"%PDF-1.7" + b"x" * 50,
                    max_part_size=500,
                )
            )

            self.assertEqual(
                [update.new_asset for update in updates],
                ["syllabi-AY24-25-001.zip", "syllabi-AY24-25-002.zip"],
            )
            self.assertEqual(set(manifest["documents"]), {"first", "second"})


if __name__ == "__main__":
    unittest.main()
