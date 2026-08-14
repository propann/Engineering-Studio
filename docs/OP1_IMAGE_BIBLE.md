# La bible des images OP‑1 — tout pour l'éditeur d'images

Document de synthèse écrit le 14 août 2026, dédié exclusivement aux
**ressources graphiques** de l'OP‑1 original (où elles sont, ce qu'elles
contiennent, comment elles sont classées, quelle palette et quelles règles
les contraignent) — pour servir directement l'éditeur d'images
(`Op1PixelEditor.tsx` + `tools/display_bridge.py`). Complète
[`OP1_FIRMWARE_BIBLE.md`](OP1_FIRMWARE_BIBLE.md) §10 sans le répéter : ce
document va plus loin sur le graphisme seul. Même méthode et mêmes niveaux
de confiance que la bible firmware (§0 de ce document).

## 0. Où vivent réellement les images — les trois emplacements

| Emplacement | Nature | Commis dans Git ? |
|---|---|---|
| `.cache/firmware/op1_246/content/display/*.svg` | 61 SVG extraits d'un OS 246 officiel déballé localement | **non** — gitignoré, jamais commis (`CONTEXT.md`) |
| `backups/display-sorted/<categorie>/*.svg` | copie triée par catégorie/confiance, générée par `tools/display_bridge.py sort` | **non** — gitignoré |
| `backups/images/{original,library,workspace,themes,exports,manifests}/` | coffre de travail de l'éditeur d'images (import, tri, éditions en cours, thèmes, exports, manifestes SHA‑256) | **non** — gitignoré, initialisation additive |
| `public/firmware-mods/{playmode,rymd,tapeconfig}.svg` | 3 écrans d'origine réutilisables tels quels dans l'UI web | **oui** — seuls fichiers d'écran réellement commis |
| `docs/assets/op1-studio-mark.svg` | logo maison, notre propre création | **oui** |
| `tools/vendor/op1repacker/assets/display/iter-lab.svg` | visuel du mod Iter Lab (vendored avec `op1repacker`, MIT) | **oui**, mais côté outil firmware, pas UI web |

**Point important, déjà noté dans `GUI_REDESIGN_BRIEF.md` §4** : la
bibliothèque complète de 61 SVG **n'existe qu'après extraction locale d'un
firmware officiel** — ce n'est pas un stock permanent du dépôt. Sans
extraction, on n'a réellement que 3 écrans + le logo. Pour retrouver les 61
fichiers : `python tools/firmware_fetch.py --version 246 --output
.cache/firmware/op1_246.op1` puis déballage (commande complète dans
[`FIRMWARE_LAB.md`](FIRMWARE_LAB.md)), ou directement
`python tools/content_catalog.py import-display` /
`python tools/display_bridge.py sort` une fois le firmware déballé (voir
[`IMAGE_LIBRARY.md`](IMAGE_LIBRARY.md) pour la commande exacte).

## 1. L'inventaire complet — 61 fichiers, 14 catégories

Régénéré le 14 août 2026 avec les corrections de catégorie de la §3
appliquées (`tools/display_bridge.py sort`, manifeste local
`backups/display-sorted/manifest.json`, gitignoré) :

| Catégorie | Nombre | Fichiers |
|---|---:|---|
| `moteurs_sonores` | 14 | `cls`, `drum2`, `fm`, `id`, `iter`, `pd`, `pls`, `sampler`, `slump`, `st`, `t10`, `dbox`, `dsynth`, `drw` |
| `effets` | 9 | `bode`, `delay`, `eq`, `ftwo`, `master`, `mllp`, `ptch`, `rymd`, `grid` |
| `non_identifie` | 10 | `adsr`, `colors`, `dynaenv`, `etchasketch`, `fmpopup`, `mmmf`, `opfont`, `signalflow`, `subscreenhand`, `tune` |
| `sequenceurs` | 7 | `clock`, `endless`, `ok`, `pattern`, `simple`, `tombola`, `sketch` |
| `lfo` | 7 | `singlelfo`, `duallfo`, `rndlfo`, `bendlfo`, `cranklfo`, `midilfo`, `reroutelfo` |
| `connectivite` | 3 | `com`, `in`, `micline` |
| `tape` | 3 | `tape`, `tapeconfig`, `mixer` |
| `interface_generique` | 2 | `lander`, `save` |
| `aide` | 1 | `help` |
| `album` | 1 | `album` |
| `clavier` | 1 | `octave` |
| `modes_principaux` | 1 | `playmode` |
| `navigation_presets` | 1 | `presetbrowser` |
| `tempo` | 1 | `tempo` |

