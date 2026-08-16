/**
 * Oracle AIFF + patch OP-1 (feuille de route M3.1, suite de la Phase C) —
 * complète `audioOracle.ts` (WAV, porté de l'EP-133) avec le format que
 * l'OP-1 utilise réellement pour ses patches et ses pistes : l'AIFF, avec
 * pour les patches synthé/drum un chunk `APPL`/`op-1` en plus, qui porte les
 * marqueurs (`start`/`end` par touche pour un drum patch). Règles et schéma
 * exacts dans `docs/AUDIO_FILE_FORMAT_REFERENCE.md` (§2, §2.5) — code
 * original de ce dépôt, pas porté d'ailleurs.
 *
 * Aucune dépendance : lecture directe des chunks AIFF (big-endian), y
 * compris le flottant étendu 80 bits du champ `sampleRate` de `COMM`, décodé
 * ici à la main (vérifié contre l'exemple `[64,14,172,68,0,0,0,0,0,0]` =
 * 44100 Hz documenté dans `op-patch-util`).
 */

interface AiffChunk { id: string; start: number; length: number }

function readChunks(view: DataView, from: number, to: number): AiffChunk[] {
  const chunks: AiffChunk[] = [];
  let offset = from;
  while (offset + 8 <= to) {
    const id = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
    const length = view.getUint32(offset + 4, false); // AIFF est big-endian
    chunks.push({ id, start: offset + 8, length });
    offset += 8 + length + (length % 2); // chunks alignés sur 2 octets, comme RIFF
  }
  return chunks;
}

/** IEEE 754 80 bits étendu (format historique Motorola/SANE utilisé par `COMM.sampleRate`). */
function readExtended80(view: DataView, offset: number): number {
  const sign = view.getUint8(offset) & 0x80 ? -1 : 1;
  const exponent = ((view.getUint8(offset) & 0x7f) << 8) | view.getUint8(offset + 1);
  const hiMant = BigInt(view.getUint32(offset + 2, false));
  const loMant = BigInt(view.getUint32(offset + 6, false));
  const mantissa = (hiMant << BigInt(32)) | loMant;
  if (exponent === 0 && mantissa === BigInt(0)) return 0;
  return sign * Number(mantissa) * Math.pow(2, exponent - 16383 - 63);
}

export interface ParsedAiffFormat {
  view: DataView;
  channels: number;
  sampleRate: number;
  bitDepth: number;
  bytesPerSample: number;
  bytesPerFrame: number;
  dataStart: number;
  frameCount: number;
  maxCode: number;
  /** Position (octet) du chunk `APPL` s'il existe, pour `readOp1PatchJson`. */
  applStart: number | null;
  applLength: number;
}

export function parseAiffFormat(bytes: ArrayBuffer): ParsedAiffFormat | null {
  if (bytes.byteLength < 12) return null;
  const view = new DataView(bytes);
  const form = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const aiff = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if (form !== "FORM" || (aiff !== "AIFF" && aiff !== "AIFC")) return null;

  const chunks = readChunks(view, 12, bytes.byteLength);
  const comm = chunks.find((chunk) => chunk.id === "COMM");
  const ssnd = chunks.find((chunk) => chunk.id === "SSND");
  const appl = chunks.find((chunk) => chunk.id === "APPL");
  if (!comm || !ssnd || comm.length < 18) return null;

  const channels = view.getInt16(comm.start, false);
  const bitDepth = view.getInt16(comm.start + 6, false);
  const sampleRate = Math.round(readExtended80(view, comm.start + 8));
  if (!channels || !sampleRate || bitDepth <= 0 || bitDepth > 32) return null;

  const bytesPerSample = Math.ceil(bitDepth / 8);
  const bytesPerFrame = channels * bytesPerSample;
  // SSND porte `offset`(4)+`blockSize`(4) avant les échantillons.
  const dataStart = ssnd.start + 8;
  const dataLength = Math.min(ssnd.length - 8, bytes.byteLength - dataStart);
  const frameCount = bytesPerFrame > 0 ? Math.floor(dataLength / bytesPerFrame) : 0;
  const maxCode = Math.pow(2, bitDepth - 1) - 1;

  return {
    view, channels, sampleRate, bitDepth, bytesPerSample, bytesPerFrame,
    dataStart, frameCount, maxCode,
    applStart: appl ? appl.start : null, applLength: appl ? appl.length : 0,
  };
}

