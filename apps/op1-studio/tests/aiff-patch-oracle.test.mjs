// Tests de l'oracle AIFF + patch OP-1 (app/lib/aiffPatchOracle.ts),
// feuille de route M3.1. Fichiers AIFF synthétiques construits ici,
// y compris le chunk APPL/op-1 — aucune fixture binaire à committer.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseAiffFormat,
  computeAiffWaveformPeaks,
  readOp1PatchJson,
  isDrumPatch,
  drumMarkersInSeconds,
  detectAiffSilenceTrim,
} from "../app/lib/aiffPatchOracle.ts";

function writeExtended80(value) {
  const bytes = new Uint8Array(10);
  const view = new DataView(bytes.buffer);
  if (value === 0) return bytes;
  let m = value;
  let e = 16383 + 63;
  while (m < Math.pow(2, 63)) { m *= 2; e -= 1; }
  while (m >= Math.pow(2, 64)) { m /= 2; e += 1; }
  const mantissa = BigInt(Math.round(m));
  view.setUint8(0, (e >> 8) & 0x7f);
  view.setUint8(1, e & 0xff);
  view.setUint32(2, Number((mantissa >> 32n) & 0xffffffffn), false);
  view.setUint32(6, Number(mantissa & 0xffffffffn), false);
  return bytes;
}

function encodeSampleBE(view, byteOffset, bitDepth, value) {
  const maxCode = Math.pow(2, bitDepth - 1) - 1;
  const code = Math.max(-(maxCode + 1), Math.min(maxCode, Math.round(value * maxCode)));
  if (bitDepth === 16) view.setInt16(byteOffset, code, false);
  else if (bitDepth === 8) view.setInt8(byteOffset, code);
  else view.setInt32(byteOffset, code, false);
}

/** frames: tableau de trames, chaque trame un tableau de `channels` valeurs -1..1. Ajoute un chunk APPL/op-1 si `patch` est fourni (JSON quelconque). */
function buildAiff({ sampleRate = 44100, channels = 1, bitDepth = 16, frames, patch }) {
  const bytesPerSample = bitDepth / 8;
  const bytesPerFrame = channels * bytesPerSample;
  const soundDataLength = frames.length * bytesPerFrame;
  const ssndLength = 8 + soundDataLength; // offset(4) + blockSize(4) + data
  const commLength = 18;

  let applBytes = new Uint8Array(0);
  if (patch !== undefined) {
    const json = new TextEncoder().encode(JSON.stringify(patch));
    const sig = new TextEncoder().encode("op-1");
    const applDataLength = sig.length + json.length + 1; // +1 octet nul terminal
    const chunkTotal = 8 + applDataLength + (applDataLength % 2);
    applBytes = new Uint8Array(chunkTotal);
    const av = new DataView(applBytes.buffer);
    applBytes.set(new TextEncoder().encode("APPL"), 0);
    av.setUint32(4, applDataLength, false);
    applBytes.set(sig, 8);
    applBytes.set(json, 12);
    // octet nul terminal déjà à 0 par défaut (Uint8Array initialisé à zéro)
  }

  const formContentLength = 4 /* "AIFF" */ + 8 + commLength + 8 + ssndLength + applBytes.length;
  const buffer = new ArrayBuffer(8 + formContentLength);
  const view = new DataView(buffer);
  const writeString = (offset, text) => { for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i)); };

  writeString(0, "FORM");
  view.setUint32(4, formContentLength, false);
  writeString(8, "AIFF");

  let offset = 12;
  writeString(offset, "COMM"); view.setUint32(offset + 4, commLength, false);
  view.setInt16(offset + 8, channels, false);
  view.setUint32(offset + 10, frames.length, false);
  view.setInt16(offset + 14, bitDepth, false);
  new Uint8Array(buffer, offset + 16, 10).set(writeExtended80(sampleRate));
  offset += 8 + commLength;

  writeString(offset, "SSND"); view.setUint32(offset + 4, ssndLength, false);
  view.setUint32(offset + 8, 0, false); // offset
  view.setUint32(offset + 12, 0, false); // blockSize
  const dataStart = offset + 16;
  frames.forEach((frame, frameIndex) => {
    frame.forEach((value, channel) => {
      encodeSampleBE(view, dataStart + frameIndex * bytesPerFrame + channel * bytesPerSample, bitDepth, value);
    });
  });
  offset += 8 + ssndLength;

  new Uint8Array(buffer, offset, applBytes.length).set(applBytes);

  return buffer;
}

function silentFrames(count, channels = 1) { return Array.from({ length: count }, () => Array(channels).fill(0)); }

