# La bible du firmware OP‑1 original

Document de synthèse écrit le 14 août 2026, en relisant l'intégralité des
études déjà produites dans ce dépôt (firmware, formats, boutons machine,
graphismes, outils communautaires) plus les dossiers locaux non commités
(`.cache/`, `backups/`, `data/`) et le travail de l'agent Codex qui tourne en
parallèle sur ce même dépôt. Rien n'est réétudié ici : chaque fait est repris
de son document source, avec un lien, pour que ce document reste la **carte**,
pas une nouvelle enquête. Objectif explicite : lister tout ce qu'on sait
**et** dire, fait par fait, si c'est déjà codé, codable tout de suite avec un
risque faible, candidat (nécessite des fixtures ou une décision produit), ou
hors périmètre.

Portée : **OP‑1 original** uniquement (l'OP‑1 Field et l'OP‑Z restent hors
cible, voir `CONTEXT.md`/`ROADMAP.md`).

## 0. Méthode et niveaux de confiance

Quatre niveaux de preuve apparaissent dans ce document, du plus solide au
moins solide — chaque fait cité porte implicitement l'un d'eux selon sa
source :

1. **Vérifié sur machine réelle** — un OP‑1 physique de l'utilisateur (reçu
   le 9 août 2026), testé le 12 août 2026 en Disk mode et en mode normal
   (voir [`HARDWARE_TESTS.md`](HARDWARE_TESTS.md),
   [`OP1_CONNECTION_MODES.md`](OP1_CONNECTION_MODES.md)). C'est la seule
   source qui vaut confirmation absolue.
2. **Vérifié sur le firmware officiel déballé localement** — OS 246 en clair
   dans `.cache/firmware/op1_246/` (gitignoré, jamais commité), lu
   directement : base SQLite, SVG, fichiers `.raw`. Voir
   [`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md).
3. **Recoupé sur plusieurs implémentations communautaires indépendantes**
   (typiquement 3) en lisant leur code source, pas seulement leur README.
   Voir [`AUDIO_FILE_FORMAT_REFERENCE.md`](AUDIO_FILE_FORMAT_REFERENCE.md).
4. **Source officielle Teenage Engineering** (page produit, guide en ligne)
   ou **source communautaire unique**, à recouper avant de coder un
   comportement précis.

Rien de ce document n'autorise une écriture automatique sur un OP‑1 — la
règle d'or reste celle de `README.md`/`FIRMWARE_SAFETY.md` : un plan préparé
n'est jamais présenté comme une écriture réussie sur la machine.

## 1. Ce qu'est un fichier `.op1`

```text
op1_246.op1
├── CRC-32 little-endian        4 octets
└── flux LZMA-Alone             reste du fichier
    └── archive TAR GNU
        ├── OP1_vdk.ldr         code principal, chiffré — hors périmètre
        ├── te-boot.ldr         bootloader — hors périmètre
        └── content/
            ├── audio/          fichiers .raw d'usine + emplacements utilisateur
            ├── display/        61 SVG d'écran
            ├── op1.db           état utilisateur (généré par la machine)
            ├── op1_factory.db   presets et moteurs — SQLite standard, ÉDITABLE
            ├── tape.db          données Tape — format non percé (§8)
            └── kerntable.db     crénage de police — aucun usage produit identifié
```

Mesuré sur OS 246 officiel ([`FIRMWARE_LAB.md`](FIRMWARE_LAB.md), niveau 2) :

| Mesure | Valeur |
|---|---:|
| Taille du fichier | 13 039 128 octets |
| SHA‑256 | `c5315218f825f143b415ca554516541898abee843d3a236df0b54c04e1fb13a9` |
| CRC stocké / recalculé | `cc08445c` / `cc08445c` (identiques) |
| Entrées TAR | 117 |
| Fichiers / dossiers | 107 / 10 |
| Données décompressées | 26 368 000 octets |
| Version / build | `R. 00246`, build `00246`, te‑boot `2.30`, `2022/11/09 16:17:00` |

Paramètres LZMA observés dans `op1repacker` : `preset=9`, `lc=3`, `lp=1`,
`pb=2`, `dict_size=2^23`.

**Codé aujourd'hui** : [`tools/firmware_inspector.py`](../tools/firmware_inspector.py)
revalide CRC/LZMA/TAR/marqueurs/SHA‑256 sans jamais extraire de chemin
dangereux (oracle Python pour un futur cœur Rust). `op1repacker` (MIT) est
vendored dans `tools/vendor/op1repacker/` et sert de moteur d'unpack/repack
en labo isolé — jamais dans le parcours utilisateur normal.

**Round‑trip confirmé** (unpack → repack sans modification) : les 107
fichiers et leur contenu sont retrouvés à l'identique, mais le fichier
reconstruit change de taille (12 115 710 octets) et de SHA‑256 — **un repack
n'est jamais une copie binaire identique** (ordre TAR, métadonnées,
compression). Conséquence produit actée : après chaque repack, revalider
CRC/LZMA/TAR/marqueurs plutôt que comparer des hashes de fichier entier.

## 2. `op1_factory.db` — la base SQLite complète (7 tables)

Ouvrable avec n'importe quel client SQLite, aucun format propriétaire caché
derrière ([`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md)) :

| Table | Lignes | Contenu |
|---|---:|---|
| `synth_types` | 10 | `cluster`, `digital`, `drwave`, `fm`, `phase`, `pulse`, `dna`, `string`, `dsynth`, `voltage` |
| `fx_types` | 7 | `grid`, `punch`, `delay`, `phone`, `spring`, `cwo`, `nitro` |
| `lfo_types` | 7 | `tremolo`, `value`, `random`, `element`, `midi`, `bend`, `crank` |
| `seq_types` | 6 | `pattern`, `endless`, `tombola`, `finger`, `sketch`, `arpeggio` |
| `drum_types` | 1 | `dbox` |
| `synth_presets` | 169 | 16 presets/moteur (`cluster`…`voltage`) + 9 en `sampler` |
| `drum_presets` | 24 | 10 en `dbox`, 14 en `drum` |

