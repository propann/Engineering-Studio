#!/usr/bin/env python3
"""Prepare, but never execute, a controlled OP-1 content transfer."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
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


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Prepare an OP-1 transfer plan without writing to the device.")
    parser.add_argument("source", type=Path, help="Prepared local pack")
    parser.add_argument("device", type=Path, help="Mounted OP-1 volume")
    args = parser.parse_args(argv)
    try:
        result = prepare_transfer(args.source, args.device)
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
