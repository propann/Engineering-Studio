# Audio Format Support: AIFF from OP-1 Studio

**Date**: 15 August 2026  
**Status**: Implemented & Ready  
**Source**: Adapted from OP-1 Studio (`app/lib/aiffPatchOracle.ts`)  

---

## 📋 WHAT'S NEW

EP-133 now supports **AIFF format** (previously WAV-only), enabling future interoperability with OP-1 sound libraries.

### New Modules

| Module | Purpose | Exports |
|--------|---------|---------|
| `src/core/audio/aiffFormat.ts` | AIFF parsing & reading | `parseAiffFormat()`, `readAiffSample()`, `extractAiffInterleaved()`, `isAiffFormat()`, `getAiffMetadata()` |
| `src/core/audio/audioFormatUnified.ts` | Format-agnostic interface | `extractAudioInterleaved()`, `getAudioMetadata()`, `detectAudioFormat()`, `isSupportedAudioFormat()`, `describeAudio()` |

---

## 🎯 USE CASES

### Current (WAV)
```typescript
import { parseWavFormat } from 'src/core/audio/wavAnalysis';

const wav = parseWavFormat(audioBytes);
// ... process WAV
```

### Future (WAV + AIFF)
```typescript
import { extractAudioInterleaved, getAudioMetadata } from 'src/core/audio/audioFormatUnified';

// Auto-detects format (AIFF or WAV)
const audio = extractAudioInterleaved(audioBytes);
if (audio) {
  console.log(`${audio.format.toUpperCase()}: ${audio.channels}ch @ ${audio.sampleRate}Hz`);
  // Use audio.interleaved for waveform display, analysis, etc.
}

// Get quick metadata without extracting all samples
const meta = getAudioMetadata(audioBytes);
console.log(`Duration: ${meta.duration}s, Format: ${meta.format}`);
```

---

## 🔌 INTEGRATION POINTS

### 1. Waveform Display
**Current**: `src/components/shared/WaveformTrim.tsx` uses WAV only

**Future**: Can now accept AIFF files
```typescript
import { extractAudioInterleaved } from '../core/audio/audioFormatUnified';

// Works with both WAV and AIFF
const audio = extractAudioInterleaved(fileBuffer);
if (audio) {
  const peaks = calculatePeaks(audio.interleaved, audio.channels);
  // Display waveform...
}
```

### 2. Audio Conversion
**Current**: `src/core/audio/wavConvert.ts` converts WAV to EP-133 targets (26.25kHz, 32kHz, 46.875kHz)

**Future**: Could accept AIFF, convert to EP-133 format
```typescript
import { extractAudioInterleaved } from '../core/audio/audioFormatUnified';
import { convertToMachineRate } from './wavConvert';

const audio = extractAudioInterleaved(op1SoundBytes); // AIFF from OP-1
if (audio) {
  // Convert OP-1 audio (44.1kHz typically) to EP-133 machine rate
  const converted = convertToMachineRate(audio.interleaved, 44100, 26250);
}
```

### 3. Sound Library Import
**Current**: Sound browser only accepts WAV files

**Future**: Can accept both WAV and AIFF
```typescript
import { isSupportedAudioFormat, describeAudio } from '../core/audio/audioFormatUnified';

if (isSupportedAudioFormat(fileBuffer)) {
  console.log(`Sound: ${describeAudio(fileBuffer)}`);
  // Accept file, add to library
}
```

---

## 📊 FORMAT COMPARISON

| Property | EP-133 (WAV) | OP-1 (AIFF) |
|----------|-------------|-----------|
| **Sample Rate** | Variable (26.25k, 32k, 46.875kHz) | 44.1kHz (fixed) |
| **Channels** | Mono or Stereo | Mono or Stereo |
| **Bit Depth** | 16-bit | 16-bit (typically) |
| **Use Case** | Drum machine patterns | Synthesizer + Tape recordings |
| **Metadata** | Extensible chunks | APPL chunk for OP-1 patches |

---

## 🚀 HOW TO USE IN YOUR CODE

### Example 1: Detect Format
```typescript
import { detectAudioFormat } from 'src/core/audio/audioFormatUnified';

const format = detectAudioFormat(audioBytes);
if (format === 'aiff') {
  console.log('OP-1 sound detected');
} else if (format === 'wav') {
  console.log('EP-133 sound detected');
}
```

