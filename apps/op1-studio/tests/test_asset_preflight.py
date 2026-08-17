import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


class AssetPreflightTests(unittest.TestCase):
    def test_svg_reports_op1_dimensions_and_risky_elements(self):
        svg_preflight = load("svg_preflight", ROOT / "tools" / "svg_preflight.py")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "screen.svg"
            path.write_text('<svg viewBox="0 0 320 160"><path d="M0 0"/><script /></svg>', encoding="utf-8")
            result = svg_preflight.inspect(path)
        self.assertTrue(result["target_viewBox"])
        self.assertEqual(result["risky_tags"], ["script"])
        self.assertEqual(result["status"], "review")

    def test_svg_rejects_entities(self):
        svg_preflight = load("svg_preflight_entities", ROOT / "tools" / "svg_preflight.py")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "unsafe.svg"
            path.write_text("<!DOCTYPE svg [<!ENTITY x 'bad'>]><svg viewBox='0 0 320 160' />", encoding="utf-8")
            with self.assertRaises(ValueError):
                svg_preflight.inspect(path)

    def test_aiff_lists_chunks_and_unknown_metadata(self):
        aiff_inspector = load("aiff_inspector", ROOT / "tools" / "aiff_inspector.py")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.aif"
            comm = b"\x00\x01\x00\x00\x00\x00\x00\x10\x40\x0e\xac\x44\x00\x00\x00\x00\x00\x00\x00\x00"
            ssnd = b"\x00\x00\x00\x00\x00\x00"
            custom = b"test"
            body = b"AIFF" + b"COMM" + len(comm).to_bytes(4, "big") + comm + b"SSND" + len(ssnd).to_bytes(4, "big") + ssnd + b"ZZZZ" + len(custom).to_bytes(4, "big") + custom
            path.write_bytes(b"FORM" + len(body).to_bytes(4, "big") + body)
            result = aiff_inspector.inspect(path)
        self.assertEqual(result["format"], "AIFF")
        self.assertEqual(result["unknown_chunks"], ["ZZZZ"])
        self.assertEqual(result["audio"]["rate"], 44100)
