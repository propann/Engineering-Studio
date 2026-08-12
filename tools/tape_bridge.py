#!/usr/bin/env python3
"""Prepare four local audio tracks for OP-1 tape import.

Sources are never modified. The output folder is created separately and can be
reviewed before copying it to the OP-1 disk.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

MAX_SECONDS = 360
SUPPORTED = {".wav", ".aif", ".aiff", ".flac", ".mp3", ".m4a"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def ffmpeg_path() -> str:
    found = shutil.which("ffmpeg")
    if found:
        return found
    local = Path(os.environ.get("LOCALAPPDATA", "")) / "OP-1-Studio" / "tools" / "ffmpeg" / "bin" / "ffmpeg.exe"
    if local.is_file():
        return str(local)
    raise RuntimeError("FFmpeg est introuvable. Lancez Install-OP1StudioTools.ps1 -All.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inputs", nargs="+", type=Path, required=True, help="1 a 4 fichiers audio, dans l'ordre des pistes")
    parser.add_argument("--output", type=Path, default=Path("backups/tape-import"))
    args = parser.parse_args()
    if len(args.inputs) > 4:
        print("ERREUR: quatre pistes maximum.", file=sys.stderr)
        return 1
    try:
        ffmpeg = ffmpeg_path()
        args.output.mkdir(parents=True, exist_ok=True)
        tape_dir = args.output / "tape"
        tape_dir.mkdir(parents=True, exist_ok=True)
        rows = []
        for index, source in enumerate(args.inputs, 1):
            if not source.is_file() or source.suffix.lower() not in SUPPORTED:
                raise ValueError(f"Fichier audio invalide: {source}")
            target = tape_dir / f"track_{index}.aif"
            if target.exists():
                raise ValueError(f"La sortie existe deja: {target}")
            command = [ffmpeg, "-nostdin", "-y", "-i", str(source), "-t", str(MAX_SECONDS), "-ac", "1", "-ar", "44100", "-sample_fmt", "s16", str(target)]
            result = subprocess.run(command, capture_output=True, text=True, check=False)
            if result.returncode != 0:
                detail = result.stderr.strip().splitlines()[-1] if result.stderr else "conversion echouee"
                raise RuntimeError(f"{source.name}: {detail}")
            rows.append({"track": index, "source": str(source.resolve()), "source_sha256": sha256(source), "output": str(target), "output_sha256": sha256(target), "max_seconds": MAX_SECONDS})
            print(f"READY    track_{index}.aif")
        (args.output / "MANIFESTE_TAPE.json").write_text(json.dumps({"format": "OP-1 tape", "sample_rate": 44100, "bits": 16, "channels": 1, "tracks": rows, "machine_write": False}, indent=2), encoding="utf-8")
        print(f"TAPE_READY={tape_dir}")
        print("MACHINE_WRITE=False")
        return 0
    except (OSError, RuntimeError, ValueError) as error:
        print(f"ERREUR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