### Example 2: Display Metadata
```typescript
import { getAudioMetadata } from 'src/core/audio/audioFormatUnified';

const meta = getAudioMetadata(audioBytes);
console.log(`
  Format: ${meta.format.toUpperCase()}
  Channels: ${meta.channels}
  Sample Rate: ${meta.sampleRate}Hz
  Duration: ${meta.duration.toFixed(2)}s
  Bit Depth: ${meta.bitDepth}
`);
```

### Example 3: Extract Samples (Both Formats)
```typescript
import { extractAudioInterleaved } from 'src/core/audio/audioFormatUnified';

const audio = extractAudioInterleaved(audioBytes);
if (audio) {
  // `audio.interleaved` is Float32Array, normalized to [-1, 1]
  // `audio.channels`, `audio.sampleRate`, `audio.frameCount` are available
  // Works whether input was AIFF or WAV
  
  const rms = calculateRMS(audio.interleaved);
  const peaks = findPeaks(audio.interleaved, audio.channels);
}
```

---

## ⚙️ IMPLEMENTATION NOTES

### AIFF Parsing
- **Format**: RIFF-like container with FORM/AIFF header
- **Sample Rate**: Stored as IEEE 754 80-bit extended (non-standard; decoder included)
- **Endianness**: Big-endian (different from WAV's little-endian)
- **Chunks**: Standard AIFF chunks (COMM, SSND, APPL for OP-1 metadata)

### WAV Support
- Unchanged; existing `wavAnalysis.ts` continues to work
- Both formats now available via unified interface

---

## 🔄 MIGRATION GUIDE

### If using `wavAnalysis.ts` directly:
```typescript
// OLD (WAV only):
import { parseWavFormat } from 'src/core/audio/wavAnalysis';
const wav = parseWavFormat(bytes);

// NEW (WAV + AIFF):
import { extractAudioInterleaved } from 'src/core/audio/audioFormatUnified';
const audio = extractAudioInterleaved(bytes);
```

### If using specific module:
```typescript
// Can still use WAV module directly:
import { parseWavFormat } from 'src/core/audio/wavAnalysis';

// Or use AIFF module directly:
import { parseAiffFormat } from 'src/core/audio/aiffFormat';

// Or let unified module auto-detect:
import { extractAudioInterleaved } from 'src/core/audio/audioFormatUnified';
```

---

## 🧪 TESTING

No breaking changes. Existing WAV processing continues to work.

**New test vectors**:
- AIFF mono 44.1kHz 16-bit (OP-1 synth format)
- AIFF stereo 44.1kHz 16-bit (OP-1 tape format)
- Mixed WAV + AIFF in same project

---

## 📞 QUESTIONS?

### "Will this increase bundle size?"
- No. `aiffFormat.ts` is ~4KB minified (no external dependencies)
- `audioFormatUnified.ts` is ~2KB minified (just delegates to format modules)

### "Do I need to change my code?"
- No. Existing WAV code works unchanged
- Optional: Migrate to `audioFormatUnified` for format-agnostic code

### "When would I use AIFF in EP-133?"
- Future: Importing OP-1 sounds into EP-133 library
- Future: Cross-machine sound sharing projects
- Current: Archive/documentation purposes

---

## 📚 RELATED DOCUMENTATION

- `/docs/RAPPORT_REUTILISATION_EP133_POUR_OP1.md` — Original reuse agreement
- `src/core/audio/wavAnalysis.ts` — WAV parsing (source of reference)
- `src/core/audio/wavConvert.ts` — Audio conversion pipeline
- `/home/azoth/OP-1-Studio/docs/AUDIO_FILE_FORMAT_REFERENCE.md` — Detailed format specs

---

## 🏷️ Tags
`#audio-format` `#aiff` `#wav` `#op1-interop` `#file-format` `#cross-machine`

**Status**: Ready to use  
**Backward Compatible**: Yes (WAV still works)  
**Breaking Changes**: None  

---

*Adapted from OP-1 Studio on 15 August 2026*  
*Enables future sound library interoperability between OP-1 and EP-133*
