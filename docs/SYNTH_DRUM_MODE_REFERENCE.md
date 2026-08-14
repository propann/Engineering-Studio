# Modes Synth et Drum — référence de comportement pour les développeurs

Document créé le 13 août 2026, même méthode et mêmes limites que
[`TAPE_MODE_REFERENCE.md`](TAPE_MODE_REFERENCE.md) : sources officielles
`teenage.engineering/guides/op-1/original/*`, rien vérifié sur le matériel
de l'utilisateur (OP‑1 depuis le 9 août 2026). Portée : **OP‑1 original**.

Objectif direct : relier **les boutons de la machine** aux **champs JSON**
déjà documentés dans
[`AUDIO_FILE_FORMAT_REFERENCE.md`](AUDIO_FILE_FORMAT_REFERENCE.md) — savoir
quel encodeur modifie quel champ, pour qu'un futur éditeur de patch dans
l'app (voir [`ENGINE_EDITOR_CONCEPT.md`](ENGINE_EDITOR_CONCEPT.md), toujours
« à construire ») corresponde exactement à ce que fait la machine.

## 1. Le motif commun T1–T4, identique en Synth et en Drum

Les deux modes partagent la même disposition de touches `T1`–`T4`, chacune
avec un couple `appui simple` / `Shift + appui` :

| Touche | Sans Shift | Avec Shift | Champ JSON correspondant |
|---|---|---|---|
| `T1` | Moteur actif | Parcourir/choisir le moteur (10 types synth, ou moteur Drum D‑Box) | `type`, `knobs[0..3]` |
| `T2` | Enveloppe (Synth : ADSR) | Play Mode (Synth) / région (Drum) | `adsr[0..3]` (Synth) / `dyna_env` (Drum) |
| `T3` | Effet on/off | Parcourir/choisir l'effet | `fx_active`, `fx_type`, `fx_params` |
| `T4` | LFO on/off | Parcourir/choisir le LFO | `lfo_active`, `lfo_type`, `lfo_params` |

C'est exactement la structure du JSON déjà documentée en §2.3/2.4 de
`AUDIO_FILE_FORMAT_REFERENCE.md` — les 4 touches de mode correspondent
terme à terme aux 4 groupes de champs du patch. Bonne nouvelle pour un futur
éditeur : l'organisation de l'écran peut suivre celle du fichier sans
traduction intermédiaire.

## 2. Mode Synth

- Entrée : touche bleue (symbole onde). Les touches de son `1`–`8`
  sélectionnent un preset chargé.
- `Shift` + une touche `1`–`8` affiche la liste des presets disponibles ;
  encodeur bleu = type de moteur, encodeur vert = choix dans ce moteur.
- **Sauvegarde** : maintenir une touche de son `1`–`8` pendant 5 secondes
  l'enregistre dans le dossier snapshot (organisation en dossiers
  personnalisés possible via USB — cohérent avec la note déjà présente dans
  `op1-docs` sur la colonne `folder` de `synth_presets`, voir
  `AUDIO_FILE_FORMAT_REFERENCE.md`).
- **T2 (ADSR)** : encodeur bleu = Attack, vert = Decay, blanc = Sustain,
  orange = Release. `Shift+T2` = Play Mode (poly/mono/legato/unison) +
  portamento — correspond aux positions `adsr[4]`/`adsr[5]` documentées côté
  `teoperator` (`AllowedADSR` : `{2048,5120,11264,14336}` = poly/mono/legato/
  unison).
- **Limite connue** : nom de fichier limité à dix caractères ; certains
  encodeurs demandent un tour complet avant de changer de valeur (à vérifier
  si ça affecte une implémentation logicielle de knob rotatif).
- **Lift/Drop vers Tape** : la touche Lift permet de transférer le son vers
  la bande, Drop le rappelle — mécanisme de « bounce » synth→tape, à ne pas
  confondre avec le Lift/Drop propre au mode Tape (`TAPE_MODE_REFERENCE.md`
  §5), qui manipule des takes déjà enregistrés.

## 3. Mode Drum

- Entrée : touche verte (symbole batterie). Les touches de son `1`–`8`
  choisissent un kit.
- **24 touches = 24 samples**, layout usine documentée par TE (kick, snare,
  rimshot, tambourine, hi-hats, ride, crash, puis basses...) — cohérent avec
  les tableaux `start[24]`/`end[24]`/`pitch[24]`/... du format JSON.
