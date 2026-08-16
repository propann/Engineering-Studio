/**
 * Tag Calculation Service
 * Auto-detection of audio tags using signal processing
 */

import { AudioTags } from '../components/Editor/TagPanel';

/**
 * Silence Detector
 * Finds the start and end of audio content
 */
class SilenceDetector {
  private threshold: number = -60; // dB
  private minSilenceDuration: number = 100; // ms
  private sampleRate: number;

  constructor(sampleRate: number, threshold: number = -60) {
    this.sampleRate = sampleRate;
    this.threshold = threshold;
  }

  /**
   * Detect audio boundaries
   */
  detectBoundaries(audioBuffer: AudioBuffer): {
    startTime: number;
    endTime: number;
  } {
    const data = this.getMonoMix(audioBuffer);
    const thresholdLinear = Math.pow(10, this.threshold / 20);

    // Find start
    let startSample = 0;
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > thresholdLinear) {
        startSample = Math.max(0, i - Math.floor(0.05 * this.sampleRate));
        break;
      }
    }

    // Find end
    let endSample = data.length;
    for (let i = data.length - 1; i >= 0; i--) {
      if (Math.abs(data[i]) > thresholdLinear) {
        endSample = Math.min(data.length, i + Math.floor(0.05 * this.sampleRate));
        break;
      }
    }

    return {
      startTime: (startSample / this.sampleRate) * 1000,
      endTime: (endSample / this.sampleRate) * 1000
    };
  }

  /**
   * Get mono mix of audio
   */
  private getMonoMix(audioBuffer: AudioBuffer): Float32Array {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const mono = new Float32Array(length);

    if (channels === 1) {
      return audioBuffer.getChannelData(0);
    }

    // Mix all channels
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch++) {
        sum += audioBuffer.getChannelData(ch)[i];
      }
      mono[i] = sum / channels;
    }

    return mono;
  }
}

/**
 * Peak Detector
 * Finds onset/attack points and peak amplitude
 */
class PeakDetector {
  private sampleRate: number;
  private frameSize: number = 2048;
  private hopSize: number = 512;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }

  /**
   * Detect onset (attack point)
   */
  detectOnset(audioBuffer: AudioBuffer): number {
    const data = this.getMonoMix(audioBuffer);
    const energy = this.computeEnergy(data);
    const novelty = this.computeNovelty(energy);

    // Find first peak in novelty
    let maxNovelty = 0;
    let maxIndex = 0;

    for (let i = 0; i < novelty.length; i++) {
      if (novelty[i] > maxNovelty) {
        maxNovelty = novelty[i];
        maxIndex = i;
      }
    }

    // Convert frame index to time
    const sampleIndex = maxIndex * this.hopSize;
    return (sampleIndex / this.sampleRate) * 1000;
  }

  /**
   * Detect peak level
   */
  detectPeakLevel(audioBuffer: AudioBuffer): number {
    const data = this.getMonoMix(audioBuffer);
    let max = 0;

    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) {
        max = abs;
      }
    }

    return max;
  }

  /**
   * Compute energy per frame
   */
  private computeEnergy(data: Float32Array): Float32Array {
    const numFrames = Math.floor((data.length - this.frameSize) / this.hopSize) + 1;
    const energy = new Float32Array(numFrames);

    for (let i = 0; i < numFrames; i++) {
      const start = i * this.hopSize;
      const end = Math.min(start + this.frameSize, data.length);
      let sum = 0;

      for (let j = start; j < end; j++) {
        sum += data[j] * data[j];
      }

      energy[i] = Math.sqrt(sum / (end - start));
    }

    return energy;
  }

  /**
   * Compute novelty function
   */
  private computeNovelty(energy: Float32Array): Float32Array {
    const novelty = new Float32Array(energy.length);

    for (let i = 1; i < energy.length; i++) {
      const diff = energy[i] - energy[i - 1];
      novelty[i] = Math.max(0, diff); // Half-wave rectification
    }

    return novelty;
  }

  /**
   * Get mono mix
   */
  private getMonoMix(audioBuffer: AudioBuffer): Float32Array {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const mono = new Float32Array(length);

    if (channels === 1) {
      return audioBuffer.getChannelData(0);
    }

    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch++) {
        sum += audioBuffer.getChannelData(ch)[i];
      }
      mono[i] = sum / channels;
    }

    return mono;
  }
}

