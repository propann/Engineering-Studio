/**
 * Adaptateur OP-1 du noyau d'analyse WAV partagé.
 * Les règles propres à l'OP-1 restent ici ; le parsing et les calculs audio
 * communs vivent dans @studio-hub/audio-bridge.
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

// Source : docs/OP1_KNOWLEDGE_BASE.md — 6 s synthé, 12 s drum.
export const OP1_AUDIO_LIMITS = {
  synthMaxSeconds: 6,
  drumMaxSeconds: 12,
} as const;

export type Op1SampleKind = 'synth' | 'drum';

export function exceedsOp1Duration(report: WavAnalysisReport, kind: Op1SampleKind): boolean {
  const limit = kind === 'synth' ? OP1_AUDIO_LIMITS.synthMaxSeconds : OP1_AUDIO_LIMITS.drumMaxSeconds;
  return report.durationSeconds > limit;
}
