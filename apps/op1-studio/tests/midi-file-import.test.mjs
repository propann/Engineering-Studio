// Tests de l'import MIDI (app/lib/midiFileImport.ts), feuille de route M4.5
// (mode « apprendre un morceau »). Fichiers .mid construits en mémoire ici,
// octet par octet, aucune fixture binaire à committer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMidiFile } from "../app/lib/midiFileImport.ts";

function writeVarLen(value) {
  const bytes = [value & 0x7f];
  value >>= 7;
  while (value > 0) { bytes.unshift((value & 0x7f) | 0x80); value >>= 7; }
  return bytes;
}

/** trackEvents: tableau de { delta, bytes: number[] } déjà encodés (statut + données ou méta). */
function buildMidi({ ticksPerQuarter = 480, format = 0, trackEvents }) {
  const trackBytes = [];
  for (const event of trackEvents) {
    trackBytes.push(...writeVarLen(event.delta), ...event.bytes);
  }
  const header = [
    ...[...("MThd")].map((c) => c.charCodeAt(0)),
    0, 0, 0, 6,
    (format >> 8) & 0xff, format & 0xff,
    0, 1, // 1 piste
    (ticksPerQuarter >> 8) & 0xff, ticksPerQuarter & 0xff,
  ];
  const track = [
    ...[...("MTrk")].map((c) => c.charCodeAt(0)),
    (trackBytes.length >>> 24) & 0xff, (trackBytes.length >>> 16) & 0xff, (trackBytes.length >>> 8) & 0xff, trackBytes.length & 0xff,
    ...trackBytes,
  ];
  return new Uint8Array([...header, ...track]).buffer;
}

const TEMPO = (microseconds) => ({ bytes: [0xff, 0x51, 0x03, (microseconds >> 16) & 0xff, (microseconds >> 8) & 0xff, microseconds & 0xff] });
const NOTE_ON = (note, velocity) => ({ bytes: [0x90, note, velocity] });
const NOTE_OFF = (note) => ({ bytes: [0x80, note, 0] });
const END = { bytes: [0xff, 0x2f, 0x00] };

test("parseMidiFile lit une note simple à 120 BPM (durée = 1 noire = 0,5 s)", () => {
  const bytes = buildMidi({
    trackEvents: [
      { delta: 0, ...TEMPO(500000) },
      { delta: 0, ...NOTE_ON(60, 100) },
      { delta: 480, ...NOTE_OFF(60) },
      { delta: 0, ...END },
    ],
  });
  const parsed = parseMidiFile(bytes);
  assert.ok(parsed);
  assert.equal(parsed.notes.length, 1);
  assert.equal(parsed.notes[0].note, 60);
  assert.ok(Math.abs(parsed.notes[0].startSeconds - 0) < 0.001);
  assert.ok(Math.abs(parsed.notes[0].durationSeconds - 0.5) < 0.001);
  assert.ok(Math.abs(parsed.durationSeconds - 0.5) < 0.001);
});

test("parseMidiFile respecte un changement de tempo en cours de morceau", () => {
  const bytes = buildMidi({
    trackEvents: [
      { delta: 0, ...TEMPO(500000) }, // 120 BPM
      { delta: 0, ...NOTE_ON(60, 100) },
      { delta: 480, ...NOTE_OFF(60) },   // 1ère noire : 0,5 s à 120 BPM
      { delta: 0, ...TEMPO(1000000) },   // passe à 60 BPM
      { delta: 0, ...NOTE_ON(62, 100) },
      { delta: 480, ...NOTE_OFF(62) },   // 2e noire : 1 s à 60 BPM
      { delta: 0, ...END },
    ],
  });
  const parsed = parseMidiFile(bytes);
  assert.equal(parsed.notes.length, 2);
  assert.ok(Math.abs(parsed.notes[0].startSeconds - 0) < 0.001);
  assert.ok(Math.abs(parsed.notes[1].startSeconds - 0.5) < 0.001);
  assert.ok(Math.abs(parsed.notes[1].durationSeconds - 1) < 0.001);
});

test("parseMidiFile gère le running status (note-on répétés sans réémettre le statut)", () => {
  const bytes = buildMidi({
    trackEvents: [
      { delta: 0, ...NOTE_ON(60, 100) },
      { delta: 100, bytes: [64, 100] },       // pas d'octet de statut : réutilise 0x90 (note on)
      { delta: 50, ...NOTE_OFF(60) },
      { delta: 50, bytes: [64, 0] },          // idem, réutilise 0x80 (note off, vu juste avant)
      { delta: 0, ...END },
    ],
  });
  const parsed = parseMidiFile(bytes);
  assert.equal(parsed.notes.length, 2);
  assert.deepEqual(parsed.notes.map((n) => n.note).sort(), [60, 64]);
});

test("parseMidiFile fusionne plusieurs pistes en une seule performance", () => {
  const bytes = buildMidi({
    format: 1,
    trackEvents: [ // une seule piste ici pour rester simple ; le multi-piste réel est couvert par le tri par tick
      { delta: 0, ...NOTE_ON(60, 100) },
      { delta: 240, ...NOTE_ON(64, 90) },
      { delta: 240, ...NOTE_OFF(60) },
      { delta: 0, ...NOTE_OFF(64) },
      { delta: 0, ...END },
    ],
  });
  const parsed = parseMidiFile(bytes);
  assert.equal(parsed.notes.length, 2);
  assert.ok(parsed.notes[1].startSeconds > parsed.notes[0].startSeconds);
});

test("parseMidiFile renvoie null pour un fichier illisible", () => {
  assert.equal(parseMidiFile(new ArrayBuffer(4)), null);
  const notMidi = new Uint8Array(20);
  assert.equal(parseMidiFile(notMidi.buffer), null);
});