/** Échantillon signé normalisé (-1..1) d'un canal donné, AIFF stocke en big-endian, complément à deux. Exportée pour app/lib/audioConvert.ts (extraction des échantillons réels avant conversion). */
export function readAiffSample(format: ParsedAiffFormat, byteOffset: number): number {
  const { view, bitDepth, maxCode } = format;
  if (bitDepth <= 8) return (view.getInt8(byteOffset)) / (maxCode + 1);
  if (bitDepth <= 16) return view.getInt16(byteOffset, false) / (maxCode + 1);
  if (bitDepth <= 24) {
    const b0 = view.getUint8(byteOffset); const b1 = view.getUint8(byteOffset + 1); const b2 = view.getUint8(byteOffset + 2);
    let raw = (b0 << 16) | (b1 << 8) | b2;
    if (raw & 0x800000) raw -= 0x1000000;
    return raw / (maxCode + 1);
  }
  return view.getInt32(byteOffset, false) / (maxCode + 1);
}

/** Crête normalisée 0-1, tous canaux confondus, d'une seule trame — partagé par `computeAiffWaveformPeaks` et `detectAiffSilenceTrim`. */
function aiffFrameMagnitude(format: ParsedAiffFormat, frameIndex: number): number {
  let peak = 0;
  const frameStart = format.dataStart + frameIndex * format.bytesPerFrame;
  for (let channel = 0; channel < format.channels; channel += 1) {
    const magnitude = Math.abs(readAiffSample(format, frameStart + channel * format.bytesPerSample));
    if (magnitude > peak) peak = magnitude;
  }
  return Math.min(1, peak);
}

export interface AiffWaveformPeaks {
  channels: number;
  sampleRate: number;
  durationSeconds: number;
  values: Float32Array;
}

/** Même principe que `computeWaveformPeaks` (audioOracle.ts) côté WAV, adapté au big-endian AIFF. */
export function computeAiffWaveformPeaks(bytes: ArrayBuffer, targetPoints = 1000): AiffWaveformPeaks | null {
  const format = parseAiffFormat(bytes);
  if (!format || !format.frameCount) return null;

  const points = Math.max(1, Math.min(targetPoints, format.frameCount));
  const framesPerPoint = format.frameCount / points;
  const values = new Float32Array(points);
  for (let point = 0; point < points; point += 1) {
    const start = Math.floor(point * framesPerPoint);
    const end = Math.max(start + 1, Math.floor((point + 1) * framesPerPoint));
    const step = Math.max(1, Math.floor((end - start) / 400));
    let peak = 0;
    for (let frame = start; frame < end; frame += step) {
      const magnitude = aiffFrameMagnitude(format, frame);
      if (magnitude > peak) peak = magnitude;
    }
    values[point] = peak;
  }
  return { channels: format.channels, sampleRate: format.sampleRate, durationSeconds: format.frameCount / format.sampleRate, values };
}

export interface AiffSilenceTrimSuggestion {
  startSeconds: number;
  endSeconds: number;
}

/**
 * Même logique que `detectSilenceTrim` (audioOracle.ts) côté WAV, adaptée au
 * big-endian AIFF — jusqu'ici le seul format réellement utilisé par les
 * patches/pistes OP-1, donc le seul pour lequel cette suggestion comptait
 * vraiment. Suggestion seulement : n'écrit rien, ne coupe rien.
 */
export function detectAiffSilenceTrim(bytes: ArrayBuffer, thresholdDb = -40, guardMs = 10): AiffSilenceTrimSuggestion | null {
  const format = parseAiffFormat(bytes);
  if (!format || !format.frameCount) return null;

  const threshold = 10 ** (thresholdDb / 20);
  let firstLoud = -1;
  for (let frame = 0; frame < format.frameCount; frame += 1) {
    if (aiffFrameMagnitude(format, frame) >= threshold) { firstLoud = frame; break; }
  }
  if (firstLoud === -1) return null; // silence total : rien à suggérer

  let lastLoud = firstLoud;
  for (let frame = format.frameCount - 1; frame >= firstLoud; frame -= 1) {
    if (aiffFrameMagnitude(format, frame) >= threshold) { lastLoud = frame; break; }
  }

  const guardFrames = Math.round((guardMs / 1000) * format.sampleRate);
  const startFrame = Math.max(0, firstLoud - guardFrames);
  const endFrame = Math.min(format.frameCount - 1, lastLoud + guardFrames);
  return { startSeconds: startFrame / format.sampleRate, endSeconds: (endFrame + 1) / format.sampleRate };
}

