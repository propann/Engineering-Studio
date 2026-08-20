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

## 9. Recherche moteurs de consoles rétro

### 9.1 Orientation retenue : émuler le chip, pas la console complète

Un émulateur de console complet apporte CPU, mémoire, vidéo, contrôleurs, ROM et timing de jeu. Ce n’est pas le bon niveau pour un module du Audio Plugin Rack. Le Rack veut un instrument ou un générateur de samples contrôlable par notes, paramètres et transport.

La cible doit donc être un adaptateur de puce audio :

```text
MIDI / clavier / pattern
          ↓
  ConsoleChipAdapter
          ↓
  APU / FM / PSG en WASM ou JS
          ↓
  PCM par blocs → AudioWorklet / Web Audio
```

L’adaptateur doit exposer une API de registre ou de notes, mais ne doit jamais charger une ROM commerciale. Les ROMs, VGM, NSF et SPC seront des formats d’import/lecture séparés, avec leurs propres questions de droits.

### 9.2 Game Boy DMG / CGB — priorité haute

Le son Game Boy est particulièrement intéressant pour le Rack :

- deux canaux pulse ;
- un canal wave table ;
- un canal noise ;
- enveloppe, sweep et longueur ;
- caractère lo-fi immédiatement reconnaissable ;
- très faible coût CPU si l’APU est isolée.

Pistes étudiées :

| Piste | Intérêt | Limite |
|---|---|---|
| `apu-legacy` | APU autonome très légère, annoncée autour de 3 kB gzip, API simple pour produire des sons Game Boy | Licence et couverture exacte à auditer avant dépendance |
| WasmBoy | APU incluse, WebAssembly, sortie Web Audio, performances et tests d’émulation | Émulateur complet, encore annoncé comme pré-1.0 et GPL-3.0 |
| `raphamorim/gameboy` | Émulateur Rust/WASM, APU annoncée assez précise, licence MPL-2.0 | Il faut extraire/isoler l’APU au lieu d’embarquer toute la console |

**Recommandation :** commencer par un prototype `GameBoyApuAdapter` avec quatre voix et un registre de paramètres inspiré du hardware. Ne pas intégrer WasmBoy au bundle du Rack sans décision de licence et sans besoin d’émulation complète.

