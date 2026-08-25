# 🎛️ Audio Rack Modules - Development Status

**Last Updated**: 2026-08-25  
**Total Modules**: 12  
**Status**: Setup Complete ✅ | Development Ready

## Où en sont les douze modules

| | Module | État |
|---|---|---|
| 1 | Patch Search & Tagging | ✅ branché — recherche, favoris, étiquettes |
| 2 | Multi-Tap Delay | ✅ livré — 1 à 8 prises toutes distinctes, SYNC au tempo, seule la première réinjecte |
| 3 | Parametric EQ | ✅ livré — trois bandes, courbe de réponse tracée, 5 courbes prédéfinies |
| 4 | ADSR Envelope | ✅ livré — quatre commandes, courbe tracée, 5 prédéfinies, rampes exp/droites |
| 5 | Arpeggiator | ✅ livré — **dans le rack MIDI**, 30 gammes, 6 motifs |
| 6 | Step Sequencer | ✅ livré — **dans le rack MIDI**, 1 à 32 pas, 4 sens, quantifié |
| 7 | LFO Generator | ✅ livré — trémolo, balayage de filtre, SYNC au tempo, déphasage à l'origine |
| 8 | Distortion Stack | ✅ livré — trois écrêtages : doux, dur, repliement |
| 9 | Chorus/Flanger/Phaser | ✅ livré — trois modes, un seul graphe |
| 10 | Audio Export | ✅ livré, au-delà du plan (AIFF + vérification) |
| 11 | Sample Pack Creator | ✅ livré — pack chromatique C3–C7 |
| 12 | Patch Import/Export | ✅ livré — import validé, trois formats, et archive ZIP de tout le travail |

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
  MIDI** produit les notes (arpégiateur, 30 gammes, `packages/musique`). Le
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
| Couverture de test | ✅ suite complète, vérifiée par sabotage |
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
> une recherche testée qui ne pouvait rien trouver, à côté de 76 patches
> d'usine qu'on ne pouvait que faire défiler.
>
> `PatchSearchEngine` est appelé directement par `AudioPluginRack.tsx` sur les
> listes réelles.
>
> `PatchSearchModule.tsx` et `audioRackStore.ts`, qui restaient en doublon sans
> consommateur, ont été **supprimés** — ils cherchaient dans un store parallèle
> que rien n'alimentait : une clef `localStorage` différente de celle du rack,
> donc toujours vide.

**Description**: Search and filter patches by name, tag, engine, category. Favorite/recent features.

**Next Steps**:
1. Write unit tests for PatchSearchEngine
2. Create patch-search.test.ts
3. Integrate module into AudioPluginRack
4. Test on real patches

---

### Module 2: Multi-Tap Delay Effect ⏱️ 3-4h
**Status**: 🟢 LIVRE (2026-08-25) — multi-prises et synchronise  

Un delai avec reinjection dans le rack (`construireChaineEffets`) : melange,
temps, retour, boucle amortie par un passe-bas. La reinjection est bornee a 0,85
pour qu'un curseur a 100 % ne parte pas en larsen.

Les prises sont la (`fxDelayTaps`, 1 a 8, et `fxDelaySpread` pour leur ecart),
avec `tempsDesPrises` et `niveauPrise`. Seule la premiere reinjecte : boucler
sur toutes multiplierait le gain de boucle par leur nombre, et le plafond ne
protegerait plus rien. La synchronisation au tempo de l'hote est branchee
(`delaySync` + division musicale).

L'ecart se met a l'echelle de ce qui tient sous le plafond de `createDelay(2)`,
au lieu d'etre rogne prise par prise. Avant, a 1200 ms et 100 % d'ecart, quatre
prises n'en donnaient que deux distinctes -- trois empilees sur 2,0 s, qui
sonnaient comme un seul echo plus fort pendant que leurs noeuds tournaient pour
rien. La derniere prise vise maintenant le plafond et les autres se
repartissent jusqu'a elle.

**Ce qui manque** : le panoramique par prise — la chaine est mono jusqu'a la
sortie, donc c'est un changement de topologie, pas un curseur de plus.

