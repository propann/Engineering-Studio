/**
 * Audio Bridge - Studio Hub Ecosystem
 * Shared audio utilities from OP-1 and EP-133
 */

export {
  analyzeWavBuffer,
  computeWaveformPeaks,
  detectSilenceTrim,
  parseWavFormat,
  readSignedSample,
  suggestNormalizationGainDb,
} from './wavAnalysis.ts';

export type {
  ParsedWavFormat,
  SilenceTrimSuggestion,
  WaveformPeaks,
  WavAnalysisReport,
} from './wavAnalysis.ts';

export const audioBridgeLoaded = true;
