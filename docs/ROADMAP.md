# Feuille de route

Le firmware est le premier écran et le premier sujet de confiance. Techniquement, une sauvegarde minimale et une identification sûre de la machine sont des prérequis du même jalon, pas des détours.

## Etat de livraison

Etat de pilotage : 12 aout 2026.

Le projet a trois niveaux de maturite :

- **socle local livre** : firmware, display, samples, patches, Studio et
  contrats JSON fonctionnent hors interface native ;
- **materiel valide** : l'OP-1 original a ete detecte en Disk et en mode
  normal, sauvegarde, comparaison et delete/restore ont ete verifies sur un
  vrai volume ;
- **integration produit manquante** : l'interface web ne declenche pas encore
  les bridges locaux, le MIDI/audio interactif n'est pas valide dans le
  navigateur et le pont natif d'ejection n'existe pas.

### Tableau de bord

| Zone | Etat reel | Prochaine preuve |
| --- | --- | --- |
| Firmware + Images | moteurs locaux livres, plans UI bornes et non destructifs | bridge de build natif, sans flash |
| Sauvegardes | backup/verify/plan/execute/restore livres ; plan UI borne ; delete/restore valide sur hardware | bridge natif + ejection |
| Bibliotheque Sons | preflight, patches CLI, grille 24 pads, index UI et plan UI borne livres | pre-ecoute fichier et transfert natif |
| Studio | projet v1, mixage, fades, piano-roll, stems, Album et trim focalise livres | sources persistantes et import UI |
| MIDI/audio | detection Windows et contrats Web MIDI presents | capture et sortie live dans Chrome/Edge |
| Education | fenetre prototype | exercices notes/timing/progression |
| Distribution | dev server et build web | Tauri, installation et permissions |

La priorite n'est plus d'ajouter des prototypes isoles : il faut rendre les
ecrans coherents, brancher les contrats existants par des actions limitees et
fermer les portes de qualite avant toute distribution.

### Architecture des fenetres

`docs/FIRMWARE_LAB_FUNCTIONS.md` et `docs/WINDOW_FUNCTIONS_SPEC.md` deviennent
la reference fonctionnelle des fenetres. La navigation produit reste organisee
autour de sept espaces visibles dans l'accueil :

| Fenetre | Perimetre retenu | Etat architectural |
| --- | --- | --- |
| Accueil | lancement par modules, etats machine et raccourcis | livre |
| Firmware | source, verification, moteurs, graphismes, audio usine, plan/build et TE-boot | sous-onglet Graphismes livre ; build natif a poursuivre |
| Sauvegardes | snapshots, comparaison, restauration, Time Capsule Pistes et transfert | livre en moteur, UI/bridge natif a brancher |
| Sons | bibliotheque, preflight, patches, 24 pads et packs | pads livres, index et transfert a poursuivre |
| Studio | Clone OP-1, MIDI, Tape, Album, mixage et projet | coeur livre, sources persistantes a poursuivre |
| Exercices | accords, finger drumming, morceaux et performance MIDI | prototype |
| Documentation | fiches par fenetre, procedures et recherche | fiche minimale |

La carte Images ne devient pas une huitieme fenetre : ses fonctions sont
absorbees par Firmware sous le sous-onglet Graphismes. L'ancien onglet global
Images a ete retire apres validation de cette integration.

### Decisions issues des analyses

- **Graphismes originaux** : le createur de dessin est une sous-section de
  Firmware > Graphismes. Il utilise un canevas 320x160, la palette OP-1
  documentee et `op1svg` avant tout export ; il ne devient pas un importeur
  libre de fichiers tiers.
- **Outils prioritaires** : `op1aiff` pour inspecter les AIFF en lecture seule
  dans Sons et `op1svg` pour valider les SVG avant patch. `teoperator` reste
  une fixture de comparaison ; les autres outils restent des references. Les
  deux outils ne sont pas encore presents dans le depot/registres installes :
  leur ajout passe d'abord par un audit de licence, version et commande.