**Files**:
- ✅ `core/audio/effets.ts` - `tempsDesPrises`, `niveauPrise`, la chaine
- ✅ `core/audio/effets.test.ts` - les prises distinctes, la reinjection, le plafond
- ✅ `racks/RackEffets.tsx` - PRISES (jusqu'a `TAPS_MAX`), ECART, SYNC + division
- ❌ panoramique par prise - TODO (topologie stereo)

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
**Status**: 🟢 LIVRE (2026-08-25) — complet  

Egaliseur trois bandes dans le rack : lowshelf a 220 Hz, peaking a 1,2 kHz,
highshelf a 5,2 kHz, ±18 dB chacune. Applique apres les moteurs, donc a la
superposition entiere, et traverse le rendu hors ligne comme le jeu.

Les trois bandes vivent dans une seule table, `BANDES_EQ`. Le graphe audio et
la courbe affichee la lisent tous les deux : c'est ce qui garantit que le trace
montre ce qu'on entend. Deux listes divergeraient au premier reglage change,
chacune restant coherente de son cote, et rien ne le signalerait.

La courbe est calculee, pas mesuree — les coefficients biquad de l'Audio EQ
Cookbook, ceux que la specification Web Audio reprend. `getFrequencyResponse`
aurait exige un contexte audio ouvert, donc un navigateur, et rendu le calcul
intestable.

Cinq courbes predefinies donnent des points de depart nommes — PLAT, CHALEUR,
SOURIRE, PRESENCE, AIR — qu'on retouche ensuite au curseur. PLAT ouvre la liste
et n'est pas decoratif : sans retour au neutre, essayer une courbe serait une
porte a sens unique. Leurs gains sont un `Record` complet des bandes, donc une
bande ajoutee a `BANDES_EQ` casse le typecheck tant que chaque courbe n'a pas
recu sa valeur.

**Ce qui manque** : rien d'identifie.

**Files**:
- ✅ `core/audio/effets.ts` - la table `BANDES_EQ`, les courbes, la chaine de filtres
- ✅ `core/audio/reponseEq.ts` - la reponse calculee, fonction pure
- ✅ `core/audio/reponseEq.test.ts` - les valeurs exactes de la reponse
- ✅ `core/audio/effets.test.ts` - les courbes et la reconnaissance de la courbe courante
- ✅ `racks/RackEffets.tsx` - curseurs, trace SVG et rappels, tires de la meme table

**Description**: 3-band EQ (Low/Mid/High) with frequency response visualizer.

**Features**:
- Low shelf (200Hz)
- Peaking mid (1kHz)
- High shelf (5kHz)
- Real-time frequency graph
- Preset curves

**Next Steps**:
1. ~~Implement BiquadFilter chain~~ — fait
2. ~~Create frequency response visualizer~~ — fait, en SVG plutot qu'en canvas :
   le trace se redessine a chaque mouvement de curseur, et un `path` se relit.
3. ~~Build React UI~~ — fait
4. ~~Test frequency response accuracy~~ — fait
5. ~~Courbes predefinies~~ — fait

---

### Module 4: ADSR Envelope Generator ⏱️ 3-4h
**Status**: ✅ LIVRE (2026-08-25) — complet  

Une enveloppe ADSR native est en place dans le moteur depuis le 2026-08-20
(`construireVoix`), avec des rampes exponentielles qui ne passent jamais par
zero. C'est elle qui supprime les clics, et elle est reutilisee par le rendu
hors ligne.

Les quatre commandes sont dans le panneau ENVELOPPE, bornees pour que les
rampes ne levent pas : `exponentialRampToValueAtTime` rejette zero, donc un
maintien a 0 % passe par un plancher a -80 dB plutot que par zero.

La courbe est tracee sous les curseurs, calculee sur les MEMES rampes
exponentielles que le moteur joue -- v(t) = v0 · (v1/v0)^(t/d), la formule de
la specification Web Audio. Des segments droits montreraient une attaque qui
monte regulierement la ou le moteur la fait bondir puis ralentir.

L'axe des temps est LINEAIRE, contrairement a celui de l'egaliseur. L'oreille
entend les hauteurs en octaves, mais les durees telles quelles : un axe
comprime montrerait une attaque de 8 ms aussi large qu'un relachement de 4 s.
Plus lisible, et faux.

La duree du maintien est une convention d'affichage -- on ne sait pas combien
de temps une touche sera tenue. Le palier montre un NIVEAU, donc il occupe le
quart du trace quels que soient les reglages, sinon il disparaitrait des qu'un
relachement long ecrase le reste.

Cinq enveloppes predefinies : DEFAUT, PERCUSSIF, PINCE, ORGUE, NAPPE. DEFAUT
reprend `ENVELOPPE_DEFAUT` sans le recopier -- deux jeux de valeurs
divergeraient au premier defaut change, et le bouton ne ramenerait plus au
point de depart.

Le choix lineaire/exponentiel est livre. Les rampes s'appliquaient a CINQ
endroits — attaque, declin, relachement d'une note tenue, relachement d'une
note ponctuelle, et le rendu hors ligne. Elles passent toutes par `rampeVers` :
ecrire le choix cinq fois, c'etait se garantir qu'un des cinq resterait
exponentiel apres une retouche, et le fichier rendu ne sonnerait plus comme ce
qu'on entend en jouant.

Chaque voix emporte la forme choisie AU DEPART de la note. Le relachement est
programme plus tard, quand la touche se leve : relire le reglage courant a ce
moment-la ferait qu'une note commencee en courbe se relacherait en droite si on
a bouge le bouton entre les deux.

Les enveloppes predefinies ne touchent PAS a la forme : c'est un gout qui
traverse tous les sons, pas une caracteristique du PERCUSSIF ou de la NAPPE.
Le type le dit — leurs `reglages` sont un `Record<PhaseEnveloppe, number>`, la
forme etant exclue.

**Ce qui manque** : rien d'identifie.

**Files**:
- ✅ `core/audio/enveloppe.ts` - resolution, courbe, predefinies, `rampeVers`
- ✅ `core/audio/enveloppe.test.ts` - bornes, formes, courbe, predefinies
- ✅ `racks/PanneauEnveloppe.tsx` - commandes, trace SVG, rappels, forme

**Description**: Full ADSR envelope with linear/exponential curves and visualizer.

**Features**:
- Attack, Decay, Sustain, Release
- Linear & exponential curves
- Envelope graph visualization
- Preset envelopes

**Next Steps**:
1. ~~Implement ADSREnvelopeProcessor~~ — fait (`resoudreEnveloppe`)
2. ~~Create envelope visualizer~~ — fait, en SVG plutot qu'en canvas : le trace
   se redessine a chaque mouvement de curseur, et un `path` se relit.
3. Build curve selector UI — reste a faire (lineaire/exponentiel)
4. ~~Preset envelopes~~ — fait

---

### Module 5: Arpeggiator ⏱️ 3-4h
**Status**: 🟢 LIVRE — dans `packages/musique`, monte dans le panneau MIDI  

Les six motifs annonces existent : haut, bas, haut-bas, bas-haut, aleatoire,
accord. L'etendue d'octaves est bornee a 1-4, le tempo vient de l'horloge de
l'hote, et les notes sont quantifiees sur la gamme choisie — ce dernier point
n'etait pas au plan.

**Ce qui manque** : la longueur de gate et l'enregistrement des notes MIDI. Le
gate n'est pas un oubli : la note court jusqu'au pas suivant, donc sa duree est
liee a la division, sans seconde minuterie. Le rendre reglable demande cette
seconde minuterie — c'est une decision, pas un curseur.

**Files**:
- ✅ `packages/musique/arpege.ts` - motifs, reservoir, quantification
- ✅ `packages/musique/Arpegiateur.tsx` - l'interface
- ✅ `packages/musique/arpege.test.ts`
- ✅ `apps/studio-hub/src/MidiSyncPanel.tsx` - l'horloge et le deroulement

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
**Status**: 🟢 LIVRE — dans `packages/musique`, monte dans le panneau MIDI  
**Priority**: 🟠 MEDIUM

**Description**: 16-step grid with per-step note, velocity, duration.

La grille va de 1 a 32 pas, pas seulement 16, et chaque pas porte sa note, sa
velocite et son actif. Quatre directions de lecture en plus du plan : avant,
arriere, aller-retour, aleatoire. Redimensionner conserve les pas existants —
passer de 16 a 8 pour essayer, puis revenir, ne doit pas rendre une grille vide.

**Ce qui manque** : la duree par pas. Comme pour l'arpege, la note court
jusqu'au pas suivant.

**Files**:
- ✅ `packages/musique/sequenceur.ts` - pas, directions, redimensionnement
- ✅ `packages/musique/Sequenceur.tsx` - la grille
- ✅ `packages/musique/sequenceur.test.ts`

---

### Module 7: LFO Generator ⏱️ 3-4h
**Status**: 🟢 LIVRE — quatre formes, deux cibles, synchronise  
**Priority**: 🟠 MEDIUM

**Description**: Multiple LFO shapes with tempo sync and phase offset.

Quatre formes (sinus, triangle, carre, dent de scie), deux cibles (tremolo,
filtre) plus l'arret, vitesse de 0,05 a 20 Hz, et la synchronisation au tempo
de l'hote avec division musicale.

Le dephasage a l'origine est livre (2026-08-25). Le LFO est construit avec
chaque voix, donc la phase decide de l'endroit du cycle ou une note DEMARRE :
a 0 un tremolo part du milieu et monte, a 270 il part du creux et l'attaque se
fait en fondu.

Un `OscillatorNode` n'a pas de phase reglable — il demarre toujours a zero, et
les deux contournements evidents echouent : demarrer dans le passe n'est pas
permis, demarrer plus tard RETARDE le LFO au lieu de le decaler. La forme est
donc fabriquee avec la phase dedans, par `createPeriodicWave`. Les quatre
formes de la specification sont des series de sinus pures, et decaler de phi
revient a tourner chaque harmonique de **k·phi** — c'est ce facteur k qui
distingue un vrai decalage temporel d'une rotation du seul fondamental, laquelle
deformerait la forme au lieu de la deplacer.

A phase nulle — le defaut — le type natif est conserve : le son des patches
existants ne bouge pas pour une fonction qu'ils n'utilisent pas.

**Ce qui manque** : rien d'identifie.

**Files**:
- ✅ `apps/studio-hub/src/core/audio/lfo.ts` - reglages, vitesse, phase
- ✅ `apps/studio-hub/src/core/audio/lfo.test.ts`
- ✅ `apps/studio-hub/src/core/audio/dsp.ts` - `coefficientsFormeLfo`, `attachLfo`
- ✅ `apps/studio-hub/src/core/audio/dsp.test.ts` - la rotation, verifiee par reconstruction
- ✅ `apps/studio-hub/src/racks/PanneauLfo.tsx`

---

## Phase 3: Advanced Effects (Week 2)

### Module 8: Distortion Stack ⏱️ 3-4h
**Status**: 🟢 LIVRE (2026-08-25) — trois ecretages  
**Priority**: 🟠 MEDIUM

**Description**: Soft/hard clipping with waveshaper and tone control.

Un `WaveShaperNode` avec trois courbes : DOUX (tanh, la crete s'arrondit), DUR
(ecretage franc, le signal s'arrete net au seuil) et REPLI (repliement d'onde,
en plus du plan). Les trois partagent le meme gain d'entree, donc changer de
mode change le grain et non le volume.

**La tonalite n'a pas de curseur a elle** : l'egaliseur trois bandes suit
immediatement dans la chaine, et egaliser APRES la saturation est justement ce
qui permet de dompter les aigus qu'elle cree. Un reglage de tonalite propre au
module ferait double emploi avec la bande AIGUS, juste a cote.

**Files**:
- ✅ `apps/studio-hub/src/core/audio/dsp.ts` - `buildSaturationCurve`
- ✅ `apps/studio-hub/src/core/audio/dsp.test.ts` - les trois courbes
- ✅ `apps/studio-hub/src/racks/RackEffets.tsx` - MIX, GAIN, les trois modes

---

### Module 9: Chorus/Flanger/Phaser ⏱️ 4-5h
**Status**: 🟢 LIVRE — les trois, sur un graphe partage  
**Priority**: 🟠 MEDIUM

**Description**: 3-in-1 modulation effects.

Les trois partagent un LFO et une voie parallele dosee ; ce qui les separe est
l'ordre de grandeur du delai — long et module pour le chorus, dix fois plus
court et reinjecte pour le flanger — et, pour le phaser, des filtres passe-tout
balayes au lieu d'un delai. Chaque mode garde SA marge : la profondeur du
flanger ne peut pas depasser son propre delai de base.

**Ce qui manque** : rien d'identifie.

**Files**:
- ✅ `apps/studio-hub/src/core/audio/effets.ts` - les trois modes
- ✅ `apps/studio-hub/src/core/audio/effets.test.ts` - marges et ordres de grandeur
- ✅ `apps/studio-hub/src/racks/RackEffets.tsx`

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

**Ce qui manque — et pourquoi ca ne se construira sans doute pas tel quel** :

Le plan demandait le choix de la profondeur (24 et 32 bits). Verifie le
2026-08-25 : les CINQ cibles d'export sont des machines, pas un export
generique. L'EP-133 est documente « PCM 16 bits » dans sa reference SysEx, et
l'OP-1 lit du 16 bits pour `synth/user` et `drum/user`. Offrir le 24 bits ici
laisserait fabriquer des fichiers que les deux machines refusent — l'inverse
du service rendu. L'item attend donc une cible qui le justifie : un export
« vers le disque » sans machine derriere.

A noter : le LECTEUR AIFF (`packages/audio-formats/aiff.ts`) accepte deja 8,
16, 24 et 32 bits. C'est l'ecriture qui est volontairement limitee.

Les metadonnees de titre (chunk `NAME` en AIFF) sont possibles sur le papier,
mais le micrologiciel de l'OP-1 n'est pas une implementation de reference :
ajouter un chunk qu'il pourrait ne pas ignorer se verifie sur la machine, pas
au jugé. A tenter par son proprietaire, avec un fichier temoin.

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
**Status**: 🟢 LIVRE — JSON dans les deux sens  
**Priority**: 🟠 MEDIUM

**Description**: Save/load patches as JSON, ZIP archives for backup.

Export vers un fichier JSON telecharge, et relecture par `lirePatchImporte`,
qui valide au lieu de faire confiance : un fichier trafique ou d'une version
plus ancienne ne doit pas installer des reglages hors bornes dans le moteur.

L'archive ZIP sauvegarde TOUT le travail personnel en une fois (TOUT
SAUVEGARDER / RESTAURER). Un fichier JSON par patch et non un gros document :
l'archive se relit alors PARTIELLEMENT, donc un patch corrompu n'emporte pas
les vingt-neuf autres — un unique document aurait la propriete inverse, une
accolade de trop et tout est perdu. Les echecs sont nommes a l'ecran plutot que
tus.

Les noms de fichiers passent par une liste blanche : un nom de patch contenant
une barre oblique creuserait un sous-dossier, et `..` sortirait du dossier de
destination chez un lecteur d'archive naif. Le nom d'origine survit a
l'interieur du fichier, donc rien n'est perdu par ce nettoyage.

Chaque fichier de l'archive repasse par `lirePatchImporte` : une archive est
une entree non fiable comme une autre.

**Ce qui manque** : rien d'identifie.

**Files**:
- ✅ `apps/studio-hub/src/core/audio/importPatch.ts`
- ✅ `apps/studio-hub/src/core/audio/importPatch.test.ts`
- ✅ `apps/studio-hub/src/core/audio/archivePatches.ts` - l'archive ZIP
- ✅ `apps/studio-hub/src/core/audio/archivePatches.test.ts`
- ✅ `apps/studio-hub/src/pages/AudioPluginRack.tsx` - export, import, archive

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

- [x] Unit tests (Vitest) — sur les fonctions pures et la structure
- [ ] Integration tests
- [ ] Audio quality tests
- [ ] Performance benchmarks
- [ ] Mobile responsiveness
- [ ] Cross-browser testing — noter que Firefox/Safari ne supportent pas
      l'API File System Access, le sélecteur de dossier y est inopérant

---

## 🚀 Deployment Checklist

- [x] All modules complete — **12/12 livrés** le 2026-08-22
- [ ] 90%+ test coverage — nombreux tests écrits ; couverture non mesurée
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
**Last Updated**: 2026-08-25  
**Next Review**: le module 1 est boucle depuis longtemps — la prochaine revue
porte sur ce qui reste identifie : panoramique par prise (2), gate (5 et 6),
dephasage du LFO (7), archive ZIP de patches (12).

