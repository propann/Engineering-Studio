# 🎛️ Audio Rack Development Roadmap

> **Lot spécialisé.** La feuille de route principale est [`docs/ROADMAP.md`](docs/ROADMAP.md) ;
> ce document en détaille le plan du rack audio. En cas de contradiction, la principale gagne.

**Status**: Completed & Delivered ✅ (12/12 Modules branchés & testés)  
**Architecture**: 3 Racks Découplés (Rack Moteurs DSP, Rack Effets Audio, Rack MIDI/Séquenceur)  
**Goal**: Complete music production studio with sample export and physical machine bridges

---

## 🎯 PROJECT VISION

Transform Studio Hub into a **complete DAW** (Digital Audio Workstation) where users can:
- ✅ Synthesize sounds from 15+ engines
- ✅ Apply professional audio effects (delay, EQ, distortion, modulation)
- ✅ Create sequences and patterns (arpeggiator, step sequencer, 30 scales)
- ✅ Modulate parameters (ADSR, LFO, pan, filters)
- ✅ Save/manage unlimited custom patches and layers
- ✅ **Export audio to WAV & AIFF** for use in other DAWs or OP-1 / EP-133
- ✅ **Create sample packs** for instruments (chromatic C3–C7)
- ✅ Document and test everything with automated test suites

> ## 📌 Synthèse de validation (12/12 modules livrés)
>
> Tous les modules sont intégrés, branchés et validés par les suites de tests unitaires et structurels :
> - **Module 1 : Preset Search & Tagging** — ✅ Branché (`AudioPluginRack.tsx`), tags, favoris, recherche
> - **Module 2 : Multi-Tap Delay** — ✅ Livré (`effets.ts`, `RackEffets.tsx`), 1 à 8 taps, ping-pong, SYNC tempo
> - **Module 3 : Parametric EQ** — ✅ Livré (`effets.ts`, `RackEffets.tsx`), 3 bandes, visualisation de courbe
> - **Module 4 : ADSR Envelope** — ✅ Livré (`PanneauEnveloppe.tsx`, `enveloppe.ts`), 4 segments, canvas interactif
> - **Module 5 : Arpeggiator** — ✅ Livré (`packages/musique/arpege.ts`, `RackMidi.tsx`), 30 gammes, 6 motifs
> - **Module 6 : Step Sequencer** — ✅ Livré (`packages/musique/sequenceur.ts`), 1 à 32 pas, 4 sens, quantifié
> - **Module 7 : LFO Generator** — ✅ Livré (`PanneauLfo.tsx`), trémolo, filtre, synchro tempo
> - **Module 8 : Distortion Stack** — ✅ Livré (`effets.ts`), 3 types d'écrêtage (doux, dur, repliement)
> - **Module 9 : Chorus / Flanger / Phaser** — ✅ Livré (`effets.ts`), 3 modes modulation
> - **Module 10 : Audio Export** — ✅ Livré (`packages/audio-formats`), encodage WAV / AIFF
> - **Module 11 : Sample Pack Creator** — ✅ Livré (`packages/audio-formats`), packs chromatiques C3–C7
> - **Module 12 : Patch Import/Export** — ✅ Livré, formats JSON, OP-1 snapshot et archives ZIP

---

## 📋 PHASE 1: CORE EFFECTS & SEQUENCING

### Module 1: Preset Search & Tagging
**Files**: `AudioPluginRack.tsx`, `patchMeta.ts`
- [x] PatchSearchEngine logic (recherche, tags, favoris, récents)
- [x] Intégration complète dans `AudioPluginRack.tsx`
- [x] Filtrage par moteur et catégories

---

### Module 2: Multi-Tap Delay Effect
**Files**: `core/audio/effets.ts`, `racks/RackEffets.tsx`
- [x] DelayProcessor Web Audio (1 à 8 taps)
- [x] Panoramique stéréo en renvoi de balle (ping-pong)
- [x] Tempo sync (BPM) avec studio hôte
- [x] Contrôles UI réactifs et tests unitaires

---

### Module 3: Parametric EQ
**Files**: `core/audio/effets.ts`, `racks/RackEffets.tsx`
- [x] EQ 3 bandes (Basses, Médiums, Aigus)
- [x] Filtres shelving et peaking
- [x] Visualisation et courbes prédéfinies

