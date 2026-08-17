# Audit des doublons et optimisation — 16 août 2026

## Verdict

L’inventaire ne révèle pas de carte outil dupliquée dans le Hub ni de dossier
outil identique à supprimer. Les raccourcis “éditeur d’image”, “éditeur de
samples”, “services”, “sons” et “jeux” ouvrent volontairement un studio de
base avec `hubTool` : ce sont des entrées spécialisées, pas des copies de
fonctionnalité.

Le doublon de code confirmé était l’analyse WAV, copiée entre OP‑1 et EP‑133.
Il est maintenant centralisé dans
`packages/audio-bridge/src/wavAnalysis.ts`. Les deux applications gardent
leurs adaptateurs locaux et leurs règles machine, donc les anciens imports et
les tests restent compatibles.

## Inventaire des outils exposés

| Entrée Hub | Destination | Statut |
|---|---|---|
| OP‑1 Studio | studio OP‑1 sans `hubTool` | studio principal |
| EP‑133 Studio | studio EP‑133 sans `hubTool` | studio principal |
| Éditeur d’image | OP‑1 avec `hubTool=editor` | raccourci spécialisé |
| Éditeur de samples | OP‑1 avec `hubTool=sounds` | raccourci spécialisé |
| Services OP‑1 | OP‑1 avec `hubTool=services` | raccourci spécialisé |
| Sons & transferts EP‑133 | EP‑133 avec `hubTool=sounds` | raccourci spécialisé |
| Jeux & entraînement | EP‑133 avec `hubTool=game` | raccourci spécialisé |
| Synchronisation MIDI | panneau Hub local | outil transversal |

Les huit entrées ont des identifiants distincts et sont couvertes par le test
navigateur Hub. Aucun doublon de route n’a été retiré.

## Doublons de code traités

### Analyse WAV — traité

Le parseur RIFF, la lecture PCM 8/16/24/32 bits et float 32 bits, l’analyse de
crête/écrêtage, les crêtes de forme d’onde, la suggestion de trim et le calcul
de normalisation sont désormais dans `@studio-hub/audio-bridge`.

- OP‑1 conserve `OP1_AUDIO_LIMITS` et `exceedsOp1Duration`.
- EP‑133 conserve `analyzeAiffBuffer`, spécifique à l’AIFF big-endian.
- `wavConvert.ts`, `audioConvert.ts` et l’éditeur AIFF restent séparés : leurs
  formats cibles et leurs contraintes de resampling ne sont pas identiques.

### Conventions de fichiers — conservées

Les `App.tsx`, `main.tsx`, `hubCommunication.ts` et
`useHubInitialization.ts` présents dans plusieurs applications ne sont pas
des fichiers en double : ils appartiennent à des runtimes et contrats machine
différents. Une fusion mécanique introduirait des dépendances croisées entre
Hub, OP‑1 et EP‑133.

## Paquets peu ou pas branchés au runtime

La recherche des imports montre que `types`, `shared-stores`, `save-manager`,
`instrument-*` et plusieurs `game-*` restent surtout des fondations/tests.
Ils ne sont pas supprimés : certains sont utilisés par les tests de packages,
et une suppression ferait disparaître du travail récupérable. En revanche, le
README ne doit pas prétendre que toutes les applications les importent déjà.

Prochaine optimisation fonctionnelle, à traiter séparément avec tests
utilisateur : brancher d’abord un contrat `save-manager` au coffre Hub, puis
un adaptateur instrument/jeu sur un écran EP‑133. Cette intégration ne doit
pas être mélangée au nettoyage des doublons audio.

## Contrôles exécutés

- `npm run typecheck -w apps/op1-studio`
- `npm run typecheck -w apps/ep133-studio`
- tests audio OP‑1 : 5 sous-tests Node, tous verts
- `npm run test:wav -w apps/ep133-studio`
- `npm run test:convert -w apps/ep133-studio`
- `git diff --check`

La passe complète `typecheck:all`, `build:all`, `lint:all` et
`test:e2e:hub` reste la validation de sortie avant commit/push.
