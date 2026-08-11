# Feuille de route

Le firmware est le premier écran et le premier sujet de confiance. Techniquement, une sauvegarde minimale et une identification sûre de la machine sont des prérequis du même jalon, pas des détours.

## M0 — Fondations · terminé

- vision et périmètre OP‑1 original ;
- analyse du marché et positionnement application locale ;
- base de connaissances et audit des outils ;
- politique de firmware et moteur de changements sûrs ;
- prototype d’interface de l’application ;
- licence, contribution et sécurité.

## M1 — Application locale : firmware et coffre · complexité L, risque élevé

- coque d’application Tauri + interface React/TypeScript + cœur Rust ;
- détection en lecture seule des modes normal, Disk et TE‑boot ;
- lecture de version et inventaire de la machine ;
- sauvegarde complète minimale avec SHA‑256 ;
- catalogue officiel versionné sans redistribuer les binaires ;
- validation URL, CRC, LZMA/TAR et structure ;
- plan étape par étape : sauvegarde, validation, TE‑boot, copie, sync, éjection ;
- écran de remplissage de la machine et aperçu des fichiers avant écriture ;
- première bibliothèque locale de samples et patches ;
- journal local et simulation complète sur fixtures ;
- matrice de tests Windows/macOS/Linux puis hardware-in-loop.

**Sortie :** une alpha installable qui protège la machine, guide une mise à jour officielle et prépare le transfert de contenu sans précondition ambiguë.

## M2 — Time Machine · complexité L

- snapshots horodatés et manifestes versionnés ;
- comparaison visuelle de deux états ;
- sauvegardes incrémentales et déduplication ;
- plan de restauration avec simulation ;
- reprise d’erreur et contrôle après écriture ;
- historique local compréhensible sans compte.

**Sortie :** la fonction récurrente qui rend l’app indispensable.

## M3 — Bibliothèque de sons et éditeur de patches · complexité L

- index local et import WAV/AIFF/FLAC/MP3 ;
- waveform, écoute, trim, gain et fondus ;
- rendu 44,1 kHz / 16 bits ;
- modes synth 6 s et drum 12 s ;
- lecture/écriture de patches avec tests croisés ;
- éditeur simple : nom, catégorie, paramètres principaux, aperçu et export d’une copie ;
- séparation explicite entre patch synthé, kit batterie et sample brut ;
- transfert par le Safe Change Engine.

## M4 — Tape & Album · complexité M/L

- lecture synchronisée des quatre pistes ;
- mute/solo, formes d’onde et repères ;
- export individuel ou groupé WAV/FLAC ;
- aperçu Album et détection des alias ;
- archivage du rendu avec le snapshot source.

## M5 — Studio quatre pistes · complexité XL

- projet local non destructif ;
- clips, découpe, déplacement, gain et fades ;
- rendu de quatre stems alignés, six minutes maximum ;
- plan d’import Tape après sauvegarde ;
- export du projet et de ses sources.

## M6 — Studio Cloud · après validation de la rétention

- compte optionnel et jumelage app/service ;
- chiffrement côté client ;
- synchronisation multi‑ordinateur ;
- historique distant et politique de rétention ;
- partage privé et révocable ;
- abonnement et facturation seulement après validation d’usage.

## M7 — Écosystème

- packs de sons avec manifestes et licences ;
- import manuel depuis services communautaires ;
- adaptateur OP‑1 Field séparé ;
- Labo expert firmware, isolé et opt-in ;
- API/plugin locale documentée ;
- traductions.

## Premières issues techniques

| Issue | Taille | Dépendance |
|---|---:|---|
| Créer le monorepo interface/app/core | M | aucune |
| Définir `DeviceIdentity`, `DeviceMode`, `FirmwareRelease` | S | monorepo |
| Construire les fixtures Disk et TE‑boot | M | modèles |
| Scanner un volume en lecture seule | M | fixtures |
| Définir `BackupManifest` v1 | S | modèles |
| Copier + hacher une sauvegarde minimale | M | manifeste |
| Lire et valider l’enveloppe `.op1` sans extraction | M | fixtures firmware |
| Implémenter le `ChangePlan` firmware | M | scanner + backup |
| Relier le prototype au cœur via commandes typées | M | ChangePlan |
| Adaptateurs de sync/éjection par OS | L | ports stabilisés |

## Portes de qualité avant essai réel

1. aucune écriture possible sur une fixture non reconnue ;
2. toutes les traversées de chemin rejetées ;
3. panne injectée à chaque étape avec résultat récupérable ;
4. sauvegarde relue et vérifiée avant activation de TE‑boot ;
5. éjection native testée sur chaque OS ;
6. procédure relue face au guide officiel ;
7. bêta volontaire avec machine de test, jamais avec l’unique copie d’un morceau.