/**
 * Loop Detector
 * Finds repeating patterns in audio
 */
class LoopDetector {
  private sampleRate: number;
  private minLoopTime: number = 100; // ms
  private maxLoopTime: number = 5000; // ms

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }

  /**
   * Detect loop points
   */
  detectLoop(
    audioBuffer: AudioBuffer
  ): { loopStart: number; loopEnd: number; confidence: number } | null {
    const data = this.getMonoMix(audioBuffer);
    const minSamples = (this.minLoopTime / 1000) * this.sampleRate;
    const maxSamples = Math.min(
      (this.maxLoopTime / 1000) * this.sampleRate,
      data.length / 2
    );

    let bestCorrelation = 0;
    let bestDelay = 0;

    // Try different loop lengths
    for (let delay = minSamples; delay < maxSamples; delay += Math.floor(this.sampleRate * 0.01)) {
      const correlation = this.computeAutoCorrelation(data, delay);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestDelay = delay;
      }
    }

    // If correlation is strong enough, return loop points
    if (bestCorrelation > 0.7) {
      return {
        loopStart: 0,
        loopEnd: (bestDelay / this.sampleRate) * 1000,
        confidence: bestCorrelation
      };
    }

    return null;
  }

  /**
   * Compute autocorrelation
   */
  private computeAutoCorrelation(data: Float32Array, delay: number): number {
    if (delay >= data.length) return 0;

    let correlation = 0;
    let norm1 = 0;
    let norm2 = 0;
    const windowSize = Math.min(data.length - delay, 44100); // 1 second max

    for (let i = 0; i < windowSize; i++) {
      const val1 = data[i];
      const val2 = data[i + delay];

      correlation += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    const denominator = Math.sqrt(norm1 * norm2);
    if (denominator === 0) return 0;

    return correlation / denominator;
  }

  /**
   * Get mono mix
   */
  private getMonoMix(audioBuffer: AudioBuffer): Float32Array {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const mono = new Float32Array(length);

    if (channels === 1) {
      return audioBuffer.getChannelData(0);
    }

    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch++) {
        sum += audioBuffer.getChannelData(ch)[i];
      }
      mono[i] = sum / channels;
    }

    return mono;
  }
}

/**
 * Pitch Detector
 * Estimates fundamental frequency using autocorrelation
 */
class PitchDetector {
  private sampleRate: number;
  private minFreq: number = 50; // Hz
  private maxFreq: number = 4000; // Hz

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }

  /**
   * Detect pitch
   */
  detectPitch(audioBuffer: AudioBuffer): number {
    const data = this.getMonoMix(audioBuffer);
    const frameSize = Math.floor(this.sampleRate / this.minFreq);
    const frame = data.slice(0, Math.min(frameSize, data.length));

    // Apply Hann window
    this.applyHannWindow(frame);

    // Compute autocorrelation
    const correlations = this.computeAutoCorrelations(frame);

    // Find peak in correlation
    const minLag = Math.floor(this.sampleRate / this.maxFreq);
    const maxLag = Math.floor(this.sampleRate / this.minFreq);

    let maxCorrelation = 0;
    let bestLag = minLag;

    for (let lag = minLag; lag < maxLag && lag < correlations.length; lag++) {
      if (correlations[lag] > maxCorrelation) {
        maxCorrelation = correlations[lag];
        bestLag = lag;
      }
    }

    // Convert lag to frequency
    if (bestLag > 0 && maxCorrelation > 0.1) {
      const frequency = this.sampleRate / bestLag;

      // Convert to semitones (relative to A4 = 440Hz)
      const semitones = 12 * Math.log2(frequency / 440);
      return Math.round(semitones * 2) / 2; // Round to half semitone
    }

    return 0; // No pitch detected
  }

  /**
   * Apply Hann window
   */
  private applyHannWindow(frame: Float32Array): void {
    for (let i = 0; i < frame.length; i++) {
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frame.length - 1)));
      frame[i] *= window;
    }
  }

  /**
   * Compute autocorrelations
   */
  private computeAutoCorrelations(frame: Float32Array): Float32Array {
    const correlations = new Float32Array(frame.length);

    for (let lag = 0; lag < frame.length; lag++) {
      let sum = 0;
      for (let i = 0; i < frame.length - lag; i++) {
        sum += frame[i] * frame[i + lag];
      }
      correlations[lag] = sum;
    }

    // Normalize
    const maxCorr = correlations[0];
    if (maxCorr > 0) {
      for (let i = 0; i < correlations.length; i++) {
        correlations[i] /= maxCorr;
      }
    }

    return correlations;
  }

  /**
   * Get mono mix
   */
  private getMonoMix(audioBuffer: AudioBuffer): Float32Array {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const mono = new Float32Array(length);

    if (channels === 1) {
      return audioBuffer.getChannelData(0);
    }

    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch++) {
        sum += audioBuffer.getChannelData(ch)[i];
      }
      mono[i] = sum / channels;
    }

    return mono;
  }
}

