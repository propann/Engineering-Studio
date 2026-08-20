# 🎛️ Studio Hub - Audio Plugin Rack

**Professional audio synthesis and effects workstation built with React + Web Audio API**

> A complete music production studio with 15 synthesis engines, 12 advanced audio modules, and sample export capabilities.

---

## 🌟 Features

### ✨ Current Features
- **15 Synthesis Engines** (Mutable Instruments Eurorack + 10 open-source synths)
- **75+ Factory Presets** organized by category
- **Real-time Web Audio API** synthesis
- **Custom Patch Manager** with localStorage persistence
- **Virtual 12-Key Piano** for live performance
- **Master Controls** (volume, detune)
- **MIDI Ready** (preparation for MIDI mapping)

### 🚀 Coming Features (2-Week Development)
- **Multi-Tap Delay Effect** - 2-8 taps with feedback and pan
- **Parametric EQ** - 3-band EQ with frequency response graph
- **ADSR Envelope Generator** - Full envelope control with curves
- **Arpeggiator** - 6+ modes with tempo sync
- **Step Sequencer** - 16-step grid for composition
- **LFO Generator** - Modulation with multiple waveforms
- **Distortion Stack** - Soft/hard clipping with waveshaper
- **Chorus/Flanger/Phaser** - Modulation effects
- **Audio Export** - WAV export (44.1kHz, 16-24-32bit)
- **Sample Pack Creator** - Auto-generate chromatic samples
- **Patch Import/Export** - Backup and sharing
- **Waveform Analyzer** - Real-time FFT visualization

---

## 📁 Project Structure

```
apps/studio-hub/
├── src/
│   ├── core/
│   │   ├── types/audio.ts           # All TypeScript interfaces
│   │   ├── store/audioRackStore.ts  # Zustand state management
│   │   └── logger.ts                # Logging utilities
│   │
│   ├── modules/                      # 12 Audio Rack modules
│   │   ├── audio-rack-01-patch-search/
│   │   │   ├── PatchSearchEngine.ts
│   │   │   ├── PatchSearchModule.tsx
│   │   │   └── types.ts
│   │   ├── audio-rack-02-delay/
│   │   ├── audio-rack-03-eq/
│   │   ├── audio-rack-04-adsr/
│   │   ├── audio-rack-05-arpeggiator/
│   │   ├── audio-rack-06-step-sequencer/
│   │   ├── audio-rack-07-lfo/
│   │   ├── audio-rack-08-distortion/
│   │   ├── audio-rack-09-modulation-fx/
│   │   ├── audio-rack-10-export/
│   │   ├── audio-rack-11-sample-pack/
│   │   └── audio-rack-12-patch-io/
│   │
│   ├── pages/
│   │   └── AudioPluginRack.tsx      # Main UI component
│   │
│   └── docs/
│       └── MODULE_DEVELOPMENT_GUIDE.md
│
├── docs/
│   ├── AUDIO_RACK_ARCHITECTURE.md
│   ├── TESTING_STRATEGY.md
│   └── PERFORMANCE_OPTIMIZATION.md
│
└── tests/
    ├── audio-rack.test.ts
    └── modules/**/*.test.ts
```

---

## 🚀 Quick Start

### Installation
```bash
cd /home/azoth/Engineering-Studio
npm install
npm install zustand  # State management
```

