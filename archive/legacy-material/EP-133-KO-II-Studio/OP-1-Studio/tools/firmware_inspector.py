#!/usr/bin/env python3
"""Read-only inspector for original OP-1 firmware containers.

The tool never extracts archive members and never writes to an OP-1 volume. It
validates the little-endian CRC-32 prefix documented by the MIT-licensed
op1repacker project (github.com/op1hacks/op1repacker), decodes the LZMA-Alone
payload with a strict size limit, and checks the TAR member table for paths or
types that would be unsafe to extract.
"""

from __future__ import annotations

import argparse
import binascii
import hashlib
import io
import json
import lzma
import sys
import tarfile
from dataclasses import asdict, dataclass
from pathlib import Path, PurePosixPath
from typing import Any


DEFAULT_MAX_COMPRESSED = 32 * 1024 * 1024
DEFAULT_MAX_UNCOMPRESSED = 256 * 1024 * 1024
DEFAULT_MAX_ENTRIES = 10_000

KNOWN_LAYOUT_MARKERS = {
    "OP1_vdk.ldr",
    "te-boot.ldr",
    "op1.db",
    "op1_factory.db",
    "tape.db",
}


class FirmwareInspectionError(Exception):
    """A predictable validation failure with a stable machine-readable code."""

    def __init__(self, code: str, message: str, **details: Any) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {"code": self.code, "message": self.message}
        if self.details:
            result["details"] = self.details
        return result


@dataclass(frozen=True)
class FirmwareMember:
    path: str
    size: int
    kind: str
    mode: str


@dataclass(frozen=True)
class FirmwareReport:
    valid: bool
    model: str
    sha256: str
    file_size: int
    stored_crc32: str
    calculated_crc32: str
    crc32_matches: bool
    compressed_size: int
    uncompressed_size: int
    archive_entries: int
    archive_payload_size: int
    recognized_markers: list[str]
    recognized_layout: bool
    members: list[FirmwareMember] | None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _decompress_lzma_alone(payload: bytes, max_output: int) -> bytes:
    try:
        decoder = lzma.LZMADecompressor(format=lzma.FORMAT_ALONE)
        output = decoder.decompress(payload, max_length=max_output + 1)
    except lzma.LZMAError as exc:
        raise FirmwareInspectionError(
            "invalid_lzma",
            "The payload is not a valid LZMA-Alone stream.",
        ) from exc

    if len(output) > max_output or (not decoder.eof and not decoder.needs_input):
        raise FirmwareInspectionError(
            "decompression_limit",
            "The decompressed payload exceeds the configured safety limit.",
            max_uncompressed_bytes=max_output,
        )

    if not decoder.eof:
        raise FirmwareInspectionError(
            "truncated_lzma",
            "The LZMA stream ended before its end marker.",
        )

    if decoder.unused_data:
        raise FirmwareInspectionError(
            "trailing_data",
            "Unexpected bytes follow the LZMA stream.",
            trailing_bytes=len(decoder.unused_data),
        )

    return output


def _validate_member_path(name: str) -> str:
    if "\\" in name:
        raise FirmwareInspectionError(
            "unsafe_path",
            "A TAR member uses a backslash path separator.",
            path=name,
        )

    path = PurePosixPath(name)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise FirmwareInspectionError(
            "unsafe_path",
            "A TAR member path is absolute or attempts directory traversal.",
            path=name,
        )

    normalized = path.as_posix()
    if normalized.startswith("/"):
        raise FirmwareInspectionError(
            "unsafe_path",
            "A TAR member resolves outside the archive root.",
            path=name,
        )
    return normalized


def _member_kind(member: tarfile.TarInfo) -> str:
    if member.isdir():
        return "directory"
    if member.isfile():
        return "file"
    if member.issym():
        return "symlink"
    if member.islnk():
        return "hardlink"
    if member.ischr() or member.isblk():
        return "device"
    if member.isfifo():
        return "fifo"
    return "other"


def _inspect_tar(
    archive_bytes: bytes,
    *,
    max_entries: int,
    include_files: bool,
) -> tuple[int, int, list[str], list[FirmwareMember] | None]:
    members: list[FirmwareMember] = []
    markers: set[str] = set()
    payload_size = 0

    try:
        archive = tarfile.open(fileobj=io.BytesIO(archive_bytes), mode="r:")
    except (tarfile.TarError, OSError) as exc:
        raise FirmwareInspectionError(
            "invalid_tar",
            "The decompressed payload is not a readable TAR archive.",
        ) from exc

    try:
        for index, member in enumerate(archive, start=1):
            if index > max_entries:
                raise FirmwareInspectionError(
                    "entry_limit",
                    "The archive contains too many members.",
                    max_entries=max_entries,
                )

            path = _validate_member_path(member.name)
            kind = _member_kind(member)
            if kind not in {"file", "directory"}:
                raise FirmwareInspectionError(
                    "unsafe_member_type",
                    "The archive contains a link or special device entry.",
                    path=path,
                    kind=kind,
                )

            if member.size < 0:
                raise FirmwareInspectionError(
                    "invalid_member_size",
                    "The archive contains a member with an invalid size.",
                    path=path,
                    size=member.size,
                )

            payload_size += member.size
            basename = PurePosixPath(path).name
            if basename in KNOWN_LAYOUT_MARKERS:
                markers.add(basename)

            if include_files:
                members.append(
                    FirmwareMember(
                        path=path,
                        size=member.size,
                        kind=kind,
                        mode=f"{member.mode & 0o7777:04o}",
                    )
                )
    except (tarfile.TarError, OSError) as exc:
        raise FirmwareInspectionError(
            "invalid_tar_member",
            "A TAR member could not be read safely.",
        ) from exc
    finally:
        archive.close()

    count = len(members) if include_files else index if "index" in locals() else 0
    return count, payload_size, sorted(markers), members if include_files else None


