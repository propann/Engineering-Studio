import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BRIDGE = ROOT / "tools" / "profile_bridge.py"


class ProfileBridgeTest(unittest.TestCase):
    def test_init_read_and_atomic_write(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            initialized = subprocess.run([sys.executable, str(BRIDGE), "init", "--root", str(root)], capture_output=True, text=True)
            self.assertEqual(initialized.returncode, 0)
            profile = json.loads((root / "profile.json").read_text(encoding="utf-8"))
            self.assertEqual(profile["schema"], "op1-studio-profile")
            source = root / "new-profile.json"
            source.write_text(json.dumps({"schema": "op1-studio-profile", "pseudo": "Atelier"}), encoding="utf-8")
            written = subprocess.run([sys.executable, str(BRIDGE), "write", "--root", str(root), "--input", str(source)], capture_output=True, text=True)
            self.assertEqual(written.returncode, 0)
            read = subprocess.run([sys.executable, str(BRIDGE), "read", "--root", str(root)], capture_output=True, text=True)
            self.assertEqual(read.returncode, 0)
            self.assertEqual(json.loads(read.stdout)["pseudo"], "Atelier")

    def test_rejects_invalid_schema(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "bad.json").write_text(json.dumps({"schema": "other"}), encoding="utf-8")
            result = subprocess.run([sys.executable, str(BRIDGE), "write", "--root", str(root), "--input", str(root / "bad.json")], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
