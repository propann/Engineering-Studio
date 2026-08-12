#!/usr/bin/env python3
"""Inspect, sort and prepare non-destructive edits for OP-1 display SVGs.

This bridge never writes into a firmware file. It works on a throwaway copy
of a local `.op1` (or an already unpacked directory), sorts the extracted
`content/display/*.svg` resources into documented categories, and can turn a
before/after edit of a single SVG into a patch file compatible with
`op1_gfx.patch_image_file` (the same engine already used by
`firmware_bridge.py` for `gfx-cwo-moose` / `gfx-tape-invert`).

Nothing here is committed to the repository: firmware resources stay under
`backups/` (already ignored by Git), exactly like the other bridges.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
VENDOR = ROOT / "tools" / "vendor"
sys.path.insert(0, str(VENDOR))

from op1repacker import op1_gfx, op1_repack  # noqa: E402


# Confidence levels, in the same spirit as docs/OP1_KNOWLEDGE_BASE.md:
# - "high": the screen is named on an official teenage.engineering page or in
#   our own verified mod catalog (data/mods/catalog.json).
# - "medium": the name matches a documented OP-1 concept (effect, LFO,
#   engine) but the exact screen naming is not confirmed by TE directly.
# - "low": internal firmware codename, no external confirmation found. Kept
#   in "non_identifie" so nobody mistakes a guess for a fact.
CATEGORY_MAP: dict[str, tuple[str, str, str]] = {
    "tape": ("tape", "high", "Guide officiel, chapitre tape-mode."),
    "tapeconfig": ("tape", "high", "Deja documente dans FIRMWARE_MOD_CATALOG.md."),
    "mixer": ("tape", "high", "Fiche produit : \"4 channel mixer\" de la fonction Tape."),
    "album": ("album", "high", "Guide officiel, chapitre song-rendering-and-connectivity."),
    "com": ("connectivite", "high", "Repere \"album/com\" du guide layout officiel."),
    "help": ("aide", "high", "Guide officiel, chapitre help."),
    "tempo": ("tempo", "high", "Guide officiel, chapitre tempo."),
    "clock": ("sequenceurs", "medium", "Associe au tempo/horloge, non nomme explicitement par TE."),
    "octave": ("clavier", "high", "Guide officiel, ancre musical-keyboard#3.2 (octave shift)."),
    "endless": ("sequenceurs", "high", "Nomme \"Endless sequencer\" dans OP1_KNOWLEDGE_BASE.md."),
    "pattern": ("sequenceurs", "medium", "Sequenceur pattern, coherent avec le guide sequencers."),
    "playmode": ("modes_principaux", "high", "Deja documente dans FIRMWARE_MOD_CATALOG.md."),
    "rymd": ("effets", "high", "op1-glitter THEME_CREATION.md : effet Spring. Corrige la categorie 'modes_principaux' d'une premiere passe moins sourcee."),
    "delay": ("effets", "high", "Fiche produit : \"seven high quality effects\"."),
    "eq": ("effets", "high", "Fiche produit : effets + fonction mixer/EQ Tape."),
    "master": ("effets", "high", "OP1_KNOWLEDGE_BASE.md : traitements master de l'Album."),
    "singlelfo": ("lfo", "high", "Fiche produit : \"multiple routable lfo's\"."),
    "duallfo": ("lfo", "high", "Fiche produit : \"multiple routable lfo's\"."),
    "rndlfo": ("lfo", "high", "Fiche produit : \"multiple routable lfo's\"."),
    "bendlfo": ("lfo", "high", "Fiche produit : \"multiple routable lfo's\"."),
    "cranklfo": ("lfo", "high", "Fiche produit : \"multiple routable lfo's\"."),
    "midilfo": ("lfo", "high", "Fiche produit : \"multiple routable lfo's\"."),
    "reroutelfo": ("lfo", "high", "Fiche produit : \"multiple routable lfo's\"."),
    "duallfo2": ("lfo", "high", "Fiche produit : \"multiple routable lfo's\"."),
    "iter": ("moteurs_sonores", "high", "data/mods/catalog.json : synthe Iter verifie."),
    "fm": ("moteurs_sonores", "medium", "Moteur FM, coherent avec les treize moteurs annonces."),
    "sampler": ("moteurs_sonores", "medium", "OP-1 documente comme synthetiseur ET sampler."),
    "presetbrowser": ("navigation_presets", "medium", "Nom explicite du fichier, pas de page TE dediee."),
    "save": ("interface_generique", "low", "Chrome d'interface generique, sens probable mais non confirme."),
    # Les entrees suivantes viennent du dictionnaire de codenames publie par
    # op1hacks/op1-glitter (THEME_CREATION.md, consulte le 12 aout 2026) :
    # un outil communautaire de theme qui documente le sens reel de chaque
    # SVG pour pouvoir le repeindre. Source communautaire, mais precise et
    # techniquement testee (l'outil modifie ces fichiers avec succes).
    "bode": ("effets", "high", "op1-glitter THEME_CREATION.md : effet CWO."),
    "cls": ("moteurs_sonores", "high", "op1-glitter THEME_CREATION.md : moteur synthe Cluster."),
    "drum2": ("moteurs_sonores", "high", "op1-glitter THEME_CREATION.md : editeur de samples Drum."),
    "ftwo": ("effets", "high", "op1-glitter THEME_CREATION.md : effet Nitro."),
    "id": ("moteurs_sonores", "high", "op1-glitter THEME_CREATION.md : moteur synthe DNA."),
    "lander": ("interface_generique", "high", "op1-glitter THEME_CREATION.md : easter egg \"Chop Lifter!\"."),
    "mllp": ("effets", "high", "op1-glitter THEME_CREATION.md : effet Punch."),
    "ok": ("sequenceurs", "high", "op1-glitter THEME_CREATION.md : sequenceur Finger."),
    "pd": ("moteurs_sonores", "high", "op1-glitter THEME_CREATION.md : moteur synthe Phase."),
    "pls": ("moteurs_sonores", "high", "op1-glitter THEME_CREATION.md : moteur synthe Pulse."),
    "ptch": ("effets", "high", "op1-glitter THEME_CREATION.md : effet Phone."),
    "simple": ("sequenceurs", "high", "op1-glitter THEME_CREATION.md : sequenceur Arpeggio."),
    "slump": ("moteurs_sonores", "high", "op1-glitter THEME_CREATION.md : moteur synthe Voltage."),
    "st": ("moteurs_sonores", "high", "op1-glitter THEME_CREATION.md : moteur synthe String."),
    "t10": ("moteurs_sonores", "high", "op1-glitter THEME_CREATION.md : moteur synthe Digital."),
}

DEFAULT_CATEGORY = ("non_identifie", "low", "Codename interne du firmware, aucune source externe ne le confirme.")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_view_box(svg_text: str) -> str | None:
    match = re.search(r'viewBox="([^"]+)"', svg_text)
    return match.group(1) if match else None


def categorize(stem: str) -> tuple[str, str, str]:
    return CATEGORY_MAP.get(stem.lower(), DEFAULT_CATEGORY)


def unpack_readonly(source: Path, work: Path) -> Path:
    """Copy `source` into `work` and unpack it there. Never touches `source`."""
    if source.is_dir():
        return source
    if source.suffix.lower() != ".op1" or not source.is_file():
        raise ValueError("La source doit etre un fichier .op1 existant ou un dossier deja deballe.")
    copied = work / "source.op1"
    shutil.copy2(source, copied)
    repacker = op1_repack.OP1Repack()
    if not repacker.unpack(str(copied)):
        raise RuntimeError("Desassemblage du firmware impossible.")
    return work / "source"


def list_display_assets(unpacked: Path) -> list[dict]:
    display_dir = unpacked / "content" / "display"
    if not display_dir.is_dir():
        raise FileNotFoundError(f"Aucun dossier content/display dans {unpacked}")

    assets = []
    for svg_path in sorted(display_dir.glob("*.svg")):
        data = svg_path.read_bytes()
        text = data.decode("utf-8", errors="replace")
        category, confidence, note = categorize(svg_path.stem)
        assets.append({
            "file": svg_path.name,
            "bytes": len(data),
            "sha256": sha256_bytes(data),
            "viewBox": read_view_box(text),
            "category": category,
            "confidence": confidence,
            "note": note,
        })
    return assets


def sort_assets(unpacked: Path, output_dir: Path) -> Path:
    """Copy every display SVG into output_dir/<category>/<file>.svg and write a manifest."""
    display_dir = unpacked / "content" / "display"
    assets = list_display_assets(unpacked)

    output_dir.mkdir(parents=True, exist_ok=True)
    for asset in assets:
        category_dir = output_dir / asset["category"]
        category_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(display_dir / asset["file"], category_dir / asset["file"])

    manifest = {
        "schema": "op1-studio-display-manifest",
        "version": 1,
        "assetCount": len(assets),
        "categories": sorted({asset["category"] for asset in assets}),
        "assets": assets,
    }
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    return manifest_path


def build_patch(filename: str, original_text: str, edited_text: str) -> dict:
    """Build a whole-file substitute patch, in the format read by op1_gfx.patch_image_file.

    This is intentionally the simplest correct patch: it replaces the exact
    original content with the edited content. It always round-trips, unlike
    a line-by-line diff, and stays compatible with the existing engine which
    only understands `substitute`, `move_all`, `move_element` and
    `move_elements` changes.
    """
    if original_text == edited_text:
        raise ValueError("Le contenu edite est identique a l'original : rien a patcher.")
    # `op1_gfx.apply_patch` calls `re.sub(find, replace, data)` with the raw
    # JSON strings. `re.sub` treats backslashes in the replacement as escape
    # sequences (`\1`, `\g<name>`, ...), so any literal backslash coming from
    # the edited SVG must be doubled here or the patch could mangle content
    # or raise `re.error` when applied.
    safe_replace = edited_text.replace("\\", "\\\\")
    return {
        "file": filename,
        "changes": [
            {
                "type": "substitute",
                "find": re.escape(original_text),
                "replace": safe_replace,
            }
        ],
    }


def apply_and_verify_patch(unpacked: Path, patch: dict) -> str:
    """Apply a patch on a copy and return the resulting SVG text, without touching the source."""
    target = unpacked / "content" / "display" / patch["file"]
    original = target.read_text(encoding="utf-8")
    patched = op1_gfx.apply_patch(original, patch)
    return patched.replace(op1_gfx.PATCH_IDENTIFIER, "")


def _cmd_list(args: argparse.Namespace) -> int:
    with tempfile.TemporaryDirectory(prefix="op1-studio-display-") as temp:
        unpacked = unpack_readonly(args.input, Path(temp))
        assets = list_display_assets(unpacked)
    print(json.dumps({"assetCount": len(assets), "assets": assets}, indent=2, ensure_ascii=False))
    return 0


def _cmd_sort(args: argparse.Namespace) -> int:
    with tempfile.TemporaryDirectory(prefix="op1-studio-display-") as temp:
        unpacked = unpack_readonly(args.input, Path(temp))
        manifest_path = sort_assets(unpacked, args.output_dir)
    print(f"MANIFEST={manifest_path}")
    return 0


def _cmd_patch(args: argparse.Namespace) -> int:
    original_text = args.original.read_text(encoding="utf-8")
    edited_text = args.edited.read_text(encoding="utf-8")
    patch = build_patch(args.file, original_text, edited_text)
    args.output.write_text(json.dumps(patch, indent=4, ensure_ascii=False), encoding="utf-8")
    print(f"PATCH_OK={args.output}")
    return 0


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    list_parser = subparsers.add_parser("list", help="Lister les SVG display avec leur categorie")
    list_parser.add_argument("--input", required=True, type=Path, help="Firmware .op1 ou dossier deja deballe")
    list_parser.set_defaults(func=_cmd_list)

    sort_parser = subparsers.add_parser("sort", help="Trier les SVG display par categorie et ecrire un manifeste")
    sort_parser.add_argument("--input", required=True, type=Path)
    sort_parser.add_argument("--output-dir", required=True, type=Path)
    sort_parser.set_defaults(func=_cmd_sort)

    patch_parser = subparsers.add_parser("patch", help="Generer un patch JSON depuis un avant/apres")
    patch_parser.add_argument("--file", required=True, help="Nom du fichier SVG cible, ex. tapeconfig.svg")
    patch_parser.add_argument("--original", required=True, type=Path)
    patch_parser.add_argument("--edited", required=True, type=Path)
    patch_parser.add_argument("--output", required=True, type=Path)
    patch_parser.set_defaults(func=_cmd_patch)

    args = parser.parse_args(list(argv) if argv is not None else None)
    try:
        return args.func(args)
    except (OSError, RuntimeError, ValueError, FileNotFoundError) as error:
        print(f"ERREUR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
