#!/usr/bin/env python3
"""Validate OP-1 display SVGs without changing the source file."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

TARGET_VIEWBOX = (320.0, 160.0)
RISKY_TAGS = {"script", "foreignObject", "image", "use"}
DECIMAL_RE = re.compile(r"[-+]?(?:\d+\.\d+|\.\d+)")


def inspect(path: Path) -> dict:
    data = path.read_bytes()
    if b"<!DOCTYPE" in data or b"<!ENTITY" in data:
        raise ValueError("DOCTYPE/ENTITY interdits")
    try:
        root = ET.fromstring(data)
    except ET.ParseError as error:
        raise ValueError(f"XML invalide: {error}") from error
    if root.tag.rsplit("}", 1)[-1] != "svg":
        raise ValueError("racine SVG absente")
    view_box = root.attrib.get("viewBox", "").replace(",", " ").split()
    if len(view_box) != 4:
        raise ValueError("viewBox SVG absent ou invalide")
    try:
        dimensions = tuple(float(value) for value in view_box)
    except ValueError as error:
        raise ValueError("viewBox SVG non numerique") from error
    tags = []
    risky = []
    styles = []
    excessive_decimals = []
    for element in root.iter():
        tag = element.tag.rsplit("}", 1)[-1]
        tags.append(tag)
        if tag in RISKY_TAGS:
            risky.append(tag)
        if "style" in element.attrib:
            styles.append(tag)
        for name, value in element.attrib.items():
            if any(len(match.group(0).split(".", 1)[1]) > 4 for match in DECIMAL_RE.finditer(value) if "." in match.group(0)):
                excessive_decimals.append(f"{tag}.{name}")
    return {
        "file": path.name,
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
        "viewBox": " ".join(view_box),
        "target_viewBox": dimensions[2:] == TARGET_VIEWBOX,
        "elements": len(tags),
        "risky_tags": sorted(set(risky)),
        "style_elements": sorted(set(styles)),
        "excessive_decimals": sorted(set(excessive_decimals)),
        "status": "review" if risky or styles or excessive_decimals or dimensions[2:] != TARGET_VIEWBOX else "ok",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Fichier SVG a inspecter")
    args = parser.parse_args()
    try:
        print(json.dumps(inspect(args.input), indent=2, ensure_ascii=False))
    except (OSError, ValueError) as error:
        print(f"ERREUR: {error}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