// ── Chunk APPL / signature "op-1" : métadonnées de patch ────────────────────
// Schéma exact (24 touches drum, 8 touches sampler) : docs/AUDIO_FILE_FORMAT_REFERENCE.md §2.3/§2.4.
export interface Op1DrumPatch {
  type: "drum" | string;
  name: string;
  start: number[];
  end: number[];
  playmode?: number[];
  reverse?: number[];
  volume?: number[];
}
export interface Op1SamplerPatch {
  type: string; // "sampler" ou un des 10 moteurs synthé
  name: string;
  base_freq?: number;
}
export type Op1PatchData = Op1DrumPatch | Op1SamplerPatch;

/**
 * Lit le JSON du chunk `APPL`/`op-1` sans dépendre de `parseAiffFormat` (le
 * chunk peut être présent même sur un fichier dont `COMM`/`SSND` sont
 * ailleurs) : recherche directe des octets, comme le font `op-patch-util`,
 * `teoperator` et `op1aiff` (voir `AUDIO_FILE_FORMAT_REFERENCE.md`). `null`
 * pour tout fichier sans ce chunk (piste Tape/Album normale) ou JSON
 * illisible — jamais une exception.
 */
export function readOp1PatchJson(bytes: ArrayBuffer): Op1PatchData | null {
  const view = new DataView(bytes);
  const raw = new Uint8Array(bytes);
  const applMarker = [0x41, 0x50, 0x50, 0x4c]; // "APPL"
  let applPos = -1;
  for (let i = 0; i + 4 <= raw.length; i += 1) {
    if (raw[i] === applMarker[0] && raw[i + 1] === applMarker[1] && raw[i + 2] === applMarker[2] && raw[i + 3] === applMarker[3]) { applPos = i; break; }
  }
  if (applPos < 0 || applPos + 12 > raw.length) return null;

  const chunkSize = view.getUint32(applPos + 4, false);
  const sigStart = applPos + 8;
  const signature = String.fromCharCode(raw[sigStart], raw[sigStart + 1], raw[sigStart + 2], raw[sigStart + 3]);
  if (signature !== "op-1") return null;

  const jsonStart = sigStart + 4;
  const jsonMaxEnd = Math.min(raw.length, applPos + 8 + chunkSize);
  let jsonEnd = jsonMaxEnd;
  for (let i = jsonStart; i < jsonMaxEnd; i += 1) { if (raw[i] === 0) { jsonEnd = i; break; } }

  try {
    const text = new TextDecoder("utf-8").decode(raw.slice(jsonStart, jsonEnd));
    return JSON.parse(text) as Op1PatchData;
  } catch { return null; }
}

export function isDrumPatch(patch: Op1PatchData): patch is Op1DrumPatch {
  return patch.type === "drum" && Array.isArray((patch as Op1DrumPatch).start) && Array.isArray((patch as Op1DrumPatch).end);
}

export interface DrumMarker {
  key: number; // 1..24
  startSeconds: number;
  endSeconds: number;
  /** Faux si la plage est nulle/dégénérée (touche jamais assignée dans ce patch). */
  active: boolean;
}

// Échelle interne observée (docs/AUDIO_FILE_FORMAT_REFERENCE.md §2.5, source
// teoperator) : la plage entière 0..MAXENDPOINT représente un buffer fixe de
// 12 s, pas la durée réelle du fichier. Non vérifié sur matériel — à
// confirmer par relecture croisée avant de s'appuyer dessus pour une
// écriture, cette fonction ne fait que de la lecture/affichage.
const DRUM_MAXENDPOINT = 2147483646;
const DRUM_BUFFER_SECONDS = 12;

/** Convertit `start`/`end` (échelle interne 0..2147483646) en secondes, bornées à la durée réelle du fichier si elle est connue. */
export function drumMarkersInSeconds(patch: Op1DrumPatch, audioDurationSeconds?: number): DrumMarker[] {
  const toSeconds = (raw: number) => {
    const seconds = (raw / DRUM_MAXENDPOINT) * DRUM_BUFFER_SECONDS;
    return audioDurationSeconds !== undefined ? Math.min(seconds, audioDurationSeconds) : seconds;
  };
  return patch.start.map((rawStart, i) => {
    const rawEnd = patch.end[i] ?? rawStart;
    const startSeconds = toSeconds(rawStart);
    const endSeconds = toSeconds(rawEnd);
    return { key: i + 1, startSeconds, endSeconds, active: endSeconds - startSeconds > 0.01 };
  });
}
