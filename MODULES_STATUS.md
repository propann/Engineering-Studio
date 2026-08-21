# 🎛️ Audio Rack Modules - Development Status

**Last Updated**: 2026-08-20  
**Total Modules**: 12  
**Status**: Setup Complete ✅ | Development Ready

## Où en sont les douze modules

| | Module | État |
|---|---|---|
| 1 | Patch Search & Tagging | ✅ branché — recherche, favoris, étiquettes |
| 2 | Multi-Tap Delay | 🟡 délai simple + SYNC au tempo, pas encore multi-prises |
| 3 | Parametric EQ | 🟢 trois bandes livrées, sans le graphe |
| 4 | ADSR Envelope | 🟡 l'enveloppe existe, les commandes non |
| 5 | Arpeggiator | ✅ livré — **dans le rack MIDI**, 11 gammes, 6 motifs |
| 6 | Step Sequencer | 🔴 |
| 7 | LFO Generator | 🔴 |
| 8 | Distortion Stack | 🟢 saturation douce et par repliement, dans le rack d'effets |
| 9 | Chorus/Flanger/Phaser | 🟡 chorus livré, flanger et phaser à faire |
| 10 | Audio Export | ✅ livré, au-delà du plan (AIFF + vérification) |
| 11 | Sample Pack Creator | ✅ livré — pack chromatique C3–C7 |
| 12 | Patch Import/Export | 🔴 |

**Quatre acquis qui ne figuraient dans aucun module** et qui conditionnaient
tout le reste :

- **Les moteurs sont indépendants du contexte audio.** `construireVoix` reçoit
  son contexte au lieu d'aller le chercher. C'est ce qui permet le rendu hors
  ligne — donc l'export — et la superposition.
- **Les patches se superposent**, chacun avec ses propres réglages et son
  moteur, et l'oscilloscope trace une onde par couche.
- **Le MIDI est partagé.** `input.onmidimessage` est une propriété : un seul
  gestionnaire à la fois. Cinq composants l'écrivaient et s'effaçaient
  mutuellement. `packages/midi-dispatch` diffuse à plusieurs auditeurs, et un
  test structurel interdit toute écriture directe.
- **Le rack s'ouvre dans les deux studios.** Onglet RACK côté EP‑133, menu vue →
  « Afficher Rack Audio » côté OP‑1. Le panneau OP‑1 part replié : le rack monte
  un AudioContext et pose ses écouteurs clavier sur `window`.
- **Trois racks, trois métiers — et chacun porte son interface.** Le **rack
  MIDI** produit les notes (arpégiateur, 29 gammes, `packages/musique`). Le
  **rack de moteurs** en fait du son. Le **rack d'effets** le traite
  (`core/audio/effets.ts` pour la chaîne, `racks/RackEffets.tsx` pour ses
  commandes). C'est ce qui décide de l'emplacement d'une fonction : un
  arpégiateur posé dans le rack de moteurs n'arpégerait que lui.

  La règle vaut aussi pour l'interface. Tant que les 94 lignes de commandes
  d'effets vivaient au milieu du rack de moteurs, la séparation n'existait qu'à
  moitié — et rien n'empêchait la suivante d'y retourner. Un test l'interdit
  maintenant : aucun `fx-groupe` ne peut réapparaître dans le rack de moteurs.

  Les racks d'interface sont **contrôlés, pas autonomes** : ils reçoivent leurs
  valeurs et rendent leurs changements. Les patches écrivent les réglages
  d'effets, donc le rack de moteurs doit pouvoir les pousser vers le bas ; un
  composant qui posséderait son état afficherait l'ancien réglage après un
  changement de patch. Même forme pour `SelecteurGamme`.
- **Le delay se cale sur le tempo du studio hôte** (bouton SYNC). Le rack n'a pas
  de transport à lui — rien à démarrer ni à arrêter — donc c'est la seule
  synchronisation qui ait un sens aujourd'hui.

---

## État vérifié du dépôt (source de vérité)

