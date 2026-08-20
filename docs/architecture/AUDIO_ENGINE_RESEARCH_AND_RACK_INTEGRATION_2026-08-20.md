# Recherche moteurs audio et préparation d’intégration du Rack

**Date :** 20 août 2026  
**Statut :** étude préparatoire — aucune nouvelle dépendance ni intégration de moteur dans cette étape  
**Périmètre :** Audio Plugin Rack, Sound Editor, OP-1 Studio, EP-133 Studio et `@studio-hub/midi-bridge`

## 1. Décision de principe

Le Rack ne doit pas ajouter un moteur audio isolé par page. Il doit conserver :

1. un seul transport musical partagé ;
2. un seul graphe audio par contexte utilisateur ;
3. des moteurs spécialisés branchés derrière un contrat commun ;
4. une séparation stricte entre audio temps réel, analyse offline et interface React ;
5. des événements MIDI et transport indépendants de l’implémentation d’un moteur.

La prochaine évolution doit donc commencer par un **Audio/Rack Runtime** partagé, puis brancher les fonctions arpéggiateur, quantification, analyse BPM et time-stretch comme modules de ce runtime.

## 2. Architecture actuelle vérifiée

### 2.1 Hôte et navigation

- `apps/studio-hub/src/App.tsx` est le routeur applicatif.
- `AudioPluginRack.tsx` est la page hôte du rack.
- OP-1 Studio et EP-133 Studio sont importés dans le Hub, pas déployés comme services séparés.
- Le rack est actuellement une grande page React qui contient encore la sélection des moteurs, une partie du graphe Web Audio, les presets et de nombreux contrôles.

### 2.2 État du rack

`apps/studio-hub/src/core/store/audioRackStore.ts` centralise déjà :

- moteur et patch sélectionnés ;
- paramètres moteur ;
- volume et detune maître ;
- ADSR, LFO, delay, EQ et distorsion ;
- paramètres d’arpégiateur ;
- persistance Zustand ;
- export/import de l’état.

Point important : l’état possède des paramètres d’arpégiateur, mais le code ne fournit pas encore un transport musical audio partagé ni un scheduler Tone.js. Le paramètre existe donc avant le moteur d’exécution.

### 2.3 Audio actuel

- `AudioPluginRack.tsx` crée et conserve son propre `AudioContext`.
- Les 15 moteurs sont sélectionnés par un type `EnginePluginType` et une logique de branchement dans la page.
- `apps/studio-hub/src/core/audio/dsp.ts` contient des briques Web Audio pures/testables : impulsion, waveshaper, pulse wave et courbes DSP.
- `packages/audio-bridge` fournit surtout lecture de headers WAV, analyse basique, pics de waveform et suggestions de trim/normalisation.
- Le dépôt déclare Tone.js dans `package.json`, mais le runtime du rack n’est pas encore construit autour de `Tone.Transport`.

### 2.4 MIDI et transport existants

`MidiSyncPanel.tsx` et `@studio-hub/midi-bridge` fournissent déjà :

- messages Hub de transport ;
- Start / Stop ;
- BPM ;
- horloge MIDI 24 PPQN ;
- routage de notes ;
- PANIC ;
- diffusion vers les studios par événements/fenêtres et `postMessage`.

Ce transport est utile pour les machines physiques, mais il ne doit pas être confondu avec l’horloge audio sample-accurate du navigateur. La future architecture doit maintenir les deux sous un même état musical, avec deux adaptateurs : `WebAudioTransportAdapter` et `MidiClockAdapter`.

## 3. Recherches et comparaison

### 3.1 Tone.js — transport, séquenceur et instruments

Tone.js est le meilleur premier candidat pour le runtime musical du Rack, parce qu’il est déjà déclaré dans le projet et expose :

- `Transport` comme horloge maître ;
- scheduling de callbacks sur une timeline musicale ;
- `Part`, `Sequence`, `Pattern` et `Loop` ;
- BPM et rampes de tempo ;
- instruments et samplers compatibles avec le graphe Web Audio.

Tone transmet au callback le temps audio exact de l’événement. Les notes doivent donc être déclenchées avec ce temps, jamais avec `setTimeout`, `setInterval` ou `requestAnimationFrame`.

**Usage recommandé dans Engineering Studio :**

