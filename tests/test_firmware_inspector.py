from __future__ import annotations

import binascii
import importlib.util
import io
import lzma
import sys
import tarfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "tools" / "firmware_inspector.py"
SPEC = importlib.util.spec_from_file_location("firmware_inspector", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
firmware_inspector = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = firmware_inspector
SPEC.loader.exec_module(firmware_inspector)


def _tar_with_files(names: list[str]) -> bytes:
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w", format=tarfile.GNU_FORMAT) as archive:
        for name in names:
            content = f"fixture:{name}".encode()
            member = tarfile.TarInfo(name=name)
            member.size = len(content)
            member.mode = 0o644
            archive.addfile(member, io.BytesIO(content))
    return buffer.getvalue()


def _firmware_from_tar(tar_bytes: bytes) -> bytes:
    compressed = lzma.compress(
        tar_bytes,
        format=lzma.FORMAT_ALONE,
        filters=[
            {
                "id": lzma.FILTER_LZMA1,
                "dict_size": 1 << 20,
                "lc": 3,
                "lp": 1,
                "pb": 2,
            }
        ],
    )
    crc = binascii.crc32(compressed) & 0xFFFFFFFF
    return crc.to_bytes(4, "little") + compressed


def _rewrite_first_tar_name(tar_bytes: bytes, name: str) -> bytes:
    data = bytearray(tar_bytes)
    encoded = name.encode("ascii")
    if len(encoded) > 99:
        raise ValueError("fixture path is too long")
    data[0:100] = b"\0" * 100
    data[0 : len(encoded)] = encoded
    data[148:156] = b"        "
    checksum = sum(data[0:512])
    data[148:156] = f"{checksum:06o}\0 ".encode("ascii")
    return bytes(data)


class FirmwareInspectorTests(unittest.TestCase):
    def test_valid_container_reports_crc_hash_and_markers(self) -> None:
        firmware = _firmware_from_tar(
            _tar_with_files(
                ["op1.db", "tape.db", "system/te-boot.ldr", "content/readme.txt"]
            )
        )

        report = firmware_inspector.inspect_firmware_bytes(
            firmware,
            include_files=True,
        )

        self.assertTrue(report.valid)
        self.assertTrue(report.crc32_matches)
        self.assertTrue(report.recognized_layout)
        self.assertEqual(report.archive_entries, 4)
        self.assertEqual(
            report.recognized_markers,
            ["op1.db", "tape.db", "te-boot.ldr"],
        )
        self.assertIsNotNone(report.members)

    def test_crc_mismatch_is_rejected_before_decompression(self) -> None:
        firmware = bytearray(_firmware_from_tar(_tar_with_files(["op1.db"])))
        firmware[0] ^= 0xFF

        with self.assertRaises(firmware_inspector.FirmwareInspectionError) as caught:
            firmware_inspector.inspect_firmware_bytes(bytes(firmware))

        self.assertEqual(caught.exception.code, "crc_mismatch")

    def test_directory_traversal_member_is_rejected(self) -> None:
        archive = _tar_with_files(["safe.txt"])
        unsafe_archive = _rewrite_first_tar_name(archive, "../outside.txt")

        with self.assertRaises(firmware_inspector.FirmwareInspectionError) as caught:
            firmware_inspector.inspect_firmware_bytes(_firmware_from_tar(unsafe_archive))

        self.assertEqual(caught.exception.code, "unsafe_path")

    def test_symbolic_link_member_is_rejected(self) -> None:
        buffer = io.BytesIO()
        with tarfile.open(fileobj=buffer, mode="w", format=tarfile.GNU_FORMAT) as archive:
            member = tarfile.TarInfo(name="unsafe-link")
            member.type = tarfile.SYMTYPE
            member.linkname = "../outside"
            archive.addfile(member)

        with self.assertRaises(firmware_inspector.FirmwareInspectionError) as caught:
            firmware_inspector.inspect_firmware_bytes(_firmware_from_tar(buffer.getvalue()))

        self.assertEqual(caught.exception.code, "unsafe_member_type")

    def test_decompression_limit_is_enforced(self) -> None:
        firmware = _firmware_from_tar(_tar_with_files(["large.bin"]))

        with self.assertRaises(firmware_inspector.FirmwareInspectionError) as caught:
            firmware_inspector.inspect_firmware_bytes(
                firmware,
                max_uncompressed=1024,
            )

        self.assertEqual(caught.exception.code, "decompression_limit")


if __name__ == "__main__":
    unittest.main()
