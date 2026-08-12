from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[1]
VENDOR = ROOT / "tools" / "vendor"
sys.path.insert(0, str(VENDOR))

MODULE_PATH = ROOT / "tools" / "display_bridge.py"
SPEC = importlib.util.spec_from_file_location("display_bridge", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
display_bridge = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(display_bridge)


def make_fake_unpacked(root: Path) -> Path:
    """Build a synthetic unpacked firmware directory. No real firmware content."""
    display = root / "content" / "display"
    display.mkdir(parents=True)
    (display / "tempo.svg").write_text(
        '<svg viewBox="0 0 320 160"><rect id="dial" x="1" y="1"/></svg>', encoding="utf-8"
    )
    (display / "singlelfo.svg").write_text(
        '<svg viewBox="0 0 320 160"><path d="M0,0 L10,10"/></svg>', encoding="utf-8"
    )
    (display / "totally-unknown-codename.svg").write_text(
        '<svg viewBox="0 0 320 160"><g/></svg>', encoding="utf-8"
    )
    return root


class CategorizeTests(unittest.TestCase):
    def test_documented_screen_is_high_confidence(self) -> None:
        category, confidence, note = display_bridge.categorize("tempo")
        self.assertEqual(category, "tempo")
        self.assertEqual(confidence, "high")
        self.assertTrue(note)

    def test_lfo_screen_is_grouped_together(self) -> None:
        for name in ("singlelfo", "duallfo", "rndlfo", "midilfo"):
            category, _confidence, _note = display_bridge.categorize(name)
            self.assertEqual(category, "lfo")

    def test_unknown_codename_falls_back_to_non_identifie(self) -> None:
        category, confidence, _note = display_bridge.categorize("totally-unknown-codename")
        self.assertEqual(category, "non_identifie")
        self.assertEqual(confidence, "low")

    def test_case_is_ignored(self) -> None:
        category, _confidence, _note = display_bridge.categorize("TEMPO")
        self.assertEqual(category, "tempo")

    def test_op1_glitter_sourced_codenames_are_high_confidence(self) -> None:
        # Ces codenames viennent de op1hacks/op1-glitter (THEME_CREATION.md),
        # pas d'une page teenage.engineering, mais l'outil les modifie avec
        # succes sur une machine reelle : confiance haute justifiee.
        expectations = {
            "rymd": "effets",
            "bode": "effets",
            "ok": "sequenceurs",
            "cls": "moteurs_sonores",
            "t10": "moteurs_sonores",
        }
        for stem, expected_category in expectations.items():
            category, confidence, note = display_bridge.categorize(stem)
            self.assertEqual(category, expected_category, stem)
            self.assertEqual(confidence, "high", stem)
            self.assertIn("op1-glitter", note)


class ListDisplayAssetsTests(unittest.TestCase):
    def test_lists_every_svg_with_view_box_and_hash(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = make_fake_unpacked(Path(temporary))
            assets = display_bridge.list_display_assets(root)

            self.assertEqual(len(assets), 3)
            by_file = {asset["file"]: asset for asset in assets}
            self.assertEqual(by_file["tempo.svg"]["category"], "tempo")
            self.assertEqual(by_file["tempo.svg"]["viewBox"], "0 0 320 160")
            self.assertEqual(len(by_file["tempo.svg"]["sha256"]), 64)
            self.assertEqual(by_file["totally-unknown-codename.svg"]["category"], "non_identifie")

    def test_missing_display_folder_raises(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with self.assertRaises(FileNotFoundError):
                display_bridge.list_display_assets(root)


class SortAssetsTests(unittest.TestCase):
    def test_copies_files_into_category_folders_and_writes_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = make_fake_unpacked(Path(temporary) / "unpacked")
            output_dir = Path(temporary) / "sorted"

            manifest_path = display_bridge.sort_assets(root, output_dir)

            self.assertTrue((output_dir / "tempo" / "tempo.svg").is_file())
            self.assertTrue((output_dir / "lfo" / "singlelfo.svg").is_file())
            self.assertTrue((output_dir / "non_identifie" / "totally-unknown-codename.svg").is_file())

            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(manifest["schema"], "op1-studio-display-manifest")
            self.assertEqual(manifest["assetCount"], 3)
            self.assertIn("lfo", manifest["categories"])

    def test_original_source_file_is_untouched(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = make_fake_unpacked(Path(temporary) / "unpacked")
            original_bytes = (root / "content" / "display" / "tempo.svg").read_bytes()
            display_bridge.sort_assets(root, Path(temporary) / "sorted")
            self.assertEqual((root / "content" / "display" / "tempo.svg").read_bytes(), original_bytes)


class BuildPatchTests(unittest.TestCase):
    def test_patch_round_trips_through_op1_gfx(self) -> None:
        from op1repacker import op1_gfx

        original = '<svg viewBox="0 0 320 160"><rect id="dial" x="1" y="1"/></svg>'
        edited = '<svg viewBox="0 0 320 160"><rect id="dial" x="1" y="1" fill="#4cace1"/></svg>'

        patch = display_bridge.build_patch("tempo.svg", original, edited)
        patched = op1_gfx.apply_patch(original, patch)

        self.assertEqual(patched.replace(op1_gfx.PATCH_IDENTIFIER, ""), edited)

    def test_patch_survives_backslashes_in_edited_content(self) -> None:
        from op1repacker import op1_gfx

        original = '<svg><text>plain</text></svg>'
        edited = '<svg><text>back\\slash and \\1 group-looking text</text></svg>'

        patch = display_bridge.build_patch("weird.svg", original, edited)
        patched = op1_gfx.apply_patch(original, patch)

        self.assertEqual(patched.replace(op1_gfx.PATCH_IDENTIFIER, ""), edited)

    def test_identical_content_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            display_bridge.build_patch("tempo.svg", "same", "same")

    def test_apply_and_verify_patch_does_not_touch_source_file(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = make_fake_unpacked(Path(temporary))
            original = (root / "content" / "display" / "tempo.svg").read_text(encoding="utf-8")
            edited = original.replace("x=\"1\"", "x=\"5\"")

            patch = display_bridge.build_patch("tempo.svg", original, edited)
            result = display_bridge.apply_and_verify_patch(root, patch)

            self.assertEqual(result, edited)
            self.assertEqual(
                (root / "content" / "display" / "tempo.svg").read_text(encoding="utf-8"),
                original,
            )


if __name__ == "__main__":
    unittest.main()