- **Profil utilisateur** : `profile.json` local, sans compte ni reseau, pour le
  pseudo, les machines nommees, le coffre, les marqueurs de partage et les
  preferences. Il reference `DeviceIdentity` et `BackupManifest` sans les
  remplacer. Le schema TypeScript et l'edition locale du pseudo/machine sont
  maintenant livres ; le fichier natif du coffre reste a brancher.
- **Cloud et licence** : Studio Cloud reste M6, apres validation de l'usage
  local. L'ecart MIT/AGPL signale dans l'analyse tooling est un point legal a
  trancher avant toute communication de service ; aucune licence n'est
  modifiee automatiquement.
- **Dependance structurante** : le coeur Rust/Safe Change Engine reste le
  vrai chantier derriere l'installation Tauri et l'execution native. Les
  bridges Python servent au labo et aux fixtures, pas de coeur final cache.

L'audit detaille des garde-fous reels est conserve dans
[`TOOLS_SAFETY_AUDIT.md`](TOOLS_SAFETY_AUDIT.md). Il confirme notamment que
`device_transfer_plan.py execute/restore` est la seule surface d'ecriture
machine, et que l'association entre une sauvegarde et le volume cible doit
encore etre imposee par l'UI/coeur natif.

### Recalage des jalons

- **M1 Firmware** : socle local et Images livres ; integration UI et flash
  restent explicitement hors perimetre tant que le ChangePlan natif n'est pas
  branche.
- **M2 Sauvegardes** : moteur de fichiers livre et teste sur hardware ;
  l'interface affiche encore une simulation et l'ejection native manque.
- **M3 Sons** : conversion, patches et 24 pads livres ; l'index local, la
  bibliotheque et le transfert utilisateur restent a fermer.
- **M4/M5 Studio** : coeur audio, projet v1 et trim focalise livres ;
  persistence des sources et import machine restent a fermer.
- **M4.5 Education** : prototype de fenetre seulement ; progression et
  verification de performance restent a construire.
- **M4.6 Visuel** : onglets, Escape et accessibilite de base livres ; le
  `SoundControlsPanel`, `FirmwareSubtabs`, `LocalProfilePanel`,
  `ExercisePanel`, `DocumentationPanel` et `BackupPanel` sont extraits
  de `app/page.tsx` sans changement de rendu. Le hub d'accueil par modules est
  maintenant livre ; le decoupage des autres ecrans reste a poursuivre.

Le projet dispose aujourd'hui d'un prototype fonctionnel et de bridges locaux
testés pour firmware, samples, patches et préparation Tape. Les écrans sont
plus avancés que les transferts machine : les prochaines étapes donnent la
priorité au cœur projet/audio et au Safe Change Engine avant d'ajouter des
options visuelles.

Voir l'audit détaillé dans [`PROJECT_STATUS.md`](PROJECT_STATUS.md), la
version pas-à-pas sans jargon dans
[`FEUILLE_DE_ROUTE_SIMPLE.md`](FEUILLE_DE_ROUTE_SIMPLE.md), l'étude des
interfaces concurrentes section par section dans
[`ANALYSE_CONCURRENTS.md`](ANALYSE_CONCURRENTS.md), et la version complète
sans rien de coupé — faite pour être suivie par un agent IA sans
ambiguïté — dans [`ROADMAP_DE_L_ENFER.md`](ROADMAP_DE_L_ENFER.md).

## M0 — Fondations · terminé

- vision et périmètre OP‑1 original ;
- analyse du marché et modèle hybride ;
- base de connaissances et audit des outils ;
- politique de firmware et moteur de changements sûrs ;
- prototype web interactif ;
- licence, contribution et sécurité.

## M1 — Firmware Control Center · complexité L, risque élevé

**Etat : partiellement livré.** Inspection firmware, moteur de mods et build
hors machine sont valides. La détection réelle et une sauvegarde complète
vérifiée ont été validées sur un OP-1 original en mode Disk (`E:`). L'import
officiel reste à terminer dans le bridge local.