### Development
```bash
# Start dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Access
- Local: http://localhost:3000/
- Network: http://192.168.2.59:3000/

---

## 📚 Documentation

### Essential Reading
1. **AUDIO_RACK_ROADMAP.md** - Complete development plan (12 modules, 2 weeks)
2. **MODULE_DEVELOPMENT_GUIDE.md** - How to build new modules
3. **MODULES_STATUS.md** - Current progress tracking

### Architecture Docs
- **AUDIO_RACK_ARCHITECTURE.md** - System design and data flow
- **TESTING_STRATEGY.md** - Testing patterns and benchmarks
- **PERFORMANCE_OPTIMIZATION.md** - Audio optimization techniques

---

## 🏗️ Architecture

### State Management (Zustand)
```typescript
// Centralized audio rack state
useAudioRackStore() → {
  selectedEngine: EnginePluginType
  masterVolume: number
  delayParams: MultiTapDelayParams
  eqParams: ParametricEQParams
  adsr: ADSRParams
  arpeggiator: ArpeggiatorParams
  userPatches: PatchPreset[]
  // ... more 20+ properties
}
```

### Module Pattern
Each module follows a standard structure:
```
Module/
├── XXProcessor.ts      # Web Audio DSP logic
├── XXModule.tsx        # React UI component
├── XX.test.ts          # Unit tests
├── types.ts            # TypeScript interfaces
└── README.md           # Module documentation
```

### Audio Pipeline
```
Parameter Slider
  ↓
Store Update (Zustand)
  ↓
Module Processor (Web Audio)
  ↓
Audio Graph
  ↓
Speaker Output
```

---

## 🎛️ Synthesis Engines (15)

### Mutable Instruments Eurorack Suite
- **Plaits** - 6 synthesis models (VA, FM, Wavetable, Grain, Speech, Chord)
- **Braids** - Classic waveform synthesis
- **Rings** - Modal resonator (String, Tube, Plate)
- **Clouds** - Granular processor
- **Elements** - Modal synthesis

### Open-Source Synths
- **Dexed FM** - Yamaha DX7 emulation (8 algorithms)
- **Surge XT** - Advanced wavetable synth
- **ZynAddSubFX** - Additive synthesis
- **Helm** - Polyphonic synth with cross-modulation
- **FluidSynth** - SoundFont 2 player
- **AMSynth** - Analog modeling
- **Amy Engine** - Additive partial synthesis
- **PL Synth** - Bitcrusher/Chiptune
- **Open303** - Roland TR-303 emulation
- **Faust DSP** - Custom DSP effects

---

## 📊 Development Timeline

### Week 1 (Foundation)
| Day | Module | Time | Status |
|-----|--------|------|--------|
| 1 | Patch Search | 2-3h | 🟡 IN PROGRESS |
| 1-2 | Multi-Tap Delay | 3-4h | 🔴 READY |
| 2 | Parametric EQ | 4-5h | 🔴 READY |
| 2-3 | ADSR Envelope | 3-4h | 🔴 READY |
| 3 | Arpeggiator | 3-4h | 🔴 READY |

### Week 2 (Polish & Export)
| Day | Module | Time | Status |
|-----|--------|------|--------|
| 4 | Step Sequencer | 5-6h | 🔴 READY |
| 4 | LFO Generator | 3-4h | 🔴 READY |
| 5 | Distortion + FX | 7-9h | 🔴 READY |
| 6 | Audio Export | 4-5h | 🔴 READY |
| 6 | Sample Pack Creator | 3-4h | 🔴 READY |
| 7 | Testing & Deploy | Full Day | 🔴 READY |

**Total**: ~50-60 hours → 2 weeks intensive development

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm run test -- --coverage
# Target: 90%+ coverage
```

### Integration Tests
- Module interconnection tests
- Audio graph validation
- Patch save/load cycle

### Audio Quality Tests
- Frequency response accuracy
- Total harmonic distortion (THD)
- Signal-to-noise ratio (SNR)

### Performance Benchmarks
- CPU usage: <10%
- Memory: <50MB
- Latency: <100ms
- Frame rate: 60fps stable

---

## 🎯 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Modules Implemented | 12/12 | 1/12 (8%) |
| Test Coverage | 90%+ | TBD |
| CPU Usage | <10% | TBD |
| Audio Export | WAV 16-32bit | 0% |
| Sample Packs | Functional | 0% |
| Documentation | 100% | 60% |
| User Satisfaction | 4.8/5 | TBD |

---

## 💾 Storage & Persistence

### Local Storage
- User patches (JSON)
- Favorites & tags
- Recent selections
- UI preferences

### IndexedDB (Planned)
- Large sample files
- Extended history
- Cache for presets

### Cloud Sync (Future)
- Google Drive integration
- Collaborative editing
- Version control

