#!/usr/bin/env python3
"""Read and write the OP-1 Studio profile inside a selected local vault."""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path

SCHEMA = "op1-studio-profile"
DEFAULT = {
    "schema": SCHEMA,
    "version": 1,
    "pseudo": "Mon atelier OP-1",
    "machines": [],
    "localSpace": {"root": "backups/"},
    "shareMarkers": [],
    "preferences": {"language": "fr", "keyboard": "azerty", "theme": "machine"},
}


def vault_path(root: Path) -> Path:
    resolved = root.expanduser().resolve()
    if not resolved.is_dir():
        raise ValueError(f"coffre introuvable: {root}")
    return resolved / "profile.json"


def normalize(value: object) -> dict:
    if not isinstance(value, dict) or value.get("schema") not in {None, SCHEMA}:
        raise ValueError("schema profile.json invalide")
    result = json.loads(json.dumps(DEFAULT))
    result["pseudo"] = value.get("pseudo") if isinstance(value.get("pseudo"), str) and value["pseudo"].strip() else DEFAULT["pseudo"]
    machines = value.get("machines", [])
    if not isinstance(machines, list):
        raise ValueError("machines doit etre une liste")
    result["machines"] = [machine for machine in machines if isinstance(machine, dict) and isinstance(machine.get("name", "OP-1"), str)]
    local_space = value.get("localSpace", {})
    if isinstance(local_space, dict) and isinstance(local_space.get("root", DEFAULT["localSpace"]["root"]), str):
        result["localSpace"]["root"] = local_space.get("root") or DEFAULT["localSpace"]["root"]
    markers = value.get("shareMarkers", [])
    if isinstance(markers, list):
        result["shareMarkers"] = [marker for marker in markers if isinstance(marker, str) and marker.strip()]
    preferences = value.get("preferences", {})
    if isinstance(preferences, dict):
        result["preferences"]["language"] = "en" if preferences.get("language") == "en" else "fr"
        result["preferences"]["keyboard"] = "qwerty" if preferences.get("keyboard") == "qwerty" else "azerty"
    return result


def read_profile(root: Path) -> dict:
    path = vault_path(root)
    if not path.exists():
        return json.loads(json.dumps(DEFAULT))
    return normalize(json.loads(path.read_text(encoding="utf-8")))


def write_profile(root: Path, value: object) -> Path:
    path = vault_path(root)
    data = json.dumps(normalize(value), ensure_ascii=False, indent=2) + "\n"
    descriptor, temporary = tempfile.mkstemp(prefix="profile.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    for command in ("read", "init"):
        subparsers.add_parser(command).add_argument("--root", type=Path, required=True)
    write_parser = subparsers.add_parser("write")
    write_parser.add_argument("--root", type=Path, required=True)
    write_parser.add_argument("--input", type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == "read":
            print(json.dumps(read_profile(args.root), ensure_ascii=False, indent=2))
        elif args.command == "init":
            print(write_profile(args.root, DEFAULT))
        else:
            print(write_profile(args.root, json.loads(args.input.read_text(encoding="utf-8"))))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"ERREUR: {error}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
