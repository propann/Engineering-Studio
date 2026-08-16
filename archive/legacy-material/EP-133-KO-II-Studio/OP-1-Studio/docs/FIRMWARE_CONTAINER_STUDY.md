# Étude directe du conteneur — OS 246 déballé en local

Étude du 12 août 2026, faite à la main sur le firmware officiel réellement
déballé (`.cache/firmware/op1_246/`, gitignoré, jamais commité — obtenu via
`tools/firmware_fetch.py`, jamais un fichier tiers). Ce document consigne ce
qu'on a observé concrètement, en complément de `FIRMWARE_LAB.md` (qui donne
la méthode) et `FIRMWARE_LAB_FUNCTIONS.md` (qui donne la liste de fonctions
cible) — ici, ce sont les faits bruts vus dans le fichier lui-même.

## Arborescence réelle déballée

```text
op1_246/
├── OP1_vdk.ldr        2 171 624 o   chiffré — hors périmètre
├── te-boot.ldr          261 604 o   bootloader — hors périmètre
└── content/
    ├── op1.db             37 888 o  état utilisateur — pas un fichier à éditer nous-mêmes
    ├── op1_factory.db    107 520 o  presets et moteurs — ÉDITABLE, voir plus bas
    ├── tape.db             4 096 o  données Tape — hors périmètre firmware
    ├── kerntable.db        4 096 o  crénage de police — aucun usage produit identifié
    ├── display/         61 fichiers .svg — ÉDITABLE
    └── audio/           7 dossiers, 40 fichiers .raw au total
        ├── factory_synth/   9
        ├── factory_drum/   14
        ├── synth/           8
        ├── drum/            8
        ├── speech/          1
        ├── preset_synth/    0 (vide sur cette version)
        └── preset_drum/     0 (vide sur cette version)
```

## `op1_factory.db` — SQLite standard, 7 tables

Ouvrable directement avec n'importe quel client SQLite, aucun format
propriétaire caché derrière :

| Table | Lignes | Contenu |
|---|---:|---|
| `synth_types` | 10 | moteurs actifs : `cluster`, `digital`, `drwave`, `fm`, `phase`, `pulse`, `dna`, `string`, `dsynth`, `voltage` |
| `fx_types` | 7 | effets actifs : `grid`, `punch`, `delay`, `phone`, `spring`, `cwo`, `nitro` |
| `lfo_types` | 7 | `tremolo`, `value`, `random`, `element`, `midi`, `bend`, `crank` |
| `seq_types` | 6 | `pattern`, `endless`, `tombola`, `finger`, `sketch`, `arpeggio` |
| `drum_types` | 1 | `dbox` |
| `synth_presets` | 169 | 16 presets par moteur (`cluster`…`voltage`) + 9 en `sampler` |
| `drum_presets` | 24 | 10 en `dbox`, 14 en `drum` |

**Preuve directe du "moteur caché" déjà documentée dans
`FIRMWARE_MOD_CATALOG.md`** : `synth_types` va de l'id 1 à 10, **11 est
absent** ; `fx_types` a les id 3,4,5,7,8,9,10, **2 est absent**. Ce sont
exactement les id que les mods `iter` (`synth_types` id 11) et `filter`
(`fx_types` id 2) insèrent. Confirmé sur le fichier réel, pas seulement dans
la doc communautaire citée jusqu'ici.

Format d'un preset (`synth_presets`, colonne `patch`, JSON complet) :

```json
{"name":"auto rptr","type":"digital","octave":1,
 "adsr":[64,12352,10239,3008,2048,64,4000,4000],
 "knobs":[17408,24320,1535,10240,0,0,0,0],
 "fx_type":"nitro","fx_active":true,"fx_params":[500,15360,15660,10880,0,0,0,0],
 "lfo_type":"element","lfo_active":true,"lfo_params":[4688,-17976,2000,4880,0,0,0,0],
 "synth_version":1}
```

## `content/display/*.svg` — étude d'un fichier réel (`tapeconfig.svg`)

Fichier choisi parce qu'il était déjà cité comme "réutilisable tel quel"
dans `GUI_REDESIGN_BRIEF.md`. Mesures faites directement sur le fichier :

