#!/usr/bin/env python3
"""Create and verify a local OP-1 backup with a content manifest.

This is the filesystem oracle for the future native Rust core. It never
formats, deletes, follows symlinks, or guesses a device. The caller must
explicitly provide the mounted source directory and a separate destination.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Iterator
from uuid import uuid4


CHUNK_SIZE = 1024 * 1024
SCHEMA_VERSION = 1


class BackupError(Exception):
    def __init__(self, code: str, message: str, **details: Any) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {"code": self.code, "message": self.message}
        if self.details:
            result["details"] = self.details
        return result


def _safe_relative(path: Path, root: Path) -> str:
    relative = path.relative_to(root).as_posix()
    parsed = PurePosixPath(relative)
    if parsed.is_absolute() or any(part in {"", ".", ".."} for part in parsed.parts):
        raise BackupError("unsafe_path", "A backup path is not safely relative.", path=relative)
    return relative


def _iter_files(root: Path) -> Iterator[tuple[Path, str]]:
    for current, directories, files in os.walk(root, topdown=True, followlinks=False):
        current_path = Path(current)
        safe_directories: list[str] = []
        for name in sorted(directories):
            candidate = current_path / name
            if candidate.is_symlink():
                raise BackupError("symlink_rejected", "Symlinked directories are not copied.", path=_safe_relative(candidate, root))
            safe_directories.append(name)
        directories[:] = safe_directories
        for name in sorted(files):
            candidate = current_path / name
            if candidate.is_symlink():
                raise BackupError("symlink_rejected", "Symlinked files are not copied.", path=_safe_relative(candidate, root))
            if not candidate.is_file():
                raise BackupError("special_file", "Only regular files can be copied.", path=_safe_relative(candidate, root))
            yield candidate, _safe_relative(candidate, root)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    try:
        with path.open("rb") as stream:
            while chunk := stream.read(CHUNK_SIZE):
                digest.update(chunk)
    except OSError as exc:
        raise BackupError("read_failed", "A source file could not be read.", path=str(path)) from exc
    return digest.hexdigest()


def _atomic_json(path: Path, value: dict[str, Any]) -> None:
    temporary = path.with_name(f".{path.name}.{uuid4().hex}.partial")
    try:
        temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def create_backup(source: Path, destination: Path, *, label: str = "op1") -> dict[str, Any]:
    source = source.expanduser().resolve()
    destination = destination.expanduser().resolve()
    if not source.is_dir():
        raise BackupError("source_unavailable", "The source must be an existing mounted directory.", path=str(source))
    if destination == source or source in destination.parents:
        raise BackupError("destination_inside_source", "The backup destination must be outside the mounted source.")

    destination.mkdir(parents=True, exist_ok=True)
    snapshot_id = f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}_{uuid4().hex[:8]}"
    snapshot = destination / f"{label}_{snapshot_id}"
    files_root = snapshot / "files"
    snapshot.mkdir()
    files_root.mkdir()
    entries: list[dict[str, Any]] = []

    try:
        for source_file, relative in _iter_files(source):
            target = files_root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            partial = target.with_name(f".{target.name}.{uuid4().hex}.partial")
            try:
                with source_file.open("rb") as input_stream, partial.open("wb") as output_stream:
                    while chunk := input_stream.read(CHUNK_SIZE):
                        output_stream.write(chunk)
                    output_stream.flush()
                    os.fsync(output_stream.fileno())
                os.replace(partial, target)
                shutil.copystat(source_file, target, follow_symlinks=False)
            finally:
                partial.unlink(missing_ok=True)

            source_hash = _sha256(source_file)
            copied_hash = _sha256(target)
            if source_hash != copied_hash:
                raise BackupError("verification_failed", "A copied file changed during verification.", path=relative)
            entries.append({
                "path": relative,
                "size": target.stat().st_size,
                "sha256": copied_hash,
                "modifiedAt": datetime.fromtimestamp(source_file.stat().st_mtime, tz=timezone.utc).isoformat(),
            })

        manifest = {
            "schemaVersion": SCHEMA_VERSION,
            "model": "op-1-original",
            "snapshotId": snapshot.name,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "sourceLabel": label,
            "fileCount": len(entries),
            "totalBytes": sum(entry["size"] for entry in entries),
            "files": entries,
        }
        _atomic_json(snapshot / "manifest.json", manifest)
        return {"snapshot": str(snapshot), "manifest": manifest}
    except Exception:
        shutil.rmtree(snapshot, ignore_errors=True)
        raise


def verify_backup(snapshot: Path) -> dict[str, Any]:
    snapshot = snapshot.expanduser().resolve()
    manifest_path = snapshot / "manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise BackupError("manifest_unavailable", "The backup manifest cannot be read.", path=str(manifest_path)) from exc

    files_root = snapshot / "files"
    checked = 0
    for entry in manifest.get("files", []):
        relative = str(entry.get("path", ""))
        parsed = PurePosixPath(relative)
        if parsed.is_absolute() or any(part in {"", ".", ".."} for part in parsed.parts):
            raise BackupError("unsafe_path", "The manifest contains an unsafe path.", path=relative)
        target = files_root / relative
        if target.is_symlink() or not target.is_file():
            raise BackupError("file_missing", "A manifest file is missing or is not regular.", path=relative)
        if target.stat().st_size != int(entry["size"]):
            raise BackupError("size_mismatch", "A backup file has changed size.", path=relative)
        if _sha256(target) != str(entry["sha256"]):
            raise BackupError("hash_mismatch", "A backup file has changed content.", path=relative)
        checked += 1

    return {"valid": True, "snapshot": str(snapshot), "checkedFiles": checked, "manifest": manifest}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create or verify an OP-1 backup with SHA-256 manifests.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    create = subparsers.add_parser("create")
    create.add_argument("source", type=Path)
    create.add_argument("destination", type=Path)
    create.add_argument("--label", default="op1")
    verify = subparsers.add_parser("verify")
    verify.add_argument("snapshot", type=Path)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = create_backup(args.source, args.destination, label=args.label) if args.command == "create" else verify_backup(args.snapshot)
        exit_code = 0
    except BackupError as exc:
        result = {"valid": False, "error": exc.to_dict()}
        exit_code = 2
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2, sort_keys=True)
    sys.stdout.write("\n")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
