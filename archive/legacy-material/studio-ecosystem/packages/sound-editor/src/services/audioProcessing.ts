/**
 * Audio Processing Service
 * Handles loading, processing, and analyzing audio files
 */

export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioContext.decodeAudioData(arrayBuffer);
}

export function getAudioContext(): AudioContext {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

export function trimAudioBuffer(
  buffer: AudioBuffer,
  startMs: number,
  endMs: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const startSample = Math.max(0, (startMs / 1000) * sampleRate);
  const endSample = Math.min(buffer.length, (endMs / 1000) * sampleRate);

  const audioContext = getAudioContext();
  const trimmed = audioContext.createBuffer(
    buffer.numberOfChannels,
    Math.max(1, endSample - startSample),
    sampleRate
  );

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    trimmed.getChannelData(ch).set(data.slice(startSample, endSample));
  }

  return trimmed;
}

export function normalizeAudioBuffer(buffer: AudioBuffer): void {
  let maxValue = 0;

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      maxValue = Math.max(maxValue, Math.abs(data[i]));
    }
  }

  if (maxValue > 1.0) {
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        data[i] /= maxValue;
      }
    }
  }
}

export function detectPeakLevel(buffer: AudioBuffer): number {
  let maxValue = 0;

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      maxValue = Math.max(maxValue, Math.abs(data[i]));
    }
  }

  return maxValue;
}

export function getBufferDuration(buffer: AudioBuffer): number {
  return (buffer.length / buffer.sampleRate) * 1000; // in milliseconds
}

export function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numberOfChannels; ch++) {
    channelData.push(audioBuffer.getChannelData(ch));
  }

  const dataLength = audioBuffer.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // WAV Header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Audio Data
  const offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let ch = 0; ch < numberOfChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      const index = offset + (i * blockAlign) + (ch * bytesPerSample);
      view.setInt16(index, sample * 0x7fff, true);
    }
  }

  return buffer;
}
