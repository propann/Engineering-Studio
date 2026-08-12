# L'éditeur de moteur avec affichage — le graal, sourcé sur le vrai firmware

Document d'organisation, pas de code. Idée posée le 12 août 2026 en creusant
les écrans réels des moteurs synthé dans l'OS 246 déballé
(`.cache/firmware/op1_246/`, voir
[`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md)). Constat de
départ : on n'a pas besoin d'inventer le langage visuel d'un éditeur de
moteur — la machine l'a déjà dessiné, à trois endroits précis. Ce document
décrit ce qui a été trouvé et ce que ça permettrait de construire.

## Les trois pièces déjà dessinées par Teenage Engineering

### 1. `cls.svg` (écran du moteur Cluster) — le patron des 4 knobs

```text
<g id="knobs">
  <g id="dots">   4 points fixes, couleur = couleur réelle de l'encodeur physique
                  base0 #4D9EFF (bleu) · base1 #00ED95 (vert)
                  base2 #FFFFFF (blanc) · base3 #FF3A5D (rouge)
  <line id="bar0..3">  une aiguille par point, même couleur, angle = position du knob
<g id="static">   graduations (ticks) autour de chaque knob, positions fixes
                  x ≈ 61 / 125 / 190 / 255 (4 emplacements espacés régulièrement)
<g id="curves"> / <g id="curves_1_">
                  4 courbes "on" (couleur vive) + 4 courbes "off" (couleur sourde),
                  une par encodeur — le "caractère" visuel propre à ce moteur
```

Ce n'est pas une décoration : c'est très exactement 4 dots + 4 bars + 4
courbes, un jeu par encodeur physique T1–T4, aux couleurs réelles de la
machine (déjà confirmées dans `FIRMWARE_CONTAINER_STUDY.md`).

### 2. `adsr.svg` — le widget d'enveloppe partagé

```text
path id="a"   segment attaque (bleu #698EFF)
path id="d"   segment decay
line id="s"   segment sustain (plat)
path id="r"   segment release
g id="adot"   point accrochable attaque (bleu)
g id="dsdot"  point accrochable decay/sustain (vert #00ED95)
g id="srdot"  point accrochable sustain/release (rouge #FF423F)
g id="rdot"   point accrochable release (bleu)
```

Un seul fichier, réutilisé par les 10 moteurs — pas un widget par moteur.
Positions des points cohérentes avec des valeurs d'enveloppe normalisées
(temps → position x, niveau → position y).

### 3. `signalflow.svg` — le schéma de routage complet

22 Ko, 30 groupes nommés explicitement : `keytoinstr`, `keytoseq`,
`seqtoinstr`, `lfotoinstr`, `lfotofx`, `instrfxon`, `tapein1..4`,
`mixerwarn`, `eqwarn`, `drivewarn`… C'est l'écran de diagnostic interne de
la machine qui montre comment clavier → instrument → séquenceur → LFO → FX →
pistes Tape → mixer → EQ → drive s'enchaînent, avec des indicateurs d'alerte
par étage. Référence directe si l'éditeur veut un jour représenter le
routage plutôt qu'un seul moteur isolé.

## Comment un éditeur de moteur s'appuierait dessus

| Élément visuel | Source de vérité (données réelles déjà en base) |
|---|---|
| Position des 4 knobs | `synth_presets.patch.knobs[0..3]` (`op1_factory.db`, JSON par preset) |
| Enveloppe ADSR | `synth_presets.patch.adsr[0..3]` |
| Courbe "caractère" du moteur | à dessiner par moteur, dans l'esprit de `curves`/`curves_1_` de `cls.svg`, pas copiée telle quelle |
| Type de moteur actif | `synth_presets.folder` / `synth_types.type` |
| Effet et LFO associés | `patch.fx_type`, `patch.fx_active`, `patch.lfo_type`, `patch.lfo_active` — déjà présents dans chaque preset lu |

Un preset réel observé (`FIRMWARE_CONTAINER_STUDY.md`) contient déjà tout ce
qu'il faut pour piloter cet affichage sans rien inventer :

```json
{"knobs":[17408,24320,1535,10240,0,0,0,0],
 "adsr":[64,12352,10239,3008,2048,64,4000,4000],
 "fx_type":"nitro","fx_active":true,
 "lfo_type":"element","lfo_active":true}
```

Seuls les 4 premières valeurs de `knobs` sont utilisées sur les moteurs
observés jusqu'ici (les 4 suivantes restent à 0) — cohérent avec 4
encodeurs physiques, pas 8 paramètres indépendants.

## Correction après étude des 6 autres moteurs — pas un patron unique

En ouvrant `pd.svg` (Phase), `pls.svg` (Pulse), `st.svg` (String), `id.svg`
(DNA), `slump.svg` (Voltage) et `t10.svg` (Digital), aucun ne reproduit le
groupe `knobs`/`dots`/`bar0..3` vu sur `cls.svg`. Chaque moteur a sa propre
mise en scène — String montre deux états de forme d'onde (`w0`/`w1`), DNA un
champ de points monochrome (`s0`…`s25`, seul écran sans la palette machine),
Voltage un oscilloscope stéréo (`left`/`right`/`volts`), Digital un écran
quasi abstrait sans aucun groupe nommé. Détail complet dans
[`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md) (Session 3).

Conséquence pour ce concept : le jeu dot+aiguille des 4 knobs n'est
probablement **pas** un asset par moteur mais un calque affiché par le code
natif de la machine au-dessus de l'écran — à traiter comme un composant
d'overlay partagé côté éditeur (un seul composant "4 knobs" réutilisé),
séparé du fond visuel qui, lui, reste propre à chaque moteur et doit être
dessiné dix fois, pas une seule. Ce qui est vraiment commun aux 10 écrans :
le canevas 320×160 et un sous-ensemble de la palette machine — pas la
composition entière.

## Ce que ça implique comme fonctions cibles

| Fonction | Source | État |
|---|---|---|
| Affichage des 4 knobs (dot + aiguille, couleurs machine) | `cls.svg` | à construire, patron déjà identifié |
| Courbe "caractère" par moteur (10 moteurs) | `curves`/`curves_1_` de `cls.svg` comme référence de style | à construire, 1 par moteur |
| Widget ADSR partagé, points accrochables | `adsr.svg` | à construire, un seul composant pour les 10 moteurs |
| Lecture d'un preset réel pour piloter l'affichage | `op1_factory.db` → `synth_presets.patch` | déjà lisible, SQLite standard |
| Vue "routage" optionnelle | `signalflow.svg` comme référence | idée annexe, pas prioritaire |

## Corollaire trouvé en creusant : deux écrans moteur mal classés

En ouvrant les fichiers plutôt que de se fier au seul nom, deux SVG classés
`non_identifie` dans `tools/display_bridge.py` (`CATEGORY_MAP`) sont en
réalité des écrans moteur :

- **`dsynth.svg`** — 43 Ko, 58 groupes, correspond au moteur `dsynth` (le nom
  du fichier correspond directement à `synth_types`). Écran dense, cohérent
  avec un moteur plus récent.
- **`drw.svg`** — 491 octets, **aucune forme dedans** (juste l'enveloppe SVG
  vide). Correspond probablement à `drwave`, mais soit c'est un stub non
  utilisé sur cette version d'OS, soit l'écran est généré autrement. À
  vérifier avant de le classer avec la même confiance que les autres.

Correction proposée pour `CATEGORY_MAP` (pas appliquée ici, juste notée) :
ajouter `"dsynth": ("moteurs_sonores", "high", "Nom de fichier correspond
directement à synth_types.dsynth, verifie par lecture directe.")` et
`"drw": ("moteurs_sonores", "medium", "Correspond probablement a
synth_types.drwave, mais fichier vide sur OS 246 - a confirmer.")`.

## Ce que ça ne règle pas encore

- comment le firmware anime réellement la transition entre courbe "off" et
  "on" (interpolation, easing) — pas observable depuis les fichiers statiques
  seuls, demanderait de regarder le comportement sur machine réelle ;
- les 10 courbes "caractère" par moteur restent à dessiner nous-mêmes dans
  l'esprit de celle de Cluster, pas extraites (une seule est en stock) ;
- aucune écriture vers la machine n'est impliquée par ce concept : c'est un
  affichage de lecture/édition locale des presets déjà en base, cohérent
  avec la règle d'or du projet.

## Référence croisée

[`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md) ·
[`FIRMWARE_LAB_FUNCTIONS.md`](FIRMWARE_LAB_FUNCTIONS.md) ·
[`DRAWING_CREATOR_CONCEPT.md`](DRAWING_CREATOR_CONCEPT.md) ·
[`PATCH_EDITOR_SPEC.md`](PATCH_EDITOR_SPEC.md)
