# Feuille de route

Le firmware est le premier écran et le premier sujet de confiance. Techniquement, une sauvegarde minimale et une identification sûre de la machine sont des prérequis du même jalon, pas des détours.

## Etat de livraison

Le projet dispose aujourd'hui d'un prototype fonctionnel et de bridges locaux
testés pour firmware, samples, patches et préparation Tape. Les écrans sont
plus avancés que les transferts machine : les prochaines étapes donnent la
priorité au cœur projet/audio et au Safe Change Engine avant d'ajouter des
options visuelles.

Voir l'audit détaillé dans [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

## M0 — Fondations · terminé

- vision et périmètre OP‑1 original ;
- analyse du marché et modèle hybride ;
- base de connaissances et audit des outils ;
- politique de firmware et moteur de changements sûrs ;
- prototype web interactif ;
- licence, contribution et sécurité.

## M1 — Firmware Control Center · complexité L, risque élevé

**Etat : partiellement livré.** Inspection firmware, moteur de mods et build
hors machine sont valides. Détection réelle, sauvegarde vérifiée et import
officiel restent à terminer dans le bridge local.

- monorepo React/TypeScript/Rust + coque Tauri ;
- détection en lecture seule des modes normal, Disk et TE‑boot ;
- lecture de version et inventaire de la machine ;
- sauvegarde complète minimale avec SHA‑256 ;
- catalogue officiel versionné sans redistribuer les binaires ;
- validation URL, CRC, LZMA/TAR et structure ;
- plan étape par étape : backup, validation, TE‑boot, copie, sync, éjection ;
- journal local et simulation complète sur fixtures ;
- matrice de tests Windows/macOS/Linux puis hardware-in-loop.

**Sortie :** une alpha qui guide une mise à jour officielle et refuse toute précondition ambiguë.

## M2 — Time Machine · complexité L

**Etat : interface et règles définies.** La copie, restauration, déduplication
et éjection contrôlée restent à implémenter.

La Time Capsule est réservée aux pistes Tape et Album. Les firmwares restent
dans le parcours Firmware et les samples dans la Bibliothèque Sons.

- snapshots horodatés et manifestes versionnés ;
- comparaison visuelle de deux états ;
- sauvegardes incrémentales et déduplication ;
- plan de restauration avec simulation ;
- reprise d’erreur et contrôle après écriture ;
- historique local compréhensible sans compte.

**Sortie :** la fonction récurrente qui rend l’app indispensable.

## M3 — Bibliothèque de sons · complexité L

Avancement : socle technique valide. FFmpeg, Rust/Cargo et `op-patch-util`
sont installables avec `tools/Install-OP1StudioTools.ps1`.
`sample_preflight.py` valide et classe les samples, et `patch_bridge.py`
produit un patch synthé de test sans modifier les sources.

**Etat : socle livré.** L'index local, waveform réel, édition et transfert
machine restent à terminer.

- index local et import WAV/AIFF/FLAC/MP3 ;
- waveform, écoute, trim, gain et fondus ;
- rendu 44,1 kHz / 16 bits ;
- modes synth 6 s et drum 12 s ;
- lecture/écriture de patches avec tests croisés ;
- transfert par le Safe Change Engine.

## M4 — Studio · Tape & Album · complexité M/L

Avancement : première interface de Studio ajoutée dans l'application.
Elle prépare quatre pistes locales, mute/solo, lecture et import contrôlé vers
`tape/`. Le rendu non destructif et la copie machine complète restent à
brancher sur le pont local.

Le Studio propose deux modes : `Clone OP-1` pour travailler sans la machine et
`OP-1 MIDI` pour connecter l'appareil comme contrôleur et source de capture.

- lecture synchronisée des quatre pistes ;
- mute/solo, formes d’onde et repères ;
- export individuel ou groupé WAV/FLAC ;
- aperçu Album et détection des alias ;
- archivage du rendu avec le snapshot source.

## M5 — Studio quatre pistes · complexité XL

Nouvelle cible produit : un éditeur interne professionnel, inspiré des
clones étudiés, avec une fenêtre de travail dédiée et non une bulle. Il doit
séparer le projet local, le moteur audio, le MIDI et l'import machine.

- projet local non destructif ;
- clips, découpe, déplacement, gain et fades ;
- rendu de quatre stems alignés, six minutes maximum ;
- plan d’import Tape après sauvegarde ;
- export du projet et de ses sources.
- fenêtre de travail dédiée avec transport, tempo, boucle et raccourcis ;
- capture MIDI OP-1 vers événements de projet ;
- grille piano-roll et quantification ;
- mixage local avant export Tape.

## M5.1 — Architecture professionnelle

- `Project` local versionné : tempo, pistes, clips, événements MIDI et sources ;
- `AudioEngine` isolé : lecture, gain, fades, rendu et pré-écoute ;
- `MidiEngine` isolé : détection, capture, horloge et sortie OP-1 ;
- `DeviceTransfer` isolé : sauvegarde, validation, copie, sync et éjection ;
- chaque outil s'ouvre dans une fenêtre dédiée, avec journal et état propre.

## M5.2 — Coeur projet et moteur audio

Avancement : format `op1-studio-project` v1 livré avec création, validation,
ouverture et enregistrement JSON depuis le Studio. Les clips restent encore
des références de sources ; le rendu audio et les événements MIDI temporels
arrivent dans l'étape suivante.

- définir un format `Project` JSON versionné ;
- stocker sources, clips, événements MIDI, tempo et mixage ;
- calculer les waveforms depuis les fichiers, sans décorations ;
- implémenter trim, déplacement, gain, fades et rendu offline ;
- ajouter tests de round-trip projet et fixtures audio ;
- seulement ensuite relier la grille et les raccourcis clavier.

## M5.3 — Safe Change Engine machine

- identifier un volume par preuves combinées, jamais par son seul nom ;
- créer et relire une sauvegarde avant écriture ;
- préparer un plan Tape/Sons avec liste exacte des fichiers ;
- copier vers un volume temporaire contrôlé, synchroniser, vérifier les hash ;
- éjecter avec l'API système et afficher le résultat ;
- tester déconnexion, volume disparu et fichier partial.

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

