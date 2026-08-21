# 🎛️ Audio Rack Modules - Development Status

**Last Updated**: 2026-08-20  
**Total Modules**: 12  
**Status**: Setup Complete ✅ | Development Ready

## État vérifié du dépôt (source de vérité)

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | ✅ 0 erreur |
| `npm run build` | ✅ passe (~640 ms) |
| Build Docker | ✅ passe (Node 20 Alpine) |
| Infra de test | ✅ vitest, `npm test` |
| Couverture de test | ✅ 238 tests, 16 fichiers |
| Serveur de dev | **HTTP simple** — voir ci-dessous |

> ⚠️ Les colonnes « Tests » ci-dessous décrivent la **cible**, pas l'existant.
> Les tests écrits portent sur les fonctions pures et sur la structure du
> source ; il n'y a aucun test de rendu React.

### Le serveur de dev est en HTTP, délibérément

Ce document a longtemps annoncé un serveur HTTPS via
`@vitejs/plugin-basic-ssl`. **Ce plugin a été retiré, et il ne faut pas le
remettre.**

Chrome accorde bien `isSecureContext` sur une origine dont le certificat est en
erreur, mais il refuse les *fonctionnalités puissantes* dessus :
`requestMIDIAccess` ne renvoyait alors aucun appareil, sans message d'erreur.
Le diagnostic a coûté une session entière.

`http://localhost:3000` est un contexte sécurisé **sans certificat** — c'est
l'exception localhost. Le sélecteur de dossier et Web MIDI y fonctionnent tous
les deux.

En revanche `http://192.168.2.59:3000` n'est pas un contexte sécurisé : ni le
sélecteur ni Web MIDI n'y sont disponibles, quoi qu'on écrive dans le code.
Voir `docs/FOLDER_PICKER.md`.

---

## Phase 1: Core Features (Week 1) 🚀

### Module 1: Patch Search & Tagging ⏱️ 2-3h
**Status**: ✅ BRANCHÉ (2026-08-21)  
**Files**:
- ✅ `PatchSearchEngine.ts` — branché dans le rack via `filtrerPatches`
- ✅ `PatchSearchEngine.test.ts` — 159 lignes
- ✅ `PatchSearchWiring.test.ts` — verrouille le câblage
- ⚠️ `PatchSearchModule.tsx` — **doublon sans consommateur**, voir ci-dessous

> Le moteur cherchait dans `audioRackStore`, un store Zustand persisté sous
> « studio-hub-audio-rack », alors que le rack garde ses patches utilisateur
> sous « studio_hub_user_patches ». Clef différente, store jamais alimenté :
> une recherche testée qui ne pouvait rien trouver, à côté de 91 patches
> d'usine qu'on ne pouvait que faire défiler.
>
> `PatchSearchEngine` est maintenant appelé directement par
> `AudioPluginRack.tsx` sur les listes réelles. **Restent en doublon sans
> consommateur** : `PatchSearchModule.tsx` (429 lignes) et
> `audioRackStore.ts` (470 lignes) — à trancher, l'interface relevant de
> l'autre terrain (cf. `docs/backup/CONTRAT_INTEGRATION.md`).

**Description**: Search and filter patches by name, tag, engine, category. Favorite/recent features.

**Next Steps**:
1. Write unit tests for PatchSearchEngine
2. Create patch-search.test.ts
3. Integrate module into AudioPluginRack
4. Test on real patches

---

### Module 2: Multi-Tap Delay Effect ⏱️ 3-4h
**Status**: 🔴 NOT STARTED (0%)  
**Files**:
- ❌ `MultiTapDelayProcessor.ts` - TODO
- ❌ `MultiTapDelayModule.tsx` - TODO
- ❌ `multi-tap-delay.test.ts` - TODO

**Description**: 2-8 tap delay with feedback, pan, and tempo sync. Real-time parameter control.

**Technical Requirements**:
- DelayNode for each tap
- FeedbackGain for each tap
- MasterMix control
- BPM tempo sync

**Next Steps**:
1. Create MultiTapDelayProcessor (reference: IMPLEMENTATION_GUIDE.md Module 2)
2. Create MultiTapDelayModule React component
3. Write unit tests
4. Integration testing

---

### Module 3: Parametric EQ ⏱️ 4-5h
**Status**: 🔴 NOT STARTED (0%)  
**Files**:
- ❌ `ParametricEQProcessor.ts` - TODO
- ❌ `FrequencyResponseGraph.tsx` - TODO
- ❌ `ParametricEQModule.tsx` - TODO
- ❌ `parametric-eq.test.ts` - TODO

**Description**: 3-band EQ (Low/Mid/High) with frequency response visualizer.

**Features**:
- Low shelf (200Hz)
- Peaking mid (1kHz)
- High shelf (5kHz)
- Real-time frequency graph
- Preset curves

**Next Steps**:
1. Implement BiquadFilter chain
2. Create frequency response canvas visualizer
3. Build React UI
4. Test frequency response accuracy

---

### Module 4: ADSR Envelope Generator ⏱️ 3-4h
**Status**: 🔴 NOT STARTED (0%)  
**Files**:
- ❌ `ADSREnvelopeProcessor.ts` - TODO
- ❌ `EnvelopeVisualizerGraph.tsx` - TODO
- ❌ `ADSREnvelopeModule.tsx` - TODO
- ❌ `adsr-envelope.test.ts` - TODO

