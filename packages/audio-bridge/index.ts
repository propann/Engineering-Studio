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
  return { min, max, values, durationSeconds: frameCount / parsed.sampleRate, sampleRate: parsed.sampleRate, channels: parsed.channels } as WaveformPeaks & { sampleRate: number; channels: number };
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

// =====================================================================
// INTER-STUDIO AUDIO & MEMORY BRIDGE (DUO STUDIO : OP-1 <-> EP-133)
// =====================================================================

export interface TapeToPadTransferRequest {
  sourceTrack: 1 | 2 | 3 | 4;
  startSample: number;
  endSample: number;
  targetGroup: "A" | "B" | "C" | "D";
  targetPadIndex: number; // 0 à 11 pour les 12 pads physiques
  sampleRate: number;
  channels: 1 | 2;
  channelData: Float32Array[];
  name?: string;
}

export interface PatternToTapeTransferRequest {
  sourceGroup: "A" | "B" | "C" | "D";
  patternIndex: number;
  targetTrack: 1 | 2 | 3 | 4;
  sampleRate: number;
  channelData: Float32Array[];
  durationSeconds: number;
  name?: string;
}

export interface AudioSlicePoint {
  index: number;
  startFrame: number;
  endFrame: number;
  startSeconds: number;
  endSeconds: number;
}

export interface Ep133OptimizationResult {
  originalBytes: number;
  optimizedBytes: number;
  bytesSaved: number;
  reductionPercentage: number;
  channels: 1 | 2;
  sampleRate: number;
  durationSeconds: number;
  wavBuffer: ArrayBuffer;
}

/**
 * Optimise un buffer audio pour l'EP-133 K.O. II :
 * 1. Trim du silence initial et final avec garde réglable
 * 2. Downmix stéréo vers mono si forcé ou recommandé pour économiser la RAM
 * 3. Normalisation de dynamique pour un rendu clair
 * 4. Encodage direct en WAV PCM 16-bit
 */
export function optimizeAudioBufferForEp133(
  audioData: Float32Array[],
  sampleRate: number,
  options: {
    forceMono?: boolean;
    trimSilence?: boolean;
    silenceThresholdDb?: number;
    normalizePeakDb?: number;
  } = {}
): Ep133OptimizationResult {
  const {
    forceMono = true,
    trimSilence = true,
    silenceThresholdDb = -45,
    normalizePeakDb = -0.5,
  } = options;

  const originalChannels = audioData.length;
  const originalFrames = audioData[0]?.length ?? 0;
  const originalBytes = 44 + originalFrames * originalChannels * 2;

  let channelsData = audioData.map((arr) => new Float32Array(arr));

  // 1. Downmix mono si demandé
  if (forceMono && channelsData.length > 1) {
    const mono = new Float32Array(originalFrames);
    const left = channelsData[0];
    const right = channelsData[1];
    for (let i = 0; i < originalFrames; i++) {
      mono[i] = (left[i] + right[i]) * 0.5;
    }
    channelsData = [mono];
  }

  const channels = channelsData.length as 1 | 2;
  let totalFrames = channelsData[0].length;

  // 2. Détection et découpe des silences
  let startFrame = 0;
  let endFrame = totalFrames;

  if (trimSilence && totalFrames > 0) {
    const threshold = 10 ** (silenceThresholdDb / 20);
    let first = -1;
    let last = -1;

    for (let i = 0; i < totalFrames; i++) {
      let loud = false;
      for (let c = 0; c < channels; c++) {
        if (Math.abs(channelsData[c][i]) >= threshold) {
          loud = true;
          break;
        }
      }
      if (loud) {
        if (first < 0) first = i;
        last = i;
      }
    }

    if (first >= 0) {
      const guardFrames = Math.round((sampleRate * 10) / 1000); // 10ms guard
      startFrame = Math.max(0, first - guardFrames);
      endFrame = Math.min(totalFrames, last + guardFrames + 1);
    }
  }

  const croppedFrames = Math.max(1, endFrame - startFrame);
  const trimmedData: Float32Array[] = [];

  for (let c = 0; c < channels; c++) {
    const trimmed = new Float32Array(croppedFrames);
    for (let i = 0; i < croppedFrames; i++) {
      trimmed[i] = channelsData[c][startFrame + i];
    }
    trimmedData.push(trimmed);
  }

  // 3. Normalisation de pic
  let maxPeak = 0;
  for (let c = 0; c < channels; c++) {
    for (let i = 0; i < croppedFrames; i++) {
      const abs = Math.abs(trimmedData[c][i]);
      if (abs > maxPeak) maxPeak = abs;
    }
  }

  const targetPeak = 10 ** (normalizePeakDb / 20);
  const gain = maxPeak > 0 ? Math.min( targetPeak / maxPeak, 10 ) : 1;

  if (gain !== 1) {
    for (let c = 0; c < channels; c++) {
      for (let i = 0; i < croppedFrames; i++) {
        trimmedData[c][i] = Math.max(-1, Math.min(1, trimmedData[c][i] * gain));
      }
    }
  }

  // 4. Encodage WAV PCM 16-bit
  const wavBytes = 44 + croppedFrames * channels * 2;
  const buffer = new ArrayBuffer(wavBytes);
  const view = new DataView(buffer);

  // RIFF Chunk
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + croppedFrames * channels * 2, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt Subchunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format = 1
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true); // byte rate
  view.setUint16(32, channels * 2, true); // block align
  view.setUint16(34, 16, true); // 16 bits per sample

  // data Subchunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, croppedFrames * channels * 2, true);

  let offset = 44;
  for (let i = 0; i < croppedFrames; i++) {
    for (let c = 0; c < channels; c++) {
      const sample = Math.max(-1, Math.min(1, trimmedData[c][i]));
      const int16 = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(offset, Math.round(int16), true);
      offset += 2;
    }
  }

  const durationSeconds = croppedFrames / sampleRate;
  const optimizedBytes = buffer.byteLength;
  const bytesSaved = Math.max(0, originalBytes - optimizedBytes);
  const reductionPercentage = originalBytes > 0 ? Math.round((bytesSaved / originalBytes) * 100) : 0;

  return {
    originalBytes,
    optimizedBytes,
    bytesSaved,
    reductionPercentage,
    channels,
    sampleRate,
    durationSeconds,
    wavBuffer: buffer,
  };
}

