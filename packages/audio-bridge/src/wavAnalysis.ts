/**
 * Analyse WAV déterministe et utilitaires de forme d'onde partagés par les
 * studios. La lecture se fait directement dans RIFF/PCM afin de conserver la
 * fréquence source et d'éviter le rééchantillonnage implicite d'AudioContext.
 */

export interface WavAnalysisReport {
  weightBytes: number;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  peakLevel: number;
  clipped: boolean;
  clippedSampleCount: number;
}

interface RiffChunk { id: string; start: number; length: number }

function readChunks(view: DataView, from: number, to: number): RiffChunk[] {
  const chunks: RiffChunk[] = [];
  let offset = from;
  while (offset + 8 <= to) {
    const id = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
    const length = view.getUint32(offset + 4, true);
    chunks.push({ id, start: offset + 8, length });
    offset += 8 + length + (length % 2);
  }
  return chunks;
}

function maxCodeFor(bitDepth: number): number {
  return bitDepth === 8 ? 127 : bitDepth === 16 ? 32767 : bitDepth === 24 ? 8388607 : 2147483647;
}

function scanSamples(view: DataView, dataStart: number, dataLength: number, bitDepth: number, isFloat: boolean): { peakLevel: number; clipped: boolean; clippedSampleCount: number } {
  const bytesPerSample = bitDepth / 8;
  const sampleCount = Math.floor(dataLength / bytesPerSample);
  const maxCode = maxCodeFor(bitDepth);
  const minCode = -(maxCode + 1);
  let peak = 0;
  let clippedCount = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const byteOffset = dataStart + index * bytesPerSample;
    if (isFloat) {
      const magnitude = Math.abs(view.getFloat32(byteOffset, true));
      if (magnitude > peak) peak = magnitude;
      if (magnitude >= 1) clippedCount += 1;
      continue;
    }
    let raw: number;
    if (bitDepth === 8) raw = view.getUint8(byteOffset) - 128;
    else if (bitDepth === 16) raw = view.getInt16(byteOffset, true);
    else if (bitDepth === 24) {
      const b0 = view.getUint8(byteOffset); const b1 = view.getUint8(byteOffset + 1); const b2 = view.getUint8(byteOffset + 2);
      raw = b0 | (b1 << 8) | (b2 << 16);
      if (raw & 0x800000) raw -= 0x1000000;
    } else raw = view.getInt32(byteOffset, true);
    const magnitude = Math.abs(raw) / (maxCode + 1);
    if (magnitude > peak) peak = magnitude;
    if (raw === maxCode || raw === minCode) clippedCount += 1;
  }
  return { peakLevel: Math.min(1, peak), clipped: clippedCount > 0, clippedSampleCount: clippedCount };
}

export interface ParsedWavFormat {
  view: DataView;
  channels: number;
  sampleRate: number;
  bitDepth: number;
  isFloat: boolean;
  bytesPerSample: number;
  bytesPerFrame: number;
  dataStart: number;
  frameCount: number;
  maxCode: number;
}

export function parseWavFormat(bytes: ArrayBuffer): ParsedWavFormat | null {
  if (bytes.byteLength < 44) return null;
  const view = new DataView(bytes);
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if (riff !== 'RIFF' || wave !== 'WAVE') return null;
  const chunks = readChunks(view, 12, bytes.byteLength);
  const fmtChunk = chunks.find((chunk) => chunk.id === 'fmt ');
  const dataChunk = chunks.find((chunk) => chunk.id === 'data');
  if (!fmtChunk || !dataChunk || fmtChunk.length < 16) return null;
  const audioFormat = view.getUint16(fmtChunk.start, true);
  const channels = view.getUint16(fmtChunk.start + 2, true);
  const sampleRate = view.getUint32(fmtChunk.start + 4, true);
  const bitDepth = view.getUint16(fmtChunk.start + 14, true);
  if (!channels || !sampleRate || ![8, 16, 24, 32].includes(bitDepth)) return null;
  if (audioFormat !== 1 && audioFormat !== 3) return null;
  if (audioFormat === 3 && bitDepth !== 32) return null;
  const bytesPerSample = bitDepth / 8;
  const bytesPerFrame = channels * bytesPerSample;
  const dataLength = Math.min(dataChunk.length, bytes.byteLength - dataChunk.start);
  const frameCount = bytesPerFrame > 0 ? Math.floor(dataLength / bytesPerFrame) : 0;
  return { view, channels, sampleRate, bitDepth, isFloat: audioFormat === 3, bytesPerSample, bytesPerFrame, dataStart: dataChunk.start, frameCount, maxCode: maxCodeFor(bitDepth) };
}

