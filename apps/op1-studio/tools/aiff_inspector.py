#!/usr/bin/env python3
"""Inspect OP-1 AIFF containers without decoding or rewriting them."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from pathlib import Path

from sample_preflight import aiff_info


def inspect(path: Path) -> dict:
    data = path.read_bytes()
    if data[:4] != b"FORM" or len(data) < 12 or data[8:12] not in {b"AIFF", b"AIFC"}:
        raise ValueError("en-tete AIFF invalide")
    chunks = []
    offset = 12
    while offset + 8 <= len(data):
        chunk_id = data[offset:offset + 4].decode("ascii", errors="replace")
        size = struct.unpack(">I", data[offset + 4:offset + 8])[0]
        end = offset + 8 + size
        if end > len(data):
            raise ValueError(f"chunk {chunk_id} tronque")
        chunks.append({"id": chunk_id, "size": size})
        offset = end + (size & 1)
    if offset != len(data):
        raise ValueError("octets residuels apres les chunks AIFF")
    return {
        "file": path.name,
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
        "format": data[8:12].decode("ascii"),
        "audio": aiff_info(path),
        "chunks": chunks,
        "unknown_chunks": [chunk["id"] for chunk in chunks if chunk["id"] not in {"COMM", "SSND", "FVER", "APPL", "INST", "MARK", "COMT", "NAME", "AUTH", "ANNO"}],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Fichier AIFF a inspecter")
    args = parser.parse_args()
    try:
        print(json.dumps(inspect(args.input), indent=2, ensure_ascii=False))
    except (OSError, ValueError) as error:
        print(f"ERREUR: {error}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
