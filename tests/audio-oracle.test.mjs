// Tests de l'oracle audio OP-1 (app/lib/audioOracle.ts), feuille de route
// M3.1 Phase A. Fichiers WAV synthétiques construits ici : aucune fixture
// binaire à committer, aucune dépendance à un vrai enregistrement.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeWavBuffer,
  computeWaveformPeaks,
  detectSilenceTrim,
  suggestNormalizationGainDb,
  exceedsOp1Duration,
  OP1_AUDIO_LIMITS,
} from "../app/lib/audioOracle.ts";

const MAX_CODE = { 8: 127, 16: 32767, 24: 8388607, 32: 2147483647 };

function encodeSample(view, byteOffset, bitDepth, isFloat, value) {
  if (isFloat) { view.setFloat32(byteOffset, value, true); return; }
  const maxCode = MAX_CODE[bitDepth];
  // Encodage asymétrique standard PCM signé : -1.0 doit tomber exactement sur
  // le code minimal (maxCode+1 négatif), pas sur -maxCode.
  const raw = value < 0 ? value * (maxCode + 1) : value * maxCode;
  const code = Math.max(-(maxCode + 1), Math.min(maxCode, Math.round(raw)));
  if (bitDepth === 8) view.setUint8(byteOffset, code + 128);
  else if (bitDepth === 16) view.setInt16(byteOffset, code, true);
  else if (bitDepth === 24) {
    const unsigned = code < 0 ? code + 0x1000000 : code;
    view.setUint8(byteOffset, unsigned & 0xff);
    view.setUint8(byteOffset + 1, (unsigned >> 8) & 0xff);
    view.setUint8(byteOffset + 2, (unsigned >> 16) & 0xff);
  } else view.setInt32(byteOffset, code, true);
}

/** frames: tableau de trames, chaque trame un tableau de `channels` valeurs -1..1. */
function buildWav({ sampleRate = 44100, channels = 1, bitDepth = 16, isFloat = false, frames }) {
  const bytesPerSample = bitDepth / 8;
  const bytesPerFrame = channels * bytesPerSample;
  const dataLength = frames.length * bytesPerFrame;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeString = (offset, text) => { for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i)); };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, isFloat ? 3 : 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerFrame, true);
  view.setUint16(32, bytesPerFrame, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);
  frames.forEach((frame, frameIndex) => {
    frame.forEach((value, channel) => {
      encodeSample(view, 44 + frameIndex * bytesPerFrame + channel * bytesPerSample, bitDepth, isFloat, value);
    });
  });
  return buffer;
}

function silentFrames(count, channels = 1) {
  return Array.from({ length: count }, () => Array(channels).fill(0));
}

test("analyzeWavBuffer lit fréquence, canaux, profondeur et durée réels", () => {
  const frames = silentFrames(4410, 2).map((frame) => frame.map(() => 0.5));
  const report = analyzeWavBuffer(buildWav({ sampleRate: 44100, channels: 2, bitDepth: 16, frames }));
  assert.ok(report);
  assert.equal(report.sampleRate, 44100);
  assert.equal(report.channels, 2);
  assert.equal(report.bitDepth, 16);
  assert.equal(report.durationSeconds, 0.1);
  assert.ok(Math.abs(report.peakLevel - 0.5) < 0.001);
  assert.equal(report.clipped, false);
});

test("analyzeWavBuffer détecte l'écrêtage exact, pas juste un niveau élevé", () => {
  const frames = [[1], [0.99], [-1], [0.5]];
  const report = analyzeWavBuffer(buildWav({ bitDepth: 16, frames }));
  assert.ok(report);
  assert.equal(report.clipped, true);
  assert.equal(report.clippedSampleCount, 2); // +1 et -1 seulement, pas 0.99
});

test("analyzeWavBuffer couvre 8, 24 et 32 bits entiers et le float 32 bits", () => {
  for (const bitDepth of [8, 24, 32]) {
    const report = analyzeWavBuffer(buildWav({ bitDepth, frames: [[0.25], [-0.25]] }));
    assert.ok(report, `bitDepth ${bitDepth} devrait être lu`);
    assert.equal(report.bitDepth, bitDepth);
  }
  const floatReport = analyzeWavBuffer(buildWav({ bitDepth: 32, isFloat: true, frames: [[0.75], [-0.75]] }));
  assert.ok(floatReport);
  assert.ok(Math.abs(floatReport.peakLevel - 0.75) < 0.001);
});

test("analyzeWavBuffer renvoie null pour un fichier illisible, jamais une exception", () => {
  assert.equal(analyzeWavBuffer(new ArrayBuffer(10)), null);
  const notRiff = new ArrayBuffer(44);
  assert.equal(analyzeWavBuffer(notRiff), null); // zéros : pas "RIFF"/"WAVE"
});

test("computeWaveformPeaks renvoie le nombre de points demandé, capé par les trames dispo", () => {
  const frames = silentFrames(200).map((frame, i) => frame.map(() => (i % 2 === 0 ? 0.8 : 0.1)));
  const peaks = computeWaveformPeaks(buildWav({ bitDepth: 16, frames }), 50);
  assert.ok(peaks);
  assert.equal(peaks.values.length, 50);
  assert.ok(peaks.values.every((v) => v >= 0 && v <= 1));
  const tooFew = computeWaveformPeaks(buildWav({ bitDepth: 16, frames: frames.slice(0, 5) }), 1000);
  assert.equal(tooFew.values.length, 5);
});

test("detectSilenceTrim ignore le silence en tête/queue et garde une marge", () => {
  const loud = 0.9;
  const frames = [
    ...silentFrames(100),
    ...Array.from({ length: 50 }, () => [loud]),
    ...silentFrames(100),
  ];
  const suggestion = detectSilenceTrim(buildWav({ sampleRate: 1000, bitDepth: 16, frames }), -40, 10);
  assert.ok(suggestion);
  // Marge de garde ~10ms = 10 trames à 1000 Hz, donc légèrement avant/après le signal fort.
  assert.ok(suggestion.startSeconds < 0.1 && suggestion.startSeconds > 0.08);
  assert.ok(suggestion.endSeconds > 0.15 && suggestion.endSeconds < 0.17);
});

test("detectSilenceTrim renvoie null pour un silence total", () => {
  const suggestion = detectSilenceTrim(buildWav({ bitDepth: 16, frames: silentFrames(100) }));
  assert.equal(suggestion, null);
});

test("suggestNormalizationGainDb calcule sans jamais dépasser 0 dBFS par défaut", () => {
  const gain = suggestNormalizationGainDb(0.5, -1);
  assert.ok(gain !== null && gain > 0); // il faut monter le niveau
  assert.equal(suggestNormalizationGainDb(0), null); // silence total : rien à normaliser
});

test("exceedsOp1Duration applique la bonne limite selon synth (6 s) ou drum (12 s)", () => {
  const shortReport = { durationSeconds: 5, weightBytes: 0, sampleRate: 44100, channels: 1, bitDepth: 16, peakLevel: 0, clipped: false, clippedSampleCount: 0 };
  const longReport = { ...shortReport, durationSeconds: 8 };
  assert.equal(exceedsOp1Duration(shortReport, "synth"), false);
  assert.equal(exceedsOp1Duration(longReport, "synth"), true);
  assert.equal(exceedsOp1Duration(longReport, "drum"), false); // 8 s < 12 s
  assert.equal(OP1_AUDIO_LIMITS.synthMaxSeconds, 6);
  assert.equal(OP1_AUDIO_LIMITS.drumMaxSeconds, 12);
});
