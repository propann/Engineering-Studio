# Catalogue des mods firmware

État vérifié le **11 août 2026**, cible **OP-1 original**. Le registre
machine-lisible est [`data/mods/catalog.json`](../data/mods/catalog.json).

## Ce qui est réellement vérifié

Sur une copie locale et non committée de l'OS 246 officiel, les modifications
de base ont été appliquées puis reconstruites avec `op1repacker`. L'inspecteur
OP-1 Studio a confirmé à chaque fois le CRC, le flux LZMA, l'archive TAR et les
117 entrées attendues.

| Priorité | Mod | Utilité | État | Risque |
|---|---|---|---|---|
| P0 | Iter caché | nouveau moteur sonore déjà présent | vérifié OS 246 | contrôlé |
| P0 | Presets Iter | rend Iter immédiatement exploitable | vérifié OS 246 | contrôlé |
| P0 | Filter caché | nouvel effet déjà présent | vérifié OS 246 | contrôlé |
| P1 | Valeurs `subtle-fx` | points de départ moins agressifs | vérifié OS 246 | contrôlé |
| P1 | Quantification par gammes | aide musicale avancée | patch communautaire, non intégré | critique |
| P1 | Presets/samples d'usine personnalisés | palette sonore complète | candidat, fixtures nécessaires | élevé |
| P2 | Tape invert | lisibilité | vérifié en labo | contrôlé |
| P2 | Iter Lab / Lost Art | identité visuelle | Iter Lab vérifié, Lost Art partiel | contrôlé |
| P2 | CWO moose/cat/dog/wizard | personnalisation | variants vérifiés séparément | contrôlé |
| P2 | Glitter / SVG personnalisé | thèmes complets | candidat sidecar ; voir [`op1hacks/op1-glitter`](https://github.com/op1hacks/op1-glitter) et [`FIRMWARE_MOD_RESOURCES.md`](FIRMWARE_MOD_RESOURCES.md) pour le mécanisme et la palette réelle | contrôlé/élevé |
| P3 | moteur compilé supplémentaire | comportement inédit | aucune preuve reproductible | critique |
| P3 | flash/OTP/ECC/bootloader | recherche matérielle | exclu | rouge |

## Limite structurante

`op1repacker` modifie surtout la base SQLite et les ressources SVG ; son propre
README précise que ces mods activent ou ajustent des éléments déjà présents.
Il ne transforme pas magiquement un OP-1 original en une nouvelle machine et
ne garantit pas la compatibilité d'une version future.

Les bases observées dans l'OS 246 exposent déjà les familles de synthèse
Cluster, Digital, Dr Wave, FM, Phase, Pulse, DNA, String, DSynth et Voltage,
ainsi que les séquenceurs Pattern, Endless, Tombola, Finger, Sketch et
Arpeggio. Iter (ID 11) et Filter (ID 2) sont absents de la base d'usine et
peuvent être ajoutés par les mods communautaires étudiés. Cela ne prouve pas
qu'un autre moteur caché puisse être activé par une simple ligne SQLite.

## Variantes incompatibles entre elles

Les patches graphiques CWO (`moose`, `cat`, `dog`, `wizard`) visent la même
ressource. Ils doivent être proposés comme un choix exclusif, jamais enchaînés
dans le même arbre de travail. Toute nouvelle tentative part d'une copie
propre du firmware officiel.

## Modes de mods à garder séparés

| Couche | Exemples | Décision produit |
|---|---|---|
| Conteneur | CRC, LZMA-Alone, TAR | implémenter un lecteur/reconstructeur sûr en Rust |
| Base usine | Iter, Filter, FX, presets | labo contrôlé avec fixtures SQLite |
| Ressources écran | SVG, Glitter, CWO | normaliser, limiter, comparer visuellement |
| Audio/contenu | patches, raw, Tape | dépôt local, provenance et prévisualisation |
| Code binaire | quantification, déverrouillage moteur | export manuel expert uniquement |
| Mémoire matérielle | OTP, ECC, flash | exclu de l'application |

## Règles de travail

1. Conserver un firmware officiel propre et son SHA-256.
2. Décompresser dans un répertoire temporaire isolé, jamais dans le coffre de
   l'utilisateur.
3. Appliquer un seul plan de mods à la fois et garder le diff des fichiers.
4. Repack, puis refaire CRC/LZMA/TAR, liste des chemins et hashes.
5. Marquer le résultat `UNOFFICIAL-MODIFIED` et l'exporter séparément.
6. Ne jamais copier automatiquement le résultat sur le volume TE-boot.
7. Conserver une sauvegarde vérifiée et un chemin manuel de retour au firmware
   officiel.

Le détail du format, des limites de `op1repacker` et de la procédure TE-boot
se trouve dans [FIRMWARE_LAB.md](FIRMWARE_LAB.md) et
[FIRMWARE_SAFETY.md](FIRMWARE_SAFETY.md).