/**
 * Tag Calculation Engine
 * Orchestrates all detectors
 */
export class TagCalculationEngine {
  private silenceDetector: SilenceDetector;
  private peakDetector: PeakDetector;
  private loopDetector: LoopDetector;
  private pitchDetector: PitchDetector;

  constructor(sampleRate: number) {
    this.silenceDetector = new SilenceDetector(sampleRate);
    this.peakDetector = new PeakDetector(sampleRate);
    this.loopDetector = new LoopDetector(sampleRate);
    this.pitchDetector = new PitchDetector(sampleRate);
  }

  /**
   * Calculate all tags automatically
   */
  async calculateTags(audioBuffer: AudioBuffer): Promise<AudioTags> {
    return new Promise((resolve) => {
      // Run calculations asynchronously to prevent UI blocking
      setTimeout(() => {
        // Detect silence boundaries
        const silence = this.silenceDetector.detectBoundaries(audioBuffer);

        // Detect onset
        const onset = this.peakDetector.detectOnset(audioBuffer);

        // Detect peak level
        const peakLevel = this.peakDetector.detectPeakLevel(audioBuffer);

        // Detect loop
        const loop = this.loopDetector.detectLoop(audioBuffer);

        // Detect pitch
        const pitch = this.pitchDetector.detectPitch(audioBuffer);

        const tags: AudioTags = {
          start: Math.max(0, silence.startTime),
          end: Math.min(audioBuffer.length / audioBuffer.sampleRate * 1000, silence.endTime),
          pitch: pitch,
          loop: loop !== null,
          loopStart: loop?.loopStart,
          loopEnd: loop?.loopEnd,
          rate: 1,
          attack: Math.max(0, onset - silence.startTime),
          release: 100 // Default release time
        };

        resolve(tags);
      }, 0);
    });
  }

  /**
   * Get suggestions for tags
   */
  async getSuggestions(audioBuffer: AudioBuffer): Promise<{
    confidence: number;
    suggestions: string[];
    detailedResults: any;
  }> {
    const tags = await this.calculateTags(audioBuffer);

    const suggestions: string[] = [];
    let confidence = 0.5;

    // Add suggestions based on detections
    if (tags.attack && tags.attack > 20) {
      suggestions.push(`Detected attack at ${Math.round(tags.attack)}ms`);
      confidence += 0.1;
    }

    if (tags.loop) {
      suggestions.push(`Loop pattern detected (${Math.round(tags.loopEnd! - tags.loopStart!)}ms)`);
      confidence += 0.1;
    }

    if (tags.pitch !== 0) {
      suggestions.push(`Pitch detected: ${tags.pitch > 0 ? '+' : ''}${tags.pitch} semitones`);
      confidence += 0.1;
    }

    if (tags.end - tags.start < 100) {
      suggestions.push('Very short sample - verify settings');
      confidence -= 0.1;
    }

    return {
      confidence: Math.max(0, Math.min(1, confidence)),
      suggestions,
      detailedResults: tags
    };
  }
}

/**
 * Convenient export function
 */
export async function detectAudioTags(audioBuffer: AudioBuffer): Promise<AudioTags> {
  const engine = new TagCalculationEngine(audioBuffer.sampleRate);
  return engine.calculateTags(audioBuffer);
}

/**
 * Get suggestions
 */
export async function getSuggestionsForAudio(
  audioBuffer: AudioBuffer
): Promise<{
  confidence: number;
  suggestions: string[];
  tags: AudioTags;
}> {
  const engine = new TagCalculationEngine(audioBuffer.sampleRate);
  const result = await engine.getSuggestions(audioBuffer);
  return {
    confidence: result.confidence,
    suggestions: result.suggestions,
    tags: result.detailedResults
  };
}
