# 🔊 @studio-hub/audio-utilities

Shared audio utilities for Studio Hub. Provides sample rate conversion, audio mixing, gain adjustment, and format helpers.

## Features

- 🔄 **Sample Rate Conversion**: Convert between different sample rates
- 🎚️ **Audio Mixing**: Mix multiple audio buffers
- 📊 **Gain Control**: Apply dB-based gain adjustments
- 🔇 **Silence Generation**: Create silent audio buffers
- 📈 **Normalization**: Normalize audio to peak level
- 📁 **Format Detection**: Identify audio formats

## Installation

```bash
npm install @studio-hub/audio-utilities
```

## Quick Start

```typescript
import { convertSampleRate, mixAudio, applyGain, SAMPLE_RATES } from '@studio-hub/audio-utilities';

// Convert sample rate
const converted = convertSampleRate(samples, 44100, 48000);

// Mix buffers
const mixed = mixAudio(buffer1, buffer2);

// Apply gain
const gained = applyGain(samples, 6); // +6dB

// Get machine-specific sample rate
const rate = SAMPLE_RATES.standard; // 44100
```

## API

### Constants

- `SAMPLE_RATES` — Predefined rates per machine class
- `AUDIO_FORMATS` — Supported audio formats

### Functions

- `convertSampleRate(samples, fromRate, toRate)` — Convert sample rate
- `mixAudio(...buffers)` — Mix multiple buffers
- `applyGain(samples, gainDb)` — Apply gain in dB
- `createSilence(sampleRate, duration)` — Create silent buffer
- `normalize(samples)` — Normalize to peak
- `getAudioFormat(filename)` — Detect audio format
- `calculateDuration(sampleCount, sampleRate)` — Get duration
- `getBufferSize(machineClass)` — Get optimal buffer size

## License

MIT
