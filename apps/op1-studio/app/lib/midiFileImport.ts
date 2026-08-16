/**
 * Import de fichier MIDI standard (.mid) — feuille de route M4.5, mode
 * « apprendre un morceau ». Lecture directe du format Standard MIDI File
 * (chunks `MThd`/`MTrk`, quantités à longueur variable, running status),
 * aucune dépendance externe. Toutes les pistes sont fusionnées en une seule
 * performance (simplification assumée : un fichier multi-instruments joue
 * toutes ses notes ensemble, pas une piste au choix) ; les changements de
 * tempo (méta-événement `Set Tempo`) sont respectés pour convertir les ticks
 * en secondes. `null` pour tout fichier illisible ou au format SMPTE
 * (non couvert) — jamais une exception.
 */

export interface MidiNoteEvent {
  note: number;
  startSeconds: number;
  durationSeconds: number;
  velocity: number;
}

export interface ParsedMidiFile {
  notes: MidiNoteEvent[];
  durationSeconds: number;
  ticksPerQuarter: number;
}

function readVarLen(view: DataView, pos: { offset: number }): number {
  let value = 0;
  let byte: number;
  do {
    byte = view.getUint8(pos.offset);
    pos.offset += 1;
    value = (value << 7) | (byte & 0x7f);
  } while (byte & 0x80);
  return value >>> 0;
}

type RawEvent = { tick: number; kind: "on" | "off" | "tempo"; note?: number; velocity?: number; microsecondsPerQuarter?: number };

export function parseMidiFile(bytes: ArrayBuffer): ParsedMidiFile | null {
  if (bytes.byteLength < 14) return null;
  const view = new DataView(bytes);
  const header = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (header !== "MThd") return null;

  const headerLength = view.getUint32(4, false);
  const numTracks = view.getUint16(10, false);
  const division = view.getUint16(12, false);
  if (division & 0x8000) return null; // SMPTE timecode : hors périmètre de ce lecteur
  const ticksPerQuarter = division || 480;

  let offset = 8 + headerLength;
  const rawEvents: RawEvent[] = [];

  for (let t = 0; t < numTracks && offset + 8 <= bytes.byteLength; t += 1) {
    const chunkId = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
    const chunkLength = view.getUint32(offset + 4, false);
    const trackStart = offset + 8;
    const trackEnd = Math.min(bytes.byteLength, trackStart + chunkLength);
    if (chunkId !== "MTrk") { offset = trackEnd; continue; }

    let pos = trackStart;
    let tick = 0;
    let runningStatus = 0;
    while (pos < trackEnd) {
      const deltaRef = { offset: pos };
      const delta = readVarLen(view, deltaRef);
      pos = deltaRef.offset;
      tick += delta;

      let statusByte = view.getUint8(pos);
      if (statusByte < 0x80) {
        statusByte = runningStatus; // running status : pas d'octet de statut, on réutilise le précédent
      } else {
        pos += 1;
        if (statusByte < 0xf0) runningStatus = statusByte;
      }

      if (statusByte === 0xff) {
        const type = view.getUint8(pos); pos += 1;
        const lenRef = { offset: pos };
        const length = readVarLen(view, lenRef);
        pos = lenRef.offset;
        if (type === 0x51 && length === 3) {
          const microseconds = (view.getUint8(pos) << 16) | (view.getUint8(pos + 1) << 8) | view.getUint8(pos + 2);
          rawEvents.push({ tick, kind: "tempo", microsecondsPerQuarter: microseconds });
        }
        pos += length;
      } else if (statusByte === 0xf0 || statusByte === 0xf7) {
        const lenRef = { offset: pos };
        const length = readVarLen(view, lenRef);
        pos = lenRef.offset + length;
      } else {
        const eventType = statusByte & 0xf0;
        if (eventType === 0x90) {
          const note = view.getUint8(pos); const velocity = view.getUint8(pos + 1); pos += 2;
          if (velocity === 0) rawEvents.push({ tick, kind: "off", note });
          else rawEvents.push({ tick, kind: "on", note, velocity });
        } else if (eventType === 0x80) {
          const note = view.getUint8(pos); pos += 2;
          rawEvents.push({ tick, kind: "off", note });
        } else {
          // Autres événements MIDI (contrôleurs, program change, pitch bend…) : ignorés, juste sautés.
          pos += (eventType === 0xc0 || eventType === 0xd0) ? 1 : 2;
        }
      }
    }
    offset = trackEnd;
  }

  rawEvents.sort((a, b) => a.tick - b.tick);

  let currentTick = 0;
  let currentSeconds = 0;
  let currentTempo = 500000; // 120 BPM par défaut si aucun événement Set Tempo
  const open = new Map<number, { startSeconds: number; velocity: number }>();
  const notes: MidiNoteEvent[] = [];

  for (const ev of rawEvents) {
    const deltaTicks = ev.tick - currentTick;
    currentSeconds += (deltaTicks / ticksPerQuarter) * (currentTempo / 1000000);
    currentTick = ev.tick;

    if (ev.kind === "tempo") {
      currentTempo = ev.microsecondsPerQuarter!;
    } else if (ev.kind === "on") {
      open.set(ev.note!, { startSeconds: currentSeconds, velocity: ev.velocity! });
    } else if (ev.kind === "off") {
      const started = open.get(ev.note!);
      if (started) {
        notes.push({ note: ev.note!, startSeconds: started.startSeconds, durationSeconds: Math.max(0.05, currentSeconds - started.startSeconds), velocity: started.velocity });
        open.delete(ev.note!);
      }
    }
  }

  notes.sort((a, b) => a.startSeconds - b.startSeconds);
  const durationSeconds = notes.reduce((max, n) => Math.max(max, n.startSeconds + n.durationSeconds), 0);
  return { notes, durationSeconds, ticksPerQuarter };
}
