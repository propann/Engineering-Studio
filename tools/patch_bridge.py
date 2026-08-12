#!/usr/bin/env python3
"""Safe adapter around the locally installed op-patch-util executable."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

SUPPORTED_INPUTS = {".wav", ".aif", ".aiff"}


def executable() -> str:
    found = shutil.which("op-patch-util") or shutil.which("op-patch-util.exe")
    if found:
        return found
    local = Path(os.environ.get("USERPROFILE", "")) / ".cargo" / "bin" / "op-patch-util.exe"
    if local.is_file():
        return str(local)
    raise RuntimeError("op-patch-util est introuvable. Lancez Install-OP1StudioTools.ps1 -All.")


def validate_inputs(paths: list[Path], maximum: int) -> None:
    if not paths or len(paths) > maximum:
        raise ValueError(f"Nombre de fichiers invalide: 1-{maximum} attendu.")
    for path in paths:
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_INPUTS:
            raise ValueError(f"Fichier sample invalide: {path}")


def run(command: list[str]) -> int:
    result = subprocess.run(command, check=False)
    if result.returncode:
        return result.returncode
    print(f"PATCH_OK={command[-1]}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="mode", required=True)
    synth = sub.add_parser("synth", help="Creer un patch synthese depuis un sample")
    synth.add_argument("--input", required=True, type=Path)
    synth.add_argument("--output", required=True, type=Path)
    synth.add_argument("--base-freq", default=440, type=int)
    drum = sub.add_parser("drum", help="Creer un patch drum depuis 1 a 24 samples")
    drum.add_argument("--inputs", required=True, nargs="+", type=Path)
    drum.add_argument("--output", required=True, type=Path)
    drum.add_argument("--octave", default=5, type=int, choices=range(1, 11))
    drum.add_argument("--low-res", action="store_true")
    drum.add_argument("--copy-remaining", action="store_true")
    drum.add_argument("--pitch-shift-remaining", action="store_true")
    args = parser.parse_args()
    try:
        tool = executable()
        args.output.parent.mkdir(parents=True, exist_ok=True)
        if args.output.exists():
            raise ValueError(f"La sortie existe deja: {args.output}")
        if args.mode == "synth":
            validate_inputs([args.input], 1)
            command = [tool, "synth", "-f", str(args.base_freq), "--output", str(args.output), str(args.input)]
        else:
            validate_inputs(args.inputs, 24)
            command = [tool, "drum", "--octave", str(args.octave), "--output", str(args.output)]
            if args.low_res:
                command.append("--low-res")
            if args.copy_remaining:
                command.append("--copy-remaining")
            if args.pitch_shift_remaining:
                command.append("--pitch-shift-remaining")
            command.extend(str(path) for path in args.inputs)
        return run(command)
    except (OSError, RuntimeError, ValueError) as error:
        print(f"ERREUR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
