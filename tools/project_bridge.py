#!/usr/bin/env python3
"""Create and validate the versioned OP-1 Studio project format."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = "op1-studio-project"
VERSION = 1


def empty_project(name: str) -> dict:
    return {
        "schema": SCHEMA,
        "version": VERSION,
        "name": name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "tempo": 90,
        "sample_rate": 44100,
        "length_seconds": 360,
        "tracks": [
            {"id": f"track-{index}", "name": f"Track {index}", "mute": False, "solo": False, "clips": [], "midi_events": []}
            for index in range(1, 5)
        ],
        "sources": [],
        "device": {"model": "OP-1 original", "midi_port": None},
    }


def validate(project: object) -> list[str]:
    errors: list[str] = []
    if not isinstance(project, dict):
        return ["project must be an object"]
    if project.get("schema") != SCHEMA:
        errors.append("schema invalide")
    if project.get("version") != VERSION:
        errors.append("version de projet non supportee")
    if not isinstance(project.get("name"), str) or not project["name"].strip():
        errors.append("name manquant")
    if not isinstance(project.get("tempo"), (int, float)) or not 20 <= project["tempo"] <= 300:
        errors.append("tempo doit etre compris entre 20 et 300")
    tracks = project.get("tracks")
    if not isinstance(tracks, list) or len(tracks) != 4:
        errors.append("le projet doit contenir exactement 4 pistes")
    else:
        for index, track in enumerate(tracks, 1):
            if not isinstance(track, dict) or not isinstance(track.get("clips"), list) or not isinstance(track.get("midi_events"), list):
                errors.append(f"track {index} invalide")
    if not isinstance(project.get("sources"), list):
        errors.append("sources doit etre une liste")
    if "source_refs" in project and not isinstance(project.get("source_refs"), list):
        errors.append("source_refs doit etre une liste")
    for index, reference in enumerate(project.get("source_refs", [])):
        if not isinstance(reference, dict) or not isinstance(reference.get("path"), str) or not reference["path"].strip():
            errors.append(f"source_refs {index} invalide")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    create = sub.add_parser("create")
    create.add_argument("--name", default="Nouveau projet OP-1")
    create.add_argument("--output", type=Path, required=True)
    check = sub.add_parser("validate")
    check.add_argument("project", type=Path)
    args = parser.parse_args()
    if args.command == "create":
        if args.output.exists():
            print(f"ERREUR: la sortie existe deja: {args.output}", file=sys.stderr)
            return 1
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(empty_project(args.name), indent=2), encoding="utf-8")
        print(f"PROJECT_CREATED={args.output}")
        return 0
    try:
        project = json.loads(args.project.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"ERREUR: {error}", file=sys.stderr)
        return 1
    errors = validate(project)
    if errors:
        print("INVALID_PROJECT=" + "; ".join(errors))
        return 1
    print(f"PROJECT_VALID={args.project}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
