// Audio Bridge package for Studio Hub / EP-133 & OP-1 Suite

export interface WavAnalysisReport {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  durationMs: number;
  fileSizeBytes: number;
  hashSha256?: string;
  isStereo: boolean;
  isOp1Format?: boolean;
  isEp133Format?: boolean;
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

export function analyzeWavBuffer(buffer: ArrayBuffer): WavAnalysisReport {
  const parsed = parseWavHeader(buffer);
  const sampleRate = parsed.sampleRate || 44100;
  const channels = parsed.channels || 1;
  const bitDepth = parsed.bitDepth || 16;
  const bytesPerSample = (bitDepth / 8) * channels;
  const dataSize = Math.max(0, buffer.byteLength - 44);
  const durationMs = (dataSize / (sampleRate * bytesPerSample)) * 1000;

  return {
    sampleRate,
    channels,
    bitDepth,
    durationMs,
    fileSizeBytes: buffer.byteLength,
    isStereo: channels === 2,
    isOp1Format: sampleRate === 44100 && bitDepth === 16,
    isEp133Format: sampleRate === 46875 || sampleRate === 44100
  };
}
