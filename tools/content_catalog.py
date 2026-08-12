#!/usr/bin/env python3
"""Create and verify a local, provenance-aware OP-1 content library.

The tool is deliberately dependency-free and never connects to a service. It
indexes files selected by the user, hashes them, and keeps unknown content in
quarantine until its provenance and licence are reviewed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


MANIFEST_RELATIVE = Path("manifests/library.json")
LAYOUT = (
    Path("backups"),
    Path("content"),
    Path("exports"),
    Path("firmware/official"),
    Path("firmware/modded"),
    Path("manifests"),
    Path("packs"),
    Path("patches/drum"),
    Path("patches/sampler"),
    Path("patches/synth"),
    Path("quarantine"),
    Path("samples"),
    Path("tapes"),
    Path("themes"),
)
SKIP_DIRECTORIES = {".git", ".cache", "node_modules", "__pycache__"}
AUDIO_EXTENSIONS = {".aif", ".aiff", ".aifc", ".wav", ".flac", ".mp3", ".ogg", ".m4a"}
ARCHIVE_EXTENSIONS = {".zip", ".tar", ".tgz", ".gz", ".7z"}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalise_root(value: str | Path) -> Path:
    root = Path(value).expanduser().resolve()
    if root.parent == root:
        raise ValueError(f"refusing to use a filesystem root as the library: {root}")
    if root.exists() and not root.is_dir():
        raise ValueError(f"library root is not a directory: {root}")
    return root


def manifest_path(root: Path) -> Path:
    return root / MANIFEST_RELATIVE


def empty_manifest() -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "libraryId": "local-op1-library",
        "model": "op-1-original",
        "generatedBy": "tools/content_catalog.py",
        "generatedAt": utc_now(),
        "policy": {
            "unknownLicense": "quarantine",
            "firmwareBinaries": "local-only",
            "thirdPartyContent": "do-not-redistribute",
        },
        "assets": [],
    }


def atomic_write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def initialise(root: Path) -> tuple[Path, bool]:
    root.mkdir(parents=True, exist_ok=True)
    for relative in LAYOUT:
        (root / relative).mkdir(parents=True, exist_ok=True)

    path = manifest_path(root)
    if path.exists():
        return path, False
    atomic_write_json(path, empty_manifest())
    return path, True


def load_manifest(root: Path) -> dict[str, Any]:
    path, _ = initialise(root)
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON manifest: {path}: {exc}") from exc
    if not isinstance(value, dict) or not isinstance(value.get("assets", []), list):
        raise ValueError(f"manifest must be an object with an assets list: {path}")
    return value


def iter_files(root: Path) -> Iterable[Path]:
    manifest = manifest_path(root).resolve()
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.is_symlink():
            continue
        if path.resolve() == manifest:
            continue
        relative_parts = path.relative_to(root).parts
        if any(part in SKIP_DIRECTORIES or part.startswith(".") for part in relative_parts):
            continue
        yield path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def classify(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".op1":
        return "firmware-container"
    if suffix in AUDIO_EXTENSIONS:
        if any(part in {"patch", "patches"} for part in path.parts):
            return "aiff-patch-or-sample"
        return "audio"
    if suffix == ".svg":
        return "theme-svg"
    if suffix in ARCHIVE_EXTENSIONS:
        return "pack-archive"
    if suffix in {".json", ".yaml", ".yml"}:
        return "metadata"
    if suffix in {".txt", ".md", ".pdf"}:
        return "documentation"
    return "other"


def relative_path(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def scan(root: Path) -> dict[str, int]:
    manifest = load_manifest(root)
    previous = {asset.get("path"): asset for asset in manifest.get("assets", []) if isinstance(asset, dict)}
    assets: list[dict[str, Any]] = []
    seen: set[str] = set()

    for path in iter_files(root):
        relative = relative_path(root, path)
        seen.add(relative)
        digest = sha256_file(path)
        old = previous.get(relative, {})
        asset = {
            "id": old.get("id") or f"sha256:{digest}",
            "path": relative,
            "kind": classify(path),
            "extension": path.suffix.lower(),
            "sha256": digest,
            "size": path.stat().st_size,
            "scannedAt": utc_now(),
            "importStatus": old.get("importStatus", "quarantine"),
            "licenseStatus": old.get("licenseStatus", "unknown"),
            "source": old.get("source", {"kind": "unknown", "url": None, "author": None}),
            "compatibility": old.get("compatibility", {"model": "op-1-original", "firmware": "unknown"}),
        }
        for key in ("tags", "notes", "durationSeconds", "sampleRate", "channels", "metadata"):
            if key in old:
                asset[key] = old[key]
        assets.append(asset)

    manifest["generatedAt"] = utc_now()
    manifest["assets"] = sorted(assets, key=lambda item: item["path"])
    atomic_write_json(manifest_path(root), manifest)
    return {
        "indexed": len(assets),
        "added": sum(1 for path in seen if path not in previous),
        "removed": sum(1 for path in previous if path not in seen),
    }


def verify(root: Path) -> tuple[dict[str, Any], int]:
    manifest = load_manifest(root)
    missing: list[str] = []
    changed: list[str] = []
    tracked = set()

    for asset in manifest.get("assets", []):
        if not isinstance(asset, dict) or not isinstance(asset.get("path"), str):
            changed.append("<invalid-manifest-entry>")
            continue
        relative = asset["path"]
        tracked.add(relative)
        path = root / Path(relative)
        if not path.is_file() or path.is_symlink():
            missing.append(relative)
            continue
        if path.stat().st_size != asset.get("size") or sha256_file(path) != asset.get("sha256"):
            changed.append(relative)

    untracked = sorted(relative_path(root, path) for path in iter_files(root) if relative_path(root, path) not in tracked)
    result = {
        "valid": not (missing or changed or untracked),
        "tracked": len(tracked),
        "missing": missing,
        "changed": changed,
        "untracked": untracked,
    }
    return result, 0 if result["valid"] else 1


def command_init(args: argparse.Namespace) -> int:
    root = normalise_root(args.root)
    path, created = initialise(root)
    print(json.dumps({"root": str(root), "manifest": str(path), "created": created}, ensure_ascii=False))
    return 0


def command_scan(args: argparse.Namespace) -> int:
    root = normalise_root(args.root)
    print(json.dumps({"root": str(root), **scan(root)}, ensure_ascii=False))
    return 0


def command_verify(args: argparse.Namespace) -> int:
    root = normalise_root(args.root)
    result, code = verify(root)
    print(json.dumps({"root": str(root), **result}, indent=2, ensure_ascii=False))
    return code


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    for name, function, help_text in (
        ("init", command_init, "create the local library layout and manifest"),
        ("scan", command_scan, "hash files and update the manifest"),
        ("verify", command_verify, "verify tracked hashes and detect untracked files"),
    ):
        subparser = subparsers.add_parser(name, help=help_text)
        subparser.add_argument("root", help="local library directory")
        subparser.set_defaults(function=function)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.function(args)
    except (OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
