"""Incrementally archive Coursedog syllabi in a GitHub Release.

The release body points at the current manifest. ZIP assets are uploaded before
that pointer changes, so an interrupted run leaves the prior archive usable.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import tempfile
import time
import uuid
import zipfile
from collections import defaultdict
from collections.abc import Callable, Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from json_io import write_json_atomic
ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DOCUMENTS_PATH = ROOT_DIR / "data" / "documents_raw.json"
RELEASE_TAG = "syllabi-archive-v2"
MAX_PART_SIZE_BYTES = int(1.5 * 1024**3)
ZIP_ENTRY_OVERHEAD_BYTES = 256
DELAY_BETWEEN_REQUESTS = 0.5
PDF_MAGIC_BYTES = b"%PDF"
INDEX_POINTER = re.compile(r"<!-- syllabi-archive-index: ([^>]*) -->")
DOCUMENT_ID = re.compile(r"^[A-Za-z0-9_-]+$")
INDEX_ASSET = re.compile(r"^syllabi-index-[0-9a-f-]+\.json$")


class ArchiveError(RuntimeError):
    """The archive cannot be safely updated."""


@dataclass
class PartUpdate:
    bucket: str
    old_asset: str | None
    new_asset: str
    path: Path


def empty_manifest() -> dict[str, Any]:
    return {"version": 1, "documents": {}, "parts": {}}


def bucket_for_document(document: dict[str, Any]) -> str:
    term = document.get("startTerm")
    if isinstance(term, str) and re.fullmatch(r"\d{4}", term):
        start_year = int(term[:2])
        return f"AY{start_year:02d}-{(start_year + 1) % 100:02d}"
    return "unassigned"


def asset_name(bucket: str, number: int) -> str:
    if not 1 <= number <= 999:
        raise ArchiveError(f"Too many archive parts for {bucket}")
    return f"syllabi-{bucket}-{number:03d}.zip"


def valid_pdf(data: bytes | None) -> bool:
    return bool(data and data.startswith(PDF_MAGIC_BYTES))


def document_url(document_id: str) -> str:
    return (
        "https://ccms.coursedog.com/api/v1/sy/smu_peoplesoft/documents/"
        f"{document_id}/pdf"
    )


def fetch_pdf(document_id: str) -> bytes | None:
    # Keep test discovery dependency-free; this is the shared local-cache policy.
    from sync_pdfs import download_and_validate_pdf

    return download_and_validate_pdf(document_url(document_id), document_id)


def validate_manifest(manifest: dict[str, Any]) -> None:
    if manifest.get("version") != 1:
        raise ArchiveError("Unsupported syllabi archive manifest")
    documents = manifest.get("documents")
    parts = manifest.get("parts")
    if not isinstance(documents, dict) or not isinstance(parts, dict):
        raise ArchiveError("Invalid syllabi archive manifest")

    known_assets: set[str] = set()
    for bucket, assets in parts.items():
        if not isinstance(bucket, str) or not isinstance(assets, list):
            raise ArchiveError("Invalid syllabi archive parts")
        asset_pattern = re.compile(rf"^syllabi-{re.escape(bucket)}-\d{{3}}\.zip$")
        if not all(isinstance(asset, str) and asset_pattern.fullmatch(asset) for asset in assets):
            raise ArchiveError("Invalid syllabi archive parts")
        known_assets.update(assets)
    if not all(
        isinstance(document_id, str)
        and DOCUMENT_ID.fullmatch(document_id)
        and isinstance(asset, str)
        and asset in known_assets
        for document_id, asset in documents.items()
    ):
        raise ArchiveError("Invalid syllabi archive document index")


def load_manifest(path: Path | None) -> dict[str, Any]:
    if path is None:
        return empty_manifest()
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ArchiveError(f"Could not read archive manifest {path}: {error}") from error
    if not isinstance(manifest, dict):
        raise ArchiveError("Invalid syllabi archive manifest")
    validate_manifest(manifest)
    return manifest


def pending_documents(
    documents: list[dict[str, Any]], manifest: dict[str, Any]
) -> dict[str, list[dict[str, Any]]]:
    """Return unindexed document records once each, grouped by academic year."""
    indexed = manifest["documents"]
    seen: set[str] = set()
    pending: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for document in documents:
        document_id = document.get("_id")
        if not isinstance(document_id, str) or not DOCUMENT_ID.fullmatch(document_id):
            continue
        if document_id in indexed or document_id in seen:
            continue
        seen.add(document_id)
        pending[bucket_for_document(document)].append(document)
    return dict(pending)


def _checked_zip(path: Path, expected_ids: set[str]) -> None:
    if not path.is_file() or path.stat().st_size > MAX_PART_SIZE_BYTES:
        raise ArchiveError(f"Archive part is missing or too large: {path.name}")
    try:
        with zipfile.ZipFile(path) as archive:
            if archive.testzip() is not None:
                raise ArchiveError(f"Archive part has a corrupt entry: {path.name}")
            names = archive.namelist()
            if len(names) != len(set(names)) or set(names) != {
                f"{document_id}.pdf" for document_id in expected_ids
            }:
                raise ArchiveError(f"Archive part does not match its manifest: {path.name}")
            for name in names:
                with archive.open(name) as entry:
                    if not entry.read(len(PDF_MAGIC_BYTES)).startswith(PDF_MAGIC_BYTES):
                        raise ArchiveError(f"Archive part has an invalid PDF: {path.name}")
    except zipfile.BadZipFile as error:
        raise ArchiveError(f"Archive part is not a valid ZIP: {path.name}") from error


class ZipPartBuilder:
    def __init__(
        self,
        path: Path,
        source_path: Path | None,
        source_size: int,
        existing_ids: set[str],
    ) -> None:
        self.path = path
        self.existing_ids = existing_ids
        self.new_ids: list[str] = []
        self.estimated_size = source_size
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.archive = zipfile.ZipFile(
            self.path, "w", compression=zipfile.ZIP_STORED, allowZip64=True
        )
        if source_path is not None:
            with zipfile.ZipFile(source_path) as source:
                for info in source.infolist():
                    with source.open(info) as source_entry, self.archive.open(
                        info.filename, "w"
                    ) as destination_entry:
                        shutil.copyfileobj(source_entry, destination_entry, 1024 * 1024)

    def would_overflow(self, document_id: str, data: bytes, limit: int) -> bool:
        return (
            self.estimated_size
            + len(document_id)
            + len(data)
            + ZIP_ENTRY_OVERHEAD_BYTES
            > limit
        )

    def add(self, document_id: str, data: bytes) -> None:
        self.archive.writestr(f"{document_id}.pdf", data)
        self.new_ids.append(document_id)
        self.estimated_size += len(document_id) + len(data) + ZIP_ENTRY_OVERHEAD_BYTES

    def close(self) -> None:
        self.archive.close()


def _next_asset_name(bucket: str, known_assets: set[str]) -> str:
    pattern = re.compile(rf"^syllabi-{re.escape(bucket)}-(\d{{3}})\.zip$")
    highest = max(
        (int(match.group(1)) for asset in known_assets if (match := pattern.fullmatch(asset))),
        default=0,
    )
    name = asset_name(bucket, highest + 1)
    known_assets.add(name)
    return name


def _apply_part_update(manifest: dict[str, Any], update: PartUpdate, ids: set[str]) -> None:
    parts = manifest["parts"].setdefault(update.bucket, [])
    if update.old_asset is None:
        parts.append(update.new_asset)
    else:
        try:
            parts[parts.index(update.old_asset)] = update.new_asset
        except ValueError as error:
            raise ArchiveError(f"Manifest is missing part {update.old_asset}") from error
    for document_id in ids:
        manifest["documents"][document_id] = update.new_asset


def iter_archive_parts(
    bucket: str,
    documents: list[dict[str, Any]],
    manifest: dict[str, Any],
    source_path: Path | None,
    output_dir: Path,
    known_assets: set[str],
    downloader: Callable[[str], bytes | None] = fetch_pdf,
    max_part_size: int = MAX_PART_SIZE_BYTES,
) -> Iterator[PartUpdate]:
    """Build changed ZIPs lazily, yielding one complete part at a time."""
    parts = manifest["parts"].get(bucket, [])
    old_asset = parts[-1] if parts else None
    existing_ids = {
        document_id
        for document_id, asset in manifest["documents"].items()
        if asset == old_asset
    }
    source_size = 0
    if old_asset is not None:
        if source_path is None:
            raise ArchiveError(f"Missing downloaded archive part {old_asset}")
        _checked_zip(source_path, existing_ids)
        source_size = source_path.stat().st_size

    builder: ZipPartBuilder | None = None
    builder_old_asset = old_asset
    builder_existing_ids = existing_ids

    def start_builder(with_source: bool) -> ZipPartBuilder:
        nonlocal builder_old_asset, builder_existing_ids
        new_asset = _next_asset_name(bucket, known_assets)
        if with_source:
            return ZipPartBuilder(
                output_dir / new_asset, source_path, source_size, builder_existing_ids
            )
        builder_old_asset = None
        builder_existing_ids = set()
        return ZipPartBuilder(output_dir / new_asset, None, 0, set())

    def finish_builder(current: ZipPartBuilder) -> PartUpdate:
        current.close()
        all_ids = current.existing_ids | set(current.new_ids)
        _checked_zip(current.path, all_ids)
        if current.path.stat().st_size > max_part_size:
            raise ArchiveError(f"Archive part exceeded size limit: {current.path.name}")
        update = PartUpdate(
            bucket=bucket,
            old_asset=builder_old_asset,
            new_asset=current.path.name,
            path=current.path,
        )
        _apply_part_update(manifest, update, all_ids)
        return update

    try:
        seen: set[str] = set()
        for document in documents:
            document_id = document["_id"]
            if document_id in seen:
                continue
            seen.add(document_id)
            data = downloader(document_id)
            if not valid_pdf(data):
                time.sleep(DELAY_BETWEEN_REQUESTS)
                continue

            if builder is None:
                starts_new_part = (
                    old_asset is not None
                    and source_size
                    + len(document_id)
                    + len(data)
                    + ZIP_ENTRY_OVERHEAD_BYTES
                    > max_part_size
                )
                builder = start_builder(with_source=not starts_new_part and old_asset is not None)

            if builder.would_overflow(document_id, data, max_part_size):
                if builder.new_ids:
                    update = finish_builder(builder)
                    yield update
                    builder = start_builder(with_source=False)
                else:
                    raise ArchiveError(f"Document {document_id} exceeds archive size limit")

            builder.add(document_id, data)
            time.sleep(DELAY_BETWEEN_REQUESTS)

        if builder is not None and builder.new_ids:
            yield finish_builder(builder)
            builder = None
    finally:
        if builder is not None:
            builder.close()
            builder.path.unlink(missing_ok=True)


def gh(*args: str, input_text: str | None = None) -> str:
    result = subprocess.run(
        ["gh", *args],
        check=True,
        text=True,
        input=input_text,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return result.stdout


def release_details() -> dict[str, Any]:
    try:
        details = json.loads(gh("release", "view", RELEASE_TAG, "--json", "body,assets"))
    except (subprocess.CalledProcessError, json.JSONDecodeError) as error:
        raise ArchiveError(f"Could not read GitHub Release {RELEASE_TAG}") from error
    if not isinstance(details, dict) or not isinstance(details.get("body"), str):
        raise ArchiveError(f"Invalid GitHub Release {RELEASE_TAG}")
    return details


def index_asset_from_body(body: str) -> str | None:
    match = INDEX_POINTER.search(body)
    if match is None:
        return None
    index_asset = match.group(1).strip()
    if not index_asset:
        return None
    if not INDEX_ASSET.fullmatch(index_asset):
        raise ArchiveError("Release body has an invalid archive index pointer")
    return index_asset


def body_with_index(body: str, index_asset: str) -> str:
    pointer = f"<!-- syllabi-archive-index: {index_asset} -->"
    if INDEX_POINTER.search(body):
        return INDEX_POINTER.sub(pointer, body)
    return f"{body.rstrip()}\n\n{pointer}".lstrip()


def download_release_asset(asset: str, destination: Path) -> Path:
    destination.mkdir(parents=True, exist_ok=True)
    gh("release", "download", RELEASE_TAG, "--pattern", asset, "--dir", str(destination))
    path = destination / asset
    if not path.is_file():
        raise ArchiveError(f"GitHub did not download expected asset {asset}")
    return path


def upload_release_asset(path: Path) -> None:
    gh("release", "upload", RELEASE_TAG, str(path))


def cleanup_unreferenced_assets(active_index: str, manifest: dict[str, Any]) -> None:
    active_assets = {active_index}
    active_assets.update(
        asset for assets in manifest["parts"].values() for asset in assets
    )
    try:
        details = release_details()
    except ArchiveError:
        return
    for asset in details.get("assets", []):
        name = asset.get("name") if isinstance(asset, dict) else None
        if not isinstance(name, str) or name in active_assets:
            continue
        if re.fullmatch(r"syllabi-(?:AY\d{2}-\d{2}|unassigned)-\d{3}\.zip", name) or INDEX_ASSET.fullmatch(name):
            try:
                gh("release", "delete-asset", RELEASE_TAG, name, "--yes")
            except subprocess.CalledProcessError as error:
                print(f"Warning: could not delete unreferenced asset {name}: {error.stderr.strip()}")


def archive(documents_path: Path) -> int:
    try:
        documents = json.loads(documents_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ArchiveError(f"Could not read documents from {documents_path}: {error}") from error
    if not isinstance(documents, list) or not all(isinstance(document, dict) for document in documents):
        raise ArchiveError("documents_raw.json must contain a list of document records")

    details = release_details()
    current_index = index_asset_from_body(details["body"])
    with tempfile.TemporaryDirectory(prefix="syllabi-archive-") as directory:
        workspace = Path(directory)
        manifest = load_manifest(
            download_release_asset(current_index, workspace) if current_index else None
        )
        cleanup_unreferenced_assets(current_index, manifest) if current_index else None
        details = release_details()
        known_assets = {
            asset["name"]
            for asset in details.get("assets", [])
            if isinstance(asset, dict) and isinstance(asset.get("name"), str)
        }
        pending = pending_documents(documents, manifest)
        if not pending:
            print("No unarchived syllabus documents.")
            return 0

        changed = False
        for bucket in sorted(pending):
            parts = manifest["parts"].get(bucket, [])
            source_path = (
                download_release_asset(parts[-1], workspace / bucket) if parts else None
            )
            try:
                for update in iter_archive_parts(
                    bucket,
                    pending[bucket],
                    manifest,
                    source_path,
                    workspace / "out",
                    known_assets,
                ):
                    upload_release_asset(update.path)
                    update.path.unlink(missing_ok=True)
                    changed = True
                    print(f"Uploaded {update.new_asset}")
            finally:
                if source_path is not None:
                    source_path.unlink(missing_ok=True)

        if not changed:
            print("No valid new syllabus PDFs were available.")
            return 0

        validate_manifest(manifest)
        index_asset = f"syllabi-index-{uuid.uuid4()}.json"
        index_path = workspace / index_asset
        write_json_atomic(index_path, manifest, sort_keys=True, separators=(",", ":"))
        upload_release_asset(index_path)

        notes_path = workspace / "release-notes.md"
        notes_path.write_text(body_with_index(details["body"], index_asset), encoding="utf-8")
        gh("release", "edit", RELEASE_TAG, "--notes-file", str(notes_path))
        cleanup_unreferenced_assets(index_asset, manifest)
        print(f"Published {index_asset} with {len(manifest['documents'])} PDFs.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--documents", type=Path, default=DEFAULT_DOCUMENTS_PATH)
    args = parser.parse_args()
    try:
        return archive(args.documents)
    except ArchiveError as error:
        print(f"Archive failed: {error}")
        return 1
    except subprocess.CalledProcessError as error:
        detail = error.stderr.strip() or error.stdout.strip() or str(error)
        print(f"Archive failed: {detail}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
