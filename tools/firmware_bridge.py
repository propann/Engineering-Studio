#!/usr/bin/env python3
"""Prepare a reproducible OP-1 firmware build without touching the source file.

This bridge intentionally stops at creating a verified .op1 artifact. It never
mounts, flashes, or writes to an OP-1 device.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VENDOR = ROOT / "tools" / "vendor"
sys.path.insert(0, str(VENDOR))

from op1repacker import op1_db, op1_gfx, op1_patches, op1_repack  # noqa: E402

VALID_OPTIONS = {
    "iter",
    "presets-iter",
    "filter",
    "subtle-fx",
    "gfx-iter-lab",
    "gfx-cwo-moose",
    "gfx-tape-invert",
}
DB_OPTIONS = {"iter", "presets-iter", "filter", "subtle-fx"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def modify(unpacked: Path, options: set[str]) -> None:
    db_options = options & DB_OPTIONS
    if db_options:
        database = op1_db.OP1DB()
        database.open(str(unpacked / "content" / "op1_factory.db"))
        if "iter" in db_options:
            database.enable_iter()
        if "presets-iter" in db_options and not database.synth_preset_folder_exists("iter"):
            preset_dir = Path(__file__).parent / "vendor" / "op1repacker" / "assets" / "presets" / "iter"
            for patch in op1_patches.load_patch_folder(str(preset_dir)):
                database.insert_synth_preset(json.dumps(patch), "iter")
        if "filter" in db_options:
            database.enable_filter()
        if "subtle-fx" in db_options:
            database.enable_subtle_fx_defaults()
        if not database.commit():
            raise RuntimeError("La base op1_factory.db n'a pas pu etre validee.")

    display = unpacked / "content" / "display"
    if "gfx-iter-lab" in options:
        shutil.copy2(Path(__file__).parent / "vendor" / "op1repacker" / "assets" / "display" / "iter-lab.svg", display / "iter.svg")
    for option in sorted(options & {"gfx-cwo-moose", "gfx-tape-invert"}):
        patch = Path(__file__).parent / "vendor" / "op1repacker" / "assets" / "display" / f"{option[4:]}.patch.json"
        if not op1_gfx.patch_image_file(str(unpacked), str(patch)):
            raise RuntimeError(f"Le patch graphique {option} a echoue.")


def build(source: Path, output_dir: Path, options: set[str]) -> Path:
    source = source.resolve()
    if source.suffix.lower() != ".op1" or not source.is_file():
        raise ValueError("Le fichier source doit etre un firmware .op1 existant.")
    output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="op1-studio-") as temp:
        work = Path(temp)
        copied = work / "source.op1"
        shutil.copy2(source, copied)
        repacker = op1_repack.OP1Repack()
        if not repacker.unpack(str(copied)):
            raise RuntimeError("Desassemblage du firmware impossible.")
        unpacked = work / "source"
        modify(unpacked, options)
        if not repacker.repack(str(unpacked)):
            raise RuntimeError("Reassemblage du firmware impossible.")
        built = work / "source-repacked.op1"
        output = output_dir / f"OP1_{source.stem}_mods.op1"
        shutil.copy2(built, output)

    manifest = output.with_suffix(".json")
    manifest.write_text(json.dumps({
        "source": str(source),
        "source_sha256": sha256(source),
        "output": str(output),
        "output_sha256": sha256(output),
        "options": sorted(options),
        "flashed": False,
    }, indent=2), encoding="utf-8")
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Firmware officiel source (.op1)")
    parser.add_argument("--output-dir", default=ROOT / "backups" / "firmware-builds", type=Path)
    parser.add_argument("--options", nargs="+", default=sorted(VALID_OPTIONS), choices=sorted(VALID_OPTIONS))
    args = parser.parse_args()
    try:
        output = build(args.input, args.output_dir, set(args.options))
    except (OSError, RuntimeError, ValueError) as error:
        print(f"ERREUR: {error}", file=sys.stderr)
        return 1
    print(f"BUILD_OK={output}")
    print(f"SHA256={sha256(output)}")
    print("FLASHED=False")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