Taux d'identification : passé de **31/61 « non identifié »** (première
lecture, avant tout recoupement) à **18/61** après le dictionnaire de
codenames `op1-glitter` (`FIRMWARE_MOD_RESOURCES.md`), puis à **10/61**
après la lecture directe des groupes SVG internes de 8 fichiers
supplémentaires le 14 août 2026 (corrections appliquées dans
`tools/display_bridge.py` `CATEGORY_MAP`, voir §3). Les 10 restants sont
listés en §5.

## 2. Profils de dimension — la règle qui contraint tout éditeur pixel

Chaque asset doit rester dans son profil d'origine ; aucun redimensionnement
implicite. Détail : [`PIXEL_EDITOR_ARCHITECTURE.md`](PIXEL_EDITOR_ARCHITECTURE.md).

| Profil (`viewBox`) | Nombre | Fichiers concernés | Règle d'édition |
|---|---:|---|---|
| `0 0 320 160` | 53 | tous les écrans standards | profil écran autorisé pour l'éditeur pixel |
| `0 0 340.156 170.079` | 1 | `colors.svg` | référence interne, édition désactivée tant que le rôle n'est pas confirmé |
| `0 0 340.157 170.078` | 3 | `fmpopup.svg`, `octave.svg`, `save.svg` | profil spécifique, pas de conversion automatique |
| `0 0 340.2 170.1` | 2 | `in.svg`, `micline.svg` | profil spécifique, pas de conversion automatique |
| `0 0 1000 700` | 1 | `lander.svg` | easter egg « Chop Lifter! », verrouillé |
| `0 0 2182.676 1444.252` | 1 | `opfont.svg` | police vectorielle complète, éditeur pixel interdit — voir §4 |
| `-146 316 320 160` | 1 | `drw.svg` | origine décalée mais même taille 320×160 — fichier vide (497 octets) sur OS 246 |

**320×160 est la résolution réelle de l'écran OP‑1** (confirmée
indépendamment sur `tapeconfig.svg`, `playmode.svg`, `rymd.svg` et par le
guide officiel « rendu vectoriel temps réel à 60 fps sur AMOLED »,
`GUI_REDESIGN_BRIEF.md` §2) — c'est le canevas de référence pour tout
dessin original (§8).

## 3. Le dictionnaire de codenames — comment chaque fichier a été identifié

Trois sources de preuve, cumulées dans `tools/display_bridge.py`
`CATEGORY_MAP` (61 entrées possibles, confiance par entrée) :

### 3.1 Confiance haute — page officielle ou catalogue de mods déjà vérifié

`tape`, `tapeconfig`, `mixer`, `album`, `com`, `help`, `tempo`, `octave`,
`endless`, `playmode` — noms directement rattachés à une page
`teenage.engineering/guides/op-1/original/*` ou à
`data/mods/catalog.json`.

### 3.2 Confiance haute — dictionnaire `op1-glitter` (`THEME_CREATION.md`)

Outil communautaire de thème, **testé avec succès sur machine réelle** par
son auteur (repeint les couleurs sans casser le rendu) — plus fiable qu'une
estimation visuelle :

