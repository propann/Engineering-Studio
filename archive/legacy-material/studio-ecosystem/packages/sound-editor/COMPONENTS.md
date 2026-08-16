# Sound Editor - Component Documentation

## Overview

The Sound Editor is built with modular React components for maximum reusability and maintainability.

## Component Architecture

```
App
├── WaveformDisplay
│   └── wavesurfer.js integration
├── MarkerSystem
│   └── Drag-drop marker placement
├── TagPanel
│   └── Tag editing & validation
├── PlaybackControls
│   └── Audio playback management
└── ExportButton
    └── File export functionality
```

---

## Components

### 1. WaveformDisplay

**Location:** `src/components/Waveform/WaveformDisplay.tsx`

Visualizes audio waveform using wavesurfer.js with playback controls.

#### Props

```typescript
interface WaveformDisplayProps {
  height?: number;           // Waveform height in pixels (default: 200)
  onMarkerPlace?: (time: number) => void;  // Callback when user clicks on waveform
}
```

#### Features

- 🎵 Real-time waveform visualization
- ▶️ Play/Pause/Stop controls
- 🔍 Zoom functionality (1-200%)
- 📏 Time ruler with grid
- 🎚️ Playhead indicator
- ⏱️ Time display (current/total)
- 🔄 AudioBuffer encoding to WAV

#### Usage

```typescript
import { WaveformDisplay } from './components/Waveform/WaveformDisplay';

<WaveformDisplay
  height={250}
  onMarkerPlace={(time) => {
    console.log('Marker at', time, 'seconds');
  }}
/>
```

#### Styling