---

## 🔗 Dependencies

### Core
- **React 19.2.8** - UI framework
- **Vite 8.2.1** - Build tool
- **TypeScript 5.9.3** - Type safety
- **Zustand 5.0.15** - State management

### Audio
- **Tone.js 15.1.22** - Audio utilities
- **WaveSurfer.js 7.12.11** - Waveform visualization
- **LibSampleRate.js 2.1.2** - Sample rate conversion
- **FFLate 0.8.3** - Compression

### Development
- **Vitest 0.34+** - Unit testing
- **Storybook 7+** - Component library
- **Tailwind CSS 3+** - Styling

---

## 📖 How to Build a Module

### 1. Create Type Definitions
```typescript
// types.ts
export interface MyEffectParams {
  param1: number;
  param2: string;
}
```

### 2. Implement Processor
```typescript
// MyEffectProcessor.ts
export class MyEffectProcessor implements AudioProcessor {
  process(input: AudioNode, output: AudioNode) { }
  setParameter(key: string, value: any) { }
}
```

### 3. Build React Component
```typescript
// MyEffectModule.tsx
export function MyEffectModule() {
  const store = useAudioRackStore();
  // UI code here
}
```

### 4. Write Tests
```typescript
// MyEffect.test.ts
describe('MyEffectProcessor', () => {
  it('should process audio', () => { })
})
```

See **MODULE_DEVELOPMENT_GUIDE.md** for complete template.

---

## 🔧 Troubleshooting

### Audio Not Playing
1. Check browser permissions (microphone/audio output)
2. Verify AudioContext is initialized
3. Check master volume is >0

### High CPU Usage
1. Disable unused modules
2. Lower synthesis complexity
3. Profile with Chrome DevTools

### Patch Not Saving
1. Check localStorage is enabled
2. Verify patch name is not empty
3. Check browser storage quota

---

## 🚀 Performance Tips

### Optimization Checklist
- ✅ Use Web Audio API primitives (no JavaScript synthesis)
- ✅ Offload heavy DSP to AudioWorklet
- ✅ Memoize React components
- ✅ Use Zustand selectors to minimize re-renders
- ✅ Debounce parameter updates
- ✅ Profile with DevTools regularly

### CPU Profiling
```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Performance tab
3. Record → Play note → Stop
4. Analyze CPU usage
```

---

## 📞 Support & Contribution

### Getting Help
1. Check AUDIO_RACK_ROADMAP.md
2. Read MODULE_DEVELOPMENT_GUIDE.md
3. Review MODULES_STATUS.md
4. Check Git history for similar issues

### Contributing
1. Create feature branch: `git checkout -b feature/module-name`
2. Follow commit message format
3. Write tests alongside code
4. Submit for review

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- React best practices
- Web Audio patterns

---

## 📜 License

Part of Engineering Studio project.  
All audio synthesis engines follow their respective licenses.

---

## 👨‍💻 Development Team

- **Project Manager**: Audio Rack Team
- **Lead Developer**: TBD
- **Audio Engineer**: TBD
- **QA Lead**: TBD

---

## 🗺️ Roadmap

### ✅ Phase 0: Setup (COMPLETE)
- Architecture design
- Type definitions
- Zustand store
- Module structure
- Documentation

### 🚀 Phase 1: Core Features (IN PROGRESS)
- Patch Search (WIP)
- Effects: Delay, EQ, Distortion
- Modulation: ADSR, LFO, Arpeggiator
- Timeline: Week 1

### 🔜 Phase 2: Advanced Features
- Step Sequencer
- Advanced Effects Chain
- Visualization & Analysis
- Timeline: Week 1.5

### 🌟 Phase 3: Export & Integration
- Audio Export (WAV)
- Sample Pack Creator
- Patch Import/Export
- Cloud Sync (Future)
- Timeline: Week 2

---

**Status**: Development in Progress  
**Last Updated**: 2026-08-20  
**Next Milestone**: Module 1 complete + Tests passing

🎛️ **Let's build an amazing audio studio!** 🎵✨

