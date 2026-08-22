/**
 * Lecture AIFF, partagée par le rack et les deux studios.
 *
 * L'AIFF est le format que l'OP-1 utilise réellement pour ses patches et ses
 * pistes. Pour les patches synthé et drum, il porte en plus un chunk
 * `APPL`/`op-1` qui contient les marqueurs — `start` et `end` par touche.
 *
 * ## Pourquoi ce fichier existe
 *
 * Ce code vivait en DEUX exemplaires : `op1-studio/app/lib/aiffPatchOracle.ts`
 * et `ep133-studio/src/core/audio/aiffFormat.ts`, ce dernier annoncé en
 * commentaire comme « adapté de OP-1 Studio ». Comparés jeton à jeton le
 * 2026-08-21, `parseAiffFormat` et `readAiffSample` étaient **logiquement
 * identiques** — seuls la mise en forme et les guillemets différaient. Deux
 * analyseurs de format binaire libres de diverger en silence, dont un dans un
 * répertoire que le typecheck n'inspecte pas.
 *
 * Aucune dépendance : lecture directe des chunks big-endian, y compris le
 * flottant étendu 80 bits du champ `sampleRate` de `COMM`, décodé à la main
 * (vérifié contre l'exemple `[64,14,172,68,0,0,0,0,0,0]` = 44100 Hz).
 */

interface AiffChunk {
  id: string;
  start: number;
  length: number;
}

function readChunks(view: DataView, from: number, to: number): AiffChunk[] | null {
  if (from < 0 || to > view.byteLength || from > to) return null;
  const chunks: AiffChunk[] = [];
  let offset = from;
  while (offset + 8 <= to) {
    const id = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const length = view.getUint32(offset + 4, false); // AIFF est big-endian
    const end = offset + 8 + length;
    const paddedEnd = end + (length % 2);
    if (end > to || paddedEnd > to) return null;
    chunks.push({ id, start: offset + 8, length });
    offset = paddedEnd;
  }
  return offset === to ? chunks : null;
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
  if (!chunks) return null;
  const comm = chunks.find((chunk) => chunk.id === "COMM");
  const ssnd = chunks.find((chunk) => chunk.id === "SSND");
  const appl = chunks.find((chunk) => chunk.id === "APPL");
  if (!comm || !ssnd || comm.length < 18) return null;

  if (comm.start < 0 || comm.start + comm.length > bytes.byteLength || comm.length < 18) return null;
  const channels = view.getInt16(comm.start, false);
  const bitDepth = view.getInt16(comm.start + 6, false);
  const sampleRate = Math.round(readExtended80(view, comm.start + 8));
  if (channels <= 0 || channels > 32 || !Number.isFinite(sampleRate) || sampleRate <= 0 || sampleRate > 384000) return null;
  if (![8, 16, 24, 32].includes(bitDepth)) return null;

  const bytesPerSample = Math.ceil(bitDepth / 8);
  const bytesPerFrame = channels * bytesPerSample;
  // SSND porte `offset`(4)+`blockSize`(4) avant les échantillons.
  if (ssnd.length < 8 || ssnd.start + ssnd.length > bytes.byteLength) return null;
  const dataStart = ssnd.start + 8;
  const dataLength = ssnd.length - 8;
  const frameCount = bytesPerFrame > 0 ? Math.floor(dataLength / bytesPerFrame) : 0;
  const maxCode = Math.pow(2, bitDepth - 1) - 1;

  return {
    view,
    channels,
    sampleRate,
    bitDepth,
    bytesPerSample,
    bytesPerFrame,
    dataStart,
    frameCount,
    maxCode,
    applStart: appl ? appl.start : null,
    applLength: appl ? appl.length : 0,
  };
}

/**
 * Échantillon signé normalisé (-1..1) d'un canal donné. L'AIFF stocke en
 * big-endian, en complément à deux.
 */
export function readAiffSample(format: ParsedAiffFormat, byteOffset: number): number {
  const { view, bitDepth, maxCode } = format;
  if (bitDepth <= 8) return view.getInt8(byteOffset) / (maxCode + 1);
  if (bitDepth <= 16) return view.getInt16(byteOffset, false) / (maxCode + 1);
  if (bitDepth <= 24) {
    const b0 = view.getUint8(byteOffset);
    const b1 = view.getUint8(byteOffset + 1);
    const b2 = view.getUint8(byteOffset + 2);
    let raw = (b0 << 16) | (b1 << 8) | b2;
    if (raw & 0x800000) raw -= 0x1000000;
    return raw / (maxCode + 1);
  }
  return view.getInt32(byteOffset, false) / (maxCode + 1);
}

/** Échantillons entrelacés, bornés à -1..1. */
export function extractAiffInterleaved(bytes: ArrayBuffer): Float32Array | null {
  const aiff = parseAiffFormat(bytes);
  if (!aiff) return null;

  const out = new Float32Array(aiff.frameCount * aiff.channels);
  let index = 0;
  for (let frame = 0; frame < aiff.frameCount; frame += 1) {
    const frameStart = aiff.dataStart + frame * aiff.bytesPerFrame;
    for (let channel = 0; channel < aiff.channels; channel += 1) {
      out[index] = Math.max(-1, Math.min(1, readAiffSample(aiff, frameStart + channel * aiff.bytesPerSample)));
      index += 1;
    }
  }
  return out;
}

export function isAiffFormat(bytes: ArrayBuffer): boolean {
  return parseAiffFormat(bytes) !== null;
}

/** Métadonnées sans extraire les échantillons — lecture d'en-tête seulement. */
export function getAiffMetadata(
  bytes: ArrayBuffer
): { channels: number; sampleRate: number; duration: number; bitDepth: number } | null {
  const aiff = parseAiffFormat(bytes);
  if (!aiff) return null;
  return {
    channels: aiff.channels,
    sampleRate: aiff.sampleRate,
    duration: aiff.frameCount / aiff.sampleRate,
    bitDepth: aiff.bitDepth,
  };
}
