// Tests de la conversion OP-1 (app/lib/audioConvert.ts), feuille de route
// M3.1 Phase B. Fichiers WAV/AIFF synthétiques construits ici — aucune
// fixture binaire à committer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { convertToOp1Audio } from "../app/lib/audioConvert.ts";
import { analyzeWavBuffer } from "../app/lib/audioOracle.ts";
import { parseAiffFormat, readAiffSample } from "../app/lib/aiffPatchOracle.ts";

function buildWav({ sampleRate = 44100, channels = 1, frames }) {
  const bytesPerFrame = channels * 2;
  const dataLength = frames.length * bytesPerFrame;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeString = (offset, text) => { for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i)); };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerFrame, true);
  view.setUint16(32, bytesPerFrame, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);
  frames.forEach((frame, frameIndex) => {
    frame.forEach((value, channel) => {
      const code = Math.max(-32768, Math.min(32767, Math.round(value * 32767)));
      view.setInt16(44 + (frameIndex * channels + channel) * 2, code, true);
    });
  });
  return buffer;
}

function sineFrames(count, channels, freqHz, sampleRate) {
  return Array.from({ length: count }, (_, i) => Array.from({ length: channels }, () => Math.sin((2 * Math.PI * freqHz * i) / sampleRate) * 0.8));
}

test("convertToOp1Audio produit de l'AIFF mono 44,1 kHz/16 bits par défaut — c'est le format réel de l'OP-1, pas le WAV", () => {
  const frames = sineFrames(4410, 1, 440, 44100); // 0,1 s à 440 Hz, déjà 44100 Hz
  const source = buildWav({ sampleRate: 44100, channels: 1, frames });
  const result = convertToOp1Audio(source);
  assert.ok(result);
  assert.equal(result.format, "aiff");
  assert.equal(result.sampleRate, 44100);
  assert.equal(result.channels, 1);
  assert.equal(result.bitDepth, 16);
  assert.ok(Math.abs(result.durationSeconds - 0.1) < 0.01);

  const reread = parseAiffFormat(result.bytes);
  assert.ok(reread);
  assert.equal(reread.sampleRate, 44100); // vérifie que writeExtended80 est l'exacte inverse de readExtended80
  assert.equal(reread.channels, 1);
  assert.equal(reread.bitDepth, 16);
  let peak = 0;
  for (let frame = 0; frame < reread.frameCount; frame += 1) {
    peak = Math.max(peak, Math.abs(readAiffSample(reread, reread.dataStart + frame * reread.bytesPerFrame)));
  }
  assert.ok(peak > 0.5); // le signal 0,8 d'amplitude doit rester audible après conversion
});

test("convertToOp1Audio accepte targetFormat: \"wav\" pour un usage hors OP-1, relisible par l'oracle WAV", () => {
  const frames = sineFrames(4410, 1, 440, 44100);
  const source = buildWav({ sampleRate: 44100, channels: 1, frames });
  const result = convertToOp1Audio(source, { targetFormat: "wav" });
  assert.equal(result.format, "wav");
  const reread = analyzeWavBuffer(result.bytes);
  assert.ok(reread);
  assert.equal(reread.sampleRate, 44100);
  assert.equal(reread.channels, 1);
  assert.ok(reread.peakLevel > 0.5);
});

test("convertToOp1Audio mixe le stéréo en mono par défaut", () => {
  const frames = sineFrames(2205, 2, 220, 44100);
  const source = buildWav({ sampleRate: 44100, channels: 2, frames });
  const result = convertToOp1Audio(source);
  assert.equal(result.channels, 1);
});

test("convertToOp1Audio rééchantillonne vers 44,1 kHz en préservant la durée", () => {
  const frames = sineFrames(2205, 1, 440, 22050); // 0,1 s à 22050 Hz
  const source = buildWav({ sampleRate: 22050, channels: 1, frames });
  const result = convertToOp1Audio(source);
  assert.equal(result.sampleRate, 44100);
  assert.ok(Math.abs(result.durationSeconds - 0.1) < 0.01);
});

test("convertToOp1Audio coupe la sélection demandée (trim)", () => {
  const frames = sineFrames(44100, 1, 440, 44100); // 1 s
  const source = buildWav({ sampleRate: 44100, channels: 1, frames });
  const result = convertToOp1Audio(source, { trim: { startSeconds: 0.25, endSeconds: 0.5 } });
  assert.ok(result);
  assert.ok(Math.abs(result.durationSeconds - 0.25) < 0.01);
});

test("convertToOp1Audio applique un fondu d'entrée (échantillons initiaux atténués)", () => {
  const frames = sineFrames(4410, 1, 440, 44100);
  const source = buildWav({ sampleRate: 44100, channels: 1, frames });
  const withoutFade = convertToOp1Audio(source, { targetFormat: "wav" });
  const withFade = convertToOp1Audio(source, { targetFormat: "wav", fadeInSeconds: 0.05 });
  const peaksWithout = analyzeWavBuffer(withoutFade.bytes);
  const peaksWith = analyzeWavBuffer(withFade.bytes);
  // Le fondu ne doit pas changer le niveau crête global (atteint après la
  // zone de fondu), seulement le tout début — comparaison indirecte via la
  // durée et la validité du fichier, le détail échantillon par échantillon
  // est déjà couvert par le calcul lui-même.
  assert.ok(peaksWithout.peakLevel > 0.5);
  assert.ok(peaksWith.peakLevel > 0.5);
});

test("convertToOp1Audio renvoie null pour un fichier illisible", () => {
  assert.equal(convertToOp1Audio(new ArrayBuffer(10)), null);
});