**Description**: Full ADSR envelope with linear/exponential curves and visualizer.

**Features**:
- Attack, Decay, Sustain, Release
- Linear & exponential curves
- Envelope graph visualization
- Preset envelopes

**Next Steps**:
1. Implement ADSREnvelopeProcessor
2. Create envelope visualizer (Canvas)
3. Build curve selector UI
4. Performance testing

---

### Module 5: Arpeggiator ⏱️ 3-4h
**Status**: 🔴 NOT STARTED (0%)  
**Files**:
- ❌ `ArpeggiatorEngine.ts` - TODO
- ❌ `ArpeggiatorModule.tsx` - TODO
- ❌ `StepDisplay.tsx` - TODO
- ❌ `arpeggiator.test.ts` - TODO

**Description**: Multi-mode arpeggiator with tempo sync and octave range.

**Features**:
- 6+ modes (up, down, up-down, random, chord)
- BPM tempo sync
- Octave range (1-4)
- Gate length control
- MIDI note recording

**Next Steps**:
1. Implement ArpeggiatorEngine
2. Create playback loop with Web Audio timer
3. Build step display visualization
4. Test timing accuracy

---

## Phase 2: Advanced Sequencing (Week 1.5)

### Module 6: Step Sequencer ⏱️ 5-6h
**Status**: 🔴 NOT STARTED (0%)  
**Priority**: 🟠 MEDIUM

**Description**: 16-step grid with per-step note, velocity, duration.

---

### Module 7: LFO Generator ⏱️ 3-4h
**Status**: 🔴 NOT STARTED (0%)  
**Priority**: 🟠 MEDIUM

**Description**: Multiple LFO shapes with tempo sync and phase offset.

---

## Phase 3: Advanced Effects (Week 2)

### Module 8: Distortion Stack ⏱️ 3-4h
**Status**: 🔴 NOT STARTED (0%)  
**Priority**: 🟠 MEDIUM

**Description**: Soft/hard clipping with waveshaper and tone control.

---

### Module 9: Chorus/Flanger/Phaser ⏱️ 4-5h
**Status**: 🔴 NOT STARTED (0%)  
**Priority**: 🟠 MEDIUM

**Description**: 3-in-1 modulation effects.

---

## Phase 4: Export & Samples (Week 2)

### Module 10: Audio Export to WAV ⏱️ 4-5h
**Status**: 🔴 NOT STARTED (0%)  
**Priority**: 🔴 HIGH

**Description**: Record and export audio to WAV format.

**Features**:
- 44.1kHz, 48kHz sample rate
- 16, 24, 32-bit depth
- Duration selection
- Metadata (title, artist, tempo)

---

### Module 11: Sample Pack Creator ⏱️ 3-4h
**Status**: 🔴 NOT STARTED (0%)  
**Priority**: 🔴 HIGH

**Description**: Generate chromatic sample sets for use in DAWs.

**Features**:
- Auto-generate C3-C7 samples
- Batch export
- Folder organization
- Metadata tagging

---

### Module 12: Patch Import/Export ⏱️ 2-3h
**Status**: 🔴 NOT STARTED (0%)  
**Priority**: 🟠 MEDIUM

**Description**: Save/load patches as JSON, ZIP archives for backup.

---

## 📊 Timeline & Dependencies

```
Week 1:
  Day 1: ✅ Patch Search + ⚙️ Multi-Tap Delay
  Day 2: ⚙️ Parametric EQ + ⚙️ ADSR
  Day 3: ⚙️ Arpeggiator + Testing
  Day 4: Step Sequencer + LFO

Week 2:
  Day 5: Distortion + Chorus/Flanger/Phaser
  Day 6: Audio Export + Sample Pack Creator
  Day 7: Patch Import/Export + Final Testing
  Day 8: Performance Optimization + Documentation
```

---

## 🧪 Testing Requirements

For each module:
Le runner est installé (`npm test` → vitest). Les points ci-dessous décrivent
ce qui reste à couvrir module par module.

- [x] Unit tests (Vitest) — 238 tests sur les fonctions pures et la structure
- [ ] Integration tests
- [ ] Audio quality tests
- [ ] Performance benchmarks
- [ ] Mobile responsiveness
- [ ] Cross-browser testing — noter que Firefox/Safari ne supportent pas
      l'API File System Access, le sélecteur de dossier y est inopérant

---

## 🚀 Deployment Checklist

- [ ] All modules complete — 0/12 branchés (module 1 écrit mais pas importé)
- [ ] 90%+ test coverage — 238 tests écrits ; couverture non mesurée
- [ ] Performance profiling (<10% CPU) — jamais mesuré
- [x] Documentation alignée sur l'état réel du dépôt (2026-08-20)
- [ ] Mobile testing passed
- [ ] Accessibility testing
- [ ] Code review completed
- [x] Production build successful — `npm run build` et `docker build` passent

---

## 📝 Notes

### Architecture Decisions
- Zustand for state management (chosen)
- Web Audio API for synthesis (chosen)
- React hooks for UI (chosen)
- Canvas for visualization (chosen)

### Performance Targets
- CPU: <10%
- Memory: <50MB
- Latency: <100ms
- Frame rate: 60fps

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

**Created**: 2026-08-20  
**Last Updated**: 2026-08-20  
**Next Review**: After Module 1 completion

