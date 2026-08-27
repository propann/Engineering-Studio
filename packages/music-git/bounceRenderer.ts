/**
 * bounceRenderer.ts — Moteur de rendu PCM offline & Export WAV/AIFF pour snapshots Music-Git
 */

import { encodeAiffPcm16, encodeWavPcm16 } from "@studio-hub/audio-formats";
import type { MusicProjectSnapshot, MusicTrackLane } from "./types";

export interface RenderBounceOptions {
  sampleRate?: number;
  channels?: 1 | 2;
  bars?: number; // Nombre de mesures à rendre (défaut: 4 mesures)
  format?: "wav" | "aiff";
  normalize?: boolean;
}

export interface RenderBounceResult {
  buffer: ArrayBuffer;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  format: "wav" | "aiff";
  peakAmplitude: number;
}

/**
 * Synthétise un kick percussif analogique 909 dans le buffer PCM
 */
function renderKickSample(
  outputL: Float32Array,
  outputR: Float32Array,
  startFrame: number,
  velocity: number,
  sampleRate: number,
  vol: number
) {
  const durationSec = 0.28;
  const totalFrames = Math.floor(durationSec * sampleRate);
  const v = (velocity / 127) * vol;

  for (let i = 0; i < totalFrames; i++) {
    const frameIdx = startFrame + i;
    if (frameIdx >= outputL.length) break;

    const t = i / sampleRate;
    // Pitch envelope : de 150 Hz à 45 Hz
    const pitch = 45 + 105 * Math.exp(-t * 28);
    const phase = 2 * Math.PI * pitch * t;
    // Amp envelope : attaque immédiate et décroissance exponentielle
    const env = Math.exp(-t * 14);
    const sample = Math.sin(phase) * env * v * 0.95;

    outputL[frameIdx] += sample;
    outputR[frameIdx] += sample;
  }
}

/**
 * Synthétise une snare / clap dans le buffer PCM
 */
function renderSnareSample(
  outputL: Float32Array,
  outputR: Float32Array,
  startFrame: number,
  velocity: number,
  sampleRate: number,
  vol: number
) {
  const durationSec = 0.22;
  const totalFrames = Math.floor(durationSec * sampleRate);
  const v = (velocity / 127) * vol;

  for (let i = 0; i < totalFrames; i++) {
    const frameIdx = startFrame + i;
    if (frameIdx >= outputL.length) break;

    const t = i / sampleRate;
    const tone = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 22) * 0.4;
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 16) * 0.6;
    const sample = (tone + noise) * v * 0.85;

    outputL[frameIdx] += sample;
    outputR[frameIdx] += sample;
  }
}

/**
 * Synthétise un charleston (Hi-Hat)
 */
function renderHiHatSample(
  outputL: Float32Array,
  outputR: Float32Array,
  startFrame: number,
  velocity: number,
  sampleRate: number,
  vol: number
) {
  const durationSec = 0.08;
  const totalFrames = Math.floor(durationSec * sampleRate);
  const v = (velocity / 127) * vol;

  for (let i = 0; i < totalFrames; i++) {
    const frameIdx = startFrame + i;
    if (frameIdx >= outputL.length) break;

    const t = i / sampleRate;
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 55);
    const sample = noise * v * 0.5;

    outputL[frameIdx] += sample;
    outputR[frameIdx] += sample;
  }
}

/**
 * Synthétise une note mélodique / basse
 */
function renderMelodicSynth(
  outputL: Float32Array,
  outputR: Float32Array,
  startFrame: number,
  note: number,
  velocity: number,
  sampleRate: number,
  vol: number,
  isBass: boolean,
  pan: number = 0
) {
  const durationSec = isBass ? 0.35 : 0.45;
  const totalFrames = Math.floor(durationSec * sampleRate);
  const freq = 440 * Math.pow(2, (note - 69) / 12);
  const v = (velocity / 127) * vol;

  const leftGain = Math.cos(((pan + 1) * Math.PI) / 4);
  const rightGain = Math.sin(((pan + 1) * Math.PI) / 4);

  for (let i = 0; i < totalFrames; i++) {
    const frameIdx = startFrame + i;
    if (frameIdx >= outputL.length) break;

    const t = i / sampleRate;
    const env = Math.exp(-t * (isBass ? 7 : 5));
    let sample = 0;

    if (isBass) {
      // Onde en dent de scie avec harmonique
      sample = (2 * ((t * freq) % 1) - 1) * 0.7 + Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.3;
    } else {
      // Onde triangulaire riche
      sample = (Math.abs(4 * ((t * freq) % 1) - 2) - 1) * 0.7 + Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
    }

    const finalSample = sample * env * v * 0.7;
    outputL[frameIdx] += finalSample * leftGain;
    outputR[frameIdx] += finalSample * rightGain;
  }
}

