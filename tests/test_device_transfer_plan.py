from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "tools" / "device_transfer_plan.py"
SPEC = importlib.util.spec_from_file_location("device_transfer_plan", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
device_transfer_plan = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(device_transfer_plan)

BACKUP_MODULE_PATH = Path(__file__).parents[1] / "tools" / "backup_manifest.py"
BACKUP_SPEC = importlib.util.spec_from_file_location("backup_manifest_for_transfer", BACKUP_MODULE_PATH)
assert BACKUP_SPEC is not None and BACKUP_SPEC.loader is not None
backup_manifest = importlib.util.module_from_spec(BACKUP_SPEC)
BACKUP_SPEC.loader.exec_module(backup_manifest)


class DeviceTransferPlanTests(unittest.TestCase):
    def test_plan_copies_new_files_and_skips_matching_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "pack"
            device = root / "device"
            (source / "tape").mkdir(parents=True)
            (source / "synth" / "user").mkdir(parents=True)
            (device / "tape").mkdir(parents=True)
            (device / "tape" / "track_1.aif").write_bytes(b"same")
            (source / "tape" / "track_1.aif").write_bytes(b"same")
            (source / "synth" / "user" / "1.aif").write_bytes(b"new")

            result = device_transfer_plan.prepare_transfer(source, device)

            self.assertEqual(result["fileCount"], 2)
            self.assertEqual(result["copyCount"], 1)
            self.assertEqual(result["skipCount"], 1)
            self.assertFalse(result["machineWrite"])

    def test_unexpected_destination_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "pack"
            device = root / "device"
            (source / "firmware").mkdir(parents=True)
            device.mkdir()
            (source / "firmware" / "update.op1").write_bytes(b"no")

            with self.assertRaises(device_transfer_plan.TransferPlanError) as caught:
                device_transfer_plan.prepare_transfer(source, device)
            self.assertEqual(caught.exception.code, "unexpected_path")

    def test_execute_requires_confirmation_and_verifies_result(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "pack"
            device = root / "device"
            backup_source = root / "backup-source"
            (source / "tape").mkdir(parents=True)
            device.mkdir()
            backup_source.mkdir()
            (source / "tape" / "track_1.aif").write_bytes(b"new track")
            (backup_source / "tape").mkdir()
            (backup_source / "tape" / "old.aif").write_bytes(b"old track")
            snapshot = Path(backup_manifest.create_backup(backup_source, root / "snapshots")["snapshot"])

            with self.assertRaises(device_transfer_plan.TransferPlanError) as caught:
                device_transfer_plan.execute_transfer(source, device, snapshot)
            self.assertEqual(caught.exception.code, "confirmation_required")

            result = device_transfer_plan.execute_transfer(source, device, snapshot, confirm=True)
            self.assertTrue(result["machineWrite"])
            self.assertTrue(result["verified"])
            self.assertEqual((device / "tape" / "track_1.aif").read_bytes(), b"new track")


if __name__ == "__main__":
    unittest.main()
