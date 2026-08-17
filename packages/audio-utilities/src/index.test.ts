import { describe, it, expect } from 'vitest';
import {
  convertSampleRate,
  mixAudio,
  applyGain,
  createSilence,
  normalize,
  getAudioFormat,
  calculateDuration,
  getBufferSize,
  SAMPLE_RATES,
} from './index';

describe('Audio Utilities', () => {
  it('should provide sample rate constants', () => {
    expect(SAMPLE_RATES.minimal).toBe(22050);
    expect(SAMPLE_RATES.standard).toBe(44100);
    expect(SAMPLE_RATES.performance).toBe(48000);
    expect(SAMPLE_RATES.server).toBe(96000);
  });

  it('should convert sample rates', () => {
    const samples = new Float32Array([0.5, 0.6, 0.7]);
    const converted = convertSampleRate(samples, 44100, 48000);

    expect(converted.length).toBeGreaterThan(0);
  });

  it('should mix audio buffers', () => {
    const buf1 = new Float32Array([0.1, 0.2]);
    const buf2 = new Float32Array([0.1, 0.2]);

    const mixed = mixAudio(buf1, buf2);
    expect(mixed.length).toBe(2);
  });

  it('should apply gain', () => {
    const samples = new Float32Array([0.5, 0.6, 0.7]);
    const gained = applyGain(samples, 6); // +6dB

    expect(gained.length).toBe(3);
    expect(gained[0]).toBeGreaterThan(samples[0]);
  });

  it('should create silence', () => {
    const silence = createSilence(44100, 1);

    expect(silence.length).toBe(44100);
    expect(silence[0]).toBe(0);
  });

  it('should normalize audio', () => {
    const samples = new Float32Array([0.1, 0.5, 0.3]);
    const normalized = normalize(samples);

    expect(normalized.length).toBe(3);
    const max = Math.max(...Array.from(normalized).map(Math.abs));
    expect(Math.abs(max - 1)).toBeLessThan(0.01);
  });

  it('should detect audio format', () => {
    expect(getAudioFormat('file.wav')).toBe('wav');
    expect(getAudioFormat('file.mp3')).toBe('mp3');
    expect(getAudioFormat('file.unknown')).toBe('wav');
  });

  it('should calculate duration', () => {
    const duration = calculateDuration(44100, 44100);
    expect(duration).toBe(1);
  });

  it('should get buffer size for machine class', () => {
    expect(getBufferSize('minimal')).toBe(1024);
    expect(getBufferSize('standard')).toBe(2048);
    expect(getBufferSize('performance')).toBe(4096);
    expect(getBufferSize('server')).toBe(8192);
  });
});
