# Liste complète des moteurs audio de l'OP-1 original

Référence établie le 12 août 2026 en croisant trois sources indépendantes :
la page produit officielle, le guide officiel section 18.1, et la lecture
directe de `op1_factory.db` + des SVG d'écran sur l'OS 246 déballé
localement (voir [`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md)).
Les trois sources se recoupent exactement — rien de spéculatif ici.

## Les 13 moteurs officiels

Source : [`teenage.engineering/products/op-1/original`](https://teenage.engineering/products/op-1/original)
(« with thirteen synthesizer engines ») et
[`teenage.engineering/guides/op-1/original/reference`](https://teenage.engineering/guides/op-1/original/reference)
section 18.1, qui les nomme tous.

| # | Moteur | Description officielle (TE) | Table `op1_factory.db` | Écran SVG | État de l'étude |
|---:|---|---|---|---|---|
| 1 | **Cluster** | multi layered oscillator cluster | `synth_types` id 1 | `cls.svg` | étudié en détail — patron knobs/curves complet |
| 2 | **Digital** | true digital synthesis | `synth_types` id 2 | `t10.svg` | étudié — écran le plus minimal (1,7 Ko, aucun groupe) |
| 3 | **Dr. Wave** | frequency domain synthesis | `synth_types` id 3 | `drw.svg` | étudié — fichier vide sur OS 246, à confirmer |
| 4 | **FM** | four operator FM synthesis | `synth_types` id 4 | `fm.svg` (+ `fmpopup.svg`) | étudié — écran le plus gros (48 Ko), matrice de routage 4 opérateurs |
| 5 | **Phase** | phase distortion | `synth_types` id 5 | `pd.svg` | étudié |
| 6 | **Pulse** | dual pulsetrain oscillator | `synth_types` id 6 | `pls.svg` | étudié — grille façon filtre/spectre |
| 7 | **DNA** | CPU Id Noise synthesis | `synth_types` id 7 | `id.svg` | étudié — seul écran entièrement monochrome |
| 8 | **String** | waveguide string model | `synth_types` id 8 | `st.svg` | étudié |
| 9 | **D-Synth** | multi envelope dual oscillator synth | `synth_types` id 9 | `dsynth.svg` | étudié — 58 groupes, le plus dense après FM |
| 10 | **Voltage** | multi oscillator electric synthesis | `synth_types` id 10 | `slump.svg` | étudié — oscilloscope stéréo |
| 11 | **D-Box** | teenage drum synthesizer | `drum_types` id 1 | `dbox.svg` | étudié |
| 12 | **Synth Sampler** | teenage sample player | — (lecteur, pas de ligne moteur) | `sampler.svg` | étudié — start/end/loop/gain, overview + vue zoomée |
| 13 | **Drum Sampler** | teenage percussion sample player | — (lecteur, pas de ligne moteur) | `drum2.svg` | étudié — pitch/rootnote/loop/gate/oneshot/reverse |

### Pourquoi la base n'a que 11 lignes de moteurs pour 13 annoncés

Les 10 `synth_types` + 1 `drum_types` (D-Box) sont des moteurs
**paramétriques** : chaque ligne porte un tableau `default_params` de 8
valeurs, modifiable, c'est un algorithme de synthèse. Synth Sampler et Drum
Sampler ne sont **pas des synthèses algorithmiques** — ils lisent un
échantillon audio importé (start/end/loop/gain). Ils n'ont donc pas besoin
d'une ligne "moteur" en base : c'est un mode de lecture, pas un jeu de
paramètres à stocker. 10 + 1 + 2 = 13, le compte est exact.

## Le 14e moteur — non officiel, hors de cette liste

| Moteur | Statut | Table | Écran SVG |
|---|---|---|---|
| **Iter** | absent de la liste officielle TE et de `synth_types` d'usine, mais réellement présent en mémoire | `synth_types` id **11** — ajoutable par simple `INSERT SQL`, déjà vérifié dans notre labo (`FIRMWARE_MOD_CATALOG.md`) | `iter.svg`, 4 Ko, aucun groupe nommé — écran nettement moins abouti que les 13 officiels |

Cohérent avec le statut déjà documenté : un moteur caché, jamais annoncé
publiquement, activable par une simple insertion de ligne — pas une
prouesse de reverse engineering, juste une case cochée dans le firmware
lui-même.

## Effets, LFO et séquenceurs (pour mémoire, hors sujet "moteurs")

Déjà entièrement recensés dans `op1_factory.db` (voir
`FIRMWARE_CONTAINER_STUDY.md`) : 7 effets (`fx_types`), 7 LFO (`lfo_types`),
6 séquenceurs (`seq_types`). Le mod `filter` ajoute un 8e effet caché
(`fx_types` id 2), même mécanisme que Iter.

## Méthode

```powershell
python tools/firmware_fetch.py --version 246 --output .cache/firmware/op1_246.op1
# unpack local (voir FIRMWARE_CONTAINER_STUDY.md pour la commande complète)
# puis sqlite3 sur content/op1_factory.db, table synth_types / drum_types
```

Sources web utilisées, consultées le 12 août 2026 :
- [teenage.engineering/products/op-1/original](https://teenage.engineering/products/op-1/original)
- [teenage.engineering/guides/op-1/original/reference](https://teenage.engineering/guides/op-1/original/reference)
- [teenage.engineering/guides/op-1/original/synthesizer-mode](https://teenage.engineering/guides/op-1/original/synthesizer-mode)

## Référence croisée

[`FIRMWARE_CONTAINER_STUDY.md`](FIRMWARE_CONTAINER_STUDY.md) ·
[`ENGINE_EDITOR_CONCEPT.md`](ENGINE_EDITOR_CONCEPT.md) ·
[`FIRMWARE_MOD_CATALOG.md`](FIRMWARE_MOD_CATALOG.md)