| Fichier | Sens réel |
|---|---|
| `bode.svg` | effet CWO |
| `cls.svg` | moteur synthé Cluster |
| `drum2.svg` | éditeur de samples Drum |
| `ftwo.svg` | effet Nitro |
| `id.svg` | moteur synthé DNA |
| `lander.svg` | easter egg « Chop Lifter! » |
| `mllp.svg` | effet Punch |
| `ok.svg` | séquenceur Finger |
| `pd.svg` | moteur synthé Phase |
| `pls.svg` | moteur synthé Pulse |
| `ptch.svg` | effet Phone |
| `rymd.svg` | effet Spring (corrige une première hypothèse « modes_principaux ») |
| `simple.svg` | séquenceur Arpeggio |
| `slump.svg` | moteur synthé Voltage |
| `st.svg` | moteur synthé String |
| `t10.svg` | moteur synthé Digital |

### 3.3 Confiance haute/moyenne — lecture directe des groupes SVG internes

Ajoutées le 14 août 2026 en ouvrant chaque fichier et en croisant sa
structure avec les tables déjà lues dans `op1_factory.db`
([`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md), Session 2) —
**appliquées dans `tools/display_bridge.py` le 14 août 2026** (13 tests
existants toujours au vert) :

| Fichier | Preuve trouvée dans le fichier | Identification | Confiance |
|---|---|---|---|
| `tombola.svg` | groupes `speed`, `bouncebar`, `rotation`, `crank` | séquenceur Tombola (`seq_types` id 3) | haute |
| `sketch.svg` | 391 lignes, groupes `dots`, `mult_times`, `mult_div`, `grid_icon`, `erase` | séquenceur Sketch (`seq_types` id 5) | haute |
| `dbox.svg` | 36 groupes, nom = `drum_types.dbox` | écran du moteur drum | haute |
| `grid.svg` | groupes `grid`, `x`, `y`, `blue`/`green`/`white` | effet Grid (`fx_types` id 3) | haute |
| `in.svg` | groupes `line`, `radio`, `whatuhear`, `mic`, `usb` | sélecteur d'entrée audio | haute |
| `micline.svg` | groupes `triglevel`, `gain`, `mhz`, `standby`, `recording` | réglages d'enregistrement | moyenne (tape ou connectivité, non tranché) |
| `dsynth.svg` | 58 groupes, nom = `synth_types.dsynth` | écran du moteur Dsynth | haute |
| `drw.svg` | fichier vide (497 octets, aucune forme) | probablement Drwave, stub à confirmer | moyenne |

## 4. Deux règles structurantes trouvées en ouvrant les fichiers

### 4.1 Aucune balise `<text>` — tout le texte est vectorisé

Mesuré sur `tapeconfig.svg` (35 393 octets, 41 groupes, 42 `path`/102
`line`/28 `polyline`/20 `circle`/7 `rect`, **0 élément `<text>`/`<tspan>`**).
Tout le texte visible à l'écran (labels, chiffres) est déjà vectorisé en
formes par Illustrator au moment de l'export firmware. Conséquence directe
pour tout outil de dessin : impossible d'ajouter du texte lisible via une
balise `<text>` qui ne correspondrait à rien d'observé sur le vrai
firmware — il faut soit vectoriser une police maison en formes, soit
réutiliser des groupes de lettres déjà présents (ex. `_x31_`…`_x34_` =
chiffres de piste 1‑4 sur `tapeconfig.svg`, réutilisés identiques sur
`subscreenhand.svg`).

### 4.2 `opfont.svg` — la police vectorielle complète du système

66 811 octets (parfois mesuré 67 788, selon build), `viewBox 2182.676 ×
1444.252` — seul fichier hors du format écran 320×160, confirme et complète
4.1 : glyphes `a, t, y, g, c, u, j, e, f, b, h, k, q, x`, chiffres et
symboles, tous dessinés en formes. Étude locale uniquement — c'est un dessin
de police propriétaire Teenage Engineering, **jamais à redistribuer**.
Règle d'édition : mode vectoriel spécialisé, aucune rastérisation
destructive par défaut (`PIXEL_EDITOR_ARCHITECTURE.md`).

## 5. Les 10 fichiers encore réellement non identifiés

Regardés mais sans correspondance directe dans les tables SQLite déjà lues
(`FIRMWARE_CONTAINER_STUDY.md` Session 2/3) :

| Fichier | Taille | Ce qu'on observe | Hypothèse |
|---|---:|---|---|
| `adsr.svg` | 2 262 o | segments `a`/`d`/`s`/`r`, points accrochables `adot`/`dsdot`/`srdot`/`rdot` | widget d'enveloppe **partagé par les 10 moteurs synthé** — voir §7 |
| `signalflow.svg` | 22 619 o | 30 groupes : `keytoinstr`, `tapein1..4`, `mixerwarn`, `drivewarn`… | écran de diagnostic/routage interne complet — voir §7 |
| `dynaenv.svg` | 5 190 o | 6 points accrochables `bdot`/`bgdot`/`gwdot`/`wdot`/`g1dot`/`g2dot` | second widget d'enveloppe, probablement propre au moteur Drum, forme non standard |
| `colors.svg` | 2 297‑2 324 o | 20 rectangles couvrant 20 couleurs hex distinctes | swatch de calibrage écran interne, pas un écran utilisateur |
| `subscreenhand.svg` | 2 746‑2 786 o | mêmes groupes `_x31_`/`_x33_`/`_x34_` (chiffres 1/3/4) que `tapeconfig.svg` | overlay de chiffres réutilisé sur plusieurs écrans, pas un écran autonome |
| `mmmf.svg` | 11 456 o | groupes `drive`, `white`, `red`, `green` | probablement lié au réglage drive/saturation (`drivewarn` de `signalflow.svg`) |
| `tune.svg` | 9 880 o | groupes `port`, `pm`, `dt` | cohérent avec justesse/portamento/detune, non confirmé |
| `etchasketch.svg` | 1 605‑1 579 o | groupes `hbars`, `vbars`, `quantize`, `cursor` | nom évocateur (jouet à dessiner), trop petit pour trancher |
| `fmpopup.svg` | 25 502 o | profil `340.157×170.078`, popup liée à `fm.svg` | popup du moteur FM, contenu détaillé non étudié |
| `opfont.svg` | 66 811‑67 788 o | voir §4.2 | **identifié avec certitude** (police), juste sans meilleure catégorie que `non_identifie` dans le schéma actuel |

## 6. La palette réelle de la machine — deux sources qui se recoupent

### 6.1 Confirmée sur firmware officiel (première main)

Mesurée directement dans `tapeconfig.svg` déballé
([`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md)) :
`#010101`, `#3B2D49`, `#87839C`, `#B4AECF`, `#FF3A5D` (rouge du 4e
encodeur), `none`.