- Dark theme with gradient background
- Color scheme: Indigo primary (#4f46e5), Cyan secondary (#06b6d4)
- Responsive with mobile support

---

### 2. MarkerSystem

**Location:** `src/components/Waveform/MarkerSystem.tsx`

Drag-drop marker system for audio tagging with visual feedback.

#### Marker Types

```typescript
type MarkerType = 'start' | 'end' | 'loop-start' | 'loop-end' | 'attack';

interface Marker {
  id: string;
  type: MarkerType;
  time: number;           // in seconds
  label: string;
  color: string;
}
```

#### Props

```typescript
interface MarkerSystemProps {
  duration: number;                      // Audio duration in seconds
  currentTime?: number;                  // Current playback position
  onMarkersChange?: (markers: Marker[]) => void;
  onMarkerClick?: (marker: Marker) => void;
}
```

#### Features

- 📍 5 marker types with distinct colors
- 🖱️ Drag-drop marker placement
- 🎯 Click on track to add markers at playhead position
- 📋 Marker list with sorting
- ✏️ Edit marker time via input
- 🗑️ Delete markers
- 🎚️ Real-time validation with boundary checking

#### Usage

```typescript
import { MarkerSystem, Marker } from './components/Waveform/MarkerSystem';

const [markers, setMarkers] = useState<Marker[]>([]);

<MarkerSystem
  duration={45.2}
  currentTime={10.5}
  onMarkersChange={(newMarkers) => setMarkers(newMarkers)}
  onMarkerClick={(marker) => console.log('Selected:', marker)}
/>
```

#### Color Scheme

- Start: Red (#ef4444)
- End: Green (#10b981)
- Loop Start/End: Blue (#3b82f6)
- Attack: Amber (#f59e0b)

---

### 3. TagPanel

**Location:** `src/components/Editor/TagPanel.tsx`

Comprehensive audio tag editor with validation and auto-detect support.

#### AudioTags Interface

```typescript
interface AudioTags {
  start: number;        // ms - Sample start position
  end: number;          // ms - Sample end position
  pitch: number;        // semitones, -12 to +12
  loop: boolean;        // Enable looping
  loopStart?: number;   // ms - Loop start point
  loopEnd?: number;     // ms - Loop end point
  rate: number;         // Playback rate multiplier (0.25 to 4)
  attack?: number;      // ms - Attack envelope
  release?: number;     // ms - Release envelope
}
```

#### Props

```typescript
interface TagPanelProps {
  tags: AudioTags;
  duration: number;
  onTagsChange?: (tags: AudioTags) => void;
  onAutoDetect?: () => Promise<AudioTags>;
  isLoading?: boolean;
}
```

#### Features

- 🎯 Start/end time editing with sliders
- 🎼 Pitch shift (-12 to +12 semitones)
- ⚙️ Playback rate (0.25x to 4x)
- 📈 Attack & release envelopes
- 🔁 Loop point configuration
- ✨ Auto-detect button (algorithm hook)
- 📊 Tag summary display
- ✅ Real-time validation

#### Usage

```typescript
import { TagPanel, AudioTags } from './components/Editor/TagPanel';

const [tags, setTags] = useState<AudioTags>({
  start: 0,
  end: 5000,
  pitch: 0,
  loop: false,
  rate: 1,
});

<TagPanel
  tags={tags}
  duration={10000}
  onTagsChange={(newTags) => setTags(newTags)}
  onAutoDetect={async () => {
    // Call your detection algorithm here
    return detectedTags;
  }}
/>
```

---

### 4. PlaybackControls

**Location:** `src/components/Common/PlaybackControls.tsx`

Audio playback control center with volume, speed, and timeline.

#### Props

```typescript
interface PlaybackControlsProps {
  duration?: number;
  onSpeedChange?: (speed: number) => void;
}
```

#### Features

- ▶️ Play/Pause/Stop buttons
- 🔊 Volume control with mute toggle
- ⏱️ Timeline scrubber
- 🎚️ Speed selection (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- ⏰ Time display (current/total)
- 📊 Volume percentage display

#### Usage

```typescript
import { PlaybackControls } from './components/Common/PlaybackControls';

<PlaybackControls
  duration={45200}
  onSpeedChange={(speed) => console.log('Speed:', speed)}
/>
```

#### State Management

Uses `useAudioStore` for state:
- `isPlaying` - Current playback state
- `volume` - Volume level (0-1)
- `currentTime` - Current playback position
- `setIsPlaying` - Control playback
- `setVolume` - Set volume
- `setCurrentTime` - Seek to time

---

### 5. ExportButton

**Location:** `src/components/Common/ExportButton.tsx`

Export audio with format selection and metadata embedding.

#### ExportOptions Interface

```typescript
interface ExportOptions {
  filename: string;              // Export filename
  format: 'op1' | 'ep133' | 'wav';  // Export format
  includeMetadata?: boolean;     // Embed tags in filename
}
```

#### Props

```typescript
interface ExportButtonProps {
  audioBuffer?: AudioBuffer;
  tags?: any;
  onExport?: (blob: Blob, filename: string) => void;
  isLoading?: boolean;
}
```

#### Features

- 📤 Multiple format support (OP-1, EP-133, WAV)
- 📝 Filename customization
- 🏷️ Metadata embedding in filename
- 📊 File size calculation
- 📋 Dialog UI with format info
- 💾 Direct browser download

#### OP-1 Filename Format

```
basename_s{start}_e{end}_p{pitch}_l{loop}.wav

Example:
kick_s0_e1500_p0_lyes.wav
pad_s500_e4000_p5_lno.wav
```

#### Usage

```typescript
import { ExportButton } from './components/Common/ExportButton';

<ExportButton
  audioBuffer={audioBuffer}
  tags={{ start: 0, end: 5000, pitch: 0, loop: false, rate: 1 }}
  onExport={(blob, filename) => console.log('Exported:', filename)}
/>
```

---

## State Management

### useAudioStore (Zustand)

```typescript
interface AudioStore {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  
  setAudioBuffer: (buffer: AudioBuffer) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  clear: () => void;
}
```

### Usage in Components

```typescript
const { audioBuffer, isPlaying, volume, setIsPlaying } = useAudioStore();
```

---

## Audio Processing Services

### `audioProcessing.ts`

#### Functions

```typescript
// Load audio from file
loadAudioFile(file: File): Promise<AudioBuffer>

// Trim audio buffer
trimAudioBuffer(buffer: AudioBuffer, startMs: number, endMs: number): AudioBuffer

// Normalize audio
normalizeAudioBuffer(buffer: AudioBuffer): AudioBuffer

// Detect peak level
detectPeakLevel(buffer: AudioBuffer): number

// Get buffer duration
getBufferDuration(buffer: AudioBuffer): number

// Encode to WAV
encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer
```

---

## Styling

### Theme Colors

```typescript
// Primary
#4f46e5 - Indigo
#7c3aed - Purple
#667eea - Violet

// Secondary
#06b6d4 - Cyan
#10b981 - Emerald
#f59e0b - Amber

// Backgrounds
#1e1e2e - Dark bg
#2d2d44 - Medium bg
#404054 - Border

// Text
#ffffff - Primary text
#e5e7eb - Secondary text
#9ca3af - Tertiary text
```

### Responsive Breakpoints

- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px
- Small Mobile: < 480px

---

## Performance Optimization

### Tips

1. **Waveform**: Limit zoom levels for performance
2. **Markers**: Use React.memo for marker items
3. **TagPanel**: Debounce input changes
4. **Audio**: Use AudioContext caching

### Build Size

- Production: 247.64 KB (76.03 KB gzip)
- Includes wavesurfer.js & tone.js

---

## Error Handling

### Components handle:

- Missing audio files
- Invalid audio formats
- Out-of-range values
- Concurrent operations
- Browser compatibility

### User feedback:

- Loading spinners
- Error messages
- Disabled controls during operations
- Tooltips for guidance

---

## Accessibility

### Features

- Semantic HTML
- ARIA labels
- Keyboard navigation
- High contrast colors
- Focus indicators
- Readable fonts

---

## Next Steps

1. **Implement auto-detection algorithms** in TagPanel
2. **Connect OP-1 import service** for sample loading
3. **Build EP-133 pattern editor**
4. **Add audio preview** with tone.js
5. **Performance testing** and optimization

---

## References

- [wavesurfer.js docs](https://wavesurfer.xyz/)
- [tone.js docs](https://tonejs.org/)
- [Zustand docs](https://github.com/pmndrs/zustand)
- [React documentation](https://react.dev/)

---

**Last Updated:** 2026-08-16  
**Status:** Production Ready (UI/UX Complete)