- `Tone.Transport` reste un adaptateur interne, pas l’API publique de l’application ;
- l’API publique du Hub utilise nos types `TransportState`, `MusicalPosition` et `ScheduledNote` ;
- `Tone.Part` sert aux patterns et `Tone.Sequence` aux grilles régulières ;
- les moteurs existants peuvent rester en Web Audio natif et recevoir le même timestamp audio.

Sources : [Tone.Transport](https://github.com/Tonejs/Tone.js/wiki/Transport), [Tone.Part](https://tonejs.github.io/docs/15.1.22/classes/Part.html), [Tone.Sequence](https://tonejs.github.io/docs/15.1.22/classes/Sequence.html).

### 3.2 Web Audio API et AudioWorklet — socle temps réel

Web Audio reste le socle bas niveau. `AudioWorklet` déporte les processeurs custom sur le thread audio, ce qui convient aux traitements qui doivent rester stables sous charge :

- time-stretch ;
- analyse ou détection par blocs ;
- effets DSP ;
- moteurs WASM ;
- ponts vers des plugins web.

Les messages React ne doivent pas piloter directement chaque échantillon. React commande l’état ; le runtime audio applique les paramètres avec `AudioParam`, événements horodatés ou messages de bloc.

Sources : [MDN AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet), [W3C Web Audio API](https://www.w3.org/TR/webaudio-1.0/).

### 3.3 SoundTouchJS — tempo sans changement de hauteur

SoundTouchJS est le candidat principal pour le recollage de boucles et de samples :

- time-stretch et pitch indépendant ;
- intégration `AudioWorklet` ;
- réglages WSOLA ;
- paramètres automatisables ;
- contrôle du pitch en semitones.

Règle d’intégration : le ratio de tempo doit être calculé à partir des BPM détecté/cible, puis appliqué au lecteur et au processeur. Il faudra également documenter les limites de qualité : les grands écarts de tempo et les matériaux polyphoniques produisent davantage d’artefacts.

SoundTouchJS recommande de synchroniser le `playbackRate` de la source avec celui du nœud de traitement et de désactiver la correction de pitch native d’un élément média quand SoundTouch gère lui-même la compensation.

Source : [SoundTouchJS AudioWorklet](https://github.com/cutterbl/SoundTouchJS/tree/master/packages/audio-worklet), [SoundTouchJS Core](https://github.com/cutterbl/SoundTouchJS/tree/master/packages/core).

**Licence à vérifier avant dépendance runtime :** le dépôt SoundTouchJS actuel indique MPL-2.0 pour sa réécriture récente. La version exacte et le sous-paquet retenu devront être figés dans un registre de licences.

### 3.4 Essentia.js — analyse BPM, beat grid et caractéristiques musicales

Essentia.js est adapté à l’analyse offline ou quasi temps réel dans le navigateur grâce à WebAssembly. Les fonctions pertinentes pour le Rack sont :

- estimation BPM ;
- ticks et positions de beats ;
- estimation de tempo sur boucles ;
- détection d’onsets/transitoires ;
- tonalité, chroma, pitch et loudness ;
- extraction de métadonnées musicales.

Essentia.js ne doit pas être placé dans le chemin audio critique du synthé. Il doit analyser un `AudioBuffer` ou des fenêtres préparées, puis produire un rapport immutable :

```ts
type AudioAnalysisReport = {
  bpm?: number;
  confidence?: number;
  beatTimes: number[];
  onsetTimes: number[];
  durationSeconds: number;
  sampleRate: number;
};
```

**Point juridique important :** le dépôt Essentia.js est AGPL-3.0. Il faut donc obtenir une validation de licence avant de l’inclure dans le bundle déployé. Une première option prudente est de l’isoler derrière un module optionnel d’analyse, ou de comparer une alternative compatible avec la licence du projet.

Sources : [Essentia.js](https://github.com/MTG/essentia.js), [liste des algorithmes](https://github.com/MTG/essentia.js/blob/master/src/python/included_algos.md), [RhythmExtractor Essentia](https://github.com/MTG/essentia/blob/master/src/algorithms/rhythm/rhythmextractor.h).

### 3.5 Web Audio Modules — contrat plugin futur

WAM est intéressant pour formaliser des plugins externes :

- descriptor JSON ;
- `AudioNode` insérable dans le graphe ;
- état sauvegardable/restaurable ;
- paramètres décrits ;
- MIDI, transport et automation ;
- GUI externe ou générée ;
- traitement via AudioWorklet.

Ce n’est pas la prochaine dépendance à installer. C’est plutôt un contrat à garder en tête pour faire évoluer notre `EnginePluginType` vers un registre de modules déclaratifs sans réécrire le rack.

Sources : [WAM API](https://github.com/webaudiomodules/api), [WAM 2 introduction](https://www.webaudiomodules.com/docs/intro/).

## 4. Fonctions à préparer

### 4.1 Arpéggiateur

Le store possède déjà `arpeggiator`. Le runtime devra ajouter :

- modes Up, Down, Up/Down, Random, Order ;
- divisions musicales ;
- nombre d’octaves ;
- latch/hold ;
- gate ;
- accent et velocity pattern ;
- swing ;
- ratchets ;
- transposition ;
- reset sur Start/Bar/Pattern.

Le moteur ne doit pas créer son propre BPM. Il consomme `TransportState` et publie des `ScheduledNote`.

### 4.2 Quantification MIDI

Le quantizer doit être non destructif et réversible :

- grille : 1/4, 1/8, 1/16, 1/32, triolets ;
- force : 0–100 % ;
- swing ;
- humanize ;
- correction des notes courtes et longues ;
- conservation de la vélocité ;
- `preview`, `apply`, `undo` ;
- export du résultat dans le format de projet concerné.

La formule de base doit travailler en ticks/positions musicales, puis convertir vers le temps audio ou MIDI seulement au dernier adaptateur. Cela évite de quantifier différemment selon le BPM courant.

### 4.3 Recalage automatique d’un sample

Pipeline cible :

```text
Fichier audio
  → decode AudioBuffer
  → analyse BPM / beats / onsets
  → choix du BPM cible du projet
  → calcul ratio cible/source
  → time-stretch pitch-preserving
  → placement sur la grille du Transport
  → preview non destructif
  → export ou sauvegarde du réglage
```

Le projet doit conserver les métadonnées plutôt que réécrire immédiatement le fichier original :

```ts
type WarpSettings = {
  sourceBpm?: number;
  targetBpm: number;
  firstBeatSeconds?: number;
  bars?: number;
  beatsPerBar: number;
  preservePitch: boolean;
  stretchEngine: "native" | "soundtouch";
};
```

### 4.4 Lecture de sons au tempo

Le lecteur doit distinguer trois cas :

1. **One-shot** : lecture libre, pas de time-stretch obligatoire ;
2. **Loop musical** : recalage BPM + beat grid ;
3. **Phrase longue** : warp markers ou analyse plus fine, avec avertissement de qualité.

Un simple `playbackRate` est acceptable pour une pré-écoute rapide, mais il change la hauteur. Le mode “tempo verrouillé” doit utiliser le moteur de time-stretch dédié.

## 5. Architecture d’intégration proposée

```text
React pages / rack UI
          │
          ▼
  Audio Rack Runtime API
  ├─ Master Transport
  ├─ Event Scheduler
  ├─ Engine Registry
  ├─ Sample Player
  ├─ MIDI Quantizer
  ├─ Audio Analysis Queue
  └─ Warp / Time-Stretch Adapter
          │
    ┌─────┼─────────┬──────────────┐
    ▼     ▼         ▼              ▼
 Tone   Native   AudioWorklet   WAM adapter
.js     WebAudio   / WASM       (futur)
    │     │         │              │
    └─────┴─────────┴──────────────┘
          │
          ▼
 Web Audio destination + MIDI Bridge
```

### Contrats à créer avant les moteurs

Proposition de fichiers, sans les implémenter pendant cette étude :

```text
apps/studio-hub/src/core/audio/runtime/
  AudioRackRuntime.ts
  MasterTransport.ts
  EventScheduler.ts
  EngineRegistry.ts
  SamplePlayer.ts
  types.ts

apps/studio-hub/src/core/audio/analysis/
  AudioAnalysisReport.ts
  AnalysisQueue.ts
  BpmDetectorAdapter.ts

apps/studio-hub/src/core/audio/warp/
  WarpSettings.ts
  TimeStretchAdapter.ts
  SoundTouchAdapter.ts

apps/studio-hub/src/core/midi/
  quantizeMidi.ts
  quantizeMidi.test.ts
```

### Règles de responsabilité

| Domaine | Responsable | Ne doit pas faire |
|---|---|---|
| État UI | Zustand / pages | créer des nœuds audio directement |
| Transport | `MasterTransport` | connaître les composants React |
| MIDI physique | `midi-bridge` | dépendre d’un moteur synthé précis |
| Synthèse | engine adapter | modifier le profil ou les projets |
| Analyse BPM | queue offline/worker | bloquer le thread audio |
| Time-stretch | AudioWorklet/WASM adapter | réécrire l’original sans confirmation |
| Preset | store/serializer | contenir des instances AudioNode |
| Plugin externe | WAM adapter futur | contourner le registre du rack |

## 6. Risques à traiter

### Temps et synchronisation

- `setTimeout` et `requestAnimationFrame` ne doivent pas déclencher les notes critiques.
- MIDI Clock 24 PPQN et horloge Web Audio n’ont pas la même granularité.
- Il faudra tester dérive, Start/Stop, changement de BPM pendant lecture et reprise après pause.

### Performance

- Essentia.js et les modèles WASM doivent être chargés à la demande.
- Les moteurs lourds ne doivent pas tous créer un graphe actif lorsqu’ils ne sont pas sélectionnés.
- AudioWorklet doit recevoir des messages compacts et bornés.
- Le mobile et Safari nécessitent une stratégie de repli et un bouton d’activation audio explicite.

### Qualité audio

- Le time-stretch n’est pas neutre sur les transitoires et les matériaux polyphoniques.
- Les boucles de batterie devront privilégier la conservation des transitoires et un warp par segments.
- Le pitch-preserving doit être comparé sur OP-1/EP-133 : 44,1 kHz, 16 bits et les formats réellement rencontrés.

### Licences et distribution

- Essentia.js : AGPL-3.0 à valider avant bundling.
- SoundTouchJS : vérifier précisément le sous-paquet et la version MPL-2.0 retenus.
- WAM : vérifier la licence de chaque plugin, pas seulement celle de l’API.
- Les moteurs déjà présents dans le rack doivent rester listés dans un registre de licences et de provenance.

## 7. Feuille de route recommandée

### Phase A — contrat et tests sans nouveau moteur

- définir `TransportState`, `MusicalPosition`, `ScheduledNote` ;
- extraire le transport commun des pages ;
- écrire des tests de conversion ticks ↔ secondes ↔ MIDI Clock ;
- ajouter un quantizer pur et réversible ;
- brancher un métronome de test.

### Phase B — arpéggiateur Tone.js

- créer `ToneTransportAdapter` ;
- implémenter `ArpeggiatorRuntime` ;
- jouer un moteur rack existant avec des événements horodatés ;
- ajouter Start/Stop/Panic et reset sur mesure ;
- comparer la sortie clavier, MIDI et séquenceur.

### Phase C — analyse locale

- définir le rapport d’analyse ;
- charger l’analyse en worker/WASM à la demande ;
- tester BPM, beats et onsets sur samples OP-1/EP-133 ;
- décider de l’option Essentia.js après validation de licence.

### Phase D — warp et lecture synchronisée

- créer un `SamplePlayer` qui distingue one-shot/loop/phrase ;
- intégrer SoundTouchJS dans un adaptateur isolé ;
- ajouter preview A/B, ratio, preserve pitch et qualité ;
- ne sauvegarder que les métadonnées de warp avant export explicite.

### Phase E — extension plugin

- transformer le registre de moteurs actuel en manifest déclaratif ;
- ajouter paramètres, catégories, état et capabilities ;
- prototyper un WAM externe dans un bac isolé ;
- ne l’intégrer au Rack principal qu’après tests de destruction, suspension et restauration.

## 8. Conclusion

La base actuelle permet cette évolution, mais le bon ordre est essentiel. Tone.js doit d’abord devenir un adaptateur de transport/séquençage, sans remplacer les 15 moteurs existants. Le quantizer peut être développé sans dépendance. L’analyse BPM doit rester offline/worker. Le recalage tempo/pitch doit être isolé derrière un adaptateur AudioWorklet. WAM est une direction de compatibilité future, pas une dépendance immédiate.

La première implémentation raisonnable est donc : **Master Transport partagé → quantizer pur → arpéggiateur Tone.js → analyse BPM → SoundTouch**.

