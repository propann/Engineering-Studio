# Éditeur simple de patches

## Objectif

Donner un espace clair pour comprendre et modifier un patch sans obliger l’utilisateur à ouvrir un outil de reverse engineering. L’éditeur travaille sur une copie locale et ne touche jamais directement au volume de l’OP‑1.

## Première version

- bibliothèque des patches et kits locaux ;
- recherche par nom, type et tags ;
- aperçu audio avant et après modification ;
- nom et catégorie ;
- paramètres simples exposés par le format reconnu : cutoff, résonance, drive, enveloppe et niveau ;
- export d’une copie avec manifeste ;
- plan de transfert séparé, après sauvegarde.

## Formats et prudence

Le dépôt ne doit pas inventer un format binaire propriétaire. L’intégration d’un codec ou d’un éditeur communautaire doit être précédée d’un audit de licence, d’un commit épinglé et de fixtures légales.

**Mise à jour du 14 août 2026** : le format exact est maintenant validé — recoupé sur 3 implémentations indépendantes (`op-patch-util`, `teoperator`, `op1aiff`), schéma binaire complet documenté dans [`AUDIO_FILE_FORMAT_REFERENCE.md`](AUDIO_FILE_FORMAT_REFERENCE.md) et repris dans [`OP1_FIRMWARE_BIBLE.md`](OP1_FIRMWARE_BIBLE.md) §5. La **lecture** est déjà codée (`app/lib/aiffPatchOracle.ts`, lecture seule). L'**écriture** reste déléguée à `op-patch-util` via `tools/patch_bridge.py` (décision actée dans `TOOLING_AUDIT.md`) plutôt que réimplémentée ici — ce n'est donc plus un format à valider, mais un éditeur d'interface à construire par‑dessus un format déjà maîtrisé.

## Parcours cible

```mermaid
flowchart LR
    IMPORT["Importer"] --> MEASURE["Mesurer"]
    MEASURE --> EDIT["Éditer une copie"]
    EDIT --> PREVIEW["Écouter"]
    PREVIEW --> EXPORT["Exporter + vérifier"]
```

Le transfert vers la machine n’apparaît qu’après l’export validé et la liaison à un `ChangePlan`.