test("parseAiffFormat lit fréquence (flottant étendu 80 bits), canaux et profondeur", () => {
  const frames = silentFrames(4410, 2).map((frame) => frame.map(() => 0.5));
  const format = parseAiffFormat(buildAiff({ sampleRate: 44100, channels: 2, bitDepth: 16, frames }));
  assert.ok(format);
  assert.equal(format.sampleRate, 44100);
  assert.equal(format.channels, 2);
  assert.equal(format.bitDepth, 16);
  assert.equal(format.frameCount, 4410);
});

test("parseAiffFormat renvoie null pour un fichier non-AIFF", () => {
  assert.equal(parseAiffFormat(new ArrayBuffer(20)), null);
});

test("computeAiffWaveformPeaks reflète les crêtes réelles, big-endian", () => {
  const frames = silentFrames(200).map((frame, i) => frame.map(() => (i % 2 === 0 ? 0.8 : 0.1)));
  const peaks = computeAiffWaveformPeaks(buildAiff({ bitDepth: 16, frames }), 40);
  assert.ok(peaks);
  assert.equal(peaks.values.length, 40);
  assert.ok(Math.max(...peaks.values) > 0.7);
});

test("readOp1PatchJson lit le vrai patch drum documenté (source teoperator)", () => {
  // Exemple réel cité dans AUDIO_FILE_FORMAT_REFERENCE.md, capturé depuis
  // teoperator/src/op1/drum.go — mêmes clés, valeurs raccourcies ici pour
  // rester lisible mais start/end gardent l'échelle interne réelle.
  const patch = {
    type: "drum",
    name: "boombap1",
    drum_version: 2,
    start: [0, 97647201, 165167950],
    end: [97643143, 165163892, 211907777],
    playmode: [8192, 8192, 8192],
  };
  const bytes = buildAiff({ bitDepth: 16, frames: silentFrames(10), patch });
  const parsed = readOp1PatchJson(bytes);
  assert.ok(parsed);
  assert.equal(parsed.type, "drum");
  assert.equal(parsed.name, "boombap1");
  assert.ok(isDrumPatch(parsed));
});

test("readOp1PatchJson renvoie null pour une piste Tape normale (pas de chunk APPL)", () => {
  const bytes = buildAiff({ bitDepth: 16, frames: silentFrames(10) });
  assert.equal(readOp1PatchJson(bytes), null);
});

test("drumMarkersInSeconds convertit l'échelle interne 0..12s et détecte les touches actives", () => {
  const MAXENDPOINT = 2147483646;
  const patch = {
    type: "drum",
    name: "test",
    start: [0, Math.round(MAXENDPOINT / 2), 1000],
    end: [Math.round(MAXENDPOINT / 4), Math.round(MAXENDPOINT / 2) + 1000, 1000], // 3e touche dégénérée (start===end)
  };
  const markers = drumMarkersInSeconds(patch);
  assert.equal(markers.length, 3);
  assert.ok(Math.abs(markers[0].startSeconds - 0) < 0.01);
  assert.ok(Math.abs(markers[0].endSeconds - 3) < 0.01); // 1/4 de 12 s
  assert.equal(markers[0].active, true);
  assert.equal(markers[2].active, false); // plage nulle : touche non assignée
});

test("drumMarkersInSeconds borne aux secondes réelles du fichier si fournies", () => {
  const patch = { type: "drum", name: "t", start: [0], end: [2147483646] }; // 12 s sur l'échelle interne
  const markers = drumMarkersInSeconds(patch, 3.5); // fichier réel de 3,5 s seulement
  assert.ok(markers[0].endSeconds <= 3.5);
});

test("detectAiffSilenceTrim ignore le silence en tête/queue, même logique que côté WAV", () => {
  const loud = 0.9;
  const frames = [
    ...silentFrames(100),
    ...Array.from({ length: 50 }, () => [loud]),
    ...silentFrames(100),
  ];
  const suggestion = detectAiffSilenceTrim(buildAiff({ sampleRate: 1000, bitDepth: 16, frames }), -40, 10);
  assert.ok(suggestion);
  assert.ok(suggestion.startSeconds < 0.1 && suggestion.startSeconds > 0.08);
  assert.ok(suggestion.endSeconds > 0.15 && suggestion.endSeconds < 0.17);
});

test("detectAiffSilenceTrim renvoie null pour un silence total ou un fichier illisible", () => {
  assert.equal(detectAiffSilenceTrim(buildAiff({ bitDepth: 16, frames: silentFrames(100) })), null);
  assert.equal(detectAiffSilenceTrim(new ArrayBuffer(20)), null);
});
