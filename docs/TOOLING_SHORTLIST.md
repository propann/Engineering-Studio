# OP-1 Studio - shortlist des outils externes

Cette liste distingue les outils verifies sur leur depot public des pistes qui
meritent encore une verification. Elle sert de base aux integrations, pas de
liste de dependances a installer automatiquement.

## A integrer en priorite

| Priorite | Projet | Usage dans OP-1 Studio | Decision |
| --- | --- | --- | --- |
| P0 | [op1repacker](https://github.com/op1hacks/op1repacker) | Firmware : unpack, mods, repack, CRC | Deja vendored et utilise par `tools/firmware_bridge.py`. |
| P1 | [op-patch-util](https://github.com/AlexCharlton/op-patch-util) | Creation et modification de patches OP-1/OP-Z | Prochain moteur de la bibliotheque Sons. Garder Rust en executable isole. |
| P1 | [op1aiff](https://github.com/op1hacks/op1aiff) | Inspection des presets AIFF et metadonnees | Ajouter un mode lecture/analyse avant toute ecriture. |
| P1 | [op1svg](https://github.com/op1hacks/op1svg) | Normalisation des graphismes injectes dans le firmware | Ajouter une validation avant l'injection des SVG. |
| P2 | [FL-OP1-controller-script](https://github.com/ryrun/FL-OP1-controller-script) | Transport MIDI et raccourcis FL Studio | Adapter les mappings au pont MIDI de l'application. |

## A garder sous le coude

| Projet | Constat | Usage possible |
| --- | --- | --- |
| [opie](https://github.com/op1hacks/opie) | Existe, mais le depot indique pre-alpha et fonctionnement macOS uniquement. | S'inspirer du flux backup/restore; ne pas le brancher directement sous Windows. |
| [TOP-1](https://github.com/AlbertSmit/TOP-1) | Clone inspire de l'OP-1, surtout Linux/Raspberry Pi, pas un pilote OP-1. | Reference pour audio, sequencer et architecture MIDI. |
| [op1kenobi](https://github.com/alexmandelshtam/op1kenobi) | Simulateur visuel, pas une connexion materielle. | Reference UI et tests sans machine. |
| [op1REpackerGUI](https://github.com/epixjava/op1REpackerGUI) | Wrapper graphique du moteur firmware. | Comparer les parcours UX, sans doubler notre editeur integre. |
| [alesya-h/op1](https://github.com/alesya-h/op1) | Surface de controle Ableton Live. | Etudier les mappings MIDI pour les exercices et le transport. |
| [op1tools](https://github.com/blattm/op1tools) | Scripts USB/Linux, utiles mais hors cible Windows actuelle. | Reprendre uniquement les operations de preview et inventaire. |

## Non confirmes dans cette passe

Les projets `OP-1 Center`, `op1-puredata-bridge`, `node-op1`,
`op1-sync-clock` et `op-1-drum-kit-builder` restent des pistes fournies par la
liste initiale. Leur depot, licence, maintenance et compatibilite OP-1 n'ont
pas ete suffisamment confirmes ici. Ils ne doivent pas etre telecharges ni
integres automatiquement.

## Ordre de travail retenu

1. Finir le pont firmware local deja valide.
2. Integrer `op-patch-util` derriere un adaptateur de creation de packs.
3. Ajouter `op1aiff` en lecture seule pour indexer les patches.
4. Ajouter `op1svg` dans la validation des mods graphiques.
5. Construire ensuite le pont MIDI et les mappings DAW.