- monorepo React/TypeScript/Rust + coque Tauri ;
- détection en lecture seule des modes normal, Disk et TE‑boot ;
- lecture de version et inventaire de la machine ;
- sauvegarde complète minimale avec SHA‑256 ;
- catalogue officiel versionné sans redistribuer les binaires ;
- validation URL, CRC, LZMA/TAR et structure ;
- plan étape par étape : backup, validation, TE‑boot, copie, sync, éjection ;
- journal local et simulation complète sur fixtures ;
- matrice de tests Windows/macOS/Linux puis hardware-in-loop ;
- validation matérielle réalisée : deux snapshots de 67 fichiers, dernier
  snapshot de 282529116 octets, manifeste SHA-256 relu avec succès, sans
  écriture sur l'OP-1 ;
- éditeur d'images machine livré (`tools/display_bridge.py` + écran
  « Images ») : tri des 61 SVG `content/display/` par catégorie documentée
  et édition non destructive via patch JSON, voir
  [`LOCAL_TOOLS.md`](LOCAL_TOOLS.md#editeur-dimages-machine).

**Sortie :** une alpha qui guide une mise à jour officielle et refuse toute précondition ambiguë.

## M2 — Time Machine · complexité L

**Etat : interface et règles définies.** Le snapshot local et sa vérification
SHA-256 sont validés sur la machine. La copie vers l'OP-1, la restauration,
la déduplication et l'éjection contrôlée restent à finaliser. Le plan de
transfert et son exécution confirmée sont maintenant testés sur fixtures.

La Time Capsule est réservée aux pistes Tape et Album. Les firmwares restent
dans le parcours Firmware et les samples dans la Bibliothèque Sons.

- snapshots horodatés et manifestes versionnés ;
- comparaison visuelle de deux états ;
- sauvegardes incrémentales et déduplication ;
- plan de restauration avec simulation ;
- reprise d’erreur et contrôle après écriture ;
- historique local compréhensible sans compte ;
- barre Storage/Usage avec seuil d'alerte coloré avant de bloquer une
  sauvegarde (comparatif dans [`ANALYSE_CONCURRENTS.md`](ANALYSE_CONCURRENTS.md)).

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
- transfert par le Safe Change Engine ;
- tableau de bibliothèque avec recherche, filtre par type, favoris et tri
  par colonne ;
- grille de pads fidèle à la disposition physique de l'OP-1 (réutilisée
  ensuite par M4.5) ;
- code couleur distinguant un son d'origine d'un son importé.

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

## M4.5 — Éducation & disposition clavier · complexité M

Nouveau jalon, construit sur la surface clavier déjà jouable (`CloneSurface`)
et sur la détection Web MIDI existante. Objectif : rendre l'OP-1 plus facile
à apprendre, avec ou sans machine branchée.

- disposition clavier ordinateur configurable (AZERTY/QWERTY) et disposition
  des pads calquée sur le mode Drum ;
- exercices de finger drumming avec retour visuel et rythmique, inspirés du
  séquenceur Finger recréé par [`sampi/finger`](https://github.com/sampi/finger) ;
- mode « apprendre un morceau » : import d'un fichier MIDI, surbrillance des
  touches à jouer, ralenti et boucle par section ;
- fonctionne en mode Clone OP-1 seul ou avec la machine connectée en entrée
  MIDI de contrôle ;
- fenêtre de travail dédiée « Exercices & Éducation », journal de progression
  local, aucune donnée envoyée hors de l'appareil ;
- trois entrées visibles dès l'ouverture (apprentissage structuré / leçons
  ciblées / morceaux), plutôt que cachées dans un menu.

**Sortie :** un parcours d'apprentissage qui ne dépend pas de posséder la
machine pour s'entraîner, et qui rend la disposition clavier de l'OP-1
transparente pour un débutant.

## M4.6 — Chantier visuel & système de design · complexité M

