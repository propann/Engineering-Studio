# 🎵 SOUND EDITOR - Code Starter Kit

## 📁 Nouvelle Structure de Dossier

```
studio-ecosystem/
├── packages/
│   ├── studio-hub/              (Existing)
│   ├── op1-studio/              (Existing)
│   ├── ep133-studio/            (Existing)
│   │
│   └── 🆕 sound-editor/          ← NEW PROJECT
│       ├── src/
│       │   ├── components/
│       │   │   ├── Waveform/
│       │   │   │   ├── WaveformDisplay.tsx
│       │   │   │   ├── MarkerSystem.tsx
│       │   │   │   └── WaveformControls.tsx
│       │   │   │
│       │   │   ├── Editor/
│       │   │   │   ├── OP1Editor.tsx
│       │   │   │   ├── EP133Editor.tsx
│       │   │   │   └── TagPanel.tsx
│       │   │   │
│       │   │   ├── Patterns/
│       │   │   │   ├── PatternGrid.tsx
│       │   │   │   ├── DrumPads.tsx
│       │   │   │   └── SequencerStep.tsx
│       │   │   │
│       │   │   └── Common/
│       │   │       ├── FileUpload.tsx
│       │   │       ├── PlaybackControls.tsx
│       │   │       └── ExportButton.tsx
│       │   │
│       │   ├── store/
│       │   │   ├── audioStore.ts
│       │   │   ├── projectStore.ts
│       │   │   └── patternStore.ts
│       │   │
│       │   ├── services/
│       │   │   ├── audioProcessing.ts
│       │   │   ├── tagCalculation.ts
│       │   │   └── fileExport.ts
│       │   │
│       │   ├── hooks/
│       │   │   ├── useWaveform.ts
│       │   │   ├── useAudio.ts
│       │   │   └── useMarkers.ts
│       │   │
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       │
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── index.html
│
└── SOUND_EDITOR_PROJECT.md (你好)
└── SOUND_EDITOR_TECH_SPEC.md
└── SOUND_EDITOR_STARTER.md
```

## 🚀 Installation

### 1. Créer le package

```bash
# Dans studio-ecosystem/
mkdir -p packages/sound-editor
cd packages/sound-editor
npm init -y
```

### 2. Installer les dépendances

```bash
npm install \
  react@19.2.8 \
  react-dom@19.2.8 \
  typescript@5.5.0 \
  zustand@5.0.15 \
  wavesurfer.js@7.0.0 \
  tone@14.8.0 \
  react-dnd@16.0.0 \
  react-rnd@10.4.1 \
  ffmpeg.wasm@0.11.0 \
  wavenet@1.0.0

npm install --save-dev \
  @vitejs/plugin-react@4.0.0 \
  vite@5.4.21 \
  @types/node@20.0.0 \
  @types/react@19.0.0 \
  @types/wavesurfer.js@6.0.0
```

### 3. Configuration de base

**package.json:**
```json
{
  "name": "sound-editor",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "zustand": "^5.0.15",
    "wavesurfer.js": "^7.0.0",
    "tone": "^14.8.0"
  }
}
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  }
})
```

## 📝 Code Starter - Composants Core

### 1. Zustand Store

**store/audioStore.ts:**
```typescript
import { create } from 'zustand';
import { AudioBuffer } from 'tone/Synth';

interface AudioState {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  
  setAudioBuffer: (buffer: AudioBuffer) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (vol: number) => void;
  clear: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  audioBuffer: null,
  isPlaying: false,
  currentTime: 0,
  volume: 1.0,
  
  setAudioBuffer: (buffer) => set({ audioBuffer: buffer }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  clear: () => set({ audioBuffer: null, isPlaying: false, currentTime: 0 }),
}));
```

**store/projectStore.ts:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Sample {
  id: string;
  name: string;
  audioBuffer: AudioBuffer;
  tags: {
    start: number;
    end: number;
    pitch: number;
    loop: boolean;
    loopStart?: number;
    loopEnd?: number;
  };
}

interface ProjectState {
  projectName: string;
  samples: Sample[];
  