export function readSignedSample(format: ParsedWavFormat, byteOffset: number): number {
  if (format.isFloat) return format.view.getFloat32(byteOffset, true);
  if (format.bitDepth === 8) return (format.view.getUint8(byteOffset) - 128) / 128;
  if (format.bitDepth === 16) return format.view.getInt16(byteOffset, true) / (format.maxCode + 1);
  if (format.bitDepth === 24) {
    const b0 = format.view.getUint8(byteOffset); const b1 = format.view.getUint8(byteOffset + 1); const b2 = format.view.getUint8(byteOffset + 2);
    let raw = b0 | (b1 << 8) | (b2 << 16);
    if (raw & 0x800000) raw -= 0x1000000;
    return raw / (format.maxCode + 1);
  }
  return format.view.getInt32(byteOffset, true) / (format.maxCode + 1);
}

function frameMagnitude(format: ParsedWavFormat, frameIndex: number): number {
  let peak = 0;
  const frameStart = format.dataStart + frameIndex * format.bytesPerFrame;
  for (let channel = 0; channel < format.channels; channel += 1) {
    const magnitude = Math.abs(readSignedSample(format, frameStart + channel * format.bytesPerSample));
    if (magnitude > peak) peak = magnitude;
  }
  return Math.min(1, peak);
}

export interface WaveformPeaks {
  channels: number;
  sampleRate: number;
  durationSeconds: number;
  values: Float32Array;
}

export function computeWaveformPeaks(bytes: ArrayBuffer, targetPoints = 1000): WaveformPeaks | null {
  const format = parseWavFormat(bytes);
  if (!format || !format.frameCount) return null;
  const points = Math.max(1, Math.min(targetPoints, format.frameCount));
  const framesPerPoint = format.frameCount / points;
  const values = new Float32Array(points);
  for (let point = 0; point < points; point += 1) {
    const start = Math.floor(point * framesPerPoint);
    const end = Math.max(start + 1, Math.floor((point + 1) * framesPerPoint));
    const step = Math.max(1, Math.floor((end - start) / 400));
    let peak = 0;
    for (let frame = start; frame < end; frame += step) peak = Math.max(peak, frameMagnitude(format, frame));
    values[point] = peak;
  }
  return { channels: format.channels, sampleRate: format.sampleRate, durationSeconds: format.frameCount / format.sampleRate, values };
}

export interface SilenceTrimSuggestion { startSeconds: number; endSeconds: number }

export function detectSilenceTrim(bytes: ArrayBuffer, thresholdDb = -40, guardMs = 10): SilenceTrimSuggestion | null {
  const format = parseWavFormat(bytes);
  if (!format || !format.frameCount) return null;
  const threshold = 10 ** (thresholdDb / 20);
  let firstLoud = -1;
  for (let frame = 0; frame < format.frameCount; frame += 1) {
    if (frameMagnitude(format, frame) >= threshold) { firstLoud = frame; break; }
  }
  if (firstLoud === -1) return null;
  let lastLoud = firstLoud;
  for (let frame = format.frameCount - 1; frame >= firstLoud; frame -= 1) {
    if (frameMagnitude(format, frame) >= threshold) { lastLoud = frame; break; }
  }
  const guardFrames = Math.round((guardMs / 1000) * format.sampleRate);
  const startFrame = Math.max(0, firstLoud - guardFrames);
  const endFrame = Math.min(format.frameCount - 1, lastLoud + guardFrames);
  return { startSeconds: startFrame / format.sampleRate, endSeconds: (endFrame + 1) / format.sampleRate };
}

export function suggestNormalizationGainDb(peakLevel: number, targetDb = -1): number | null {
  if (!(peakLevel > 0)) return null;
  const targetLinear = 10 ** (targetDb / 20);
  return 20 * Math.log10(targetLinear / peakLevel);
}

export function analyzeWavBuffer(bytes: ArrayBuffer, weightBytes = bytes.byteLength): WavAnalysisReport | null {
  const format = parseWavFormat(bytes);
  if (!format) return null;
  const dataLength = format.frameCount * format.bytesPerFrame;
  const { peakLevel, clipped, clippedSampleCount } = scanSamples(format.view, format.dataStart, dataLength, format.bitDepth, format.isFloat);
  return { weightBytes, durationSeconds: format.frameCount / format.sampleRate, sampleRate: format.sampleRate, channels: format.channels, bitDepth: format.bitDepth, peakLevel, clipped, clippedSampleCount };
}
