"""Small, fail-closed JSON helpers for pipeline artifacts."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, TypeVar


T = TypeVar("T")


def load_json(path: Path, expected_type: type[T]) -> T:
    """Load a JSON artifact and reject malformed or unexpected data."""
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"Could not read valid JSON from {path}: {error}") from error

    if not isinstance(data, expected_type):
        raise ValueError(
            f"Expected {expected_type.__name__} JSON in {path}, got {type(data).__name__}"
        )
    return data


def write_json_atomic(path: Path, data: Any, **dump_kwargs: Any) -> None:
    """Durably replace a JSON artifact without exposing a partial write."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_name(f".{path.name}.tmp")

    try:
        with temporary_path.open("w", encoding="utf-8") as file:
            json.dump(data, file, **dump_kwargs)
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary_path, path)
        _fsync_directory(path.parent)
    finally:
        if temporary_path.exists():
            temporary_path.unlink()


def write_bytes_atomic(path: Path, data: bytes) -> None:
    """Durably replace a binary artifact without exposing a partial write."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_name(f".{path.name}.tmp")

    try:
        with temporary_path.open("wb") as file:
            file.write(data)
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary_path, path)
        _fsync_directory(path.parent)
    finally:
        if temporary_path.exists():
            temporary_path.unlink()


def _fsync_directory(path: Path) -> None:
    """Persist the rename where the platform permits directory fsync."""
    try:
        descriptor = os.open(path, os.O_RDONLY)
    except OSError:
        return
    try:
        os.fsync(descriptor)
    except OSError:
        pass
    finally:
        os.close(descriptor)
