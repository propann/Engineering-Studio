// Audio Bridge package for Studio Hub / EP-133 & OP-1 Suite

export interface WavAnalysisReport {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  durationMs: number;
  durationSeconds: number;
  fileSizeBytes: number;
  weightBytes?: number;
  hashSha256?: string;
  isStereo: boolean;
  isOp1Format?: boolean;
  isEp133Format?: boolean;
  peakLevel: number;
  clipped: boolean;
  clippedSampleCount: number;
}

export interface ParsedWavFormat {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  frameCount: number;
  bytesPerSample: number;
  bytesPerFrame: number;
  dataStart: number;
  dataLength: number;
  buffer?: ArrayBuffer;
}

export interface SilenceTrimSuggestion {
  startSample: number;
  endSample: number;
  startSeconds: number;
  endSeconds: number;
}

export interface WaveformPeaks {
  min: number[];
  max: number[];
  values: number[];
  durationSeconds: number;
}

export function parseWavHeader(buffer: ArrayBuffer): Partial<WavAnalysisReport> {
  const view = new DataView(buffer);
  if (buffer.byteLength < 44) return {};
  
  const sampleRate = view.getUint32(24, true);
  const channels = view.getUint16(22, true);
  const bitDepth = view.getUint16(34, true);
  
  return {
    sampleRate,
    channels,
    bitDepth,
    isStereo: channels === 2,
    fileSizeBytes: buffer.byteLength
  };
}

export function parseWavFormat(buffer: ArrayBuffer): ParsedWavFormat | null {
  if (buffer.byteLength < 44) return null;
  const view = new DataView(buffer);
  if (view.getUint32(0, false) !== 0x52494646 || view.getUint32(8, false) !== 0x57415645) return null;

  let offset = 12;
  let channels = 0;
  let sampleRate = 0;
  let bitDepth = 0;
  let audioFormat = 0;
  let blockAlign = 0;
  let dataStart = -1;
  let dataLength = 0;

  while (offset + 8 <= buffer.byteLength) {
    const chunkId = view.getUint32(offset, false);
    const chunkLength = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > buffer.byteLength) return null;
    if (chunkId === 0x666d7420 && chunkLength >= 16) {
      audioFormat = view.getUint16(chunkStart, true);
      channels = view.getUint16(chunkStart + 2, true);
      sampleRate = view.getUint32(chunkStart + 4, true);
      blockAlign = view.getUint16(chunkStart + 12, true);
      bitDepth = view.getUint16(chunkStart + 14, true);
    } else if (chunkId === 0x64617461) {
      dataStart = chunkStart;
      dataLength = chunkLength;
    }
    offset = chunkEnd + (chunkLength % 2);
  }

  if (dataStart < 0 || ![1, 3].includes(audioFormat) || channels < 1 ||
      !Number.isFinite(sampleRate) || sampleRate < 1 || bitDepth < 8 ||
      ![8, 16, 24, 32].includes(bitDepth)) return null;
  const bytesPerSample = bitDepth / 8;
  const bytesPerFrame = blockAlign || bytesPerSample * channels;
  if (bytesPerFrame < bytesPerSample * channels || dataLength < 0 ||
      dataStart + dataLength > buffer.byteLength) return null;
  return {
    sampleRate,
    channels,
    bitDepth,
    frameCount: Math.floor(dataLength / bytesPerFrame),
    bytesPerSample,
    bytesPerFrame,
    dataStart,
    dataLength,
    buffer
  };
}

function readWavSample(view: DataView, offset: number, bitDepth: number, audioFormat: number): number {
  if (audioFormat === 3 && bitDepth === 32) return view.getFloat32(offset, true);
  if (bitDepth === 8) return (view.getUint8(offset) - 128) / 128;
  if (bitDepth === 16) return view.getInt16(offset, true) / 32768;
  if (bitDepth === 24) {
    let raw = view.getUint8(offset) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset + 2) << 16);
    if (raw & 0x800000) raw -= 0x1000000;
    return raw / 8388608;
  }
  return view.getInt32(offset, true) / 2147483648;
}