Le style « machine OP-1 » (boutons, écran, bande magnétique) est déjà réussi
et cohérent. Ce jalon ne le refait pas : il le rend soutenable pour la suite
et l'étend proprement aux nouvelles fenêtres (Éducation, Documentation).

- extraire les valeurs répétées (tailles, espacements, couleurs) dans un
  jeu de tokens unique au lieu de les réécrire à chaque endroit ;
- découper `app/page.tsx` (actuellement un seul fichier de près de 700
  lignes) en composants par écran, sans changer le rendu visuel ;
- redessiner le clavier du clone pour refléter la vraie disposition de
  l'OP-1 (rangées colorées, zone batterie séparée de la zone synthé), requis
  pour que le module Éducation (M4.5) soit crédible ;
- remplacer toutes les formes d'onde décoratives par de vraies formes
  calculées depuis l'audio, dans tous les écrans concernés (Sons, Tape,
  Studio) ;
- créer les icônes d'application dans les tailles requises par Windows,
  macOS et Linux ;
- ajouter un premier écran d'accueil pour un nouvel utilisateur, au lieu
  d'ouvrir directement sur l'écran Firmware ;
- vérifier l'accessibilité : contraste suffisant, navigation complète au
  clavier, fermeture des fenêtres modales avec Échap ;
- préparer des captures d'écran propres pour le README et une future fiche
  de présentation ;
- écran d'accueil en grille de cartes par module avec badges de
  compatibilité (« sans machine » / « OP-1 requis »).

**Sortie :** une interface qui reste cohérente et facile à faire évoluer à
mesure que M4.5, M5 et les fenêtres suivantes s'ajoutent.

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
ouverture et enregistrement JSON depuis le Studio. Les clips conservent
maintenant la durée réelle des fichiers chargés et le transport suit l'horloge
audio maître. Le piano-roll est éditable, les événements MIDI sont rejoués
pendant le transport, la quantification 1/16 dépendante du BPM est livrée et
le rendu WAV offline applique gain, trim, mute/solo et fades, la vue globale
calcule les niveaux audio en 24 points par piste, les stems Tape sont
exportables séparément et l'Album produit deux faces WAV avec manifeste ; le
transfert machine reste à faire.

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
- exécuter les copies autorisées seulement après `--confirm`, sans suppression ;
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
- adaptateur OP‑1 Field séparé, uniquement lorsque le matériel sera disponible ;
- Labo expert firmware, isolé et opt-in ;
- API/plugin locale documentée ;
- traductions.

## M8 — Empaquetage & distribution desktop · complexité M

Le monorepo React/TypeScript/Rust et la coque Tauri existent déjà (M1). Ce
jalon rend l'application réellement installable, plutôt que lancée en mode
développeur.

- construire des installeurs pour Windows, macOS et Linux à partir de la
  même base Tauri ;
- brancher l'accès au volume USB de l'OP-1 et à la sortie audio directement
  depuis l'app installée, sans dépendre du navigateur (Web MIDI/USB) ;
- signer et notariser l'application sur chaque plateforme pour éviter les
  avertissements de sécurité au premier lancement ;
- vérifier que le Safe Change Engine (M5.3) fonctionne identiquement en
  mode installé et en mode développement.

**Sortie :** une version que quelqu'un en dehors du projet peut télécharger
et installer, sans lancer de commande.

## Documentation utilisateur française · en continu

Distincte de la documentation développeur (`docs/`) : un guide simplifié pour
un musicien non technique, tenu à jour au même rythme que les jalons livrés
plutôt qu'en une seule passe finale.

- démarrage rapide : brancher, première sauvegarde, premier son ;
- une page par espace livré (Firmware, Sauvegardes, Sons & patches, Studio,
  Exercices & Éducation) dès que l'espace correspondant sort du statut
  simulation ;
- FAQ des erreurs et messages de statut réels observés dans l'app ;
- accessible depuis la fenêtre « Documentation » de l'application, pas
  seulement dans le dépôt Git.

Premier jalon : voir [`GUIDE_UTILISATEUR.md`](GUIDE_UTILISATEUR.md).

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

