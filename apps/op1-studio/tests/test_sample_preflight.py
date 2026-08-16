import importlib.util
import json
import subprocess
import tempfile
import unittest
import wave
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]


def load_module():
    path = ROOT / "tools" / "sample_preflight.py"
    spec = importlib.util.spec_from_file_location("sample_preflight", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


class SamplePreflightTests(unittest.TestCase):
    def test_common_formats_are_accepted_and_names_are_op1_safe(self):
        module = load_module()
        self.assertTrue({".wav", ".aif", ".flac", ".mp3", ".m4a", ".ogg"}.issubset(module.SUPPORTED))
        self.assertEqual(module.classify(Path("drum/import/Kit.wav"), "auto"), "drum")
        self.assertEqual(module.classify(Path("synth/import/Basse.wav"), "auto"), "synth")
        self.assertIsNone(module.classify(Path("album/face_a.aif"), "auto"))
        self.assertEqual(module.safe_name(Path("Étage de basse!.wav"), set()), "tagedebass.aif")

    def test_wav_metadata_and_manifest_fields(self):
        module = load_module()
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "synth" / "short.wav"
            source.parent.mkdir()
            with wave.open(str(source), "wb") as audio:
                audio.setnchannels(1)
                audio.setsampwidth(2)
                audio.setframerate(44100)
                audio.writeframes(b"\x00\x00" * 4410)
            info = module.inspect(source)
        self.assertEqual(info["rate"], 44100)
        self.assertEqual(info["channels"], 1)
        self.assertAlmostEqual(info["seconds"], 0.1, places=3)

    def test_ffprobe_metadata_is_parsed_for_compressed_input(self):
        module = load_module()
        result = subprocess.CompletedProcess(
            args=["ffprobe"], returncode=0,
            stdout=json.dumps({"streams": [{"channels": 2, "sample_rate": "48000", "bits_per_sample": 24, "duration": "1.25"}]}),
            stderr="",
        )
        with patch.object(module.shutil, "which", return_value="ffprobe"), patch.object(module.subprocess, "run", return_value=result):
            info = module.inspect(Path("voice.mp3"))
        self.assertEqual(info["channels"], 2)
        self.assertEqual(info["rate"], 48000)
        self.assertEqual(info["width"], 3)
        self.assertAlmostEqual(info["seconds"], 1.25)
