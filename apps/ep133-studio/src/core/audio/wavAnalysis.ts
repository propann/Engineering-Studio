/**
 * Adaptateur EP-133 : le noyau WAV est partagé avec OP-1 via audio-bridge.
 * L'analyse AIFF reste locale car elle est spécifique au flux OP-1/EP-133.
 */
export {
  analyzeWavBuffer,
  computeWaveformPeaks,
  detectSilenceTrim,
  parseWavFormat,
  readSignedSample,
  suggestNormalizationGainDb,
} from '@studio-hub/audio-bridge';

export type {
  ParsedWavFormat,
  SilenceTrimSuggestion,
  WaveformPeaks,
  WavAnalysisReport,
} from '@studio-hub/audio-bridge';

import type { WavAnalysisReport } from '@studio-hub/audio-bridge';

/** Analyse AIFF PCM non compressé (big-endian), sans décodage AudioContext. */
export function analyzeAiffBuffer(bytes: ArrayBuffer, weightBytes = bytes.byteLength): WavAnalysisReport | null {
  if (bytes.byteLength < 54) return null;
  const view = new DataView(bytes);
  const text = (offset: number, length: number) => String.fromCharCode(...Array.from({ length }, (_, index) => view.getUint8(offset + index)));
  if (text(0, 4) !== 'FORM' || text(8, 4) !== 'AIFF') return null;
  let offset = 12; let commStart = -1; let commLength = 0; let soundStart = -1; let soundLength = 0;
  while (offset + 8 <= bytes.byteLength) {
    const id = text(offset, 4); const length = view.getUint32(offset + 4, false); const start = offset + 8;
    if (id === 'COMM') { commStart = start; commLength = length; }
    if (id === 'SSND') { soundStart = start; soundLength = length; }
    offset += 8 + length + (length % 2);
  }
  if (commStart < 0 || soundStart < 0 || commLength < 18 || soundLength < 8) return null;
  const channels = view.getUint16(commStart, false);
  const frameCount = view.getUint32(commStart + 2, false);
  const bitDepth = view.getUint16(commStart + 6, false);
  const exponent = view.getUint16(commStart + 8, false);
  const fraction = Number((BigInt(view.getUint32(commStart + 10, false)) << 32n) | BigInt(view.getUint32(commStart + 14, false)));
  const sampleRate = exponent === 0 ? 0 : Math.round(2 ** (exponent - 16383) * (1 + fraction / 2 ** 63));
  if (!channels || !sampleRate || ![8, 16, 24, 32].includes(bitDepth) || soundStart + 8 > bytes.byteLength) return null;
  const dataStart = soundStart + 8 + view.getUint32(soundStart, false);
  const dataLength = Math.min(Math.max(0, soundLength - 8), bytes.byteLength - dataStart);
  const bytesPerSample = bitDepth / 8;
  const sampleCount = Math.floor(dataLength / bytesPerSample);
  const maxCode = bitDepth === 8 ? 127 : bitDepth === 16 ? 32767 : bitDepth === 24 ? 8388607 : 2147483647;
  const minCode = -(maxCode + 1);
  let peak = 0; let clippedSampleCount = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const at = dataStart + index * bytesPerSample;
    let raw = 0;
    if (bitDepth === 8) raw = view.getInt8(at);
    else if (bitDepth === 16) raw = view.getInt16(at, false);
    else if (bitDepth === 24) {
      raw = (view.getUint8(at) << 16) | (view.getUint8(at + 1) << 8) | view.getUint8(at + 2);
      if (raw & 0x800000) raw -= 0x1000000;
    } else raw = view.getInt32(at, false);
    peak = Math.max(peak, Math.abs(raw) / (maxCode + 1));
    if (raw === maxCode || raw === minCode) clippedSampleCount += 1;
  }
  return { weightBytes, durationSeconds: frameCount / sampleRate, sampleRate, channels, bitDepth, peakLevel: Math.min(1, peak), clipped: clippedSampleCount > 0, clippedSampleCount } as any;
}
