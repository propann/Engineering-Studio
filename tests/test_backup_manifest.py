from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "tools" / "backup_manifest.py"
SPEC = importlib.util.spec_from_file_location("backup_manifest", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
backup_manifest = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(backup_manifest)


class BackupManifestTests(unittest.TestCase):
    def test_create_and_verify_backup(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "device"
            destination = root / "backups"
            (source / "tape").mkdir(parents=True)
            (source / "tape" / "side_a.aif").write_bytes(b"tape fixture")
            (source / "op1.db").write_bytes(b"database fixture")

            result = backup_manifest.create_backup(source, destination, label="test-op1")
            snapshot = Path(result["snapshot"])
            self.assertEqual(result["manifest"]["fileCount"], 2)
            verification = backup_manifest.verify_backup(snapshot)
            self.assertTrue(verification["valid"])
            self.assertEqual(verification["checkedFiles"], 2)

    def test_tampering_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "device"
            destination = root / "backups"
            source.mkdir()
            (source / "op1.db").write_bytes(b"original")
            snapshot = Path(backup_manifest.create_backup(source, destination)["snapshot"])
            (snapshot / "files" / "op1.db").write_bytes(b"tampered")

            with self.assertRaises(backup_manifest.BackupError) as caught:
                backup_manifest.verify_backup(snapshot)
            self.assertEqual(caught.exception.code, "hash_mismatch")

    def test_destination_inside_source_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / "device"
            source.mkdir()
            with self.assertRaises(backup_manifest.BackupError) as caught:
                backup_manifest.create_backup(source, source / "backups")
            self.assertEqual(caught.exception.code, "destination_inside_source")


if __name__ == "__main__":
    unittest.main()
