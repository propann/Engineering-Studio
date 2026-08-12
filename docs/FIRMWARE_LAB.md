# Laboratoire firmware OP‑1 original

Dernière étude reproductible : **11 août 2026** · OS officiel **246**.

Ce document décrit les outils capables d’ouvrir (`unpack`), d’analyser et de
reconstruire (`repack`) un fichier `.op1`. Il sert au laboratoire local du
projet, pas au parcours normal de mise à jour. Les firmwares Teenage
Engineering restent propriétaires et ne sont pas stockés dans ce dépôt.

## Réponse courte : le fichier est copié manuellement sur la machine

Le firmware n’est pas envoyé par une commande magique de l’application. La
procédure officielle est :

1. éteindre l’OP‑1 et débrancher l’USB ; attendre trois secondes ;
2. maintenir `COM` pendant l’allumage pour entrer dans **te‑boot** ;
3. appuyer sur `1` (**Upload firmware**) ;
4. brancher l’USB et attendre le disque amovible ;
5. **copier manuellement le fichier `.op1` sur ce disque** — jamais un dossier
   déballé ;
6. éjecter le disque depuis le système d’exploitation ;
7. appuyer sur `COM` sur l’OP‑1 et attendre sa validation/reprise.

OP‑1 Studio prépare le fichier, calcule ses preuves, affiche cette checklist
et peut ouvrir le gestionnaire de fichiers. Il ne prétend pas avoir installé
le firmware avant que l’OP‑1 ait terminé son propre contrôle.

