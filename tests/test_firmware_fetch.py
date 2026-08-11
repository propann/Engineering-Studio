from __future__ import annotations

import binascii
import importlib.util
import io
import json
import lzma
import tarfile
import tempfile
import unittest
from pathlib import Path
import sys


ROOT = Path(__file__).parents[1]


def _load_tool(name: str):
    path = ROOT / "tools" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


inspector = _load_tool("firmware_inspector")
fetch = _load_tool("firmware_fetch")


def _fixture_firmware() -> bytes:
    archive_buffer = io.BytesIO()
    with tarfile.open(fileobj=archive_buffer, mode="w") as archive:
        for name in ["op1.db", "tape.db", "system/te-boot.ldr"]:
            content = name.encode()
            member = tarfile.TarInfo(name=name)
            member.size = len(content)
            archive.addfile(member, io.BytesIO(content))
    compressed = lzma.compress(archive_buffer.getvalue(), format=lzma.FORMAT_ALONE)
    return (binascii.crc32(compressed) & 0xFFFFFFFF).to_bytes(4, "little") + compressed


class _FakeResponse:
    def __init__(self, body: bytes, url: str) -> None:
        self._stream = io.BytesIO(body)
        self._url = url
        self.headers = {"Content-Length": str(len(body))}

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def geturl(self) -> str:
        return self._url

    def read(self, size: int = -1) -> bytes:
        return self._stream.read(size)


class _FakeOpener:
    def __init__(self, body: bytes) -> None:
        self.body = body

    def open(self, _request, timeout: int):
        return _FakeResponse(self.body, "https://teenage.engineering/_software/op-1/op1_246.op1")


class FirmwareFetchTests(unittest.TestCase):
    def test_only_official_https_url_is_accepted(self) -> None:
        fetch.validate_official_url("https://teenage.engineering/_software/op-1/op1_246.op1", {"teenage.engineering"})
        with self.assertRaises(fetch.FirmwareFetchError) as caught:
            fetch.validate_official_url("https://example.invalid/op1_246.op1", {"teenage.engineering"})
        self.assertEqual(caught.exception.code, "unapproved_host")

    def test_download_validates_before_final_move(self) -> None:
        body = _fixture_firmware()
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            catalog = root / "catalog.json"
            catalog.write_text(
                json.dumps(
                    {
                        "model": "op-1-original",
                        "policy": {"allowedDownloadHosts": ["teenage.engineering"]},
                        "releases": [{"version": 246, "officialUrl": "https://teenage.engineering/_software/op-1/op1_246.op1", "sha256": None}],
                    }
                ),
                encoding="utf-8",
            )
            output = root / "downloads" / "op1_246.op1"
            original_builder = fetch.build_opener
            fetch.build_opener = lambda _handler: _FakeOpener(body)
            try:
                result = fetch.download_release(catalog, 246, output)
            finally:
                fetch.build_opener = original_builder
            self.assertTrue(output.is_file())
            self.assertTrue(result["containerValid"])
            self.assertFalse(result["sha256Approved"])


if __name__ == "__main__":
    unittest.main()