**Preuve de première main des « moteurs cachés »** : `synth_types` va de
l'id 1 à 10, **id 11 absent** ; `fx_types` a les id 3,4,5,7,8,9,10, **id 2
absent**. Exactement les id que les mods `iter` et `filter` insèrent — un
moteur/effet caché n'est pas une prouesse de reverse engineering, c'est une
case déjà présente en mémoire, jamais activée par défaut.

Format d'un preset (`synth_presets.patch`, JSON complet, exemple réel) :

```json
{"name":"auto rptr","type":"digital","octave":1,
 "adsr":[64,12352,10239,3008,2048,64,4000,4000],
 "knobs":[17408,24320,1535,10240,0,0,0,0],
 "fx_type":"nitro","fx_active":true,"fx_params":[500,15360,15660,10880,0,0,0,0],
 "lfo_type":"element","lfo_active":true,"lfo_params":[4688,-17976,2000,4880,0,0,0,0],
 "synth_version":1}
```

Seuls les 4 premières valeurs de `knobs` sont utilisées sur les moteurs
observés (les 4 suivantes restent à 0) — cohérent avec 4 encodeurs
physiques.

**Codé aujourd'hui** : rien ne lit `op1_factory.db` depuis l'app TS ; les
mods qui l'éditent passent par `op1repacker` en Python (labo isolé).
**Codable maintenant, risque contrôlé** : lecture seule de la base pour
peupler un futur éditeur de presets/moteurs (voir §6bis) — la base est déjà
SQLite standard, aucun format à percer.

## 3. `content/audio/*.raw` — audio d'usine, format confirmé par les tailles

Aucun octet d'en‑tête (`.raw` = PCM brut, mono 16 bits/44,1 kHz). Les
tailles observées confirment directement les limites déjà documentées :
plusieurs fichiers `factory_synth/` font exactement 529 200 octets, soit
`529200 / 2 / 44100 = 6,000 s` pile — la limite synthé. Les fichiers
`drum/`/`factory_drum/` s'étalent de 5,7 à 12,0 s, cohérent avec la limite
drum.