### 6.2 Confirmée sur machine réelle repeinte (`op1-glitter`)

`THEME_CREATION.md` documente la palette effectivement utilisée, vérifiée
en repeignant une machine réelle avec succès
([`FIRMWARE_MOD_RESOURCES.md`](FIRMWARE_MOD_RESOURCES.md)) :

| Couleur | Hex | Usage documenté |
|---|---|---|
| Encodeur vert | `#00ed95` | encodeur physique |
| Encodeur rouge | `#ff3a5d` | encodeur physique |
| Encodeur bleu | `#698eff` | encodeur physique |
| Encodeur blanc | `#dfd9ff` | 4e encodeur ; aussi bande Tape, EQ aigus, texte dynamique |
| Blanc | `#ffffff` | — |
| Texte d'interface | `#aeb1dc` | — |
| Fond d'écran | `#9256d7` | — |
| Bleu clair alternatif | `#4d9eff` | — |
| Violet foncé terne | `#383572` | — |

Les deux sources se recoupent exactement sur le rouge `#FF3A5D`/`#ff3a5d` —
confirmation croisée, pas une coïncidence de casse.

### 6.3 Bug de code trouvé, toujours pas corrigé au 14 août 2026

La machine a 4 encodeurs **bleu/vert/blanc/rouge**. `MachineControls`
(`app/page.tsx`) a déjà les bons labels. Mais **`app/globals.css`**
(`--orange: #f26c38`) et **le logo** (`docs/assets/op1-studio-mark.svg`)
utilisent un **orange** à la place du **blanc** pour le 4e encodeur — pas la
vraie couleur machine. Volontairement pas corrigé pour ne pas croiser un
autre chantier en cours sur `app/page.tsx`/`app/globals.css` — à corriger
au prochain passage sur ces fichiers.

