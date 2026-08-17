#!/usr/bin/env python3
"""Inspect a mounted original OP-1 volume without changing it."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any


EXPECTED_DIRECTORIES = ("tape", "album", "synth", "drum")
SCHEMA_VERSION = 1


class InventoryError(Exception):
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


def _regular_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for current, directories, names in os.walk(root, topdown=True, followlinks=False):
        current_path = Path(current)
        directories[:] = sorted(name for name in directories if not (current_path / name).is_symlink())
        for name in sorted(names):
            candidate = current_path / name
            if candidate.is_symlink():
                raise InventoryError("symlink_rejected", "A symlink is not part of a device inventory.", path=str(candidate))
            if not candidate.is_file():
                raise InventoryError("special_file", "Only regular files can be inventoried.", path=str(candidate))
            files.append(candidate)
    return files


def inspect_device(root: Path) -> dict[str, Any]:
    root = root.expanduser().resolve()
    if not root.is_dir():
        raise InventoryError("source_unavailable", "The device root must be an existing directory.", path=str(root))

    present = [name for name in EXPECTED_DIRECTORIES if (root / name).is_dir()]
    if not present:
        raise InventoryError("not_op1", "The mounted directory has no OP-1 content directories.", path=str(root))

    files = _regular_files(root)
    category_rows: list[dict[str, Any]] = []
    for category in EXPECTED_DIRECTORIES:
        category_root = root / category
        category_files = [path for path in files if category_root in path.parents]
        category_rows.append({
            "name": category,
            "present": category in present,
            "fileCount": len(category_files),
            "totalBytes": sum(path.stat().st_size for path in category_files),
        })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "model": "op-1-original",
        "confidence": "high" if len(present) == len(EXPECTED_DIRECTORIES) else "medium",
        "root": str(root),
        "contentDirectories": present,
        "fileCount": len(files),
        "totalBytes": sum(path.stat().st_size for path in files),
        "categories": category_rows,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Inspect a mounted original OP-1 volume without writing to it.")
    parser.add_argument("root", type=Path)
    args = parser.parse_args(argv)
    try:
        result = inspect_device(args.root)
        exit_code = 0
    except InventoryError as exc:
        result = {"valid": False, "error": exc.to_dict()}
        exit_code = 2
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2, sort_keys=True)
    sys.stdout.write("\n")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
