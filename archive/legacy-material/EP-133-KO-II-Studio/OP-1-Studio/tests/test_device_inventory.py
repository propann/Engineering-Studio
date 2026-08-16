from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "tools" / "device_inventory.py"
SPEC = importlib.util.spec_from_file_location("device_inventory", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
device_inventory = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(device_inventory)


class DeviceInventoryTests(unittest.TestCase):
    def test_original_layout_is_identified(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for category in ("tape", "album", "synth", "drum"):
                (root / category / "user").mkdir(parents=True)
            (root / "tape" / "track_1.aif").write_bytes(b"track")
            (root / "synth" / "user" / "1.aif").write_bytes(b"patch")

            result = device_inventory.inspect_device(root)

            self.assertEqual(result["model"], "op-1-original")
            self.assertEqual(result["confidence"], "high")
            self.assertEqual(result["fileCount"], 2)
            self.assertEqual(result["totalBytes"], 10)

    def test_non_device_layout_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "music").mkdir()
            with self.assertRaises(device_inventory.InventoryError) as caught:
                device_inventory.inspect_device(root)
            self.assertEqual(caught.exception.code, "not_op1")


if __name__ == "__main__":
    unittest.main()