/**
 * Découpe intelligente d'un buffer audio en 24 tranches égales ou transitoires
 * pour assignation immédiate aux 24 touches OP-1 ou à la grille de pads EP-133.
 */
export function sliceAudioInto24DrumPads(
  totalFrames: number,
  sampleRate: number
): AudioSlicePoint[] {
  const slices: AudioSlicePoint[] = [];
  const framesPerSlice = Math.floor(totalFrames / 24);

  for (let i = 0; i < 24; i++) {
    const startFrame = i * framesPerSlice;
    const endFrame = i === 23 ? totalFrames : (i + 1) * framesPerSlice;
    slices.push({
      index: i,
      startFrame,
      endFrame,
      startSeconds: startFrame / sampleRate,
      endSeconds: endFrame / sampleRate,
    });
  }

  return slices;
}

/**
 * Gestionnaire réactif singleton pour le pont Duo Studio (OP-1 <-> EP-133).
 */
export class InterStudioBridge {
  private static instance: InterStudioBridge | null = null;
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();
  private sharedAudioClipboard: {
    name: string;
    source: "op1" | "ep133" | "rack";
    buffer: Float32Array[];
    sampleRate: number;
    duration: number;
  } | null = null;

  public static getInstance(): InterStudioBridge {
    if (!InterStudioBridge.instance) {
      InterStudioBridge.instance = new InterStudioBridge();
    }
    return InterStudioBridge.instance;
  }

  public on(event: string, callback: (payload: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: (payload: any) => void): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  public emit(event: string, payload: any): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in InterStudioBridge listener for event "${event}":`, e);
        }
      });
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(`studio-bridge:${event}`, { detail: payload }));
    }
  }

  public copyAudioToClipboard(
    name: string,
    source: "op1" | "ep133" | "rack",
    buffer: Float32Array[],
    sampleRate: number
  ): void {
    const duration = (buffer[0]?.length ?? 0) / sampleRate;
    this.sharedAudioClipboard = {
      name,
      source,
      buffer: buffer.map((c) => new Float32Array(c)),
      sampleRate,
      duration,
    };
    this.emit("clipboard:updated", { ...this.sharedAudioClipboard });
  }

  public getAudioClipboard() {
    return this.sharedAudioClipboard;
  }

  public transferTapeSelectionToEp133(req: TapeToPadTransferRequest): void {
    this.emit("tape:to_ep133_pad", req);
  }

  public bouncePatternToOp1Track(req: PatternToTapeTransferRequest): void {
    this.emit("ep133:to_op1_track", req);
  }
}

export const interStudioBridge = InterStudioBridge.getInstance();

// Logger utility for all applications
export { createLogger, globalLogger, default as Logger } from './logger.ts';