/**
 * Moteur de Bounce / Rendu Audio Hors-Ligne pour un snapshot Music-Git
 */
export function renderSnapshotOffline(
  snapshot: MusicProjectSnapshot,
  options: RenderBounceOptions = {}
): RenderBounceResult {
  const sampleRate = options.sampleRate || 44100;
  const channels = options.channels || 2;
  const bars = Math.max(1, options.bars || 4);
  const format = options.format || "wav";
  const bpm = Math.max(20, Math.min(300, snapshot.bpm || 120));

  // Durée d'une mesure (4 temps à 4/4) en secondes
  const secondsPerBeat = 60 / bpm;
  const secondsPerBar = secondsPerBeat * (snapshot.timeSignature ? snapshot.timeSignature[0] : 4);
  const totalDurationSeconds = secondsPerBar * bars + 0.5; // + 0.5s de tail de réverbération
  const totalFrames = Math.floor(totalDurationSeconds * sampleRate);

  const bufferL = new Float32Array(totalFrames);
  const bufferR = new Float32Array(totalFrames);

  const secondsPer16th = secondsPerBeat / 4;
  const framesPer16th = Math.floor(secondsPer16th * sampleRate);

  // Itération sur chaque mesure et chaque pas du séquenceur 16 pas
  for (let bar = 0; bar < bars; bar++) {
    const barStartFrame = Math.floor(bar * secondsPerBar * sampleRate);

    for (const track of snapshot.tracks) {
      if (track.muted) continue;
      const trackVol = (track.volume ?? 0.8) * (snapshot.masterVolume ?? 0.85);
      const trackPan = track.pan ?? 0;
      const pattern = track.patterns[0];
      if (!pattern) continue;

      const trackNameLower = track.name.toLowerCase();
      const isKick = trackNameLower.includes("kick") || trackNameLower.includes("bd");
      const isSnare = trackNameLower.includes("snare") || trackNameLower.includes("clap") || trackNameLower.includes("sd");
      const isHiHat = trackNameLower.includes("hihat") || trackNameLower.includes("hat") || trackNameLower.includes("ch") || trackNameLower.includes("oh");
      const isBass = trackNameLower.includes("bass") || trackNameLower.includes("basse") || trackNameLower.includes("sub");

      for (let step = 0; step < 16; step++) {
        const stepData = pattern.steps[step];
        if (!stepData || !stepData.active) continue;

        const stepStartFrame = barStartFrame + step * framesPer16th;
        const vel = stepData.velocity || 100;
        const note = stepData.note || (isKick ? 36 : isSnare ? 38 : 60);

        if (isKick) {
          renderKickSample(bufferL, bufferR, stepStartFrame, vel, sampleRate, trackVol);
        } else if (isSnare) {
          renderSnareSample(bufferL, bufferR, stepStartFrame, vel, sampleRate, trackVol);
        } else if (isHiHat) {
          renderHiHatSample(bufferL, bufferR, stepStartFrame, vel, sampleRate, trackVol);
        } else {
          renderMelodicSynth(bufferL, bufferR, stepStartFrame, note, vel, sampleRate, trackVol, isBass, trackPan);
        }
      }
    }
  }

  // Calcul du peak et normalisation douce
  let peak = 0;
  for (let i = 0; i < totalFrames; i++) {
    const absL = Math.abs(bufferL[i]);
    const absR = Math.abs(bufferR[i]);
    if (absL > peak) peak = absL;
    if (absR > peak) peak = absR;
  }

  const normalizeScale = options.normalize && peak > 0.001 ? 0.95 / peak : 1.0;

  // Interleaving dans un Float32Array stéréo ou mono
  const interleaved = new Float32Array(totalFrames * channels);
  if (channels === 2) {
    for (let i = 0; i < totalFrames; i++) {
      interleaved[i * 2] = Math.max(-1, Math.min(1, bufferL[i] * normalizeScale));
      interleaved[i * 2 + 1] = Math.max(-1, Math.min(1, bufferR[i] * normalizeScale));
    }
  } else {
    for (let i = 0; i < totalFrames; i++) {
      const mono = (bufferL[i] + bufferR[i]) * 0.5 * normalizeScale;
      interleaved[i] = Math.max(-1, Math.min(1, mono));
    }
  }

  // Encodage binaire en WAV (PCM 16-bit) ou AIFF
  let encodedBuffer: ArrayBuffer;
  if (format === "aiff") {
    encodedBuffer = encodeAiffPcm16(interleaved, channels, sampleRate);
  } else {
    encodedBuffer = encodeWavPcm16(interleaved, channels, sampleRate);
  }

  return {
    buffer: encodedBuffer,
    durationSeconds: totalDurationSeconds,
    sampleRate,
    channels,
    format,
    peakAmplitude: peak * normalizeScale,
  };
}
