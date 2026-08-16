# Effets, LFO et séquenceurs — liste complète

Suite de [`SYNTH_ENGINES_REFERENCE.md`](SYNTH_ENGINES_REFERENCE.md), même
méthode : croisement de la page officielle, du guide officiel (section 18)
et de la lecture directe de `op1_factory.db` sur l'OS 246 déballé
localement. Les trois sources se recoupent exactement sur les trois
catégories — aucun élément caché ou manquant trouvé ici, contrairement aux
moteurs (qui avaient Iter en plus).

## Les 7 effets

`fx_types` (`op1_factory.db`) contient exactement ces 7 lignes + Filter,
caché, en 8e (voir plus bas).

| Effet | Description officielle | `fx_types` id | Écran SVG | Confiance |
|---|---|---:|---|---|
| **Delay** | solid state delay | 5 | `delay.svg` | haute — nom direct |
| **Grid** | three dimensional feedback plate | 3 | `grid.svg` | haute — confirmé cette session (groupes `grid`/`x`/`y`) |
| **Nitro** | dual resonant turbo filter | 10 | `ftwo.svg` | haute — dictionnaire `op1-glitter` |
| **Phone** | hacked telephone system | 7 | `ptch.svg` | haute — dictionnaire `op1-glitter` |
| **Punch** | hard hitting low pass filter | 4 | `mllp.svg` | haute — dictionnaire `op1-glitter` |
| **Spring** | mathematic reverb | 8 | `rymd.svg` | haute — dictionnaire `op1-glitter`, corrige une première hypothèse "modes principaux" |
| **CWO** | pitch shifting delay | 9 | `bode.svg` | haute — dictionnaire `op1-glitter` |

**8e effet, caché comme Iter** : **Filter** — absent de `fx_types` d'usine
(id 2 manquant, voir `SYNTH_ENGINES_REFERENCE.md`/`FIRMWARE_CONTAINER_STUDY.md`),
ajouté par le mod `filter`, même mécanisme d'`INSERT SQL` qu'Iter. Non
listé dans la doc officielle des 7 effets — cohérent avec son statut de
moteur/effet caché.

## Les 7 LFO

`lfo_types` contient exactement ces 7 lignes, aucun élément caché trouvé ici
(contrairement aux moteurs et effets).

| LFO | Description officielle | `lfo_types` id | Écran SVG | Confiance |
|---|---|---:|---|---|
| **Tremolo** | vibrato : module pitch et volume, vitesse et enveloppe réglables | 1 | `duallfo.svg` | moyenne — "dual" cohérent avec 2 paramètres modulés (pitch + volume), pas confirmé par nom direct |
| **Value** | LFO classique, un seul paramètre modifié | 2 | `singlelfo.svg` | moyenne — "single" cohérent avec 1 seul paramètre |
| **Random** | randomise tous les paramètres d'un module | 3 | `rndlfo.svg` | haute — nom direct |
| **Element** | modulation depuis une source externe (micro, entrée ligne, capteur G, radio FM) | 4 | `reroutelfo.svg` | moyenne — "reroute" cohérent avec une source externe redirigée |
| **MIDI** | route un CC MIDI externe vers l'OP-1 | 5 | `midilfo.svg` | haute — nom direct |
| **Bend** | utilise l'accessoire bender | 6 | `bendlfo.svg` | haute — nom direct |
| **Crank** | utilise l'accessoire manivelle | 7 | `cranklfo.svg` | haute — nom direct |

Les associations "moyenne confiance" (Tremolo/Value/Element) sont déduites
du sens du nom de fichier, pas confirmées par une source externe nommée —
à vérifier si un jour la distinction devient importante pour l'UI.

## Les 7 séquenceurs (6 en base + Finger compté deux fois)

`seq_types` contient 6 lignes ; le guide officiel en liste 7 parce que
**Finger** y est décrit séparément pour Synth et pour Drum, alors que c'est
la même entrée en base (même mécanisme de dédoublement que Sampler/Drum
Sampler pour les moteurs — un seul objet technique, deux contextes
d'usage).

| Séquenceur | Description officielle | `seq_types` id | Écran SVG | Confiance |
|---|---|---:|---|---|
| **Pattern** | 16-step grid sequencer | 1 | `pattern.svg` | haute |
| **Finger: Synth** | 32-step performance sequencer | 4 (`finger`) | `ok.svg` | haute — dictionnaire `op1-glitter` |
| **Finger: Drum** | 32-step performance sequencer | 4 (`finger`, même ligne) | `ok.svg` | haute — même écran, contexte drum |
| **Endless** | 128-step sequencer | 2 | `endless.svg` | haute |
| **Tombola** | spinning sequencer | 3 | `tombola.svg` | haute — confirmé cette session |
| **Sketch** | free form sequencer | 5 | `sketch.svg` | haute — confirmé cette session |
| **Grid** (nom officiel) / `arpeggio` (nom interne) | arpeggio sequencer | 6 (`arpeggio`) | `simple.svg` | haute — dictionnaire `op1-glitter`, nom interne différent du nom affiché |

Point notable : le séquenceur officiellement affiché **"Grid"** porte le nom
interne `arpeggio` en base — à ne pas confondre avec l'effet **Grid** (nom
identique côté utilisateur, mécanisme totalement différent : un est un
arpégiateur, l'autre une réverbération/delay). Le fichier `grid.svg` observé
plus tôt est bien l'écran de l'**effet**, pas du séquenceur.

## Bilan cumulé sur les trois inventaires (moteurs + effets/LFO/séquenceurs)

| Catégorie | Officiel/documenté | Caché trouvé | Total réel observé |
|---|---:|---:|---:|
| Moteurs | 13 | 1 (Iter) | 14 |
| Effets | 7 | 1 (Filter) | 8 |
| LFO | 7 | 0 | 7 |
| Séquenceurs | 6 objets (7 usages) | 0 | 6 |

Seuls les moteurs et les effets ont un élément caché — cohérent avec ce que
`FIRMWARE_MOD_CATALOG.md` documentait déjà (mods `iter` et `filter`), rien
d'autre trouvé de cette nature en LFO ou séquenceurs après lecture complète
des tables.

## Référence croisée

[`SYNTH_ENGINES_REFERENCE.md`](SYNTH_ENGINES_REFERENCE.md) ·
[`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md) ·
[`FIRMWARE_MOD_CATALOG.md`](FIRMWARE_MOD_CATALOG.md) ·
[`ENGINE_EDITOR_CONCEPT.md`](ENGINE_EDITOR_CONCEPT.md)
