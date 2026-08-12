#!/usr/bin/env python3
"""Prepare, but never execute, a controlled OP-1 content transfer."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import shutil
from pathlib import Path, PurePosixPath
from typing import Any


CHUNK_SIZE = 1024 * 1024
ALLOWED_ROOTS = ("tape", "album", "synth/user", "drum/user")
SCHEMA_VERSION = 1


class TransferPlanError(Exception):
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


def _hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(CHUNK_SIZE):
            digest.update(chunk)
    return digest.hexdigest()


def _relative(path: Path, root: Path) -> str:
    relative = path.relative_to(root).as_posix()
    parsed = PurePosixPath(relative)
    if parsed.is_absolute() or any(part in {"", ".", ".."} for part in parsed.parts):
        raise TransferPlanError("unsafe_path", "A source path is not safely relative.", path=relative)
    return relative


def _allowed(relative: str) -> bool:
    return any(relative == root or relative.startswith(f"{root}/") for root in ALLOWED_ROOTS)


def _verify_backup(snapshot: Path) -> dict[str, Any]:
    manifest_path = snapshot.expanduser().resolve() / "manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise TransferPlanError("backup_unavailable", "The backup manifest cannot be read.", path=str(manifest_path)) from exc
    if manifest.get("model") != "op-1-original":
        raise TransferPlanError("backup_model", "The backup is not an original OP-1 snapshot.")
    files_root = manifest_path.parent / "files"
    for entry in manifest.get("files", []):
        relative = str(entry.get("path", ""))
        parsed = PurePosixPath(relative)
        target = files_root / relative
        if parsed.is_absolute() or any(part in {"", ".", ".."} for part in parsed.parts):
            raise TransferPlanError("unsafe_path", "The backup contains an unsafe path.", path=relative)
        if not target.is_file() or target.is_symlink() or target.stat().st_size != int(entry["size"]):
            raise TransferPlanError("backup_invalid", "A backup file is missing or changed.", path=relative)
        if _hash(target) != str(entry["sha256"]):
            raise TransferPlanError("backup_invalid", "A backup file failed SHA-256 verification.", path=relative)
    return {"snapshot": str(manifest_path.parent), "checkedFiles": len(manifest.get("files", []))}


def _files(root: Path) -> list[tuple[Path, str]]:
    result: list[tuple[Path, str]] = []
    for current, directories, names in os.walk(root, topdown=True, followlinks=False):
        current_path = Path(current)
        directories[:] = sorted(directories)
        for name in sorted(names):
            path = current_path / name
            relative = _relative(path, root)
            if not _allowed(relative):
                raise TransferPlanError("unexpected_path", "A transfer file is outside an OP-1 destination.", path=relative)
            if path.is_symlink():
                raise TransferPlanError("symlink_rejected", "Symlinked files cannot be transferred.", path=relative)
            if not path.is_file():
                raise TransferPlanError("special_file", "Only regular files can be transferred.", path=relative)
            result.append((path, relative))
    return result


def prepare_transfer(source: Path, device: Path) -> dict[str, Any]:
    source = source.expanduser().resolve()
    device = device.expanduser().resolve()
    if not source.is_dir():
        raise TransferPlanError("source_unavailable", "The prepared pack must be an existing directory.", path=str(source))
    if not device.is_dir():
        raise TransferPlanError("device_unavailable", "The target OP-1 volume must be mounted.", path=str(device))
    if source == device or source in device.parents or device in source.parents:
        raise TransferPlanError("overlapping_paths", "The source and device paths must be separate.")

    actions: list[dict[str, Any]] = []
    for source_path, relative in _files(source):
        source_hash = _hash(source_path)
        target = device / PurePosixPath(relative)
        if target.exists() and not target.is_file():
            raise TransferPlanError("target_not_regular", "An OP-1 destination is not a regular file.", path=relative)
        target_hash = _hash(target) if target.is_file() else None
        actions.append({
            "action": "skip" if target_hash == source_hash else "copy",
            "path": relative,
            "size": source_path.stat().st_size,
            "sourceSha256": source_hash,
            "targetSha256": target_hash,
        })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "model": "op-1-original",
        "machineWrite": False,
        "source": str(source),
        "device": str(device),
        "fileCount": len(actions),
        "copyCount": sum(action["action"] == "copy" for action in actions),
        "skipCount": sum(action["action"] == "skip" for action in actions),
        "actions": actions,
    }


def execute_transfer(source: Path, device: Path, backup_snapshot: Path, *, confirm: bool = False) -> dict[str, Any]:
    """Copy changed files only after an explicit confirmation and backup check."""
    if not confirm:
        raise TransferPlanError("confirmation_required", "Pass --confirm to enable machine writes.")
    backup = _verify_backup(backup_snapshot)
    plan = prepare_transfer(source, device)
    copied = 0
    skipped = 0
    for action in plan["actions"]:
        if action["action"] == "skip":
            skipped += 1
            continue
        relative = action["path"]
        source_path = Path(plan["source"]) / PurePosixPath(relative)
        target = Path(plan["device"]) / PurePosixPath(relative)
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_name(f".{target.name}.op1studio.partial")
        try:
            with source_path.open("rb") as input_stream, temporary.open("wb") as output_stream:
                shutil.copyfileobj(input_stream, output_stream, length=CHUNK_SIZE)
                output_stream.flush()
                os.fsync(output_stream.fileno())
            if _hash(temporary) != action["sourceSha256"]:
                raise TransferPlanError("source_changed", "A source file changed during transfer.", path=relative)
            os.replace(temporary, target)
            if _hash(target) != action["sourceSha256"]:
                raise TransferPlanError("write_verification_failed", "A device file failed post-copy verification.", path=relative)
            copied += 1
        finally:
            temporary.unlink(missing_ok=True)
    return {"schemaVersion": SCHEMA_VERSION, "machineWrite": True, "backup": backup, "copied": copied, "skipped": skipped, "verified": True}


def restore_file(backup_snapshot: Path, device: Path, relative: str, *, confirm: bool = False, replace: bool = False) -> dict[str, Any]:
    """Restore one missing device file from a verified snapshot without deleting anything."""
    if not confirm:
        raise TransferPlanError("confirmation_required", "Pass --confirm to enable machine writes.")
    parsed = PurePosixPath(relative)
    if parsed.is_absolute() or any(part in {"", ".", ".."} for part in parsed.parts) or not _allowed(relative):
        raise TransferPlanError("unexpected_path", "The restore path is outside an OP-1 content directory.", path=relative)
    backup = _verify_backup(backup_snapshot)
    snapshot = Path(backup["snapshot"])
    source = snapshot / "files" / parsed
    target = device.expanduser().resolve() / parsed
    if not device.expanduser().resolve().is_dir():
        raise TransferPlanError("device_unavailable", "The target OP-1 volume must be mounted.", path=str(device))
    if not source.is_file():
        raise TransferPlanError("backup_file_missing", "The requested file is not in the backup.", path=relative)
    if target.exists() and not replace:
        raise TransferPlanError("target_exists", "Refusing to overwrite an existing device file without --replace.", path=relative)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(f".{target.name}.op1studio.restore.partial")
    try:
        with source.open("rb") as input_stream, temporary.open("wb") as output_stream:
            shutil.copyfileobj(input_stream, output_stream, length=CHUNK_SIZE)
            output_stream.flush()
            os.fsync(output_stream.fileno())
        expected_hash = _hash(source)
        if _hash(temporary) != expected_hash:
            raise TransferPlanError("restore_verification_failed", "The temporary restore failed SHA-256 verification.", path=relative)
        os.replace(temporary, target)
        if _hash(target) != expected_hash:
            raise TransferPlanError("restore_verification_failed", "The restored device file failed SHA-256 verification.", path=relative)
    finally:
        temporary.unlink(missing_ok=True)
    return {"schemaVersion": SCHEMA_VERSION, "machineWrite": True, "backup": backup, "restored": relative, "sha256": expected_hash, "verified": True}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Prepare or execute a controlled OP-1 transfer.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    prepare = subparsers.add_parser("prepare")
    prepare.add_argument("source", type=Path, help="Prepared local pack")
    prepare.add_argument("device", type=Path, help="Mounted OP-1 volume")
    execute = subparsers.add_parser("execute")
    execute.add_argument("source", type=Path, help="Prepared local pack")
    execute.add_argument("device", type=Path, help="Mounted OP-1 volume")
    execute.add_argument("backup", type=Path, help="Verified local OP-1 backup snapshot")
    execute.add_argument("--confirm", action="store_true", help="Confirm writes to the mounted OP-1 volume")
    restore = subparsers.add_parser("restore")
    restore.add_argument("backup", type=Path, help="Verified local OP-1 backup snapshot")
    restore.add_argument("device", type=Path, help="Mounted OP-1 volume")
    restore.add_argument("path", help="Relative OP-1 file to restore")
    restore.add_argument("--confirm", action="store_true", help="Confirm writes to the mounted OP-1 volume")
    restore.add_argument("--replace", action="store_true", help="Allow replacing an existing file")
    args = parser.parse_args(argv)
    try:
        if args.command == "prepare":
            result = prepare_transfer(args.source, args.device)
        elif args.command == "execute":
            result = execute_transfer(args.source, args.device, args.backup, confirm=args.confirm)
        else:
            result = restore_file(args.backup, args.device, args.path, confirm=args.confirm, replace=args.replace)
        exit_code = 0
    except (TransferPlanError, OSError) as exc:
        if isinstance(exc, TransferPlanError):
            error = exc.to_dict()
        else:
            error = {"code": "read_failed", "message": str(exc)}
        result = {"valid": False, "error": error}
        exit_code = 2
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2, sort_keys=True)
    sys.stdout.write("\n")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