Sources officielles : [mise à jour OP‑1 original](https://teenage.engineering/downloads/op-1/original),
[guide te‑boot](https://teenage.engineering/guides/op-1/original/te-boot) et
[mode Disk](https://teenage.engineering/guides/op-1/original/song-rendering-and-connectivity).

## Ce que nous avons réellement observé sur OS 246

Le fichier officiel a été téléchargé dans un cache temporaire, puis inspecté
avec `tools/firmware_inspector.py` et ouvert dans une copie de travail avec
`op1repacker`. Le relevé machine-lisible est dans
[`data/firmware/op1_246-observation.json`](../data/firmware/op1_246-observation.json).

| Mesure | Observation |
|---|---:|
| Taille du fichier original | 13 039 128 octets |
| SHA‑256 local | `c5315218f825f143b415ca554516541898abee843d3a236df0b54c04e1fb13a9` |
| CRC stocké / recalculé | `cc08445c` / `cc08445c` |
| Entrées TAR | 117 |
| Fichiers / dossiers | 107 / 10 |
| Données décompressées | 26 368 000 octets |
| Marqueurs reconnus | `OP1_vdk.ldr`, `te-boot.ldr`, `op1.db`, `op1_factory.db`, `tape.db` |
| Version analysée | `R. 00246`, build `00246` |
| Build / te‑boot | `2022/11/09 16:17:00` / `2.30` |

Le relevé local n’est pas une signature Teenage Engineering. Il prouve
seulement ce qui a été calculé sur le fichier téléchargé à cette date.

## Format observé

```text
op1_246.op1
├── CRC-32 little-endian        4 octets
└── flux LZMA-Alone             reste du fichier
    └── archive TAR GNU
        ├── OP1_vdk.ldr         code principal, chiffré selon la recherche communautaire
        ├── te-boot.ldr         chargeur de démarrage
        └── content/
            ├── audio/          fichiers .raw et espaces utilisateur
            ├── display/        ressources SVG
            ├── op1.db           état utilisateur
            ├── op1_factory.db   presets et données d’usine
            ├── tape.db          données Tape
            └── kerntable.db     données de crénage de la police
```

Les recherches publiques indiquent que le code de `OP1_vdk.ldr` contient des
blocs chiffrés ; l’objectif d’OP‑1 Studio est donc l’inspection du conteneur
et des ressources, pas le contournement d’une protection.

## Outils récupérés et décision d’intégration

Les sources sont téléchargées par
[`scripts/fetch-community-tools.sh`](../scripts/fetch-community-tools.sh) dans
`.cache/community-tools/`, puis figées sur les commits étudiés.

| Outil | Commit étudié | Licence annoncée | Ce qu’il apporte | Décision |
|---|---|---|---|---|
| [`op1repacker`](https://github.com/op1hacks/op1repacker) | `390b18e` | MIT | unpack, analyse, mods, repack | labo isolé ; ne pas utiliser tel quel pour une extraction utilisateur |
| [`op1REpackerGUI`](https://github.com/op1hacks/op1REpackerGUI) | `3f54f41` | MIT pour le dépôt GUI | interface, thèmes, backup/restore, éjection | référence UX et audit ; ne pas reprendre ses écritures sans réécriture |
| [`op1-docs`](https://github.com/sualk/op1-docs) | `3868599` | aucune licence trouvée | format du conteneur, bases, chiffrement, SVG | référence factuelle ; pas de copie de contenu sans vérification |
| [`op1svg`](https://github.com/op1hacks/op1svg) | `50a3b01` | MIT | normalisation/analyse SVG | futur sidecar graphique, après attribution |
| [`op1aiff`](https://github.com/op1hacks/op1aiff) | `db742a1` | MIT | inspection/création de presets AIFF | futur sidecar samples/patches |
| [`opie`](https://github.com/op1hacks/opie) | `90b20ec` | non déclarée | ancien backup/restore macOS, presets | étude historique seulement |
| [`op1-fw-archive`](https://github.com/op1hacks/op1-fw-archive) | — | contenu firmware propriétaire | historique des versions | métadonnées et liens uniquement ; aucun binaire dans le dépôt |

### Ce que fait réellement `op1repacker`

Le cœur Python suit cette chaîne :

```text
unpack : retirer 4 octets CRC → LZMA-Alone → extraire TAR
repack : dossier → TAR GNU → LZMA-Alone → préfixer un nouveau CRC-32
```

Les paramètres LZMA observés dans le code sont `preset=9`, `lc=3`, `lp=1`,
`pb=2` et `dict_size=2^23`. Le projet explique aussi que l’OP‑1 refuse les
firmwares trop gros et que la mémoire disponible impose un compromis de
compression.

Le point critique est que la version étudiée utilise `tar.extractall()` sans
contrôle de chemin, ne valide pas le CRC avant le déballage et reconstruit
l’archive dans l’ordre renvoyé par `os.listdir()`. Ces choix sont acceptables
pour un outil de laboratoire utilisé sur un fichier local volontaire, pas pour
une application qui ouvre un fichier téléchargé ou fourni par un tiers.

La GUI reprend presque à l’identique ce moteur, ajoute des opérations de
montage/éjection et une restauration d’archives. Son contrôle de sauvegarde
vérifie surtout la présence de dossiers et ne fournit pas le manifeste par
fichier exigé par OP‑1 Studio. La restauration doit donc être réécrite autour
de `BackupManifest`, de chemins relatifs sûrs et d’une relecture après copie.

## Test de reconstruction sans modification

Le test a été fait hors dépôt, sur l’OS 246 officiel :

```bash
python3 tools/firmware_inspector.py .cache/firmware/op1_246.op1 --include-files

tool_dir="$PWD/.cache/community-tools/op1repacker"
firmware="$PWD/.cache/firmware/op1_246.op1"

PYTHONPATH="$tool_dir" python3 -c \
  'from op1repacker.op1_repack import OP1Repack; import sys; OP1Repack(debug=1).unpack(sys.argv[1])' \
  "$firmware"

PYTHONPATH="$tool_dir" python3 -c \
  'from op1repacker.op1_repack import OP1Repack; import sys; OP1Repack(debug=1).repack(sys.argv[1])' \
  "$PWD/.cache/firmware/op1_246"

python3 tools/firmware_inspector.py \
  .cache/firmware/op1_246-repacked.op1 --include-files
```

Résultat :

- les 107 fichiers extraits ont été retrouvés après reconstruction ;
- aucun contenu de fichier n’a changé dans le round-trip sans modification ;
- le conteneur reconstruit reste valide et son CRC est correct ;
- le fichier reconstruit fait 12 115 710 octets et n’a pas le même SHA‑256 :
  `306b534d99c35bdb909c3e83decd36a41322b1de77f113025be8ff1e409ae2b2` ;
- ce n’est donc pas une copie binaire identique : ordre, métadonnées TAR et
  compression changent.

Conclusion pratique : après chaque repack, OP‑1 Studio doit refaire son propre
contrôle CRC/LZMA/TAR, vérifier les marqueurs, comparer la liste et les hashes
des fichiers attendus, puis produire un journal. Un succès Python ne doit
jamais être présenté comme une installation réussie sur la machine.

## Vérification des mods sur OS 246

Les mods `iter`, `presets-iter`, `filter`, `subtle-fx`, `gfx-iter-lab`,
`gfx-tape-invert` et une variante CWO ont ensuite été appliqués sur une copie
fraîche, repackés, puis relus par l'inspecteur OP-1 Studio. Le résultat combiné
observé contenait toujours 117 entrées et un CRC correspondant au flux
compressé. Les variantes CWO `moose`, `cat`, `dog` et `wizard` ciblent la même
ressource : elles sont des choix exclusifs, pas une série de patches à empiler.

Les résultats complets, y compris les éléments seulement candidats ou de
recherche, sont dans le [catalogue des mods](FIRMWARE_MOD_CATALOG.md) et son
registre [`data/mods/catalog.json`](../data/mods/catalog.json).

## Parcours OP‑1 Studio retenu

### Parcours officiel

1. télécharger uniquement depuis l’URL officielle répertoriée ;
2. vérifier taille, CRC, LZMA, TAR, chemins et marqueurs ;
3. créer et vérifier la sauvegarde de l’OP‑1 en **Disk mode** ;
4. guider l’utilisateur vers **te‑boot > 1** ;
5. lui faire copier manuellement le `.op1` sur le volume amovible ;
6. lui faire éjecter le volume ;
7. attendre la validation et le redémarrage de l’OP‑1 ;
8. enregistrer le résultat confirmé par l’utilisateur.

### Labo expert

Le labo peut ouvrir une copie locale, afficher les ressources, appliquer une
modification expérimentale et reconstruire un fichier marqué
`UNOFFICIAL-MODIFIED`. Il ne doit pas afficher de bouton d’installation, ne
doit jamais écrire directement sur le volume TE‑boot et doit toujours conserver
le firmware source intact.

## Ce qui manque encore

- un extracteur Rust sûr partageant les mêmes règles que l’inspecteur Python ;
- une reconstruction déterministe et contrôlée, sans `tar.extractall()` ;
- une comparaison visuelle des bases SQLite et des ressources SVG/audio ;
- des fixtures légales modifiables pour tester les repacks sans redistribuer de
  firmware Teenage Engineering ;
- un détecteur hardware-in-the-loop capable de distinguer Disk mode et TE‑boot ;
- une preuve de fin d’installation fournie par l’utilisateur ou observée sur
  le volume après redémarrage.
