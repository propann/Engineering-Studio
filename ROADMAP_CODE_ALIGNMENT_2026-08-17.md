# Feuille de route alignée au code — Studio Hub

**Date de référence :** 17 août 2026  
**Source de vérité :** code présent dans ce checkout, scripts npm, builds et tests réellement exécutés.  
**Règle :** une fonctionnalité n’est « livrée » que si son code est présent et compilé ; une validation matérielle ou navigateur manquante reste ouverte.

## État actuel

| Domaine | État réel | Preuve / limite |
|---|---|---|
| Portail Hub | Livré | `apps/studio-hub/src/App.tsx`, profil local, inventaire multi-machines, lancement des studios |
| Fiche personnage | Livrée dans le Hub | OP‑1 et EP‑133 ne sont plus les sources d’identité ; migration `legacy-profile.json` conservée |
| Coffre local | Livré côté Hub | `apps/studio-hub/src/VaultPanel.tsx`, snapshots sélectifs, manifeste et SHA‑256 |
| Raccord Hub → studios | Livré | `useHubInitialization`, transmission du profil et du workspace |
| Raccord studios → Hub | Code livré, E2E ouvert | événements sécurisés `backup_created` / `session_update`, mais pas encore de test navigateur Hub complet |
| Sécurité postMessage | Livrée | origine exacte et fenêtre source vérifiées dans les trois applications |
| Éditeur de samples OP‑1 | Livré localement | import WAV/AIFF, waveform, trim, fondus, export AIFF ; transfert machine à valider |
| Éditeur d’images OP‑1 | Livré localement | `DisplayCreatorPanel`, `Op1PixelEditor`, sanitation SVG ; bridge matériel hors périmètre actuel |
| Éditeur EP‑133 | Livré localement | patterns, Song, projets, samples, MIDI et exports présents dans `apps/ep133-studio/src` |
| Sauvegarde OP‑1 | Partiellement livrée | moteurs/outils et validations locales présents ; bridge natif et parcours complet à fermer |
| Sauvegarde EP‑133 | Partiellement livrée | coffre et archives locales présents ; restauration réelle machine à revalider |
| MIDI | Fonctionnel par studio | Web MIDI, SysEx de lecture et contrôles présents ; synchronisation OP‑1 + EP‑133 à tester ensemble |
| PWA/offline | Build livré, validation ouverte | le build EP‑133 génère le service worker ; installation/offline navigateur non validés |
| Packages adaptatifs | Livrés et testés isolément | adapters/games/packages passent leurs tests ; consommation directe par les apps encore limitée |
| Qualité monorepo | Verte avec réserves | builds, typechecks, tests et lint passent ; warning bundle EP‑133 et absence de tests `midi-analysis` |
| Dépôt Git unique | Non terminé | `apps/op1-studio` et `apps/ep133-studio` sont encore des gitlinks sans `.gitmodules` |

## Jalons actifs

### P0 — Rendre le dépôt réellement publiable

- convertir les deux gitlinks historiques en dossiers suivis par le dépôt parent ;
- exclure `node_modules`, `dist` et les secrets locaux ;
- vérifier qu’un clone propre peut exécuter `npm ci` et reconstruire les trois applications ;
- faire un commit contrôlé puis pousser vers le dépôt de référence.

**Acceptation :** le dépôt ne dépend plus de `/tmp` ni d’un ancien checkout pour compiler.

### P0 — Parcours E2E du Hub

Tester le parcours complet : Hub vierge, création/migration de fiche, deux machines
dont un EP‑133 128 Mo, workspace, ouverture OP‑1/EP‑133, réception du profil et du
workspace, événement studio → Hub, fermeture/réouverture et récupération de la fiche.

**Acceptation :** test Playwright dédié Hub + studios, avec contrôle des origines et absence de double fiche locale.

### P0 — Validation machine contrôlée

- OP‑1 : backup, manifeste, restauration et contrôle d’intégrité ;
- EP‑133 : scan, backup complet, sélection `projects/samples`, restauration ;
- progression, délais et erreurs visibles ;
- aucune écriture firmware ou opération irréversible sans confirmation.

**Acceptation :** rapport daté par machine, modèle/capacité et hash des archives avant/après.

### P1 — Synchronisation musicale

Définir la machine maître, le tempo, Start/Stop/Clock, la reconnexion, les modes
OP‑1 classique/contrôleur, l’arrêt d’urgence et les limites Web MIDI/SysEx.

**Acceptation :** scénario répétable avec deux appareils et journal MIDI exportable.

### P1 — Faire consommer les packages partagés

Choisir les contrats communs (profil, machine, MIDI, audio, sauvegarde), brancher
un premier adapter dans chaque application et ajouter un test app ↔ package.
Les packages actuels sont une fondation testée, pas encore une intégration produit complète.

### P2 — Qualité et performance

- ajouter des tests à `packages/midi-analysis` et des tests de contrat `postMessage`/SVG ;
- valider PWA/offline et intégrer les tests Python/hardware à la CI ;
- découper le chunk audio EP‑133 d’environ 2 Mo ;
- réduire les composants géants et les warnings lint restants.

## Hors roadmap immédiate

Comptes/cloud/paiement, écriture firmware non confirmée, recopie brute des anciens
prototypes et suppression de l’archive historique.

## Documents historiques

`MASTER_ROADMAP.md`, `PROGRESS.md`, `STATUS.md`, `PHASE4_FINAL_STATUS.md` et
`PHASE4_WEEK3_PROGRESS.md` conservent l’historique des agents et des packages,
mais leurs mentions « production ready », « Git clean » et « Phase 4 complète »
ne décrivent pas l’état produit actuel. Ce document est la référence de pilotage
jusqu’à la prochaine mise à jour validée.