| Contrôle | Résultat |
|---|---|
| `npm run typecheck` | ✅ 0 erreur |
| `npm run build` | ✅ passe (~640 ms) |
| Build Docker | ✅ passe (Node 20 Alpine) |
| Infra de test | ✅ vitest, `npm test` |
| Couverture de test | ✅ 515 tests, 26 fichiers |
| Modules livrés | 4 sur 12 · 2 partiels |
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
**Status**: 🟡 PARTIEL (2026-08-21) — delai simple, pas multi-tap  

Un delai avec reinjection est livre dans le rack (`construireEffets`) : melange,
temps, retour, boucle amortie par un passe-bas. La reinjection est bornee a 0,85
pour qu'un curseur a 100 % ne parte pas en larsen.

**Ce qui manque pour le module complet** : plusieurs prises (2 a 8), leur
panoramique, et la synchronisation au tempo. Le delai actuel est mono-prise.

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
**Status**: 🟢 LIVRE (2026-08-21) — sans le graphe de reponse  

Egaliseur trois bandes dans le rack : lowshelf a 220 Hz, peaking a 1,2 kHz,
highshelf a 5,2 kHz, ±18 dB chacune. Applique apres les moteurs, donc a la
superposition entiere, et traverse le rendu hors ligne comme le jeu.

**Ce qui manque** : le visualiseur de reponse en frequence, et les courbes
predefinies.

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
**Status**: 🟡 PARTIEL — l'enveloppe existe, pas le module  

Une enveloppe ADSR native est en place dans le moteur depuis le 2026-08-20
(`construireVoix`), avec des rampes exponentielles qui ne passent jamais par
zero. C'est elle qui supprime les clics, et elle est reutilisee par le rendu
hors ligne.

**Ce qui manque** : des commandes pour la regler, le visualiseur de courbe, et
le choix lineaire/exponentiel. Les valeurs sont aujourd'hui fixes.

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
**Status**: ✅ LIVRE (2026-08-21) — et au-dela du plan  

Le rack fabrique des samples : rendu hors ligne, encodage, ecriture verifiee.

Deux differences avec le plan d'origine, dans le bon sens :
- **AIFF en plus du WAV**, parce que c'est le format que l'OP-1 lit reellement
  pour ses patches. Lui ecrire du WAV produirait un fichier qu'elle ignore.
- **Ecriture RELUE et comparee par empreinte**. Un write() qui rend la main ne
  garantit pas que les octets sont sur le support.

Le rendu est hors ligne, donc plus rapide que le temps reel — indispensable pour
un pack. Il reutilise `construireVoix`, le meme code moteur que pour jouer : un
second chemin audio aurait diverge des la premiere evolution.

**Ce qui manque** : le choix de la profondeur (24 et 32 bits), et les
metadonnees de titre.

**Priority**: 🔴 HIGH

**Description**: Record and export audio to WAV format.

**Features**:
- 44.1kHz, 48kHz sample rate
- 16, 24, 32-bit depth
- Duration selection
- Metadata (title, artist, tempo)

---

### Module 11: Sample Pack Creator ⏱️ 3-4h
**Status**: ✅ LIVRE (2026-08-21)  

Bouton « PACK C3–C7 » : 49 notes chromatiques rendues d'affilee dans un
sous-dossier au nom du patch. Chaque fichier est relu et verifie DANS la boucle,
et l'erreur dit combien etaient deja ecrits — « ca a plante » sur 49 fichiers ne
dit pas s'il faut tout refaire ou completer.

**A savoir** : ce pack ne va PAS sur l'OP-1. Son echantillonneur synthe prend un
fichier UNIQUE qu'il transpose, et un kit drum un fichier unique portant 24
marqueurs. C'est un format de bibliotheque, pour les DAW et les studios.

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

- [x] Unit tests (Vitest) — 515 tests sur les fonctions pures et la structure
- [ ] Integration tests
- [ ] Audio quality tests
- [ ] Performance benchmarks
- [ ] Mobile responsiveness
- [ ] Cross-browser testing — noter que Firefox/Safari ne supportent pas
      l'API File System Access, le sélecteur de dossier y est inopérant

---

## 🚀 Deployment Checklist

- [ ] All modules complete — 0/12 branchés (module 1 écrit mais pas importé)
- [ ] 90%+ test coverage — 515 tests écrits ; couverture non mesurée
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