def inspect_firmware_bytes(
    data: bytes,
    *,
    include_files: bool = False,
    max_compressed: int = DEFAULT_MAX_COMPRESSED,
    max_uncompressed: int = DEFAULT_MAX_UNCOMPRESSED,
    max_entries: int = DEFAULT_MAX_ENTRIES,
) -> FirmwareReport:
    """Inspect a firmware container already loaded in memory."""

    if len(data) < 5:
        raise FirmwareInspectionError(
            "file_too_small",
            "An OP-1 firmware needs a four-byte CRC and a compressed payload.",
            file_size=len(data),
        )

    if len(data) > max_compressed:
        raise FirmwareInspectionError(
            "compressed_size_limit",
            "The firmware file exceeds the configured safety limit.",
            file_size=len(data),
            max_compressed_bytes=max_compressed,
        )

    stored_crc = int.from_bytes(data[:4], byteorder="little", signed=False)
    payload = data[4:]
    calculated_crc = binascii.crc32(payload) & 0xFFFFFFFF
    sha256 = hashlib.sha256(data).hexdigest()

    if stored_crc != calculated_crc:
        raise FirmwareInspectionError(
            "crc_mismatch",
            "The embedded little-endian CRC-32 does not match the payload.",
            stored_crc32=f"{stored_crc:08x}",
            calculated_crc32=f"{calculated_crc:08x}",
            sha256=sha256,
        )

    archive_bytes = _decompress_lzma_alone(payload, max_uncompressed)
    entry_count, payload_size, markers, members = _inspect_tar(
        archive_bytes,
        max_entries=max_entries,
        include_files=include_files,
    )

    return FirmwareReport(
        valid=True,
        model="op-1-original",
        sha256=sha256,
        file_size=len(data),
        stored_crc32=f"{stored_crc:08x}",
        calculated_crc32=f"{calculated_crc:08x}",
        crc32_matches=True,
        compressed_size=len(payload),
        uncompressed_size=len(archive_bytes),
        archive_entries=entry_count,
        archive_payload_size=payload_size,
        recognized_markers=markers,
        recognized_layout=len(markers) >= 2,
        members=members,
    )


def inspect_firmware_file(
    path: Path,
    *,
    include_files: bool = False,
    max_compressed: int = DEFAULT_MAX_COMPRESSED,
    max_uncompressed: int = DEFAULT_MAX_UNCOMPRESSED,
    max_entries: int = DEFAULT_MAX_ENTRIES,
) -> FirmwareReport:
    """Read and inspect a firmware file without modifying it."""

    try:
        size = path.stat().st_size
    except OSError as exc:
        raise FirmwareInspectionError(
            "file_unavailable",
            "The firmware file cannot be opened.",
            path=str(path),
        ) from exc

    if size > max_compressed:
        raise FirmwareInspectionError(
            "compressed_size_limit",
            "The firmware file exceeds the configured safety limit.",
            file_size=size,
            max_compressed_bytes=max_compressed,
        )

    try:
        data = path.read_bytes()
    except OSError as exc:
        raise FirmwareInspectionError(
            "file_unavailable",
            "The firmware file cannot be read.",
            path=str(path),
        ) from exc

    return inspect_firmware_bytes(
        data,
        include_files=include_files,
        max_compressed=max_compressed,
        max_uncompressed=max_uncompressed,
        max_entries=max_entries,
    )


def _positive_mib(value: str) -> int:
    try:
        mib = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("expected an integer number of MiB") from exc
    if mib <= 0:
        raise argparse.ArgumentTypeError("the limit must be greater than zero")
    return mib * 1024 * 1024


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Safely inspect an original OP-1 .op1 firmware container.",
    )
    parser.add_argument("firmware", type=Path, help="path to a local .op1 file")
    parser.add_argument(
        "--include-files",
        action="store_true",
        help="include the validated TAR member list in the JSON report",
    )
    parser.add_argument(
        "--max-uncompressed-mib",
        type=_positive_mib,
        default=DEFAULT_MAX_UNCOMPRESSED,
        metavar="MIB",
        help="maximum decompressed payload (default: 256 MiB)",
    )
    parser.add_argument(
        "--compact",
        action="store_true",
        help="emit compact JSON instead of indented JSON",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        report = inspect_firmware_file(
            args.firmware,
            include_files=args.include_files,
            max_uncompressed=args.max_uncompressed_mib,
        )
        output: dict[str, Any] = report.to_dict()
        exit_code = 0
    except FirmwareInspectionError as exc:
        output = {
            "valid": False,
            "model": "op-1-original",
            "file": str(args.firmware),
            "error": exc.to_dict(),
        }
        exit_code = 2

    json.dump(
        output,
        sys.stdout,
        ensure_ascii=False,
        indent=None if args.compact else 2,
        sort_keys=True,
    )
    sys.stdout.write("\n")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