| Dossier | Fichiers | Rôle |
|---|---:|---|
| `factory_synth/` | 9 | sons d'usine synthé, ~6 s ou moins |
| `factory_drum/` | 14 | sons d'usine drum, ~10‑12 s |
| `synth/`, `drum/` (racine) | 8 chacun | emplacements utilisateur ; `synth/*.raw` = stubs 1 octet, `drum/*.raw` réels 5,7‑12 s sur cet OS (à re‑vérifier pourquoi l'asymétrie) |
| `speech/` | 1 | `op1patch.raw`, 0,66 s — probable bip vocal « OP‑1 » à la sauvegarde d'un patch |
| `preset_synth/`, `preset_drum/` | 0 | vides sur OS 246 |

**Codable, candidat (risque élevé)** : aperçu lecture seule des `.raw`
d'usine, dépend d'un décodeur AIFF/RAW déjà disponible côté app
(`app/lib/audioOracle.ts`/`aiffPatchOracle.ts`) ; remplacement d'un son
d'usine reste classé **expérimental** (`FIRMWARE_LAB_FUNCTIONS.md` §D).

## 4. Les moteurs, effets, LFO, séquenceurs — inventaire complet et recoupé

Établi en croisant la page produit officielle, le guide officiel §18.1 et la
lecture directe d'`op1_factory.db` — les trois sources se recoupent
exactement. Détail complet :
[`SYNTH_ENGINES_REFERENCE.md`](SYNTH_ENGINES_REFERENCE.md),
[`EFFECTS_LFO_SEQUENCERS_REFERENCE.md`](EFFECTS_LFO_SEQUENCERS_REFERENCE.md).

### 4.1 Les 13 moteurs officiels + 1 caché

| # | Moteur | Description TE | Table | Écran SVG |
|---:|---|---|---|---|
| 1 | Cluster | multi layered oscillator cluster | `synth_types` id 1 | `cls.svg` |
| 2 | Digital | true digital synthesis | id 2 | `t10.svg` |
| 3 | Dr. Wave | frequency domain synthesis | id 3 | `drw.svg` (vide sur OS 246) |
| 4 | FM | four operator FM synthesis | id 4 | `fm.svg` + `fmpopup.svg` |
| 5 | Phase | phase distortion | id 5 | `pd.svg` |
| 6 | Pulse | dual pulsetrain oscillator | id 6 | `pls.svg` |
| 7 | DNA | CPU Id Noise synthesis | id 7 | `id.svg` |
| 8 | String | waveguide string model | id 8 | `st.svg` |
| 9 | D‑Synth | multi envelope dual oscillator | id 9 | `dsynth.svg` |
| 10 | Voltage | multi oscillator electric synthesis | id 10 | `slump.svg` |
| 11 | D‑Box | teenage drum synthesizer | `drum_types` id 1 | `dbox.svg` |
| 12 | Synth Sampler | teenage sample player (lecteur, pas un moteur paramétrique) | — | `sampler.svg` |
| 13 | Drum Sampler | teenage percussion sample player | — | `drum2.svg` |
| **14 (caché)** | **Iter** | absent de la doc TE, présent en mémoire | `synth_types` id **11** | `iter.svg` |

### 4.2 Les 7 effets + 1 caché

| Effet | Description TE | id | SVG |
|---|---|---:|---|
| Delay | solid state delay | 5 | `delay.svg` |
| Grid | three dimensional feedback plate | 3 | `grid.svg` |
| Nitro | dual resonant turbo filter | 10 | `ftwo.svg` |
| Phone | hacked telephone system | 7 | `ptch.svg` |
| Punch | hard hitting low pass filter | 4 | `mllp.svg` |
| Spring | mathematic reverb | 8 | `rymd.svg` |
| CWO | pitch shifting delay | 9 | `bode.svg` |
| **Filter (caché)** | absent de la doc TE | id **2** | — |

### 4.3 Les 7 LFO et les 6 séquenceurs (7 usages)

LFO : Tremolo, Value, Random, Element, MIDI, Bend, Crank — aucun élément
caché trouvé ici (contrairement aux moteurs/effets).

Séquenceurs : Pattern (16 pas), Finger (Synth **et** Drum, même entrée en
base id 4, 32 pas performance), Endless (128 pas), Tombola, Sketch, Grid
(nom affiché) / `arpeggio` (nom interne, id 6 — ne pas confondre avec
l'effet Grid, mécanisme totalement différent).

### 4.4 Bilan caché

| Catégorie | Officiel | Caché | Total réel |
|---|---:|---:|---:|
| Moteurs | 13 | 1 (Iter) | 14 |
| Effets | 7 | 1 (Filter) | 8 |
| LFO | 7 | 0 | 7 |
| Séquenceurs | 6 objets | 0 | 6 |

**Codé aujourd'hui** : rien côté app TS ne pilote moteurs/effets/LFO/
séquenceurs — c'est un référentiel de connaissance, pas encore un éditeur.
**Codable, candidat structurant** : un éditeur de moteur/preset (§6bis) qui
lit cette table pour peupler ses listes déroulantes, sans réinventer de
nomenclature.

## 5. Format patch — AIFF + chunk `APPL`/`op‑1` (schéma complet)

Recoupé sur 3 implémentations indépendantes (`op-patch-util` Rust,
`teoperator` Go, `op1aiff` Python — les trois font *exactement* la même
chose au chunk près). Détail binaire complet :
[`AUDIO_FILE_FORMAT_REFERENCE.md`](AUDIO_FILE_FORMAT_REFERENCE.md).

### 5.1 Enveloppe

Un patch OP‑1 est un **AIFF valide** (`FORM`/`COMM`/`SSND`) auquel un chunk
`APPL` est inséré **juste avant** `SSND`. `COMM` reste un AIFF ordinaire :
mono, 16 bits, 44 100 Hz.

```text
"APPL"      4 octets ASCII, id de chunk AIFF standard
<taille>    4 octets big-endian = 4 (signature) + longueur JSON (+ remplissage)
"op-1"      4 octets ASCII — signature d'application du chunk APPL
<JSON>      patch compact, terminé par un octet nul ou la fin du buffer
<padding>   0+ octets pour un total multiple de 4 (règle la plus stricte des 3 sources)
```

### 5.2 Schéma JSON — Drum (24 touches)

| Champ | Type | Taille | Plage / unité |
|---|---|---|---|
| `type` | string | — | `"drum"` (aussi `"iter"` observé, moteur caché) |
| `name` | string | — | nom affiché, ≤10 caractères simples |
| `drum_version` | int | — | 1 ou 2 |
| `octave` | int | — | 0 dans tous les exemples observés |
| `start`/`end` | array | 24 | échelle interne, **pas un index d'échantillon** — voir §5.4 |
| `pitch` | array | 24 | -24567..24567 (-48..+48 demi‑tons) |
| `reverse` | array | 24 | 8192 = normal, 16384 = inversé |
| `volume` | array | 24 | 0/8192/16384 observés ; `8192 × (gain+1.0)` pour gain -1.0..+1.0 |
| `playmode` | array | 24 | 0/8192/16384 observés |
| `dyna_env` | array | 8 | enveloppe dynamique globale |
| `fx_active`/`fx_type`/`fx_params` | bool/string/array(8) | — | plage dépend du type |
| `lfo_active`/`lfo_type`/`lfo_params` | bool/string/array(8) | — | plage dépend du type |

### 5.3 Schéma JSON — Sampler / Synth

| Champ | Type | Plage |
|---|---|---|
| `type` | string | nom du moteur (`sampler`, `cluster`, `digital`, `dna`, `drwave`… — cohérent avec §4.1) |
| `name` | string | — |
| `synth_version` | int | 1 ou 2 |
| `octave` | int | -2..2 |
| `base_freq` | float | **sampler uniquement**, ex. `440.0` — fréquence jouée par l'échantillon d'origine |
| `adsr` | array(8) | attack/decay/sustain/release/playmode/portamento |
| `knobs` | array(8) | seuls les 4 premiers utilisés par la plupart des moteurs |
| `fx_*`, `lfo_*` | — | identique au drum |

### 5.4 Piège concret : `start`/`end` du Drum ne sont pas des index

```go
var MAXENDPOINT = int64(2147483646)      // valeur max observée
var SAMPLECONVERSION = int64(4058)       // 2147483646 / (44100 * 12)
```

La plage entière `0..2147483646` représente **12 secondes maximum d'un
sample drum**, pas la longueur réelle du fichier. Conversion en secondes
réelles : `secondes = (raw / 2147483646) × 12`. **Non vérifié sur
matériel** — à confirmer avant de s'en servir pour autre chose que
l'affichage (`drumMarkersInSeconds`, déjà codé en lecture, voir §14).

### 5.5 Valeurs et plages par moteur/effet/LFO (extrait, `teoperator`)

| Catégorie | Nom | Knob 1 | Knob 2 | Knob 3 | Knob 4 |
|---|---|---|---|---|---|
| Moteur | `cluster` | 3072–17408 (pas 128) | 0–32767 | 512–24064 | 3–1638 |
| Moteur | `digital` | 0–32767 | 2048–26624 | -32768–32767 | 0–32767 |
| Moteur | `dna` | -29491–32767 | 4608–12800 | 0–32767 | 0–32767 |
| Effet | `nitro` | 64–16448 | -32768–32768 (pas 512) | 0–20643 | 64–16448 |
| Effet | `delay` | 1024–11264 | 3276–32767 | 0–16384 | 0–32767 |
| ADSR (tous moteurs) | attack/decay/release | 64–16320 (pas 512) | sustain 0–32767 | playmode `{2048,5120,11264,14336}` = poly/mono/legato/unison | — |

Table complète dans `teoperator/src/op1/synth.go` (`.cache/community-tools/teoperator/`).
`op1-docs/lfo.md` donne un 3e jeu de plages par sous‑paramètre de LFO, avec
une nomenclature différente — les deux sources ne se recoupent pas
terme à terme, à réconcilier avant un éditeur définitif.

**Codé aujourd'hui** :
[`app/lib/aiffPatchOracle.ts`](../app/lib/aiffPatchOracle.ts) lit ce format
en entier (parseur AIFF big‑endian, décodage du flottant étendu 80 bits,
lecture `APPL`/`op‑1`, `drumMarkersInSeconds`) — **lecture seule**,
14 tests. L'**écriture** d'un patch reste déléguée à `op-patch-util` via
[`tools/patch_bridge.py`](../tools/patch_bridge.py) (décision actée,
`TOOLING_AUDIT.md`) — pas un chantier JS, pour ne pas dupliquer un format
binaire déjà maîtrisé par un outil Rust MIT audité.

## 6. Boutons machine ↔ champs JSON (Synth/Drum, T1–T4)

Détail complet : [`SYNTH_DRUM_MODE_REFERENCE.md`](SYNTH_DRUM_MODE_REFERENCE.md).
Les deux modes partagent la même disposition — les 4 touches de mode
correspondent **terme à terme** aux 4 groupes de champs du patch (§5.2/5.3) :

| Touche | Sans Shift | Avec Shift | Champ JSON |
|---|---|---|---|
| `T1` | Moteur actif | Parcourir/choisir le moteur | `type`, `knobs[0..3]` |
| `T2` | Enveloppe (Synth ADSR) | Play Mode (Synth) / région (Drum) | `adsr[0..3]` / `dyna_env` |
| `T3` | Effet on/off | Parcourir/choisir l'effet | `fx_active`, `fx_type`, `fx_params` |
| `T4` | LFO on/off | Parcourir/choisir le LFO | `lfo_active`, `lfo_type`, `lfo_params` |

**Drum, édition par touche** (24 touches = 24 samples) : Bleu = pitch
(`Shift` = reverse) ; Vert = `start` (`Shift` = réglage fin) ; Blanc = `end`
(`Shift` = réglage fin) ; Orange = `playmode` (`Shift` = `volume`).

**LIFT/DROP a trois significations différentes selon le mode actif** — à ne
jamais fusionner dans une seule fonction générique côté app :
1. En Drum : maintenir touche source + `LIFT`, puis destination + `DROP` =
   copier un mapping de touche.
2. En Synth : bounce son→tape (transfert vers la bande).
3. En Tape (§7) : buffer mémoire unique pour un take audio déjà enregistré.

**Codé aujourd'hui** : sélection type synth/drum, fréquence de base, octave,
mode basse résolution dans `SoundControlsPanel.tsx` ; grille 24 pads fidèle
à la disposition physique dans `SoundPadGrid.tsx`. **Absent** : édition
ADSR/knobs/FX/LFO (T1‑T4), édition par touche du Drum, snapshot — voir §6bis.

## 6bis. L'éditeur de moteur — patrons visuels déjà dessinés par TE

Idée creusée dans [`ENGINE_EDITOR_CONCEPT.md`](ENGINE_EDITOR_CONCEPT.md) :
on n'a pas besoin d'inventer le langage visuel, la machine l'a déjà dessiné
à trois endroits, lus directement dans les SVG du firmware :

1. **`cls.svg`** (écran Cluster) : 4 knobs (dot + aiguille, couleurs machine
   `#4D9EFF`/`#00ED95`/`#FFFFFF`/`#FF3A5D`) + 4 courbes « caractère ». **Mais
   ce patron ne se généralise PAS** : en ouvrant les 6 autres écrans moteur
   (`pd`, `pls`, `st`, `id`, `slump`, `t10`), aucun ne reproduit ce groupe —
   chaque moteur a sa propre mise en scène (String = 2 formes d'onde, DNA =
   champ de points monochrome, Voltage = oscilloscope stéréo, Digital =
   quasi abstrait). Conclusion : le jeu 4 knobs est probablement un
   **calque affiché par le code natif** au‑dessus de l'écran moteur, pas un
   asset par moteur — à traiter comme un composant overlay partagé, séparé
   du fond visuel propre à chaque moteur (à dessiner 10 fois, pas 1 fois).
2. **`adsr.svg`** : widget d'enveloppe partagé par les 10 moteurs (segments
   attaque/decay/sustain/release, points accrochables colorés).
3. **`signalflow.svg`** : schéma de routage complet (clavier → instrument →
   séquenceur → LFO → FX → pistes Tape → mixer → EQ → drive), 30 groupes
   nommés — référence si l'éditeur veut représenter le routage plutôt qu'un
   seul moteur isolé.

Un preset réel (§2) contient déjà tout ce qu'il faut pour piloter cet
affichage sans rien inventer (`knobs`, `adsr`, `fx_type`/`fx_active`,
`lfo_type`/`lfo_active`).

**Codable, candidat structurant, pas commencé** : éditeur de synthèse qui
**fabrique** un son (pas seulement l'import de sample), avec un contrôle de
compatibilité qui **refuse les valeurs hors plage** (§5.5) avant export —
sans ce garde‑fou, l'utilisateur peut construire un patch qui ressemble à un
JSON valide mais plante ou sonne mal sur la machine réelle.

## 7. Mode Tape — comportement (pas juste le format)

Détail complet : [`TAPE_MODE_REFERENCE.md`](TAPE_MODE_REFERENCE.md).

- **6 minutes au total, partagées par les 4 pistes** (pas 6 min/piste),
  44,1 kHz/16 bits, tête de lecture commune aux 4 pistes.
- **Overdub destructif par défaut** : enregistrer sur une piste déjà remplie
  écrase le contenu, sauf `LIFT` préalable.
- **LIFT/DROP** : buffer mémoire **unique** (pas une pile) ; `SHIFT+LIFT`
  lève les 4 pistes en même temps (mixdown rapide « ping‑pong » : lift 4
  pistes → drop dans le sampler drum = mono instantané) ; `LIFT` sans `DROP`
  = suppression.
- **SPLIT** coupe à la position de tête ; `SHIFT+SPLIT` joint le take le
  plus proche ; `SHIFT+TAPE` = fonction d'effacement dédiée.
- **Varispeed** : encodeur blanc, modifiable **pendant l'enregistrement** ;
  `SHIFT`+encodeur = pas fixes. Change pitch et qualité perçue, comme une
  vraie bande.
- **Tape Tricks** (touches `1`–`8` en mode Tape) : Loop In/Out/Toggle,
  Break, Chop, Memo 1/2.
- **Mixer** (étage en aval, pas encore vérifié sur manuel officiel) : niveau
  0‑99 + pan par piste, EQ 3 bandes, effet master stéréo, Master Out avec
  balance et drive. **Un export `track_N.aif` individuel ne contient jamais
  ces traitements** — le son « final » entendu sur la machine ne se
  reconstruit pas en sommant les 4 fichiers bruts.

**Codé aujourd'hui** : bande unique 360 s, 4 pistes (`StudioTapeEditor.tsx`
et al.), édition souris libre (déplacement de clip n'importe où — **va
au‑delà du hardware**, différence assumée du clone). **Absent** :
overdub destructif, LIFT/DROP, SPLIT/SPLICE, Tape Tricks, écran Mixer
séparé. Recommandation actée : traiter ces comportements comme des
**fonctionnalités en plus** de la souris, pas un remplacement — ils
servent des usages (bounce, ping‑pong, split au point de tête) que la
souris seule ne reproduit pas.

## 8. Arborescence du disque OP‑1 — confirmée sur vraie sauvegarde matérielle

Une sauvegarde réelle existe en local
(`backups/OP-1_2026-08-12_01-00/`, gitignorée, jamais commise — issue du
test matériel du 12 août 2026, voir [`HARDWARE_TESTS.md`](HARDWARE_TESTS.md))
et confirme la structure au-delà de ce que documentent les outils
communautaires :

```text
OP-1_2026-08-12_01-00/
├── album/
│   ├── side_a.aif        ← nom confirmé en minuscules + underscore
│   └── side_b.aif
├── drum/user/
│   ├── 1.aif … 8.aif     ← 8 emplacements numérotés
│   └── aftermat.aif, boombap2.aif, flobass7.aif, gameboi5.aif,      ← + jusqu'à
│       korgpss5.aif, lofibrea.aif, metalgui.aif, mfdoom77.aif,        16 fichiers
│       ntlowfid.aif, po123815.aif, vinylcra.aif                        nommés observés
├── synth/user/
│   ├── 1.aif … 8.aif     ← 8 emplacements numérotés
│   └── 80sbass3.aif, blueguit.aif, cuica169.aif, … memorymo32.aif,   ← + de 30
│       memorymo36.aif, memorymo56.aif …                                fichiers nommés
└── tape/
    ├── track_1.aif … track_4.aif
```

**Deux corrections concrètes apportées par cette preuve de première main** :

1. **`synth/user` et `drum/user` ne sont pas limités à 8 emplacements** —
   l'hypothèse « 8 slots numérotés » (déduite des seules touches `1`‑`8`)
   est incomplète : la machine accepte manifestement bien plus de fichiers
   nommés dans ces dossiers (30+ observés côté synth). Ne jamais coder en
   dur un nombre de patches contesté, comme le dit déjà
   [`OP1_KNOWLEDGE_BASE.md`](OP1_KNOWLEDGE_BASE.md) — mesurer et signaler la
   capacité observée.
2. **La limite « 10 caractères simples »** pour un nom destiné à la machine
   est confirmée exactement par les noms réels observés (`aftermat`,
   `boombap2`, `flobass7`… tous ≤10 caractères, alphanumériques minuscules).

Ce dossier de sauvegarde contient des échantillons audio réels de
l'utilisateur — jamais lu ni redistribué au‑delà de cette liste de noms de
fichiers, cohérent avec `*.aif` dans `.gitignore`.

**Codé aujourd'hui** : `tools/backup_manifest.py` et
`tools/device_transfer_plan.py` savent inventorier/sauvegarder/planifier un
transfert sur un volume Disk mode réel (déjà testé, §9). **Candidat
immédiat, faible risque** : afficher dans l'UI de la bibliothèque Sons un
avertissement quand un dossier `user` dépasse 8 fichiers plutôt que de
supposer une limite fixe.

## 9. Modes de connexion PC — matrice et preuves matérielles

Détail complet : [`OP1_CONNECTION_MODES.md`](OP1_CONNECTION_MODES.md).

| Mode OP‑1 | Sélection | Preuves PC attendues | Autorisations app |
|---|---|---|---|
| Normal | `COM`→`T1`/`OP‑1` | USB, interfaces MIDI/audio | état, audio, MIDI ; aucun fichier |
| Contrôleur MIDI | `COM`→`T2`/`CTRL` | interfaces MIDI, pas de volume | MIDI entrant/sortant ; aucun fichier |
| Disk | `COM`→`T3`/`DISK` | volume avec `tape`/`album`/`synth`/`drum` | inventaire + sauvegarde ; écriture seulement par plan confirmé |
| TE‑boot | éteint, `COM` au démarrage | petit volume de maintenance | parcours firmware officiel guidé seulement |
| Charge seule | câble sans interface exploitable | rien de suffisant | aucun accès |
| Inconnu/transition | déconnexion, changement | signaux partiels | lecture minimale ; toute mutation bloquée |

**Vérifié sur machine réelle le 12 août 2026** : mode Disk sur `E:`
(inventaire 67 fichiers / 282 529 116 octets, sauvegarde + restauration +
vérification SHA‑256 + comparaison de 2 snapshots = 11 différences
détectées, toutes OK) ; mode normal sous Windows avec `VID_2367&PID_0004`,
sortie audio « Haut‑parleurs (OP‑1) », ports MIDI `OP‑1 [2]`/`OP‑1 [3]`.

**Règle d'identification** : combiner classe USB, VID/PID, point de
montage, structure du volume, interfaces audio/MIDI et stabilité de
l'observation — le VID/PID seul n'est jamais suffisant. Une déconnexion,
un changement de volume ou une structure modifiée fait revenir la session à
`Inconnu`.

**Codé aujourd'hui** : détection silencieuse à l'ouverture de Studio,
écoute des deux ports MIDI d'entrée, décodage note‑on/note‑off tous canaux.
**Reste à vérifier** : éjection native automatique, transfert d'un pack
complet préparé par l'app, reprise après déconnexion pendant une copie,
capture MIDI/audio interactive dans Chrome/Edge (aucun navigateur
automatisable disponible dans cet environnement de développement).

## 10. Le système graphique (écrans SVG)

### 10.1 Inventaire — 61 SVG, 5 profils de dimension

| Profil | Nombre | Règle d'édition |
|---|---:|---|
| `320×160` | 53 | profil écran standard, éditable |
| `340.156×170.079` (`colors.svg`) | 1 | référence interne, lecture seule |
| `340.157×170.078` (`fmpopup`, `octave`, `save`) | 3 | profil spécifique, pas de conversion auto |
| `340.2×170.1` (`in`, `micline`) | 2 | profil spécifique, pas de conversion auto |
| `1000×700` (`lander.svg`) | 1 | easter egg « Chop Lifter! », verrouillé |
| `2182.676×1444.252` (`opfont.svg`) | 1 | police vectorielle, éditeur pixel interdit |

### 10.2 Deux faits qui contraignent tout outil de dessin

1. **Aucune balise `<text>` dans le firmware** — tout texte visible est déjà
   vectorisé en `path`/`line`/`polyline` au moment de l'export Illustrator.
   Un outil de dessin qui veut du texte lisible doit soit vectoriser une
   police maison, soit réutiliser des groupes de lettres déjà présents
   (ex. `_x31_`…`_x34_` = chiffres de piste 1‑4).
2. **`opfont.svg`** (66 811 octets) est la police vectorielle complète du
   système — confirme et complète le point 1.

### 10.3 Palette réelle (confirmée sur firmware officiel, pas estimée)

| Couleur | Hex | Usage |
|---|---|---|
| Encodeur vert | `#00ed95` | encodeur physique |
| Encodeur rouge | `#ff3a5d` | encodeur physique |
| Encodeur bleu | `#698eff` | encodeur physique |
| Encodeur blanc | `#dfd9ff` | 4e encodeur + éléments dynamiques (bande Tape, EQ aigus) |
| Fond violet | `#9256d7` | fond d'écran |
| Texte | `#aeb1dc` | texte d'interface |

**Bug de code trouvé, pas encore corrigé** : la machine a 4 encodeurs
**bleu/vert/blanc/rouge** (déjà correct dans `MachineControls`,
`app/page.tsx`) mais `app/globals.css` (`--orange: #f26c38`) et le logo
utilisent un **orange** à la place du **blanc** pour le 4e encodeur — pas la
vraie couleur machine. Noté dans `GUI_REDESIGN_BRIEF.md` §2, pas corrigé
pour ne pas toucher `globals.css` pendant un autre chantier en cours.

### 10.4 Dictionnaire de codenames (61 fichiers, taux d'identification)

Recoupé sur la doc `op1-glitter` + lecture directe des tables SQLite — fait
tomber le taux de SVG « non identifié » de 31/61 à 18/61. Exemples :
`bode.svg`=CWO, `cls.svg`=Cluster, `drum2.svg`=éditeur samples Drum,
`ftwo.svg`=Nitro, `id.svg`=DNA, `mllp.svg`=Punch, `ok.svg`=Finger,
`pd.svg`=Phase, `pls.svg`=Pulse, `ptch.svg`=Phone, `rymd.svg`=Spring,
`simple.svg`=Arpeggio, `slump.svg`=Voltage, `st.svg`=String, `t10.svg`=Digital.
8 de plus identifiés par lecture directe des groupes internes :
`tombola.svg`, `sketch.svg`, `dbox.svg`, `grid.svg`, `in.svg`,
`micline.svg`, `dsynth.svg`, `drw.svg` (stub vide, à confirmer). Détail
complet et fichiers encore non identifiés (`etchasketch`, `mmmf`, `tune`…) :
[`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md).

**Codé aujourd'hui** : [`tools/display_bridge.py`](../tools/display_bridge.py)
trie/catégorise les 61 SVG avec un niveau de confiance par fichier, produit
un manifeste et un patch JSON (`op1_gfx.patch_image_file`) par fichier.
`Op1PixelEditor.tsx` (composant local, pas de dépendance lourde, inspiré de
Dotting/Piskel étudiés dans
[`PIXEL_EDITOR_ARCHITECTURE.md`](PIXEL_EDITOR_ARCHITECTURE.md)) est le
premier prototype d'éditeur pixel — grille, zoom, outils de dessin de base,
export SVG déterministe, **aucun export firmware à ce stade**.
**Candidat, pas commencé** : mode « thème » (une table couleur→couleur
appliquée à tous les écrans d'un coup, mécanisme déjà documenté par
`op1-glitter`, §12) ; validation `op1svg` avant tout import de SVG
utilisateur arbitraire (garde‑fou manquant, pas un choix produit).

## 11. Catalogue des mods firmware — vérifié / candidat / exclu

Détail complet : [`FIRMWARE_MOD_CATALOG.md`](FIRMWARE_MOD_CATALOG.md),
registre machine‑lisible [`data/mods/catalog.json`](../data/mods/catalog.json).
Vérifié en appliquant les mods sur une copie de l'OS 246, en repackant, puis
en relisant avec l'inspecteur OP‑1 Studio — CRC/LZMA/TAR et 117 entrées
confirmés à chaque fois.

| Priorité | Mod | État | Risque |
|---|---|---|---|
| P0 | Activer Iter (moteur caché) | **vérifié OS 246** | contrôlé |
| P0 | Presets Iter | **vérifié OS 246** | contrôlé |
| P0 | Activer Filter (effet caché) | **vérifié OS 246** | contrôlé |
| P1 | Valeurs `subtle-fx` (FX moins agressifs) | **vérifié OS 246** | contrôlé |
| P1 | Quantification par gammes | patch communautaire, **non intégré** | critique |
| P1 | Presets/samples d'usine personnalisés | candidat, fixtures nécessaires | élevé |
| P2 | Tape invert | **vérifié en labo** | contrôlé |
| P2 | Iter Lab | **vérifié** | contrôlé |
| P2 | Iter Lost Art | partiel (fixture repack manquante) | contrôlé |
| P2 | CWO moose/cat/dog/wizard | **vérifiés séparément**, choix exclusif | contrôlé |
| P2 | Thème Glitter (couleur globale) | mécanisme documenté, **moteur pas encore écrit** | contrôlé/élevé |
| P3 | Moteur compilé supplémentaire | aucune preuve reproductible | critique |
| P3 | flash/OTP/ECC/bootloader | **exclu** | rouge |

**Règle absolue, jamais négociable** : conserver un firmware officiel propre
+ SHA‑256 ; un seul plan de mods à la fois ; repack puis revalidation
complète ; résultat marqué `UNOFFICIAL-MODIFIED` ; jamais de copie
automatique sur le volume TE‑boot ; toujours un chemin de retour au
firmware officiel.

**Codé aujourd'hui** : [`tools/firmware_bridge.py`](../tools/firmware_bridge.py)
prépare un build reproductible avec manifeste SHA‑256, sans jamais monter
ni flasher. **Codable, faible risque** : les mods P0/P1 `subtle-fx` sont
déjà vérifiés et pourraient être exposés dans l'UI dès que la fenêtre
Firmware (§13) est prête à les afficher avec le marquage
`UNOFFICIAL-MODIFIED` requis.

## 12. Outils communautaires — décision d'usage par outil

Vue complète : [`TOOLING_AUDIT.md`](TOOLING_AUDIT.md),
[`TOOLING_GAP_ANALYSIS.md`](TOOLING_GAP_ANALYSIS.md),
[`TOOLING_SHORTLIST.md`](TOOLING_SHORTLIST.md), registre
[`tools/sources.yml`](../tools/sources.yml). Clonés localement dans
`.cache/community-tools/` (gitignoré) : `op1repacker`, `op1REpackerGUI`,
`op1-docs`, `op1svg`, `op1aiff`, `opie`, `teoperator`, `op-patch-util`,
`op1-glitter`, `OP-1Z-Sample-Manager`, `connect-op1`.

| Outil | Licence | Où il est réellement utilisé |
|---|---|---|
| `op1repacker` | MIT | **vendored**, `firmware_bridge.py`, `display_bridge.py` |
| `op-patch-util` | à vérifier | installé via Cargo, appelé par `patch_bridge.py` |
| FFmpeg | — | sidecar, `sample_preflight.py`/`tape_bridge.py` |
| Dictionnaire `op1-glitter` | — | recopié en dur dans `display_bridge.py` (codenames + palette) |
| `op1aiff`, `op1svg` | MIT | **audités, jugés utiles, jamais branchés** — voir angle mort ci‑dessous |

**Constat net de `TOOLING_GAP_ANALYSIS.md`** : sur toute la liste auditée,
seuls **`op1aiff`** (inspection AIFF/preset, aujourd'hui couvert
différemment par `app/lib/aiffPatchOracle.ts`, code original plutôt que
porté) et **`op1svg`** (normalisation/validation SVG avant injection — ce
garde‑fou manque réellement pour l'import de SVG arbitraire) restent des
angles morts réels. Tout le reste est soit déjà couvert par nos propres
bridges, soit laissé en référence par choix documenté.

**Le vrai trou identifié** (pas un outil communautaire, un manque
architectural) : `ARCHITECTURE.md` prévoit un domaine Rust
(`DeviceIdentity`, `ChangePlan`, `BackupManifest`…) ; `src-tauri/src/main.rs`
fait 30 lignes et n'expose qu'une commande statique. Toute la logique vit en
Python (`tools/*.py`) — très bien pour un labo local reproductible, mais ne
peut pas devenir le cœur d'une app Tauri packagée (M8) sans réécriture ou
appel en sidecar.

## 13. Ce qui est déjà codé dans notre outil — carte complète

| Bridge/module | Rôle | Écrit sur la machine ? |
|---|---|---|
| `tools/firmware_inspector.py` | CRC/LZMA/TAR/SHA‑256, lecture seule | non |
| `tools/firmware_fetch.py` | téléchargement officiel validé (HTTPS, hôte, taille, conteneur) | non |
| `tools/firmware_bridge.py` | build reproductible + manifeste SHA‑256 | non |
| `tools/display_bridge.py` | tri/catégorisation SVG, patch JSON par fichier | non |
| `tools/svg_preflight.py` | validation SVG sans modifier la source | non |
| `tools/patch_bridge.py` | adaptateur sûr autour d'`op-patch-util` | non |
| `tools/sample_preflight.py` | validation/conversion samples (FFmpeg si dispo) | non |
| `tools/tape_bridge.py` | préparation de 4 pistes locales pour import Tape | non |
| `tools/device_inventory.py` | inspection d'un volume Disk mode monté | non |
| `tools/device_transfer_plan.py` | plan de transfert **jamais exécuté** | non |
| `tools/backup_manifest.py` | sauvegarde + manifeste SHA‑256 | non (copie vers coffre séparé) |
| `tools/content_catalog.py` | bibliothèque locale avec provenance/hash | non |
| `tools/aiff_inspector.py` | inspection conteneur AIFF, lecture seule | non |
| `tools/project_bridge.py` | format projet OP‑1 Studio versionné | non |
| `tools/profile_bridge.py` | profil utilisateur dans un coffre local | non |
| `app/lib/audioOracle.ts` | oracle WAV (porté EP‑133, MIT) | — (navigateur) |
| `app/lib/aiffPatchOracle.ts` | oracle AIFF + patch OP‑1 (original) | — (navigateur) |
| `app/lib/audioConvert.ts` | conversion locale → AIFF mono 44,1 kHz/16 bits | — (navigateur) |
| `app/lib/keyboardLayout.ts` | repère de colonnes partagé clavier/exercices | — |
| `app/lib/midiFileImport.ts` | parseur Standard MIDI File | — |
| `Op1PixelEditor.tsx` | éditeur pixel local, pas d'export firmware encore | — |

**Aucun de ces modules n'écrit automatiquement sur un volume TE‑boot ou ne
flashe un firmware** — cohérent avec la règle d'or à travers tout le dépôt.

## 14. Ce qui est codable maintenant, priorisé (faible risque, gain direct)

1. **Éditeur de moteur/preset en lecture** (§4, §6bis) : peupler l'UI depuis
   `op1_factory.db` (SQLite standard, déjà lisible) plutôt que réinventer
   une nomenclature — bloqué seulement par l'absence d'un pont Rust/Tauri
   ou d'un bridge Python dédié à exposer cette lecture côté app.
2. **Avertissement « plus de 8 fichiers »** dans la bibliothèque Sons (§8) —
   correction directe d'une hypothèse fausse, aucune dépendance nouvelle.
3. **`op1svg`** comme garde‑fou de validation avant tout import de SVG
   utilisateur (§10.4, §12) — bloque une fonction aujourd'hui classée
   expérimentale faute de validation, pas par choix produit.
4. **Mode thème global** dans `display_bridge.py` (table couleur→couleur
   appliquée à tous les SVG d'un coup, §10.4, §12) — mécanisme déjà
   documenté par `op1-glitter`, reste seulement à écrire le moteur local.
5. **Contrôle de compatibilité avant export** d'un patch (§6bis, §5.5) :
   refuser/clamper les valeurs hors plage (`AllowedADSR`,
   `AllowedEngine`…) — condition pour que l'éditeur de moteur, une fois
   construit, ne produise jamais un patch qui plante sur la machine.
6. **Exposer les mods P0/P1 déjà vérifiés** (`iter`, `filter`,
   `presets-iter`, `subtle-fx`, §11) dans l'UI Firmware, avec le marquage
   `UNOFFICIAL-MODIFIED` déjà requis par la politique de sécurité.

## 15. Explicitement hors périmètre — et pourquoi

| Zone | Pourquoi exclue |
|---|---|
| `OP1_vdk.ldr` (code principal) | chiffré, recherche communautaire seulement — aucun contournement |
| OTP/ECC/flash/bootloader | risque matériel critique, peut rendre l'appareil inutilisable |
| Automatisation des touches TE‑boot `7`/`8` | reset usine / formatage, destructif, doit rester un geste humain volontaire |
| Format `tape.db` | non percé par 12 dépôts communautaires étudiés — positionner des clips avec points de loop précis (comme LIFT/DROP/SPLIT machine) ne peut pas être répliqué tant que ce format n'est pas compris |
| `op1dumps`, `op1-decryptor` | recherche flash/chiffrement — exclus du produit, veille seulement |
| Écriture automatique sur volume TE‑boot | jamais, quel que soit le parcours (officiel ou labo expert) |

## 16. Ce qui reste à vérifier sur matériel (liste vivante)

- nom/label exact des volumes selon système et version OS ;
- comportement après copie d'un fichier temporaire ou inconnu sur le
  volume Disk ;
- variantes exactes des noms d'album (`sideA.aif` vs `side_a.aif` selon
  version — confirmé `side_a.aif`/`side_b.aif` sur le test du 12 août,
  d'autres versions restent à vérifier) ;
- limites de patches réellement imposées par chaque version de firmware ;
- reconstruction des index après restauration ;
- conservation des chunks AIFF inconnus par les bibliothèques choisies ;
- VID/PID selon mode normal (confirmé `2367:0004`), Disk et TE‑boot (pas
  encore confirmés séparément) ;
- comportement `start`/`end` du Drum (§5.4) sur un patch réellement rejoué ;
- éjection native automatique, reprise après déconnexion pendant une copie ;
- capture MIDI/audio interactive dans Chrome/Edge avec Web MIDI ;
- mode TE‑boot et flux firmware complet (jamais testé de bout en bout).

## 17. Sources

Toutes les sources primaires (pages officielles Teenage Engineering, dépôts
communautaires avec commit épinglé, méthode de reproduction) sont listées
dans [`SOURCES.md`](SOURCES.md) et [`tools/sources.yml`](../tools/sources.yml).
Les commandes exactes pour reproduire l'étude du conteneur sont dans
[`FIRMWARE_LAB.md`](FIRMWARE_LAB.md).

## Référence croisée — tous les documents consolidés ici

[`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md) ·
[`FIRMWARE_LAB.md`](FIRMWARE_LAB.md) ·
[`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md) ·
[`FIRMWARE_MOD_CATALOG.md`](FIRMWARE_MOD_CATALOG.md) ·
[`FIRMWARE_MOD_RESOURCES.md`](FIRMWARE_MOD_RESOURCES.md) ·
[`FIRMWARE_SAFETY.md`](FIRMWARE_SAFETY.md) ·
[`OP1_KNOWLEDGE_BASE.md`](OP1_KNOWLEDGE_BASE.md) ·
[`AUDIO_FILE_FORMAT_REFERENCE.md`](AUDIO_FILE_FORMAT_REFERENCE.md) ·
[`SYNTH_DRUM_MODE_REFERENCE.md`](SYNTH_DRUM_MODE_REFERENCE.md) ·
[`TAPE_MODE_REFERENCE.md`](TAPE_MODE_REFERENCE.md) ·
[`SYNTH_ENGINES_REFERENCE.md`](SYNTH_ENGINES_REFERENCE.md) ·
[`EFFECTS_LFO_SEQUENCERS_REFERENCE.md`](EFFECTS_LFO_SEQUENCERS_REFERENCE.md) ·
[`ENGINE_EDITOR_CONCEPT.md`](ENGINE_EDITOR_CONCEPT.md) ·
[`PATCH_EDITOR_SPEC.md`](PATCH_EDITOR_SPEC.md) ·
[`OP1_CONNECTION_MODES.md`](OP1_CONNECTION_MODES.md) ·
[`HARDWARE_TESTS.md`](HARDWARE_TESTS.md) ·
[`IMAGE_LIBRARY.md`](IMAGE_LIBRARY.md) ·
[`PIXEL_EDITOR_ARCHITECTURE.md`](PIXEL_EDITOR_ARCHITECTURE.md) ·
[`TOOLING_AUDIT.md`](TOOLING_AUDIT.md) ·
[`TOOLING_GAP_ANALYSIS.md`](TOOLING_GAP_ANALYSIS.md) ·
[`TOOLING_SHORTLIST.md`](TOOLING_SHORTLIST.md) ·
[`CLONE_RESEARCH.md`](CLONE_RESEARCH.md) ·
[`SOURCES.md`](SOURCES.md)