export function analyzeWavBuffer(buffer: ArrayBuffer, sizeOverride?: number): WavAnalysisReport | null {
  const parsed = parseWavFormat(buffer);
  if (!parsed) return null;
  const view = new DataView(buffer);
  const audioFormat = view.getUint16(20, true);
  let peakLevel = 0;
  let clippedSampleCount = 0;
  const sampleCount = Math.floor(parsed.dataLength / parsed.bytesPerSample);
  for (let index = 0; index < sampleCount; index += 1) {
    const at = parsed.dataStart + index * parsed.bytesPerSample;
    const value = readWavSample(view, at, parsed.bitDepth, audioFormat);
    peakLevel = Math.max(peakLevel, Math.abs(value));
    if ((audioFormat === 3 && Math.abs(value) >= 1) ||
        (audioFormat !== 3 && (value <= -1 || value >= (1 - 1 / (2 ** (parsed.bitDepth - 1)))))) {
      clippedSampleCount += 1;
    }
  }
  const fileSizeBytes = sizeOverride ?? buffer.byteLength;
  const durationSeconds = parsed.frameCount / parsed.sampleRate;
  return {
    sampleRate: parsed.sampleRate,
    channels: parsed.channels,
    bitDepth: parsed.bitDepth,
    durationMs: durationSeconds * 1000,
    durationSeconds,
    fileSizeBytes,
    weightBytes: fileSizeBytes,
    isStereo: parsed.channels === 2,
    isOp1Format: parsed.sampleRate === 44100 && parsed.bitDepth === 16,
    isEp133Format: parsed.sampleRate === 46875 || parsed.sampleRate === 44100,
    peakLevel: Math.min(1, peakLevel),
    clipped: clippedSampleCount > 0,
    clippedSampleCount
  };
}

export function computeWaveformPeaks(buffer: ArrayBuffer, points = 100): WaveformPeaks | null {
  const parsed = parseWavFormat(buffer);
  if (!parsed) return null;
  const view = new DataView(buffer);
  const audioFormat = view.getUint16(20, true);
  const frameCount = parsed.frameCount;
  const count = Math.min(Math.max(1, points), frameCount);
  const values: number[] = [];
  const min: number[] = [];
  const max: number[] = [];
  for (let bucket = 0; bucket < count; bucket += 1) {
    const from = Math.floor(bucket * frameCount / count);
    const to = Math.max(from + 1, Math.floor((bucket + 1) * frameCount / count));
    let bucketMin = 0;
    let bucketMax = 0;
    for (let frame = from; frame < Math.min(to, frameCount); frame += 1) {
      for (let channel = 0; channel < parsed.channels; channel += 1) {
        const at = parsed.dataStart + frame * parsed.bytesPerFrame + channel * parsed.bytesPerSample;
        const value = readWavSample(view, at, parsed.bitDepth, audioFormat);
        bucketMin = Math.min(bucketMin, value);
        bucketMax = Math.max(bucketMax, value);
      }
    }
    min.push(bucketMin);
    max.push(bucketMax);
    values.push(Math.max(Math.abs(bucketMin), Math.abs(bucketMax)));
  }
  return { min, max, values, durationSeconds: frameCount / parsed.sampleRate } as WaveformPeaks & { sampleRate: number; channels: number };
}

export function detectSilenceTrim(buffer: ArrayBuffer, thresholdDb = -40, guardMs = 10): SilenceTrimSuggestion | null {
  const parsed = parseWavFormat(buffer);
  if (!parsed) return null;
  const view = new DataView(buffer);
  const audioFormat = view.getUint16(20, true);
  const threshold = 10 ** (thresholdDb / 20);
  let first = -1;
  let last = -1;
  for (let frame = 0; frame < parsed.frameCount; frame += 1) {
    let loud = false;
    for (let channel = 0; channel < parsed.channels; channel += 1) {
      const at = parsed.dataStart + frame * parsed.bytesPerFrame + channel * parsed.bytesPerSample;
      loud ||= Math.abs(readWavSample(view, at, parsed.bitDepth, audioFormat)) >= threshold;
    }
    if (loud) {
      if (first < 0) first = frame;
      last = frame;
    }
  }
  if (first < 0) return null;
  const guard = Math.round(parsed.sampleRate * guardMs / 1000);
  const startSample = Math.max(0, first - guard);
  const endSample = Math.min(parsed.frameCount, last + guard + 1);
  return {
    startSample,
    endSample,
    startSeconds: startSample / parsed.sampleRate,
    endSeconds: endSample / parsed.sampleRate
  };
}

export function readSignedSample(view: DataView, offset: number, bitDepth: number): number {
  if (offset < 0 || offset >= view.byteLength) return 0;
  if (bitDepth === 8) return (view.getUint8(offset) - 128) / 128;
  if (bitDepth === 16) return view.getInt16(offset, true) / 32768;
  if (bitDepth === 24) {
    if (offset + 2 >= view.byteLength) return 0;
    let raw = view.getUint8(offset) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset + 2) << 16);
    if (raw & 0x800000) raw -= 0x1000000;
    return raw / 8388608;
  }
  if (bitDepth === 32) return view.getInt32(offset, true) / 2147483648;
  return 0;
}

export function suggestNormalizationGainDb(peak: number, targetDb = -1): number | null {
  if (!Number.isFinite(peak) || peak <= 0) return null;
  return targetDb - (20 * Math.log10(Math.min(1, peak)));
}

// Logger utility for all applications
export { createLogger, globalLogger, default as Logger } from './logger.ts';
