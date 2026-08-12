#!/usr/bin/env python3
"""Validate and convert local samples for OP-1 user folders.

The command never edits source files. Conversion uses FFmpeg when available;
without it, --check-only still validates WAV and AIFF metadata.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import wave
from pathlib import Path

SUPPORTED = {".wav", ".aif", ".aiff"}
TARGET_RATE = 44100
TARGET_WIDTH = 2
MAX_SECONDS = {"synth": 6.0, "drum": 12.0}


def classify(path: Path, requested: str) -> str | None:
    if requested != "auto":
        return requested
    parts = {part.lower() for part in path.parts}
    if "drum" in parts:
        return "drum"
    if "synth" in parts:
        return "synth"
    if "tape" in parts or "album" in parts:
        return None
    return "synth"


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def wav_info(path: Path) -> dict:
    with wave.open(str(path), "rb") as audio:
        frames = audio.getnframes()
        rate = audio.getframerate()
        return {"channels": audio.getnchannels(), "rate": rate, "width": audio.getsampwidth(), "frames": frames, "seconds": frames / rate if rate else 0}


def aiff_info(path: Path) -> dict:
    data = path.read_bytes()
    if data[:4] not in {b"FORM"} or data[8:12] not in {b"AIFF", b"AIFC"}:
        raise ValueError("en-tete AIFF invalide")
    offset = 12
    info = None
    while offset + 8 <= len(data):
        chunk, size = data[offset:offset + 4], struct.unpack(">I", data[offset + 4:offset + 8])[0]
        body = data[offset + 8:offset + 8 + size]
        if chunk == b"COMM" and len(body) >= 18:
            channels, frames, width = struct.unpack(">H I H", body[:8])
            exponent = struct.unpack(">H", body[8:10])[0]
            mantissa = int.from_bytes(body[10:18], "big")
            rate = round((mantissa / (1 << 63)) * (2 ** (exponent - 16383))) if mantissa else 0
            info = {"channels": channels, "rate": rate, "width": (width + 7) // 8, "frames": frames, "seconds": frames / rate if rate else 0}
            break
        offset += 8 + size + (size & 1)
    if info is None:
        raise ValueError("chunk COMM AIFF absent")
    return info


def inspect(path: Path) -> dict:
    if path.suffix.lower() == ".wav":
        return wav_info(path)
    return aiff_info(path)


def safe_name(path: Path, used: set[str]) -> str:
    stem = re.sub(r"[^a-zA-Z0-9]", "", path.stem).lower() or "sound"
    stem = stem[:10]
    name = f"{stem}.aif"
    index = 1
    while name in used:
        suffix = f"{index:02d}"
        name = f"{stem[:10 - len(suffix)]}{suffix}.aif"
        index += 1
    used.add(name)
    return name


def convert(source: Path, target: Path) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg and os.environ.get("LOCALAPPDATA"):
        candidate = Path(os.environ["LOCALAPPDATA"]) / "OP-1-Studio" / "tools" / "ffmpeg" / "bin" / "ffmpeg.exe"
        if candidate.is_file():
            ffmpeg = str(candidate)
    if not ffmpeg:
        raise RuntimeError("FFmpeg est requis pour convertir. Utilisez --check-only ou installez FFmpeg.")
    command = [ffmpeg, "-nostdin", "-y", "-i", str(source), "-ac", "1", "-ar", str(TARGET_RATE), "-sample_fmt", "s16", str(target)]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip().splitlines()[-1] if result.stderr else "conversion FFmpeg echouee")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Dossier de samples a analyser")
    parser.add_argument("--output", type=Path, default=Path("backups/sample-preflight"), help="Dossier de sortie local")
    parser.add_argument("--mode", choices=["auto", *sorted(MAX_SECONDS)], default="auto")
    parser.add_argument("--check-only", action="store_true", help="Analyser sans convertir ni ecrire")
    args = parser.parse_args()
    if not args.input.is_dir():
        print(f"ERREUR: dossier introuvable: {args.input}", file=sys.stderr)
        return 1
    files = sorted(path for path in args.input.rglob("*") if path.is_file() and path.suffix.lower() in SUPPORTED)
    if not files:
        print("Aucun WAV ou AIFF trouve.", file=sys.stderr)
        return 1
    if not args.check_only:
        args.output.mkdir(parents=True, exist_ok=True)
        target_dir = args.output / args.mode / "user"
        target_dir.mkdir(parents=True, exist_ok=True)
    used: set[str] = set()
    rows = []
    failures = 0
    for source in files:
        mode = classify(source, args.mode)
        row = {"source": str(source), "source_sha256": digest(source), "mode": mode or "ignored"}
        if mode is None:
            row["status"] = "ignored"
            rows.append(row)
            print(f"IGNORED  {source.name} (tape/album : pas un sample utilisateur)")
            continue
        try:
            info = inspect(source)
            row["input"] = info
            if info["seconds"] > MAX_SECONDS[mode] + 0.01:
                raise ValueError(f"duree {info['seconds']:.2f}s > limite {MAX_SECONDS[mode]:.0f}s")
            row["status"] = "valid"
            if not args.check_only:
                target = args.output / mode / "user" / safe_name(source, used)
                target.parent.mkdir(parents=True, exist_ok=True)
                convert(source, target)
                output_info = inspect(target)
                if output_info["rate"] != TARGET_RATE or output_info["width"] != TARGET_WIDTH or output_info["channels"] != 1:
                    raise ValueError("sortie non conforme: mono, 44100 Hz, 16 bits attendu")
                row.update({"output": str(target), "output_sha256": digest(target), "output_info": output_info})
        except (OSError, ValueError, RuntimeError) as error:
            failures += 1
            row.update({"status": "rejected", "error": str(error)})
        rows.append(row)
        print(f"{row['status'].upper():8} {source.name} {row.get('error', '')}")
    if not args.check_only:
        (args.output / "MANIFESTE_SAMPLES.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
    valid = sum(row["status"] == "valid" for row in rows)
    ignored = sum(row["status"] == "ignored" for row in rows)
    print(f"TOTAL={len(rows)} VALIDES={valid} IGNORES={ignored} REJETES={failures}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
