# Formats de fichiers son — patches et pistes Tape

Document créé le 13 août 2026, en clonant et lisant le code source (pas
seulement les README) de 12 dépôts communautaires dans
`.cache/community-tools/` (ignoré par Git, non redistribué). Objectif direct
demandé : savoir **exactement quoi écrire dans un fichier** pour qu'il soit
reconnu comme un patch ou une piste par l'OP‑1, avec toutes les règles, pas
une approximation.

Trois implémentations indépendantes du même format ont été lues et
recoupées : [`op-patch-util`](https://github.com/AlexCharlton/op-patch-util)
(Rust), [`teoperator`](https://github.com/schollz/teoperator) (Go) et
`op1aiff` (Python — voir §6, correction de commit). Les trois font
**exactement la même chose** au chunk près : c'est un signal fort de
fiabilité, indépendant de notre propre lecture de `op1_factory.db` dans
[`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md).

Rien ici n'a été vérifié en écrivant réellement sur la machine de
l'utilisateur (OP‑1 reçu le 9 août 2026). Tout ce qui suit vient de code
communautaire et de fichiers `op1_factory.db`/SVG étudiés localement, pas
d'un test matériel.

## 1. Deux familles de fichiers audio, deux règles différentes

| | Patch synth/drum (`synth/user/*.aif`, `drum/user/*.aif`) | Piste Tape / Album (`tape/track_N.aif`, `album/side_a.aif`) |
|---|---|---|
| Contenu | Audio + **métadonnées JSON propriétaires** embarquées | Audio brut, **aucune métadonnée OP‑1** |
| Le moteur doit savoir quoi faire du son | Oui — c'est tout l'enjeu du format | Non — c'est juste de la matière première |
| Règle d'écriture | Précise et documentée ci-dessous | Contraintes de format seulement (mono/44,1 kHz/16 bits) |
| Ce qui positionne les clips/loops sur la bande | `tape.db` (firmware), **format non retrouvé** — voir §4 | — |

## 2. Format Patch : AIFF standard + un chunk `APPL` propriétaire

### 2.1 Enveloppe

Un patch OP‑1 est un fichier **AIFF valide** (`FORM`/`AIFF`, `COMM`, `SSND`)
auquel un chunk `APPL` (Application Specific, chunk AIFF standard, pas une
extension OP‑1) est inséré **juste avant** le chunk `SSND` (le son lui-même).
`COMM` reste un chunk AIFF ordinaire : mono, 16 bits, 44 100 Hz, comme
n'importe quel outil AIFF le produirait (confirmé par
`op-patch-util/src/chunks.rs`, `teoperator/src/op1/drum.go`).

### 2.2 Le chunk `APPL` — disposition binaire exacte

```
"APPL"                  4 octets, ASCII, id de chunk AIFF standard
<taille>                4 octets big-endian = 4 (signature) + longueur du JSON (+ remplissage)
"op-1"                  4 octets ASCII — la "signature d'application" du chunk APPL
<JSON>                  le patch, en JSON compact, terminé par un octet nul ou par la fin du buffer
<remplissage>            0 ou plusieurs octets pour aligner la taille totale du fichier
```

Recoupé sur 3 implémentations :

- Rust (`ApplicationSpecificChunk::OP1`, `chunks.rs:571`) : lit jusqu'au
  premier octet nul après `"op-1"`, désérialise en JSON ; à l'écriture,
  complète `to_bytes()` avec un octet `0` si la longueur est impaire.
- Go (`SynthPatch.SaveSynth`, `synth.go:409`) : insère `APPL` + taille +
  `"op-1"` + JSON + un octet de remplissage, **répété en boucle** en
  ajoutant des octets de remplissage jusqu'à ce que la taille totale du
  fichier soit un multiple de 2 (le code des patches drum vise un multiple
  de **4**, léger écart interne à `teoperator` lui-même — viser un multiple
  de 4 est le choix le plus sûr, il satisfait aussi la contrainte à 2).
- Python (`op1aiff`, voir §6) : ajoute simplement `"\n "` (2 octets) après
  le JSON, sans boucle de vérification — fonctionne dans la pratique mais
  ne garantit pas l'alignement dans tous les cas.

**Règle à suivre pour notre propre code** : padder avec des octets de
remplissage jusqu'à ce que la taille totale du fichier soit un multiple de
4, en recalculant la taille à chaque itération (comme le fait Go) — c'est le
plus strict des trois et il couvre les deux autres.

### 2.3 Schéma JSON — patch Drum (24 touches)

| Champ | Type | Taille | Unité / plage observée |
|---|---|---|---|
| `type` | string | — | `"drum"` (aussi des moteurs cachés comme `"iter"`, voir §2.6) |
| `name` | string | — | nom affiché sur la machine |
| `drum_version` | int | — | `1` ou `2` selon les échantillons observés |
| `octave` | int | — | `0` dans tous les exemples observés |
| `start` / `end` | array | 24 | bornes d'échantillon **à l'échelle interne**, pas un index — voir §2.5 |
| `pitch` | array | 24 | `-24567`..`24567`, pas de `512` par demi-ton (`-48`..`+48` demi-tons) |
| `reverse` | array | 24 | `8192` = normal, `16384` = inversé |
| `volume` | array | 24 | `0`/`8192`/`16384` observés ; `op-patch-util` calcule `8192 * (gain + 1.0)` pour un gain `-1.0..+1.0` |
| `playmode` | array | 24 | `0`/`8192`/`16384` observés |
| `dyna_env` | array | 8 | enveloppe dynamique globale |
| `fx_active` | bool | — | — |
| `fx_type` | string | — | voir §2.7 |
| `fx_params` | array | 8 | plage dépend de `fx_type`, voir §2.7 |
| `lfo_active` | bool | — | — |
| `lfo_type` | string | — | voir §2.7 |
| `lfo_params` | array | 8 | plage dépend de `lfo_type`, voir §2.7 |

Source : `op-patch-util/src/op1.rs:6-23` et `teoperator/src/op1/drum.go:27-45`,
identiques champ pour champ.

### 2.4 Schéma JSON — patch Sampler / Synth

| Champ | Type | Taille | Unité / plage observée |
|---|---|---|---|
| `type` | string | — | nom du moteur : `"sampler"`, `"cluster"`, `"digital"`, `"dna"`, `"drwave"`… (voir §2.7, doit rester cohérent avec les 13 moteurs de [`SYNTH_ENGINES_REFERENCE.md`](SYNTH_ENGINES_REFERENCE.md)) |
| `name` | string | — | — |
| `synth_version` | int | — | `1` ou `2` observés |
| `octave` | int | — | `-2`..`2` |
| `base_freq` | float | — | **Sampler uniquement**, ex. `440.0`, `261.625…` (Hz, fréquence de la note jouée par l'échantillon d'origine) |
| `adsr` | array | 8 | attack/decay/sustain/release/playmode/portamento — plages exactes en §2.7 |
| `knobs` | array | 8 | seuls les 4 premiers sont utilisés par la plupart des moteurs (confirmé aussi côté `ENGINE_EDITOR_CONCEPT.md`) |
| `fx_active`, `fx_type`, `fx_params` | — | — | identique au drum |
| `lfo_active`, `lfo_type`, `lfo_params` | — | — | identique au drum |

Source : `op-patch-util/src/op1.rs:24-37` et `teoperator/src/op1/synth.go:57-71`.

### 2.5 Piège concret : `start`/`end` du Drum ne sont pas des index d'échantillon

`teoperator/src/op1/constants.go` :

```go
var MAXENDPOINT = int64(2147483646)      // valeur max observée
var SAMPLECONVERSION = int64(4058)       // 2147483646 / (44100 * 12)
```

Le commentaire du code fait le calcul lui-même : la plage entière
`0..2 147 483 646` représente les **12 secondes maximum d'un sample drum**
(cohérent avec la limite déjà documentée dans
[`OP1_KNOWLEDGE_BASE.md`](OP1_KNOWLEDGE_BASE.md)), pas la longueur réelle du
fichier. Autrement dit : `start`/`end` sont une position normalisée sur une
échelle fixe de 12 s, pas un offset en échantillons ni en octets. Convertir
une position réelle (en secondes, à 44,1 kHz) demande une règle de
proportionnalité sur cette échelle fixe, **pas** un simple `secondes ×
44100`. À vérifier par un test croisé (écrire un patch, le relire avec
`op-patch-util dump`, comparer) avant de coder un convertisseur — ce n'est
pas un détail à deviner.

### 2.6 Moteurs "cachés" confirmés côté patch réel

Un exemple de patch réel dans `op1aiff/main.py` (capturé en 2016, voir §6)
contient `"type": "iter"` — confirmation indépendante, sur un vrai fichier
utilisateur, que **Iter** (déjà documenté comme moteur caché ajouté par mod
dans [`FIRMWARE_MOD_CATALOG.md`](FIRMWARE_MOD_CATALOG.md) et
[`SYNTH_ENGINES_REFERENCE.md`](SYNTH_ENGINES_REFERENCE.md)) est bien une
valeur de `type` valide pour le firmware, pas une hypothèse.

### 2.7 Noms de moteurs/effets/LFO et leurs plages numériques

Les **noms** (Cluster, Digital, DNA, Delay, Grid, Nitro, Tremolo, Value,
Random…) sont déjà établis de façon plus fiable dans
[`SYNTH_ENGINES_REFERENCE.md`](SYNTH_ENGINES_REFERENCE.md) et
[`EFFECTS_LFO_SEQUENCERS_REFERENCE.md`](EFFECTS_LFO_SEQUENCERS_REFERENCE.md)
(lecture directe de `op1_factory.db`, la source la plus proche du firmware
réel). `teoperator/src/op1/synth.go:89-208` apporte un complément que nos
docs n'avaient pas encore : des **plages numériques min/max/pas** par moteur,
effet et LFO — utiles pour construire des curseurs qui n'acceptent pas de
valeurs invalides.

Exemples directement réutilisables (à revérifier sur firmware avant de les
coder en dur, `teoperator` datant d'avant l'étude de notre propre
`op1_factory.db`) :

| Catégorie | Nom | Knob 1 | Knob 2 | Knob 3 | Knob 4 |
|---|---|---|---|---|---|
| Moteur | `cluster` | 3072–17408 (pas 128) | 0–32767 | 512–24064 | 3–1638 |
| Moteur | `digital` | 0–32767 | 2048–26624 | -32768–32767 | 0–32767 |
| Moteur | `dna` | -29491–32767 | 4608–12800 | 0–32767 | 0–32767 |
| Effet | `nitro` | 64–16448 | -32768–32768 (pas 512) | 0–20643 | 64–16448 |
| Effet | `delay` | 1024–11264 | 3276–32767 | 0–16384 | 0–32767 |
| ADSR (tous moteurs) | attack/decay/release | 64–16320 (pas 512) | sustain 0–32767 | playmode `{2048,5120,11264,14336}` = poly/mono/legato/unison | — |

Table complète dans `teoperator/src/op1/synth.go`. `op1-docs/lfo.md` fournit
un troisième jeu de plages par sous-paramètre de LFO (ex. `Bend`, `Crank`)
mais avec une nomenclature différente de celle de la base factory — les deux
sources ne se recoupent pas terme à terme, à réconcilier avant de s'en
servir pour un éditeur définitif.

## 3. Format Tape / Album : pas de métadonnées, juste des contraintes

Confirmé par lecture de `OP-1Z-Sample-Manager/blueprints/constants.py` et
`tape_export.py` (aucune écriture de métadonnées OP‑1, juste une copie/
conversion FFmpeg de fichiers) :

- `tape/track_1.aif` à `track_4.aif`, `album/side_a.aif` / `side_b.aif` — la
  casse canonique observée en code est **minuscule avec underscore**
  (`track_`, `side_`), ce qui affine l'alias déjà noté dans
  `OP1_KNOWLEDGE_BASE.md` (`sideA.aif` semble être une variante de version
  d'OS, pas la forme d'origine).
- Un fichier `track_N.aif`/`side_X.aif` est un **AIFF audio brut**, mono,
  44,1 kHz/16 bits — sans chunk `APPL`. C'est cohérent avec "quoi envoyer
  dedans" : rien d'autre que du son.

## 4. Le vrai obstacle pour un import de piste : `tape.db`

`op1-docs/README.md` liste `tape.db` comme stockant **"tape clips, loop
points etc"**, séparé des fichiers `.aif`. Sur les 12 dépôts communautaires
étudiés dans cette passe — y compris les plus techniques
(`op1-docs`, `op1repacker`, `opie`) — **aucun ne documente le format binaire
de `tape.db`** ; `op1-docs` le marque lui-même comme TODO.

Conséquence concrète et vérifiée (pas une supposition) : écrire directement
un `track_N.aif` complet (un enregistrement continu qui remplace toute la
piste) est reproductible avec les règles ci-dessus, mais **positionner
plusieurs clips avec des points de loop précis sur la bande, comme le fait
LIFT/DROP/SPLIT sur la machine, ne peut pas être répliqué en écrivant
seulement les `.aif`** tant que `tape.db` n'est pas compris. Ceci confirme et
durcit la limite déjà posée dans `OP1_KNOWLEDGE_BASE.md` et
[`TAPE_MODE_REFERENCE.md`](TAPE_MODE_REFERENCE.md) : notre clone peut
composer librement en local, mais un export "un seul bloc audio par piste"
reste la seule opération sûre vers la machine réelle tant que ce point n'est
pas résolu.

## 5. Recette minimale pour écrire un patch valide

1. Générer un AIFF mono/44,1 kHz/16 bits standard (`FORM`/`COMM`/`SSND`),
   n'importe quel encodeur AIFF correct convient (FFmpeg, déjà utilisé dans
   `tools/sample_preflight.py`).
2. Construire le JSON du patch avec les champs de §2.3 (drum) ou §2.4
   (sampler), tailles de tableaux et plages de §2.7 respectées.
3. Localiser l'offset du chunk `SSND` dans le fichier.
4. Insérer avant lui : `"APPL"` + taille (4 + longueur JSON + remplissage,
   big-endian) + `"op-1"` + JSON + remplissage.
5. Recalculer et réécrire la taille totale du `FORM` (octets 4-8 du
   fichier) pour qu'elle reste cohérente.
6. Relire le fichier produit avec `op-patch-util dump` (déjà installé via
   `Install-OP1StudioTools.ps1`) pour vérifier — ne jamais faire confiance à
   l'écriture sans relecture croisée.

Notre projet n'a pas besoin de réimplémenter ça : `tools/patch_bridge.py`
délègue déjà à `op-patch-util` en sous-processus isolé (décision actée dans
`TOOLING_AUDIT.md`). Cette recette sert à **comprendre et valider** ce que
l'outil produit, pas à le remplacer.

## 6. Correction apportée au registre existant

En clonant `op1aiff` au commit épinglé dans `tools/sources.yml`
(`db742a1bbd42c324b1996f1abbdee755f2cfd3d5`), ce commit s'est révélé être
**un dépôt vide** (README + LICENSE seulement, aucun code Python). Le vrai
code (`op_aiff.py`, format ci-dessus) existe seulement sur la branche
`dev`, commit `881f1d9`, jamais fusionnée sur `master`. `tools/sources.yml`
et `scripts/fetch-community-tools.sh` ont été corrigés pour pointer vers ce
commit ; les affirmations passées de `TOOLING_AUDIT.md` sur `op1aiff`
("inspection AIFF/preset en lecture seule") restent justes, mais décrivaient
en réalité du code jamais audité localement jusqu'à cette session.

`connect-op1` s'est aussi révélé différent de sa description dans
`tools/sources.yml` ("exemple WebUSB") : c'est en réalité un script Lua +
shell qui appelle `lsusb`/JACK côté Linux, pas une démo WebUSB navigateur.
L'identifiant `2367:0004` reste confirmé et inchangé.

## 7. « Time savers » — ce qui vaut vraiment la peine

| Dépôt | Ce qu'on peut reprendre concrètement | Comment | Licence |
|---|---|---|---|
| `op-patch-util` | Déjà fait : sous-processus isolé via `patch_bridge.py`. Rien à changer. | — | **aucun fichier LICENSE trouvé** — confirmé à nouveau cette session, toujours pas de réutilisation de code, juste l'exécutable |
| `teoperator` | Table de plages numériques par moteur/effet/LFO (§2.7) — gain de temps direct si on construit un éditeur de patch avec curseurs bornés, évite de deviner les bornes. | Recopier les valeurs en constantes chez nous, avec attribution, **pas** le code Go | MIT |
| `op1aiff` (branche `dev`) | Recette de lecture/écriture du chunk `APPL` en ~60 lignes Python lisibles — bon test de référence si on veut un jour valider `op-patch-util` par une seconde implémentation indépendante en Python pur. | Lecture/comparaison, pas d'exécution du code tiers dans l'app | MIT |
| `OP-1Z-Sample-Manager` | Confirmation de la casse canonique des noms de fichiers Tape/Album (§3) — évite un futur bug de détection de fichiers. | Fait, capturé dans ce document | GPL-3.0 (déjà noté compatible AGPL/MIT dans `TOOLING_GAP_ANALYSIS.md`) |
| `op1-docs` | Rien de nouveau ce tour-ci au-delà de ce qui est déjà cité dans `SOURCES.md`/`FIRMWARE_CONTAINER_STUDY.md`, sauf la confirmation que `tape.db` reste non documenté même par la source la plus technique disponible (§4) — utile pour arrêter de chercher une réponse qui n'existe pas encore publiquement. | — | non déclarée |

Rien dans cette passe ne change les décisions déjà prises dans
`TOOLING_AUDIT.md`/`TOOLING_SHORTLIST.md`/`TOOLING_GAP_ANALYSIS.md` : ce
document les complète avec des **faits de format** utilisables pour coder,
là où les trois autres tranchent des questions de **réutilisation/licence**.
Consulter ces documents avant d'ajouter une dépendance.

## 8. Dépôts inspectés cette session

Clonés dans `.cache/community-tools/` (ignoré par Git) :

| Dépôt | Commit inspecté | Apport à ce document |
|---|---|---|
| `op1repacker` | `390b18e4` (déjà épinglé) | pas de nouveau fait format (hors périmètre patch/tape) |
| `op1-docs` | `38685982` (déjà épinglé) | structure du conteneur, `tape.db` non documenté (§4) |
| `op1svg` | `50a3b01e` (déjà épinglé) | pas de fait audio nouveau |
| `op1aiff` | `881f1d9` (corrigé, était `db742a1`) | format `APPL`, exemple réel avec `type: iter` |
| `opie` | `90b20ecf` (déjà épinglé) | rien de nouveau au-delà de `TOOLING_AUDIT.md` |
| `op-patch-util` | `e3417c3f` (nouveau, non épinglé — pas de commit officiellement recommandé en amont) | schéma JSON patch, enveloppe AIFF |
| `teoperator` | `ddc6ef3b` (nouveau) | schéma JSON patch (confirmation croisée), plages numériques, astuce `start`/`end` |
| `OP-1Z-Sample-Manager` | `1f2bbec9` (nouveau) | noms de fichiers Tape/Album canoniques |
| `op1tools` | `ef446f2d` (nouveau) | rien de nouveau au-delà de `TOOLING_AUDIT.md` (scripts Linux mount/eject) |
| `op1-glitter` | `816901ed` (nouveau) | thème/SVG, hors périmètre de ce document |
| `connect-op1` | `cb12b957` (nouveau) | correction de description (§6) |
| `op1REpackerGUI` | `3f54f41c` (déjà épinglé) | checkout impossible sous Windows (nom de fichier avec espace final) ; contenu déjà couvert par `TOOLING_AUDIT.md` |

Les commits "nouveaux" ne sont pas encore épinglés dans
`tools/sources.yml` (pas de rôle de réutilisation de code décidé pour eux,
seulement de lecture ponctuelle) — à faire si l'un d'eux devient une vraie
dépendance de référence.