- **Import** : jusqu'à 12 secondes par échantillon (contre 6 s en Synth,
  déjà documenté dans `OP1_KNOWLEDGE_BASE.md`), ou transfert direct d'un
  `.aif` dans `drum/user/`.
- **Édition par touche**, un encodeur par paramètre :
  - Bleu = pitch (`pitch[i]`) ; `Shift`+Bleu = inverser la lecture
    (`reverse[i]`).
  - Vert = point d'entrée (`start[i]`) ; `Shift`+Vert = réglage fin.
  - Blanc = point de sortie (`end[i]`) ; `Shift`+Blanc = réglage fin.
  - Orange = mode de lecture — joue jusqu'au bout / boucle / une fois
    (`playmode[i]`) ; `Shift`+Orange = volume (`volume[i]`).
  - **Rappel du piège déjà documenté** : `start`/`end` ne sont pas un index
    d'échantillon direct, voir `AUDIO_FILE_FORMAT_REFERENCE.md` §2.5 — la
    machine affiche sans doute une position relative à l'écran, pas la valeur
    JSON brute ; à vérifier avant de reproduire l'affichage.
- **T2 = enveloppe dynamique** (`dyna_env`), 3 points : niveau d'attaque
  (bleu), niveau de partie médiane (vert), niveau de release + une région
  réglable (4e encodeur) — 8 valeurs au total dans `dyna_env[8]`, cohérent.
- **Copier une touche vers une autre** : maintenir la touche source + `LIFT`,
  puis la touche destination + `DROP` — même paire de touches que Tape et
  Synth, mais un troisième usage encore différent (copie de mapping, pas de
  buffer audio). Trois significations de LIFT/DROP selon le mode actif — à
  garder en tête pour ne pas les fusionner dans une seule fonction générique
  côté app.
- **D‑Box** : moteur de synthèse drum dédié (double oscillateur), contrôles
  pitch/forme d'onde/enveloppe en accès direct, second oscillateur via
  `Shift`, cross-modulation et cutoff filtre en plus — c'est le seul moteur
  Drum paramétrique de la liste des 13 dans
  `SYNTH_ENGINES_REFERENCE.md`.

## 4. Où en est l'app par rapport à ce modèle

| Fonction | État dans le code | Repère |
|---|---|---|
| Sélection type de patch synth/drum, fréquence de base, octave racine, mode basse résolution | **existe** | `SoundControlsPanel.tsx` |
| Détection et appel d'`op-patch-util` pour construire un patch | **existe** | `patch_bridge.py`, confirmé en direct (« Moteur de patch détecté op-patch-util 1.1.0 » vu en lançant l'app) |
| Édition ADSR / knobs moteur / FX / LFO (T1–T4 ci-dessus) | **absent** | correspond à `ENGINE_EDITOR_CONCEPT.md`, toujours listé « à construire » |
| Édition par touche du Drum (pitch/start/end/playmode/volume) | **absent** | pas de composant équivalent trouvé dans `app/components/` |
| Grille 24 pads fidèle à la disposition physique | **existe** | `SoundPadGrid.tsx`, vérifié visuellement (voir capture de l'app) |
| Snapshot (sauvegarde d'un son en cours) | **absent** | — |

Rien d'urgent à corriger ici — c'est une carte, pas un bug. Elle sert de
base directe si `ENGINE_EDITOR_CONCEPT.md` passe de concept à construction :
les tableaux ci-dessus donnent le mapping bouton → champ JSON dont l'éditeur
aura besoin.

## 5. Sources

- [Synthesizer mode](https://teenage.engineering/guides/op-1/original/synthesizer-mode)
- [Drum mode](https://teenage.engineering/guides/op-1/original/drum-mode)
- Recoupé avec `teoperator/src/op1/synth.go` (plages `AllowedADSR`,
  `AllowedEngine`) déjà cité dans `AUDIO_FILE_FORMAT_REFERENCE.md`.

Non couvert dans cette passe, à faire si besoin plus tard : mode
Séquenceurs (`sequencers`) et enregistrement de sources externes
(`recording-external-sources`) — les deux guides sont déjà référencés dans
`SOURCES.md` mais pas encore mités pour leur contenu.
