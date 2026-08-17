import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "tools" / "content_catalog.py"


class ContentCatalogTests(unittest.TestCase):
    def run_catalog(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            check=False,
            capture_output=True,
            text=True,
        )

    def test_init_scan_and_verify(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "OP-1-Studio-Library"

            initial = self.run_catalog("init", str(root))
            self.assertEqual(initial.returncode, 0, initial.stderr)
            self.assertTrue((root / "patches" / "synth").is_dir())
            self.assertTrue((root / "manifests" / "library.json").is_file())

            fixture = root / "patches" / "synth" / "fixture.aif"
            fixture.write_bytes(b"OP-1 Studio legal test fixture")
            scanned = self.run_catalog("scan", str(root))
            self.assertEqual(scanned.returncode, 0, scanned.stderr)
            manifest = json.loads((root / "manifests" / "library.json").read_text(encoding="utf-8"))
            self.assertEqual(len(manifest["assets"]), 1)
            self.assertEqual(manifest["assets"][0]["kind"], "aiff-patch-or-sample")
            self.assertEqual(self.run_catalog("verify", str(root)).returncode, 0)

            fixture.write_bytes(b"changed")
            verification = self.run_catalog("verify", str(root))
            self.assertEqual(verification.returncode, 1)
            self.assertIn("patches/synth/fixture.aif", verification.stdout)


if __name__ == "__main__":
    unittest.main()