---

### Module 4: ADSR Envelope Generator
**Files**: `racks/PanneauEnveloppe.tsx`, `core/audio/enveloppe.ts`
- [x] Processeur ADSR (Attack, Decay, Sustain, Release)
- [x] Rampes exponentielles et linéaires
- [x] Visualisation interactive et presets (Pad, Pluck, Lead, Perc)

---

### Module 5: Arpeggiator
**Files**: `packages/musique/arpege.ts`, `RackMidi.tsx`
- [x] Modes d'arpège (Up, Down, Up-Down, Aléatoire, Accord)
- [x] Synchro d'horloge 24 PPQN / BPM
- [x] 30 gammes musicales tempérées

---

## 🎵 PHASE 2: ADVANCED SEQUENCING & MODULATION

### Module 6: Step Sequencer
**Files**: `packages/musique/sequenceur.ts`
- [x] Éditeur de grille 1 à 32 pas
- [x] Paramètres par pas : note, vélocité, gate
- [x] Lecture avant, arrière, pendulaire, aléatoire
- [x] Quantification sur gammes

---

### Module 7: LFO Generator
**Files**: `racks/PanneauLfo.tsx`
- [x] Formes d'ondes (sinus, triangle, carré, rampe, S&H)
- [x] Synchronisation au tempo
- [x] Routage vers volume (trémolo) et coupure de filtre

---

## 🎚️ PHASE 3: ADVANCED EFFECTS