## 7. Les patrons visuels déjà dessinés par Teenage Engineering — matière première d'un éditeur de moteur

Détail complet : [`ENGINE_EDITOR_CONCEPT.md`](ENGINE_EDITOR_CONCEPT.md).
Trois pièces réutilisables sans rien inventer :

1. **`cls.svg`** (Cluster) : groupe `knobs` = 4 dots + 4 aiguilles (couleurs
   machine réelles) + groupe `static` (graduations à x≈61/125/190/255) +
   `curves`/`curves_1_` (4 courbes « caractère » on/off). **Correction
   importante** : ce patron **ne se généralise pas** aux 6 autres écrans
   moteur ouverts (`pd`, `pls`, `st`, `id`, `slump`, `t10`) — chacun a sa
   propre mise en scène (String = 2 formes d'onde, DNA = champ de points
   monochrome seul écran sans la palette machine, Voltage = oscilloscope
   stéréo, Digital = quasi abstrait sans groupe nommé). Le jeu de 4 knobs
   est probablement un **calque affiché par le code natif** au‑dessus de
   l'écran, pas un asset par moteur — à traiter comme un composant overlay
   partagé, séparé du fond visuel propre à chaque moteur (à dessiner 10
   fois, pas une fois).
2. **`adsr.svg`** : widget d'enveloppe **partagé par les 10 moteurs** —
   un seul fichier, pas un par moteur. Segments colorés + points
   accrochables (bleu=attaque, vert=decay/sustain, rouge=sustain/release).
3. **`signalflow.svg`** : schéma de routage complet clavier→instrument→
   séquenceur→LFO→FX→pistes Tape→mixer→EQ→drive, avec indicateurs d'alerte
   par étage — référence si un éditeur veut représenter le routage plutôt
   qu'un seul moteur isolé.

Ce qui est vraiment commun aux 10 écrans moteur : le canevas 320×160 et un
sous‑ensemble de la palette machine (`#00ED95`/`#698EFF`/`#FF3A5D`
reviennent partout sauf sur `id.svg`, seul écran entièrement monochrome) —
pas la composition entière.

## 8. Contraintes pour tout dessin original (créateur de dessin)

