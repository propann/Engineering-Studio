/**
 * Audio Utilities - Shared audio helpers for Studio Hub
 */

export const SAMPLE_RATES = {
  minimal: 22050,
  standard: 44100,
  performance: 48000,
  server: 96000,
} as const;

export const AUDIO_FORMATS = ['wav', 'ogg', 'mp3', 'flac'] as const;

export interface AudioBuffer {
  channels: number;
  sampleRate: number;
  samples: Float32Array[];
  duration: number;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

/**
 * Convert sample rate from one rate to another
 */
export function convertSampleRate(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return samples;

  const ratio = toRate / fromRate;
  const newLength = Math.floor(samples.length * ratio);
  const newSamples = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const pos = i / ratio;
    const index = Math.floor(pos);
    const frac = pos - index;

    if (index + 1 < samples.length) {
      newSamples[i] = samples[index] * (1 - frac) + samples[index + 1] * frac;
    } else {
      newSamples[i] = samples[index];
    }
  }

  return newSamples;
}

/**
 * Mix multiple audio buffers
 */
export function mixAudio(...buffers: Float32Array[]): Float32Array {
  if (buffers.length === 0) return new Float32Array();
  if (buffers.length === 1) return buffers[0];

  const maxLength = Math.max(...buffers.map(b => b.length));
  const mixed = new Float32Array(maxLength);

  for (const buffer of buffers) {
    for (let i = 0; i < buffer.length; i++) {
      mixed[i] += buffer[i];
    }
  }

  // Normalize to prevent clipping
  const max = Math.max(...Array.from(mixed).map(Math.abs));
  if (max > 1) {
    for (let i = 0; i < mixed.length; i++) {
      mixed[i] /= max;
    }
  }

  return mixed;
}

/**
 * Apply gain (volume) to audio buffer
 */
export function applyGain(samples: Float32Array, gainDb: number): Float32Array {
  const gain = Math.pow(10, gainDb / 20);
  const result = new Float32Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    result[i] = samples[i] * gain;
  }

  return result;
}

/**
 * Create silent audio buffer
 */
export function createSilence(sampleRate: number, durationSeconds: number): Float32Array {
  const length = Math.floor(sampleRate * durationSeconds);
  return new Float32Array(length);
}

/**
 * Normalize audio buffer (0dB peak)
 */
export function normalize(samples: Float32Array): Float32Array {
  const max = Math.max(...Array.from(samples).map(Math.abs));
  if (max === 0) return samples;

  const result = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    result[i] = samples[i] / max;
  }
  return result;
}

/**
 * Get audio format from file extension
 */
export function getAudioFormat(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return AUDIO_FORMATS.includes(ext as any) ? ext : 'wav';
}

/**
 * Calculate duration from samples and sample rate
 */
export function calculateDuration(sampleCount: number, sampleRate: number): number {
  return sampleCount / sampleRate;
}

/**
 * Get recommended buffer size for machine class
 */
export function getBufferSize(machineClass: 'minimal' | 'standard' | 'performance' | 'server'): number {
  const sizes: Record<string, number> = {
    minimal: 1024,
    standard: 2048,
    performance: 4096,
    server: 8192,
  };
  return sizes[machineClass] || 2048;
}
