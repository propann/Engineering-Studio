/**
 * AIFF Format Support for EP-133 Studio
 * Adapted from OP-1 Studio (app/lib/aiffPatchOracle.ts)
 *
 * Enables EP-133 to read and understand AIFF files from OP-1
 * for future cross-machine sound library interoperability.
 *
 * AIFF is the real format OP-1 uses for:
 * - synth/user/*.aif
 * - drum/user/*.aif
 * - Tape/Album recordings
 *
 * Attribution: Pattern from OP-1 Studio, adapted for EP-133
 * Reference: docs/RAPPORT_REUTILISATION_EP133_POUR_OP1.md
 */

interface AiffChunk {
  id: string;
  start: number;
  length: number;
}

function readChunks(view: DataView, from: number, to: number): AiffChunk[] {
  const chunks: AiffChunk[] = [];
  let offset = from;
  while (offset + 8 <= to) {
    const id = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    );
    const length = view.getUint32(offset + 4, false); // AIFF is big-endian
    chunks.push({ id, start: offset + 8, length });
    offset += 8 + length + (length % 2); // chunks aligned on 2-byte boundary
  }
  return chunks;
}

/**
 * IEEE 754 80-bit extended format (Motorola/SANE, used by COMM.sampleRate)
 * Decoder adapted from OP-1 Studio
 */
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
  applStart: number | null;
  applLength: number;
}

export function parseAiffFormat(bytes: ArrayBuffer): ParsedAiffFormat | null {
  if (bytes.byteLength < 12) return null;
  const view = new DataView(bytes);
  const form = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );
  const aiff = String.fromCharCode(
    view.getUint8(8),
    view.getUint8(9),
    view.getUint8(10),
    view.getUint8(11),
  );
  if (form !== 'FORM' || (aiff !== 'AIFF' && aiff !== 'AIFC')) return null;

  const chunks = readChunks(view, 12, bytes.byteLength);
  const comm = chunks.find((chunk) => chunk.id === 'COMM');
  const ssnd = chunks.find((chunk) => chunk.id === 'SSND');
  const appl = chunks.find((chunk) => chunk.id === 'APPL');
  if (!comm || !ssnd || comm.length < 18) return null;

  const channels = view.getInt16(comm.start, false);
  const bitDepth = view.getInt16(comm.start + 6, false);
  const sampleRate = Math.round(readExtended80(view, comm.start + 8));
  if (!channels || !sampleRate || bitDepth <= 0 || bitDepth > 32) return null;

  const bytesPerSample = Math.ceil(bitDepth / 8);
  const bytesPerFrame = channels * bytesPerSample;
  const dataStart = ssnd.start + 8;
  const dataLength = Math.min(ssnd.length - 8, bytes.byteLength - dataStart);
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
 * Read a normalized audio sample from AIFF format (big-endian)
 * Returns value in range [-1, 1]
 */
export function readAiffSample(format: ParsedAiffFormat, byteOffset: number): number {
  const { view, bitDepth, maxCode } = format;
  if (bitDepth <= 8) {
    return view.getInt8(byteOffset) / (maxCode + 1);
  }
  if (bitDepth <= 16) {
    return view.getInt16(byteOffset, false) / (maxCode + 1);
  }
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

/**
 * Extract all samples from AIFF as interleaved Float32Array
 * Useful for waveform display and analysis
 */
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

/**
 * Detect if buffer is AIFF format
 */
export function isAiffFormat(bytes: ArrayBuffer): boolean {
  return parseAiffFormat(bytes) !== null;
}

/**
 * Get audio metadata from AIFF without fully extracting samples
 */
export function getAiffMetadata(bytes: ArrayBuffer): {
  channels: number;
  sampleRate: number;
  duration: number;
  bitDepth: number;
} | null {
  const aiff = parseAiffFormat(bytes);
  if (!aiff) return null;

  return {
    channels: aiff.channels,
    sampleRate: aiff.sampleRate,
    duration: aiff.frameCount / aiff.sampleRate,
    bitDepth: aiff.bitDepth,
  };
}