| Mesure | Valeur observée |
|---|---|
| Taille | 35 393 octets |
| `viewBox` | `0 0 320 160` — confirme la résolution écran déjà documentée |
| Générateur | Adobe Illustrator 14.0.0 (commentaire d'en-tête du fichier) |
| Groupes `<g id="...">` | 41 |
| Éléments graphiques | 42 `path`, 102 `line`, 28 `polyline`, 20 `circle`, 7 `rect` |
| Éléments `<text>`/`<tspan>` | **0** |

### Deux faits techniques qui comptent pour le créateur de dessin

1. **Aucun texte réel dans le SVG.** Tout le texte visible à l'écran
   (labels, chiffres de piste) est déjà vectorisé en `path`/`line`/`polyline`
   par Illustrator au moment de l'export firmware — pas une seule balise
   `<text>`. Conséquence directe pour
   [`DRAWING_CREATOR_CONCEPT.md`](DRAWING_CREATOR_CONCEPT.md) : un outil de
   dessin qui voudrait ajouter du texte lisible dans le style de la machine
   devra soit vectoriser une police maison en formes, soit réutiliser des
   groupes de lettres déjà présents (ex. les groupes `_x31_` à `_x34_` sont
   les chiffres de piste 1 à 4, dessinés en primitives simples) plutôt que
   de s'appuyer sur une balise `<text>` qui ne correspond à rien
   d'observé sur le vrai firmware.
2. **La palette réelle est confirmée directement dans le fichier officiel**,
   pas seulement via la documentation communautaire `op1-glitter` citée
   dans `FIRMWARE_MOD_RESOURCES.md` : `#010101`, `#3B2D49`, `#87839C`,
   `#B4AECF`, `#FF3A5D` (le rouge des 4 encodeurs) et `none`. Le rouge
   `#FF3A5D` en particulier correspond exactement à la valeur déjà notée
   pour l'encodeur rouge — **confirmation de première main**, plus solide
   que la source communautaire seule.

## Session 2 — correction du catalogue `non_identifie` par lecture directe

`tools/display_bridge.py` classait 18 SVG en `non_identifie` faute de
confirmation externe. En ouvrant chaque fichier et en croisant sa structure
avec les tables déjà lues dans `op1_factory.db` (`synth_types`, `drum_types`,
`fx_types`, `seq_types`), huit d'entre eux s'identifient sans ambiguïté :

| Fichier | Preuve trouvée dans le fichier | Identification | Catégorie proposée |
|---|---|---|---|
| `tombola.svg` | groupes `speed`, `bouncebar`, `rotation`, `crank` | séquenceur **Tombola** (`seq_types` id 3) | sequenceurs |
| `sketch.svg` | 391 lignes, groupes `dots`, `mult_times`, `mult_div`, `grid_icon`, `erase` | séquenceur **Sketch** (`seq_types` id 5) | sequenceurs |
| `dbox.svg` | 36 groupes, nom correspond directement à `drum_types.dbox` | écran du **moteur drum** | moteurs_sonores |
| `grid.svg` | groupes `grid`, `x`, `y`, `blue`/`green`/`white` | effet **Grid** (`fx_types` id 3) | effets |
| `in.svg` | groupes `line`, `radio`, `whatuhear`, `mic`, `usb` | **sélecteur d'entrée audio** | connectivite |
| `micline.svg` | groupes `triglevel`, `gain`, `mhz`, `standby`, `recording` | réglages **d'enregistrement** (seuil de déclenchement, gain, fréquence radio) | connectivite ou tape |
| `dsynth.svg` | 58 groupes, nom correspond à `synth_types.dsynth` | écran du moteur **Dsynth** | moteurs_sonores |
| `drw.svg` | fichier vide (491 octets, aucune forme) | probablement **Drwave**, mais stub — à confirmer | moteurs_sonores (confiance moyenne) |

Restent réellement non identifiés après cette passe : `colors.svg`,
`etchasketch.svg`, `fmpopup.svg` (déjà en `moteurs_sonores` via `fm`, sa
popup reste à part), `mmmf.svg`, `opfont.svg`, `signalflow.svg`,
`subscreenhand.svg`, `dynaenv.svg`, `tune.svg` — regardés mais sans
correspondance directe dans les tables déjà lues :

- **`opfont.svg`** (66 811 octets, viewBox `2182.676 x 1444.252` — pas
  320×160 comme tous les écrans) : c'est la **police vectorielle complète du
  système** — glyphes `a, t, y, g, c, u, j, e, f, b, h, k, q, x`, chiffres et
  symboles. Confirme et complète le constat de la section précédente : le
  texte affiché n'est jamais une balise `<text>`, il est composé à partir de
  ces glyphes. Directement pertinent pour
  [`DRAWING_CREATOR_CONCEPT.md`](DRAWING_CREATOR_CONCEPT.md) si on veut un
  jour écrire du texte fidèle au style machine — étude locale uniquement,
  c'est un dessin de police propriétaire TE, pas un contenu à redistribuer.
- **`dynaenv.svg`** (6 points accrochables : `bdot`, `bgdot`, `gwdot`,
  `wdot`, `g1dot`, `g2dot`) : un **second widget d'enveloppe**, distinct de
  `adsr.svg` — probablement propre au moteur drum (voir
  [`ENGINE_EDITOR_CONCEPT.md`](ENGINE_EDITOR_CONCEPT.md)), forme non
  standard (plus de points qu'un ADSR classique).
- **`signalflow.svg`** : déjà étudié dans `ENGINE_EDITOR_CONCEPT.md`, écran
  de routage interne complet.
- **`mmmf.svg`** (groupes `drive`, `white`, `red`, `green`) : probablement
  liée au réglage **drive/saturation** évoqué par `drivewarn` dans
  `signalflow.svg`, sans confirmation suffisante pour trancher.
- **`tune.svg`** (groupes `port`, `pm`, `dt`) : cohérent avec un écran de
  **justesse/portamento/detune**, pas confirmé par une table.
- **`etchasketch.svg`** (1 579 octets, groupes `hbars`, `vbars`, `quantize`,
  `cursor`) : trop petit et sans correspondance table pour trancher — nom
  évocateur (jouet à dessiner par inclinaison) mais reste une hypothèse.
- **`colors.svg`**, **`subscreenhand.svg`** : pas encore ouverts en détail.

Ces corrections ne sont pas appliquées dans `tools/display_bridge.py` ici —
c'est une lecture, pas un changement de code. Elles sont prêtes à intégrer
le jour où quelqu'un touche `CATEGORY_MAP`.

## Session 3 — les 2 derniers SVG, tous les moteurs, et l'audio `.raw`

### `colors.svg` et `subscreenhand.svg`

- **`colors.svg`** (2 297 octets) : ni groupe ni forme complexe, juste **20
  rectangles** couvrant 20 couleurs hexadécimales distinctes — un swatch de
  référence, probablement un outil de calibrage écran interne plutôt qu'un
  écran utilisateur. Catégorie proposée : `reference_interne`, pas
  `moteurs_sonores` ni autre chose.
- **`subscreenhand.svg`** (2 746 octets) : mêmes groupes `_x31_`, `_x33_`,
  `_x34_` (chiffres 1, 3, 4) que `tapeconfig.svg` — un overlay de chiffres
  réutilisé sur plusieurs écrans, pas un écran autonome. Catégorie proposée :
  `interface_generique`.

### Les 6 moteurs restants — le patron de `cls.svg` ne se généralise PAS

Correction importante par rapport à `ENGINE_EDITOR_CONCEPT.md` : en ouvrant
les 6 écrans moteur manquants, **aucun ne reproduit le groupe `knobs`/`dots`/
`bar0..3` de `cls.svg`**. Chaque moteur a sa propre mise en scène, sans
patron commun :

| Moteur | Fichier | Ce qu'on voit | Thème visuel |
|---|---|---|---|
| Phase | `pd.svg` | groupes `red1`, `blue`, `green`, `white` | couleurs nommées mais structure différente de `cls.svg` |
| Pulse | `pls.svg` | `fltbgleft/right`, `hlinehoris` ×7, `whitetbars/hbars` | grille façon filtre/spectre |
| String | `st.svg` | juste `static`, `w1`, `w0` | deux états de forme d'onde (corde) |
| DNA | `id.svg` | 22 groupes `s0`…`s25`, monochrome `#231F20` | champ de points façon code génétique — seul écran sans la palette couleur machine |
| Voltage | `slump.svg` | `left`, `right`, `volts` | oscilloscope stéréo — colle littéralement au nom "Voltage" |
| Digital | `t10.svg` | aucun groupe nommé, 1 743 octets | le plus minimal des 10, presque abstrait |

**Conclusion à corriger dans `ENGINE_EDITOR_CONCEPT.md`** : le jeu
dot+aiguille des 4 knobs vu dans `cls.svg` n'est probablement **pas** un
élément dessiné par écran — puisqu'il n'apparaît que sur ce seul fichier,
c'est plus probablement un **calque affiché par le code natif du firmware
au-dessus de l'écran moteur**, pas un asset statique par moteur. Ce qui EST
partagé entre les 10 écrans, c'est uniquement : le canevas 320×160 et un
sous-ensemble de la palette machine (`#00ED95`, `#698EFF`, `#FF3A5D`
reviennent partout sauf sur `id.svg`, seul écran entièrement monochrome).
Chaque moteur a sa propre métaphore visuelle, cohérente avec son nom
(String = onde, Voltage = oscilloscope, DNA = points) — un éditeur de
moteur crédible doit donc prévoir une visualisation dédiée par moteur, pas
un template unique rempli différemment.

### Contenu audio `.raw` — format confirmé par les chiffres eux-mêmes

Aucun octet d'en-tête dans ces fichiers (`.raw` = PCM brut). Le format
attendu côté produit (mono, PCM 16 bits, 44,1 kHz) est déjà documenté dans
`OP1_KNOWLEDGE_BASE.md` — et les tailles réelles le confirment
directement : plusieurs fichiers de `factory_synth/` (`designadrum.raw`,
`dist a log.raw`, `knorr.raw`) font exactement **529 200 octets**, soit très
précisément 6,000 secondes sous cette hypothèse
(`529200 / 2 / 44100 = 6.0`) — la limite synthé documentée, pile en dessous.
Les fichiers `drum/` et `factory_drum/` s'étalent entre 5,7 s et 12,0 s,
cohérent avec la limite drum.

| Dossier | Fichiers | Rôle |
|---|---:|---|
| `factory_synth/` | 9 | sons d'usine synthé, ~6 s ou moins |
| `factory_drum/` | 14 | sons d'usine drum, ~10-12 s |
| `synth/` | 8 | **1 octet chacun** — emplacements utilisateur vides (stub) |
| `drum/` | 8 | sons réels, 5,7 à 12,0 s (pas vides comme `synth/`, à re-vérifier pourquoi) |
| `speech/` | 1 | `op1patch.raw`, 0,66 s — probablement le bip vocal "OP-1" joué à la sauvegarde d'un patch |
| `preset_synth/`, `preset_drum/` | 0 | vides sur cette version |

Les 8 fichiers `synth/*.raw` à 1 octet confirment que les emplacements
utilisateur par défaut sont des stubs vides plutôt que de vrais sons —
cohérent avec le fait que `synth/user` doit être rempli par l'utilisateur.

## Ce que ça change concrètement pour les autres documents

- `FIRMWARE_MOD_CATALOG.md` (Iter/Filter absents de la base d'usine) :
  confirmé par lecture directe des tables, pas seulement par le résultat du
  round-trip `op1repacker`.
- `FIRMWARE_MOD_RESOURCES.md` (palette machine) : le rouge `#FF3A5D` est
  maintenant sourcé sur le firmware officiel lui-même, pas uniquement sur
  `op1-glitter`.
- `DRAWING_CREATOR_CONCEPT.md` : ajouter la contrainte "pas de balise
  `<text>`, texte en formes vectorisées" à la liste de contraintes de style
  déjà posée (canevas 320×160, palette limitée).

## Méthode reproductible

```powershell
python tools/firmware_fetch.py --version 246 --output .cache/firmware/op1_246.op1
python -c "
import sys; sys.path.insert(0, 'tools/vendor')
from op1repacker import op1_repack
op1_repack.OP1Repack().unpack('.cache/firmware/op1_246.op1')
"
# op1_factory.db s'ouvre avec n'importe quel client SQLite
# les SVG s'ouvrent avec n'importe quel éditeur de texte ou navigateur
```

Rien de ceci n'est commis dans le dépôt : `.cache/` reste ignoré par Git,
cohérent avec `CONTEXT.md` et `NOTICE.md`.

## Référence croisée

[`FIRMWARE_LAB.md`](FIRMWARE_LAB.md) · [`FIRMWARE_MOD_CATALOG.md`](FIRMWARE_MOD_CATALOG.md) ·
[`FIRMWARE_MOD_RESOURCES.md`](FIRMWARE_MOD_RESOURCES.md) ·
[`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md) ·
[`DRAWING_CREATOR_CONCEPT.md`](DRAWING_CREATOR_CONCEPT.md)