### Module 8: Distortion Stack
**Files**: `core/audio/effets.ts`, `racks/RackEffets.tsx`
- [x] Soft clipping (tanh)
- [x] Hard clipping
- [x] Wavefolding (repliement d'onde)
- [x] Contrôles Drive et Tone

---

### Module 9: Chorus/Flanger/Phaser
**Files**: `core/audio/effets.ts`, `racks/RackEffets.tsx`
- [x] Sélecteur 3-en-1 avec modulation LFO
- [x] Contrôle de profondeur, vitesse et feedback
- [x] Élargissement stéréo

---

## 💾 PHASE 4: EXPORT & SAMPLES

### Module 10: Audio Export to WAV & AIFF
**Files**: `packages/audio-formats/encode.ts`, `packages/audio-formats/aiff.ts`
- [x] Rendu hors-ligne via OfflineAudioContext
- [x] Export WAV et AIFF 16-bit / 44.1 kHz
- [x] Vérification d'intégrité et téléchargement

---

### Module 11: Sample Pack Creator
**Files**: `packages/audio-formats/samplePack.ts`
- [x] Génération chromatique automatique (C3–C7)
- [x] Export par lots et nommage standardisé

---

### Module 12: Patch Import/Export
**Files**: `packages/audio-formats/op1Patch.ts`, `core/audio/importPatch.ts`
- [x] Format patch JSON et extraction de snapshots OP-1 / EP-133
- [x] Export d'archives ZIP consolidées
- [x] Validation de schéma et tolérance aux erreurs

---

## 📊 FILE STRUCTURE

```
apps/studio-hub/
├── src/
│   ├── modules/
│   │   ├── audio-rack-01-patch-search/
│   │   │   ├── PatchSearchEngine.ts
│   │   │   ├── PatchSearchModule.tsx
│   │   │   ├── patch-search.test.ts
│   │   │   └── types.ts
│   │   ├── audio-rack-02-delay/
│   │   │   ├── MultiTapDelayProcessor.ts
│   │   │   ├── MultiTapDelayModule.tsx
│   │   │   ├── multi-tap-delay.test.ts
│   │   │   └── types.ts
│   │   ├── audio-rack-03-eq/
│   │   │   ├── ParametricEQProcessor.ts
│   │   │   ├── FrequencyResponseGraph.tsx
│   │   │   ├── ParametricEQModule.tsx
│   │   │   ├── parametric-eq.test.ts
│   │   │   └── types.ts
│   │   ├── audio-rack-04-adsr/
│   │   │   ├── ADSREnvelopeProcessor.ts
│   │   │   ├── EnvelopeVisualizerGraph.tsx
│   │   │   ├── ADSREnvelopeModule.tsx
│   │   │   ├── adsr-envelope.test.ts
│   │   │   └── types.ts
│   │   ├── audio-rack-05-arpeggiator/
│   │   │   ├── ArpeggiatorEngine.ts
│   │   │   ├── ArpeggiatorModule.tsx
│   │   │   ├── StepDisplay.tsx
│   │   │   ├── arpeggiator.test.ts
│   │   │   └── types.ts
│   │   ├── audio-rack-06-step-sequencer/
│   │   ├── audio-rack-07-lfo/
│   │   ├── audio-rack-08-distortion/
│   │   ├── audio-rack-09-modulation-fx/
│   │   ├── audio-rack-10-export/
│   │   ├── audio-rack-11-sample-pack/
│   │   └── audio-rack-12-patch-io/
│   │
│   ├── core/
│   │   ├── audio/
│   │   │   ├── AudioContextManager.ts
│   │   │   ├── EffectsChain.ts
│   │   │   ├── dsp-helpers.ts
│   │   │   └── wav-encoder.ts
│   │   │
│   │   ├── store/
│   │   │   ├── audioRackStore.ts (Zustand)
│   │   │   └── patchStore.ts
│   │   │
│   │   └── types/
│   │       └── audio.ts (all interfaces)
│   │
│   ├── pages/
│   │   ├── AudioPluginRack.tsx (MAIN COMPONENT - refactored)
│   │   └── audio-plugin-rack.css
│   │
│   ├── components/
│   │   └── common/
│   │       ├── Slider.tsx
│   │       ├── Toggle.tsx
│   │       ├── Knob.tsx
│   │       └── Visualizer.tsx
│   │
│   └── App.tsx
│
├── docs/
│   ├── AUDIO_RACK_ARCHITECTURE.md
│   ├── MODULE_DEVELOPMENT_GUIDE.md
│   ├── TESTING_STRATEGY.md
│   ├── PERFORMANCE_OPTIMIZATION.md
│   └── API_REFERENCE.md
│
└── tests/
    ├── audio-rack.integration.test.ts
    └── sample-export.test.ts
```

---

## 🏗️ ARCHITECTURE IMPROVEMENTS

### Before (Current State)
```typescript
// All state in one component
function AudioPluginRack() {
  const [plaitsEngine, setPlaitsEngine] = useState(...)
  const [dxAlgorithm, setDxAlgorithm] = useState(...)
  const [surgeMorph, setSurgeMorph] = useState(...)
  // 50+ useState hooks...
  
  // DSP logic mixed with UI
  const playPluginNote = () => { /* 300+ lines */ }
}
```

### After (Proposed)
```typescript
// 1. Zustand store for state
const useAudioRackStore = create((set) => ({
  selectedEngine: 'mi_plaits',
  masterVolume: 85,
  patches: [],
  // ...
}))

// 2. Separate processor classes
class MultiTapDelayProcessor { }
class ParametricEQProcessor { }
class ADSREnvelopeProcessor { }

// 3. Effects chain manager
class EffectsChain {
  private processors: AudioProcessor[] = []
  add(processor: AudioProcessor) { }
  process(input: AudioNode, output: AudioNode) { }
}

// 4. Clean UI components
function AudioPluginRack() {
  const { selectedEngine, masterVolume } = useAudioRackStore()
  return (
    <div>
      <PatchSearchModule />
      <EngineSelector />
      <MultiTapDelayModule />
      <ParametricEQModule />
      <ADSREnvelopeModule />
      <ArpeggiatorModule />
      <ExportModule />
    </div>
  )
}
```

---

## ✅ DEVELOPMENT CHECKLIST

### Week 1 - Core Features
- [ ] Module 1: Patch Search (2-3h)
- [ ] Module 2: Multi-Tap Delay (3-4h)
- [ ] Module 3: Parametric EQ (4-5h)
- [ ] Module 4: ADSR Envelope (3-4h)
- [ ] Module 5: Arpeggiator (3-4h)
- [ ] Create Zustand store
- [ ] Refactor AudioPluginRack component
- [ ] Integration testing

### Week 2 - Export & Polish
- [ ] Module 10: Audio Export (4-5h)
- [ ] Module 11: Sample Pack Creator (3-4h)
- [ ] Module 12: Patch Import/Export (2-3h)
- [ ] Performance profiling & optimization
- [ ] Documentation
- [ ] E2E testing
- [ ] Deploy to staging

---

## 📖 DOCUMENTATION TO CREATE

### 1. **MODULE_DEVELOPMENT_GUIDE.md**
- Template for new modules
- Web Audio API patterns
- React component patterns
- Testing strategies

### 2. **AUDIO_RACK_ARCHITECTURE.md**
- System overview
- Data flow diagrams
- Component relationships
- Performance considerations

### 3. **API_REFERENCE.md**
- All public APIs
- Type definitions
- Usage examples
- Integration guide

### 4. **TESTING_STRATEGY.md**
- Unit test patterns
- Integration test setup
- Audio quality testing
- Performance benchmarks

### 5. **PERFORMANCE_OPTIMIZATION.md**
- AudioWorklet usage
- Web Workers for analysis
- Memory management
- CPU profiling guide

---

## 🚀 DEPLOYMENT STRATEGY

### Phase 1: Development (Local)
```bash
npm run dev
# Test each module in isolation
```

### Phase 2: Staging (Pre-production)
```bash
npm run build
npm run preview
# Full integration testing
```

### Phase 3: Production
```bash
git push origin main
# Auto-deploy via CI/CD
```

---

## 📊 SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Modules Implemented | 12 | 0 |
| Unit Test Coverage | 90% | 0% |
| Integration Tests | 15+ | 0 |
| Performance (CPU) | <10% | N/A |
| Sample Export Quality | 44.1kHz, 16-bit | N/A |
| Documentation | 100% | 0% |
| User Satisfaction | 4.8/5 | N/A |

---

## 🔄 VERSION CONTROL STRATEGY

### Branch Structure
```
main (production)
├── develop (staging)
│   ├── feature/patch-search (2-3h)
│   ├── feature/multi-tap-delay (3-4h)
│   ├── feature/parametric-eq (4-5h)
│   ├── feature/adsr-envelope (3-4h)
│   ├── feature/arpeggiator (3-4h)
│   ├── feature/audio-export (4-5h)
│   ├── feature/sample-pack-creator (3-4h)
│   └── feature/patch-import-export (2-3h)
```

### Commit Message Format
```
feat: Add Multi-Tap Delay effect module

- Implement DelayProcessor class
- Add React UI component
- Support 2-8 tap configuration
- Add tempo sync feature
- Write unit tests

Closes #123
```

---

## 💡 QUICK WIN PRIORITIES

### Day 1 Priority
1. **Patch Search** (2-3h) - Foundation for patch management
2. **Multi-Tap Delay** (3-4h) - First effect adds immediate value

### Day 2-3 Priority
3. **Parametric EQ** (4-5h) - Essential mixing tool
4. **ADSR Envelope** (3-4h) - Sound design
5. **Arpeggiator** (3-4h) - Sequencing/performance

### Day 4-5 Priority
6. **Audio Export** (4-5h) - Enables sample creation workflow
7. **Sample Pack** (3-4h) - Extends utility
8. **Patch I/O** (2-3h) - Sharing/backup

---

## 🎯 INTEGRATION POINTS

### With Existing Studio Hub Features
- **Sound Library Panel**: Browse exported samples
- **Vault Panel**: Store sample packs
- **Audio Bridge**: Route audio between modules
- **Theme Editor**: Style new components

### Export Destinations
- **Local Download**: WAV files
- **Email**: Send to collaborators
- **Cloud Storage**: (Future) Google Drive sync
- **Other DAWs**: Import as samples

---

## 📝 NOTES FOR TEAM

- All modules should follow same UI/UX pattern
- Use Tailwind CSS for styling
- Implement error boundaries
- Add loading states for long operations
- Persist state to localStorage + IndexedDB
- Test on mobile (iPad + tablet)
- Document parameter ranges & defaults

---

**Created**: 2026-08-20  
**Last Updated**: 2026-08-20  
**Next Review**: After Module 1 completion

