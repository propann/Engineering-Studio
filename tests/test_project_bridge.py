import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BRIDGE = ROOT / "tools" / "project_bridge.py"


class ProjectBridgeTest(unittest.TestCase):
    def test_create_and_validate_project(self):
        import tempfile
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory) / "studio.json"
            created = subprocess.run([sys.executable, str(BRIDGE), "create", "--output", str(project)], check=False, capture_output=True, text=True)
            self.assertEqual(created.returncode, 0)
            data = json.loads(project.read_text(encoding="utf-8"))
            self.assertEqual(data["schema"], "op1-studio-project")
            self.assertEqual(len(data["tracks"]), 4)
            checked = subprocess.run([sys.executable, str(BRIDGE), "validate", str(project)], check=False, capture_output=True, text=True)
            self.assertEqual(checked.returncode, 0)

    def test_validate_persisted_source_references(self):
        import tempfile
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory) / "studio.json"
            data = {
                "schema": "op1-studio-project", "version": 1, "name": "Sources",
                "tempo": 90, "tracks": [{"clips": [], "midi_events": []} for _ in range(4)],
                "sources": [], "source_refs": [{"id": "track-1", "path": "kick.wav", "status": "reconnect"}],
            }
            project.write_text(json.dumps(data), encoding="utf-8")
            checked = subprocess.run([sys.executable, str(BRIDGE), "validate", str(project)], check=False, capture_output=True, text=True)
            self.assertEqual(checked.returncode, 0)


if __name__ == "__main__":
    unittest.main()