  addSample: (sample: Sample) => void;
  updateSample: (id: string, tags: any) => void;
  removeSample: (id: string) => void;
  setProjectName: (name: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projectName: 'Untitled',
      samples: [],
      
      addSample: (sample) => 
        set((state) => ({
          samples: [...state.samples, sample],
        })),
      
      updateSample: (id, tags) =>
        set((state) => ({
          samples: state.samples.map((s) =>
            s.id === id ? { ...s, tags } : s
          ),
        })),
      
      removeSample: (id) =>
        set((state) => ({
          samples: state.samples.filter((s) => s.id !== id),
        })),
      
      setProjectName: (name) => set({ projectName: name }),
    }),
    {
      name: 'sound-editor-project',
    }
  )
);
```

### 2. Service: Audio Processing

**services/audioProcessing.ts:**
```typescript
export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioContext.decodeAudioData(arrayBuffer);
}

export function trimAudioBuffer(
  buffer: AudioBuffer,
  startMs: number,
  endMs: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const startSample = (startMs / 1000) * sampleRate;
  const endSample = (endMs / 1000) * sampleRate;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const trimmed = audioContext.createBuffer(
    buffer.numberOfChannels,
    endSample - startSample,
    sampleRate
  );
  
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    trimmed.getChannelData(ch).set(data.slice(startSample, endSample));
  }
  
  return trimmed;
}

export function normalizeAudioBuffer(buffer: AudioBuffer): AudioBuffer {
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
  
  return buffer;
}
```

### 3. Composant: OP-1 Editor

**components/Editor/OP1Editor.tsx:**
```typescript
import React, { useState } from 'react';
import { useAudioStore } from '../../store/audioStore';
import { WaveformDisplay } from '../Waveform/WaveformDisplay';
import { MarkerSystem } from '../Waveform/MarkerSystem';
import { TagPanel } from './TagPanel';
import { FileUpload } from '../Common/FileUpload';

export function OP1Editor() {
  const { audioBuffer } = useAudioStore();
  const [tags, setTags] = useState({
    start: 0,
    end: 0,
    pitch: 0,
    loop: false,
  });

  return (
    <div className="op1-editor">
      <header>
        <h1>🎛️ OP-1 Sound Editor</h1>
      </header>

      <main>
        {!audioBuffer ? (
          <FileUpload />
        ) : (
          <div className="editor-content">
            <div className="waveform-section">
              <WaveformDisplay audioBuffer={audioBuffer} />
              <MarkerSystem tags={tags} onTagsChange={setTags} />
            </div>

            <div className="control-section">
              <TagPanel tags={tags} onTagsChange={setTags} />
            </div>
          </div>
        )}
      </main>

      <style>{`
        .op1-editor {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
          padding: 2rem;
        }

        .editor-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .waveform-section {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }

        .control-section {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }

        @media (max-width: 1200px) {
          .editor-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
```

### 4. Composant: Waveform Display

**components/Waveform/WaveformDisplay.tsx:**
```typescript
import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformDisplayProps {
  audioBuffer: AudioBuffer;
}

export function WaveformDisplay({ audioBuffer }: WaveformDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !audioBuffer) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgb(200, 100, 255)',
      progressColor: 'rgb(100, 200, 255)',
      height: 300,
      responsive: true,
    });

    wavesurferRef.current = wavesurfer;

    // Load buffer
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Wavesurfer expects PCM data
    wavesurfer.loadDecodedBuffer(audioBuffer);

    return () => {
      wavesurfer.destroy();
    };
  }, [audioBuffer]);

  return (
    <div className="waveform-display">
      <div ref={containerRef} className="wavesurfer-container"></div>
      <style>{`
        .waveform-display {
          width: 100%;
        }

        .wavesurfer-container {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
```

## 🎯 Next Steps

1. **Créer le projet:** `npm init` + dépendances
2. **Copier les composants:** Starter code ci-dessus
3. **Tester le waveform:** Valider wavesurfer.js
4. **Implémenter markers:** Système drag-drop
5. **Tests:** Audio processing

## 📚 Ressources

- [Wavesurfer.js Docs](https://wavesurfer-js.org/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Tone.js Docs](https://tonejs.org/)

---

**Status:** 🚀 **READY TO BUILD**
