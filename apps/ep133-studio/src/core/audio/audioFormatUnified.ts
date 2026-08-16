/**
 * Unified Audio Format Support
 * Supports both WAV (EP-133) and AIFF (OP-1) formats
 *
 * This module provides a format-agnostic interface for audio operations,
 * enabling future interoperability between OP-1 and EP-133 sound libraries.
 *
 * Strategy: Auto-detect format, delegate to format-specific implementations
 */

import { parseWavFormat, readSignedSample as readWavSample } from './wavAnalysis';
import { parseAiffFormat, readAiffSample } from './aiffFormat';

export interface ExtractedAudio {
  channels: number;
  sampleRate: number;
  frameCount: number;
  interleaved: Float32Array;
  format: 'wav' | 'aiff';
  duration: number;
}

export interface AudioMetadata {
  format: 'wav' | 'aiff' | 'unknown';
  channels: number;
  sampleRate: number;
  duration: number;
  bitDepth: number;
  fileSize: number;
}

/**
 * Auto-detect and extract audio samples from either WAV or AIFF
 * Tries AIFF first (OP-1 format), then WAV (EP-133 format)
 */
export function extractAudioInterleaved(bytes: ArrayBuffer): ExtractedAudio | null {
  // Try AIFF first (OP-1 format)
  const aiff = parseAiffFormat(bytes);
  if (aiff) {
    const out = new Float32Array(aiff.frameCount * aiff.channels);
    let index = 0;
    for (let frame = 0; frame < aiff.frameCount; frame += 1) {
      const frameStart = aiff.dataStart + frame * aiff.bytesPerFrame;
      for (let channel = 0; channel < aiff.channels; channel += 1) {
        out[index] = Math.max(-1, Math.min(1, readAiffSample(aiff, frameStart + channel * aiff.bytesPerSample)));
        index += 1;
      }
    }
    return {
      channels: aiff.channels,
      sampleRate: aiff.sampleRate,
      frameCount: aiff.frameCount,
      interleaved: out,
      format: 'aiff',
      duration: aiff.frameCount / aiff.sampleRate,
    };
  }

  // Fall back to WAV (EP-133 format)
  const wav = parseWavFormat(bytes);
  if (wav) {
    const out = new Float32Array(wav.frameCount * wav.channels);
    let index = 0;
    for (let frame = 0; frame < wav.frameCount; frame += 1) {
      const frameStart = wav.dataStart + frame * wav.bytesPerFrame;
      for (let channel = 0; channel < wav.channels; channel += 1) {
        out[index] = Math.max(-1, Math.min(1, readWavSample(wav, frameStart + channel * wav.bytesPerSample)));
        index += 1;
      }
    }
    return {
      channels: wav.channels,
      sampleRate: wav.sampleRate,
      frameCount: wav.frameCount,
      interleaved: out,
      format: 'wav',
      duration: wav.frameCount / wav.sampleRate,
    };
  }

  return null;
}

/**
 * Get metadata from either format without extracting all samples
 */
export function getAudioMetadata(bytes: ArrayBuffer): AudioMetadata {
  const aiff = parseAiffFormat(bytes);
  if (aiff) {
    return {
      format: 'aiff',
      channels: aiff.channels,
      sampleRate: aiff.sampleRate,
      duration: aiff.frameCount / aiff.sampleRate,
      bitDepth: aiff.bitDepth,
      fileSize: bytes.byteLength,
    };
  }

  const wav = parseWavFormat(bytes);
  if (wav) {
    return {
      format: 'wav',
      channels: wav.channels,
      sampleRate: wav.sampleRate,
      duration: wav.frameCount / wav.sampleRate,
      bitDepth: wav.bitDepth,
      fileSize: bytes.byteLength,
    };
  }

  return {
    format: 'unknown',
    channels: 0,
    sampleRate: 0,
    duration: 0,
    bitDepth: 0,
    fileSize: bytes.byteLength,
  };
}

/**
 * Detect audio format
 */
export function detectAudioFormat(bytes: ArrayBuffer): 'wav' | 'aiff' | 'unknown' {
  if (parseAiffFormat(bytes)) return 'aiff';
  if (parseWavFormat(bytes)) return 'wav';
  return 'unknown';
}

/**
 * Check if file is supported audio format
 */
export function isSupportedAudioFormat(bytes: ArrayBuffer): boolean {
  return detectAudioFormat(bytes) !== 'unknown';
}

/**
 * Get a human-readable description of audio properties
 */
export function describeAudio(bytes: ArrayBuffer): string {
  const meta = getAudioMetadata(bytes);
  if (meta.format === 'unknown') {
    return `Unknown format (${(bytes.byteLength / 1024).toFixed(1)} KB)`;
  }

  const formatUpper = meta.format.toUpperCase();
  const channels = meta.channels === 1 ? 'mono' : meta.channels === 2 ? 'stereo' : `${meta.channels}ch`;
  const duration = meta.duration > 0 ? `${meta.duration.toFixed(2)}s` : '0s';

  return `${formatUpper} ${channels} ${meta.sampleRate}Hz ${meta.bitDepth}bit (${duration})`;
}