Détail complet : [`DRAWING_CREATOR_CONCEPT.md`](DRAWING_CREATOR_CONCEPT.md).
Un dessin fait dans l'app plutôt qu'importé règle le problème de licence à
la racine (rien téléchargé, rien extrait d'un tiers). Trois garde‑fous pour
qu'un dessin libre ressemble à la machine plutôt qu'à un éditeur SVG
générique :

- **Canevas 320×160** — la résolution réelle, jamais une taille arbitraire
  à recadrer plus tard.
- **Palette limitée aux couleurs machine confirmées** (§6.2) — le
  sélecteur de couleur ne propose que ces teintes, pas une roue chromatique
  complète.
- **Style contraint** — traits fins, une seule couleur par élément, fond
  sombre, cohérent avec `tapeconfig.svg`/`playmode.svg`/`rymd.svg`, les 3
  écrans réellement en stock dans `public/firmware-mods/`.

## 9. Chaîne complète de réinstallation dans un firmware — sûre par construction

```text
firmware officiel local
        ↓ lecture seule + inventaire des 61 SVG (§1)
asset choisi + sauvegarde de l'original (hash conservé)
        ↓ édition pixel (Op1PixelEditor.tsx) ou dessin original (§8)
SVG normalisé + validation structurelle + aperçu
        ↓ patch whole-file avec hash de l'original (op1_gfx.patch_image_file)
copie de firmware déballée (jamais le fichier source de l'utilisateur)
        ↓ contrôle des chemins et vérification du patch
firmware modifié exporté (.op1), marqué UNOFFICIAL-MODIFIED
```

Aucune écriture automatique sur l'OP‑1 à aucune étape — le transfert reste
une action manuelle et explicite, cohérent avec `FIRMWARE_SAFETY.md`.

## 10. Ce qui est déjà codé, ce qui est codable, ce qui manque

| Fonction | État | Fichier |
|---|---|---|
| Tri/catégorisation des 61 SVG avec confiance par fichier | **codé** | `tools/display_bridge.py` (`CATEGORY_MAP`, corrigé le 14 août 2026, §3.3) |
| Manifeste JSON (hash, `viewBox`, catégorie, confiance) | **codé** | `tools/display_bridge.py sort` |
| Export patch `op1_gfx.patch_image_file` par fichier | **codé** | `tools/display_bridge.py patch` |
| Validation SVG avant modification | **codé, lecture seule** | `tools/svg_preflight.py` |
| Coffre local (`images/original/library/workspace/themes/exports/manifests`) | **codé** | `tools/content_catalog.py`, `IMAGE_LIBRARY.md` |
| Lecture native (Tauri) / route locale (`npm run dev`) du coffre | **codé** | `app/lib/nativeStorage.ts`, `app/api/display-library/route.ts`, `src-tauri/src/main.rs` |
| Éditeur pixel (grille, zoom, crayon/gomme/pipette/remplissage, export SVG déterministe) | **codé, prototype** | `Op1PixelEditor.tsx` — pas encore d'export firmware |
| Légende des codenames affichée dans l'UI | **candidat** | table déjà en mémoire (`CATEGORY_MAP`), pas encore affichée |
| Mode « thème » global (1 table couleur→couleur → patch pour tous les écrans) | **candidat, mécanisme documenté** | inspiré `op1-glitter`, moteur à écrire dans `display_bridge.py` |
| Variantes CWO comme choix exclusif avec aperçu comparatif | **partiel** | actuellement des cases indépendantes, à corriger |
| Validation `op1svg` avant import d'un SVG arbitraire | **manquant, garde‑fou identifié** | `TOOLING_GAP_ANALYSIS.md` priorité 1 |
| Créateur de dessin original (§8) | **cible retenue, non commencé** | — |
| Correction couleur orange→blanc (§6.3) | **connue, pas corrigée** | `app/globals.css`, `docs/assets/op1-studio-mark.svg` |

## Référence croisée

[`OP1_FIRMWARE_BIBLE.md`](OP1_FIRMWARE_BIBLE.md) §2, §10 ·
[`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md) ·
[`FIRMWARE_MOD_RESOURCES.md`](FIRMWARE_MOD_RESOURCES.md) ·
[`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md) §C ·
[`ENGINE_EDITOR_CONCEPT.md`](ENGINE_EDITOR_CONCEPT.md) ·
[`DRAWING_CREATOR_CONCEPT.md`](DRAWING_CREATOR_CONCEPT.md) ·
[`PIXEL_EDITOR_ARCHITECTURE.md`](PIXEL_EDITOR_ARCHITECTURE.md) ·
[`IMAGE_LIBRARY.md`](IMAGE_LIBRARY.md) ·
[`GUI_REDESIGN_BRIEF.md`](GUI_REDESIGN_BRIEF.md) §2, §4, §7bis ·
[`TOOLING_GAP_ANALYSIS.md`](TOOLING_GAP_ANALYSIS.md)
