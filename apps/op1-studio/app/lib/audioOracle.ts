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

// Limites déplacées dans @studio-hub/audio-formats : le rack fabrique les
// samples et doit les connaître pour viser juste.
export { OP1_AUDIO_LIMITS, type Op1SampleKind } from '@studio-hub/audio-formats';
import { op1MaxSeconds, type Op1SampleKind as Kind } from '@studio-hub/audio-formats';

export function exceedsOp1Duration(report: WavAnalysisReport, kind: Kind): boolean {
  const duration = (report as any).durationSeconds || ((report as any).durationMs ? (report as any).durationMs / 1000 : 0);
  return duration > op1MaxSeconds(kind);
}