Sources : [apu-legacy](https://github.com/shamblesides/apu-legacy), [WasmBoy](https://github.com/torch2424/wasmboy), [Game Boy Rust/WASM](https://github.com/raphamorim/gameboy).

### 9.3 NES / Famicom — priorité moyenne à haute

L’APU NES standard fournit cinq voix :

- pulse 1 ;
- pulse 2 ;
- triangle ;
- noise ;
- DMC/sample.

Ce moteur est idéal pour un module “NES APU” et un séquenceur chiptune. Il faut toutefois distinguer le 2A03 standard des extensions d’arcade et des variantes de mapper.

Pistes étudiées :

- `jsnes` est un émulateur JavaScript utilisable dans le navigateur et expose une API de callback de samples audio ; il reste un émulateur complet, pas un APU autonome.
- `WebNES` propose audio Web Audio et une implémentation de l’APU standard, mais le projet est ancien et annonce des limites de précision.
- `cfxnes` propose une librairie NES JavaScript avec Web Audio et une licence MIT, mais son périmètre reste celui d’un émulateur.
- Un cœur Rust/WASM APU-only, tel que celui d’un projet NES moderne, serait plus propre pour le Rack si le cœur est réellement découplé et si sa licence est compatible.

**Recommandation :** produire d’abord un moteur interne minimal à cinq voix, contrôlé par paramètres musicaux, plutôt que d’embarquer un émulateur complet. Le DMC/sample doit rester une extension séparée avec son propre buffer et ses propres tests.

Sources : [JSNES](https://github.com/bfirsh/jsnes), [WebNES](https://github.com/peteward44/WebNES), [CfxNES](https://github.com/jpikl/cfxnes), [NES WASM Rust](https://github.com/dustinbowers/nes-emulator).

### 9.4 Mega Drive / Genesis — YM2612 + SN76489 — priorité haute

Le couple Genesis est très pertinent pour le Rack :

- YM2612 : FM 6 canaux, timbres métalliques, basses et leads typés ;
- SN76489 : PSG pour pulses, bruit et basses simples ;
- possibilité de charger ou générer des séquences VGM/XGM ;
- complément direct aux moteurs FM déjà présents dans le Rack.

`libymfm.wasm` est la piste la plus intéressante trouvée pour une intégration future : il compile en WebAssembly des cœurs Yamaha FM et expose des interfaces bas niveau de puce ainsi qu’un séquenceur VGM/XGM. Il couvre notamment YM2612, YM2149, SN76489 et plusieurs autres circuits. Le dépôt annonce une licence BSD 3-Clause.

**Recommandation :** prioriser un adaptateur YM2612, puis ajouter SN76489 comme second bloc. Le module ne doit pas dépendre d’un émulateur Mega Drive complet. Les séquences VGM/XGM doivent être traitées comme un lecteur séparé du synthé live.

Source : [libymfm.wasm](https://github.com/h1romas4/libymfm.wasm).

### 9.5 SNES / SPC700 — priorité exploratoire

Le SNES est plus complexe : son APU est un système autonome avec CPU SPC700, RAM et DSP. Un fichier SPC est une capture d’état de ce système avant lecture, pas simplement une liste de notes.

La piste `spc-player` montre qu’une lecture SPC dans le navigateur est possible et documente la relation entre le SPC700, sa RAM et son DSP. Cela en fait une bonne piste pour un futur **lecteur de musiques SNES**, mais pas le premier moteur d’instrument live du Rack.

**Recommandation :** garder le SNES dans une phase “lecteur/import SPC”, après Game Boy, NES et Genesis. Ne pas promettre un synthé SPC700 live avant d’avoir un cœur stable, un adaptateur AudioWorklet et une décision de licence.

Source : [SPC Player](https://github.com/Kazhuu/spc-player).

### 9.6 VGM / NSF / SPC — fonction intéressante séparée

Un module “Console Music Player” pourrait lire des formats de musique de consoles sans devenir un émulateur de jeu :

- NSF pour NES ;
- VGM/XGM pour plusieurs puces arcade et consoles ;
- SPC pour SNES ;
- formats ou séquences propres aux différents cœurs.

`game-music-emu` est une bibliothèque connue pour ajouter la lecture de musiques de consoles classiques. Le projet annonce LGPL, mais signale aussi des exceptions de licence selon les cœurs utilisés, notamment pour certains cœurs YM2612 MAME. Cette piste est donc utile pour une étude de lecteur, mais elle exige une matrice de licences par émulateur.

Source : [Game Music Emu](https://github.com/libgme/game-music-emu).

## 10. Classement console recommandé pour le Rack

| Rang | Module | Usage | Décision |
|---:|---|---|---|
| 1 | Game Boy APU | 4 voix lo-fi, FX, arpèges et drums | Prototype APU autonome |
| 2 | Genesis YM2612 | FM 6 voix, basses, leads et séquences | Étudier `libymfm.wasm` |
| 3 | NES APU | 5 voix chiptune et DMC séparé | Cœur APU-only à privilégier |
| 4 | SNES SPC700 | Lecture SPC et textures DSP | Phase exploratoire |
| 5 | VGM/NSF/SPC Player | Écoute, import et analyse de musiques rétro | Module séparé du live rack |

## 11. Contrat console proposé

Un futur moteur console doit implémenter un contrat plus petit que celui d’un émulateur :

```ts
type ConsoleChipId = "gameboy-apu" | "nes-apu" | "ym2612" | "sn76489" | "spc700";

interface ConsoleChipAdapter {
  readonly id: ConsoleChipId;
  readonly channelCount: number;
  readonly sampleRate: number;
  start(context: AudioContext): Promise<void>;
  stop(): void;
  noteOn(channel: number, note: number, velocity: number, at: number): void;
  noteOff(channel: number, note: number, at: number): void;
  setParameter(channel: number, key: string, value: number, at?: number): void;
  reset(at?: number): void;
  dispose(): void;
}
```

Ce contrat laisse le Rack choisir entre une implémentation JS, WASM ou AudioWorklet. Il impose la même gestion du temps, des notes, des paramètres, de la destruction et du PANIC.

## 12. Conclusion console

Les meilleurs gains créatifs ne viennent pas d’un émulateur complet, mais de trois blocs spécialisés :

1. **Game Boy APU** pour le caractère lo-fi et les FX ;
2. **YM2612 + SN76489** pour compléter le FM et le PSG du Rack ;
3. **NES APU** pour le chiptune séquencé.

Le SNES et les lecteurs NSF/VGM/SPC doivent rester des fonctions séparées tant que les contrats de licence, de timing et d’export ne sont pas validés. La prochaine étape de recherche est de comparer les cœurs APU-only et de vérifier leurs licences dans un registre avant tout ajout de dépendance.

