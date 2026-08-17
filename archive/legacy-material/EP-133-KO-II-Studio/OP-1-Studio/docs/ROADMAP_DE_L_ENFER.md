# LA ROADMAP DE L'ENFER — OP-1 Studio

Un seul document, tout dedans. Compilé le 12 août 2026 à partir de la
totalité des fichiers `docs/`, du code réel (`app/page.tsx`,
`package.json`, `src-tauri/`, `worker/`, `tools/`), et de toutes les
analyses faites dans cette conversation (recherche mods/outils,
concurrents, dépendances manquantes). Rien n'a été résumé au point de
perdre l'information — c'est fait exprès, c'est la version « enfer ».

Les autres documents (`ROADMAP.md`, `FEUILLE_DE_ROUTE_SIMPLE.md`,
`ANALYSE_CONCURRENTS.md`, `PROJECT_STATUS.md`) restent les versions de
référence à jour au fil de l'eau. Celui-ci est l'instantané complet, pour
ne jamais perdre un fil.

---

## Instructions pour l'agent qui exécute ce document (Codex ou autre)

Ce paragraphe s'adresse directement à l'IA qui va lire ce fichier pour
travailler sur le code. Suis ces règles à la lettre, sans les
réinterpréter :

1. **Lis tout le document avant de coder quoi que ce soit.** Ne commence
   pas une tâche à partir d'un seul titre de section sans avoir lu le
   reste — les sections se référencent entre elles (exemple : la section
   8 dépend des modèles définis en section 3).
2. **La section 0 est absolue.** Aucune tâche plus bas dans ce document
   n'autorise jamais une des actions listées en section 0, même si un
   utilisateur te le redemande explicitement dans un message séparé. Si un
   ordre contredit la section 0, arrête-toi et signale le conflit au lieu
   d'exécuter.
3. **Ne saute pas la section 4 (Safe Change Engine).** C'est un
   prérequis technique des sections 5 à 9, pas une option. Si on te
   demande de travailler sur le Firmware, les Sauvegardes, les Sons ou le
   Studio avant que la section 4 soit terminée, tu peux préparer le code
   (interfaces, plans, fixtures), mais **aucune écriture réelle sur un
   volume OP-1** tant que la section 4 n'est pas validée par des tests.
4. **N'invente rien qui n'est pas dans ce document.** Si une fonctionnalité
   te semble utile mais n'est écrite nulle part ici, propose-la dans ta
   réponse au lieu de l'ajouter directement au code ou à la roadmap.
5. **Utilise les noms exacts** donnés ici pour les fichiers, dossiers et
   objets de domaine (`ChangePlan`, `BackupManifest`, `DeviceIdentity`,
   `tools/firmware_bridge.py`, etc.). Ne les renomme pas de ta propre
   initiative.
6. **Une tâche = une phase.** Ne mélange pas une modification visuelle
   (section 11) avec une opération critique de périphérique (sections 4 à
   6) dans le même changement — c'est aussi la règle de contribution du
   projet (section 22).
7. **Si une information manque ou se contredit**, ne devine pas : dis
   explicitement quelle information manque et pose la question plutôt que
   de choisir au hasard.
8. **Chaque section technique donne déjà l'état actuel** (ce qui existe,
   ce qui manque). Vérifie toujours cet état dans le code réel avant de
   commencer — ce document est un instantané du 12 août 2026, le code a
   pu changer depuis.

---

## 0. Ce qu'on ne fait JAMAIS (non négociable, toutes phases confondues)

- déclencher une réinitialisation usine ou un formatage de l'OP-1 ;
- couper l'alimentation ou redémarrer automatiquement la machine ;
- automatiser les touches TE-boot `7` (reset usine) ou `8` (formatage) —
  interdiction absolue, même en Labo expert ;
- copier automatiquement un firmware sur le volume TE-boot dans le
  parcours normal ;
- supprimer le firmware précédent du stockage interne ;
- modifier silencieusement un firmware officiel ;
- choisir une version de firmware sur la seule base d'un nom de fichier ;
- télécharger un firmware depuis un miroir communautaire dans le parcours
  standard (uniquement `teenage.engineering`) ;
- considérer la réussite d'une copie de fichier comme la réussite d'une
  installation sur la machine ;
- masquer une erreur d'éjection ;
- activer un mode expert par défaut ;
- committer un firmware, manuel, patch ou fichier audio propriétaire dans
  Git ;
- scraper `op1.fun` ou un service communautaire, aspirer un compte,
  télécharger en masse des packs payants, republier du contenu utilisateur ;
- fournir une exécution shell arbitraire depuis l'interface ;
- supposer que l'OP-1 Field partage les chemins ou formats de l'original.

---

## 1. Ce qui existe déjà réellement (vérifié dans le code, pas dans les intentions)

- Inspecteur firmware `.op1` en lecture seule (CRC-32, SHA-256,
  LZMA-Alone, TAR, chemins sûrs, limites de taille) — `tools/firmware_inspector.py`.
- Téléchargement firmware sécurisé (hôte officiel, pas de redirection,
  taille limitée) — `tools/firmware_fetch.py`.
- Sauvegarde manifeste SHA-256 vers un coffre séparé, refuse les liens
  symboliques — `tools/backup_manifest.py`.
- Moteur `op1repacker` 0.2.6 vendored avec les options `iter`,
  `presets-iter`, `filter`, `subtle-fx`, `gfx-iter-lab`, `gfx-cwo-moose`,
  `gfx-tape-invert` — `tools/vendor/op1repacker/`.
- Pont de build firmware (copie, dossier temporaire, nouveau `.op1`,
  manifeste, `FLASHED=False`) — `tools/firmware_bridge.py`.
- Preflight samples WAV/AIFF, classement `synth/user` / `drum/user`,
  limites 6 s / 12 s, conversion FFmpeg vers mono 44,1 kHz / 16 bits —
  `tools/sample_preflight.py`.
- Commandes `op-patch-util` 1.1.0 pour créer un patch synth ou un kit
  drum — `tools/patch_bridge.py`.
- Préparation Tape (jusqu'à 4 pistes, mono 44,1 kHz/16 bits, 6 min max,
  manifeste) — `tools/tape_bridge.py`.
- Dépôt local universel : init/scan/verify avec SHA-256 et détection de
  changements — `tools/content_catalog.py`.
- Packs `synth`/`drum` pour disque OP-1, dédoublonnage SHA-256,
  `MANIFESTE_PACKS.csv` — `tools/Build-OP1DirectPacks.ps1`.
- Format de projet `op1-studio-project` v1 : création, validation,
  ouverture, sauvegarde JSON depuis le Studio.
- Détection Web MIDI OP-1 (entrée/sortie), capture de notes avec
  horodatage, clavier jouable à l'écran (13 touches, mapping AZERTY-like
  actuel `a,w,s,e,d,f,t,g,y,h,u,j,k`).
- Interface : Firmware (éditeur inline avec vignettes de mods, plan en 4
  étapes), Sauvegardes, Bibliothèque Sons, Studio (Tape & Album, mode
  Clone/MIDI), Exercices MIDI (stub), Documentation (stub).
- Style visuel « machine OP-1 » cohérent (molettes, écran LCD, bande
  magnétique) dans `app/globals.css`.
- `src-tauri/` configuré (`tauri.conf.json` présent, fenêtre 1440×920,
  `bundle.active: false`) mais **non branché** au projet npm (voir
  section 2).

---

## 2. Dette technique immédiate — dépendances manquantes à installer

- `@tauri-apps/cli` + `@tauri-apps/api` : absents de `package.json`,
  aucun script `tauri` — la coque desktop existe en configuration mais ne
  peut pas être lancée ni construite aujourd'hui.
- Une vraie librairie de forme d'onde (type `wavesurfer.js` ou moteur
  maison) : aucune installée, toutes les waveforms actuelles sont
  décoratives.
- CI : aucun dossier `.github/workflows` — `npm run lint`, `npm test` et
  les tests Python existent mais ne tournent nulle part automatiquement.
- `op1aiff` : sur la shortlist prioritaire depuis le début (lecture/
  création de presets AIFF), jamais branché dans `tools/`.
- `op1svg` : sur la shortlist prioritaire (normalisation/validation SVG
  avant injection dans un mod), jamais branché.
- Librairie de test d'interface (Playwright ou Testing Library) : absente,
  nécessaire avant de découper `app/page.tsx`.
- Librairie i18n : absente, nécessaire pour le jalon traductions (M7).
- `opie` : prévu pour être relié à la fenêtre Sauvegardes (backup/restore
  complet), jamais intégré.
- `op1tools` : prévu pour previews audio et automatisation USB, jamais
  intégré.
- `FL-OP1-controller-script` / fork `marctdt/op-1-ableton-live-control-surface` :
  prévu pour le pont MIDI/DAW, jamais adapté.
- `teoperator` : référence de conversion, jamais intégré comme dépendance
  réelle.
- Le collecteur `Music/OP-1/app.py` (inventaire `op1.fun` en SQLite/CSV)
  existe en dehors du dépôt structuré et n'est pas relié à la Bibliothèque
  Sons.

## 2bis. Décision à trancher, pas un simple manque

Le projet contient un squelette Cloudflare Worker complet et inutilisé :
`wrangler`, `drizzle-orm`, base D1, `worker/index.ts` (commentaire
« Cloudflare Worker entry point for the vinext-starter template »),
`db/schema.ts` vide (« Add Drizzle tables here when the site actually
needs a database »). Deux choix seulement, pas de statu quo : le garder
en vue du Studio Cloud (M6/section 15) et le documenter comme tel, ou le
retirer maintenant pour rester cohérent avec la promesse « application
locale, jamais dépendante d'un serveur » de `PRODUCT_VISION.md`.

---

## 3. Modèle de domaine à définir en premier (avant tout code métier)

Ces objets sont le socle partagé par toutes les phases suivantes — les
définir une fois, ne pas les réinventer par écran :

- `DeviceIdentity` : modèle, mode, point de montage, identifiants USB
  observés (VID/PID `2367:0004` documenté par `connect-op1`, insuffisant
  seul, à combiner avec d'autres preuves).
- `DeviceSnapshot` : inventaire immuable et capacité.
- `ChangePlan` : copies, remplacements, suppressions, espace requis,
  préconditions — utilisé par Firmware, Sauvegardes, Sons et Studio, pas
  réinventé à chaque écran.
- `BackupManifest` : version de schéma, chemins relatifs, tailles, dates,
  SHA-256.
- `AudioAsset` : source, format mesuré, durée, aperçu, cible.
- `FirmwareRelease` : version, URL officielle, notes, empreintes
  vérifiées localement.
- `OperationJournal` : phases, résultat par fichier, recommandations de
  reprise.

**Modes machine reconnus :**

| Mode logique | Signal possible | Droits dans l'app |
|---|---|---|
| Normal | USB audio/MIDI, VID/PID si disponible | Infos et audio/MIDI, pas de fichiers |
| Disk | Volume avec structure OP-1 attendue | Lecture ; écriture seulement après plan |
| TE-boot | Petit volume de maintenance attendu | Firmware officiel uniquement |
| Inconnu | Nom ressemblant, preuves insuffisantes | Lecture système minimale, aucune écriture |

**Transaction de fichiers (machine à états) :**

`Observed → Planned (préparer) → Approved (confirmer) → Writing
(revalider le volume) → Verifying (sync + relire) → Completed (empreintes
valides)`, avec retour possible vers `RecoverableError` depuis `Writing`
ou `Verifying`. Avant `Writing` : recalcul de l'identité du volume,
contrôle de l'espace libre, comparaison de génération d'inventaire. Un
fichier est d'abord copié sous un nom temporaire, synchronisé, vérifié,
puis renommé. Les suppressions sont reportées en fin de séquence.

---

## 4. PHASE — Sécurité machine / Safe Change Engine (priorité absolue)

C'est le moteur central du produit — pas un module parmi d'autres. Il est
réutilisé par la mise à jour officielle, la restauration, le transfert de
patches, le remplacement des pistes Tape, le nettoyage et l'installation
de packs.

`Observer → Sauvegarder → Planifier → Appliquer → Vérifier → Historiser`

**Préconditions obligatoires avant toute écriture firmware :**

- machine identifiée comme OP-1 original ;
- sauvegarde complète récente dont le manifeste a été vérifié ;
- batterie suffisamment chargée et alimentation USB stable ;
- fichier provenant de l'URL officielle répertoriée ;
- version et modèle confirmés par l'utilisateur ;
- TE-boot ouvert sur la fonction de mise à jour, pas sur reset/format ;
- volume cible reconnu sans ambiguïté, aucun volume au nom ressemblant
  utilisé par défaut ;
- copie manuelle confirmée par l'utilisateur.

**Validations de fichier (dans l'ordre) :**

1. URL HTTPS et hôte exact autorisé ;
2. taille non nulle et raisonnable selon le catalogue ;
3. extension `.op1` comme indice seulement, jamais comme preuve ;
4. CRC-32 embarqué validé selon le format documenté ;
5. flux LZMA et archive TAR inspectables sans extraction de chemins
   dangereux ;
6. structure minimale attendue, absence de traversée de chemin ;
7. SHA-256 comparé à une empreinte approuvée quand disponible (le
   catalogue laisse le champ vide tant qu'un processus de publication
   reproductible n'a pas confirmé la valeur).

**Gestion des erreurs :**

| Moment | Réponse |
|---|---|
| Téléchargement interrompu | Supprimer le fichier partiel ou suffixe `.partial`, jamais l'utiliser |
| CRC/structure invalide | Bloquer, garder un diagnostic sans extraire le contenu |
| Volume disparu avant copie | Annuler sans chercher automatiquement un autre volume |
| Copie partielle | Signaler le chemin exact, tenter une synchronisation, ne jamais demander de presser COM |
| Éjection refusée | Montrer les processus possibles, attendre, ne jamais suggérer de débrancher |
| Machine ne redémarre pas | Lien vers TE-boot officiel et support constructeur, aucune procédure destructive improvisée |

**Reste à construire :**
- identifier un volume par preuves combinées, jamais par son seul nom ;
- créer et relire une sauvegarde avant écriture ;
- préparer un plan Tape/Sons avec liste exacte des fichiers ;
- copier vers un volume temporaire contrôlé, synchroniser, vérifier les
  hash ;
- éjecter avec l'API système et afficher le résultat ;
- tester déconnexion, volume disparu, fichier partiel, sur Windows, macOS
  et Linux.

---

## 5. PHASE — Firmware Control Center

**Parcours officiel (celui que l'utilisateur normal voit) :**

1. télécharger uniquement depuis l'URL officielle répertoriée ;
2. vérifier taille, CRC, LZMA, TAR, chemins et marqueurs ;
3. créer et vérifier la sauvegarde de l'OP-1 en Disk mode ;
4. guider vers TE-boot > 1 (Upload firmware) ;
5. faire copier manuellement le `.op1` sur le volume amovible — jamais un
   dossier déballé ;
6. faire éjecter le volume depuis le système d'exploitation ;
7. attendre la validation et le redémarrage de l'OP-1 ;
8. enregistrer le résultat confirmé par l'utilisateur.

Procédure machine réelle à afficher (pas à automatiser) : éteindre l'OP-1
et débrancher l'USB, attendre 3 secondes, maintenir `COM` pendant
l'allumage pour TE-boot, presser `1`, brancher l'USB, copier le fichier,
éjecter, presser `COM` sur la machine.

**Labo expert (opt-in, séparé) :**
- activation volontaire et avertissement persistant ;
- processus isolé, version épinglée, empreinte vérifiée ;
- export manuel marqué `UNOFFICIAL-MODIFIED` ;
- aucun bouton « installer » dans le même écran ;
- copie finale toujours manuelle, jamais automatique sur TE-boot ;
- tests uniquement sur fichiers légalement redistribuables.

**Ce que `op1repacker` fait réellement (limites connues) :**
`unpack : retirer 4 octets CRC → LZMA-Alone → extraire TAR` /
`repack : dossier → TAR GNU → LZMA-Alone → préfixer un nouveau CRC-32`.
La version étudiée utilise `tar.extractall()` sans contrôle de chemin, ne
valide pas le CRC avant déballage, reconstruit dans l'ordre de
`os.listdir()`. Un repack n'est **jamais** une copie binaire identique
(taille et SHA-256 différents à chaque test, même sans modification) —
donc après chaque repack, refaire son propre contrôle CRC/LZMA/TAR,
comparer la liste et les hashes de fichiers attendus, produire un journal.

**Catalogue des mods (état vérifié le 11 août 2026, OS 246) :**

| Priorité | Mod | État | Risque |
|---|---|---|---|
| P0 | Iter caché | vérifié OS 246 | contrôlé |
| P0 | Presets Iter | vérifié OS 246 | contrôlé |
| P0 | Filter caché | vérifié OS 246 | contrôlé |
| P1 | `subtle-fx` | vérifié OS 246 | contrôlé |
| P1 | Quantification par gammes | patch communautaire, non intégré | critique |
| P1 | Presets/samples d'usine personnalisés | candidat, fixtures nécessaires | élevé |
| P2 | Tape invert | vérifié en labo | contrôlé |
| P2 | Iter Lab / Lost Art | Iter Lab vérifié, Lost Art partiel | contrôlé |
| P2 | CWO moose/cat/dog/wizard | variantes vérifiées séparément, **exclusives entre elles** | contrôlé |
| P2 | Glitter / SVG personnalisé | candidat sidecar | contrôlé/élevé |
| P3 | moteur compilé supplémentaire | aucune preuve reproductible | critique |
| P3 | flash/OTP/ECC/bootloader | exclu du produit | rouge |

**Ce qui manque encore côté labo (`FIRMWARE_LAB.md`) :**
- un extracteur Rust sûr partageant les règles de l'inspecteur Python ;
- une reconstruction déterministe et contrôlée, sans `tar.extractall()` ;
- une comparaison visuelle des bases SQLite et ressources SVG/audio ;
- des fixtures légales modifiables (sans redistribuer de firmware TE) ;
- un détecteur hardware-in-the-loop Disk mode vs TE-boot ;
- une preuve de fin d'installation observée ou confirmée par l'utilisateur.

**Format du conteneur `.op1` (connaissance figée à documenter dans le
code) :** 4 octets CRC-32 little-endian → flux LZMA-Alone → archive TAR
contenant `OP1_vdk.ldr` (chiffré selon la recherche communautaire),
`te-boot.ldr`, `content/audio/`, `content/display/`, `op1.db`,
`op1_factory.db`, `tape.db`, `kerntable.db`. Mesures de référence OS 246 :
13 039 128 octets, CRC `cc08445c`, 117 entrées TAR (107 fichiers / 10
dossiers), version `R. 00246`, te-boot `2.30`.

---

## 6. PHASE — Sauvegardes / Time Machine

**Structure de dossiers proposée :**
```
OP-1 Studio Backups/
└── original-op1_<device-id>/
    └── <timestamp>_<snapshot-id>/
        ├── manifest.json
        ├── device.json
        ├── files/...
        └── previews/...
```
Pas de déduplication dans le premier prototype (une couche de blobs
adressés par contenu pourra venir après mesure, sans changer le manifeste
public).

**À construire :**
- snapshots horodatés et manifestes versionnés ;
- comparaison visuelle de deux états ;
- sauvegardes incrémentales et déduplication ;
- plan de restauration avec simulation ;
- reprise d'erreur et contrôle après écriture ;
- historique local compréhensible sans compte ;
- **barre Storage/Usage avec seuil d'alerte coloré** (issu de l'analyse
  concurrentielle — OP-1Z Sample Manager le fait déjà bien).

**Time Capsule (distincte des sauvegardes complètes) :** réservée
uniquement aux dossiers `tape` et `album` — pistes, prises, exports
audio. Aucun firmware, aucun mod, aucun sample utilisateur dedans. Les
firmwares restent dans le flux Firmware, les samples dans le preflight
audio.

---

## 7. PHASE — Dépôt local universel (bibliothèque de contenu)

**Arborescence retenue :**
```
OP-1-Studio-Library/
├── backups/
├── content/
├── exports/
├── firmware/{official,modded}/
├── manifests/
├── packs/
├── patches/{drum,sampler,synth}/
├── quarantine/
├── samples/
├── tapes/
└── themes/
```

Chaque entrée conserve au minimum : chemin relatif, type, taille,
SHA-256, modèle visé, compatibilité firmware, auteur, source/URL,
licence, date d'import, statut.

**Pipeline d'import :** Sélection locale → Hash SHA-256 → Détection
format → Provenance et licence → Quarantaine ou bibliothèque → Preview
puis export. Tout contenu à droits/modèle incertain reste en
`quarantine`. Pas de scraping, pas de compte aspiré, pas de packs payants
téléchargés en masse.

**Règles de licence :**
- sauvegardes/sons créés par l'utilisateur : restent dans son coffre
  local ;
- code MIT/GPL : séparé du contenu audio, notices conservées ;
- packs communautaires : liés à leur auteur et conditions ;
- contenu propriétaire ou licence inconnue : indexable localement, mais
  jamais dans Git ni une release ;
- firmwares et manuels Teenage Engineering : hors dépôt Git.

---

## 8. PHASE — Sons & patches (bibliothèque + éditeur)

**Première version de l'éditeur (`PATCH_EDITOR_SPEC.md`) :**
- bibliothèque des patches et kits locaux ;
- recherche par nom, type et tags ;
- aperçu audio avant/après modification ;
- nom et catégorie ;
- paramètres simples exposés par le format reconnu : cutoff, résonance,
  drive, enveloppe, niveau ;
- export d'une copie avec manifeste ;
- plan de transfert séparé, après sauvegarde.

Parcours cible : `Importer → Mesurer → Éditer une copie → Écouter →
Exporter + vérifier`. Le transfert machine n'apparaît qu'après export
validé et liaison à un `ChangePlan`.

**Contraintes de format mesurées (`OP1_KNOWLEDGE_BASE.md`) :**

| Cible | Durée max documentée | Préparation prudente |
|---|---:|---|
| Synth sampler | 6 s | mono, PCM 16 bits, 44,1 kHz, AIFF |
| Drum sampler | 12 s | mono, PCM 16 bits, 44,1 kHz, AIFF |
| Patch natif | dépend du moteur | préserver chunks inconnus et métadonnées |

**Ajouts issus de l'analyse concurrentielle (OP-PatchStudio, OP-1Z Sample
Manager) :**
- tableau de bibliothèque avec recherche, filtre par type, favoris, tri
  par colonne (nom/type/nb samples/date), sélection multiple, suppression
  groupée, pagination ;
- grille de pads fidèle à la disposition physique des 24 pads OP-1, avec
  la lettre clavier affichée sur chaque pad (réutilisée ensuite par le
  module Éducation) ;
- éditeur multisample : clavier complet pour assigner un son par plage de
  notes, avec réglage de convention de numérotation (`c3=60`/`c4=60`) ;
- code couleur distinguant un son d'origine d'un son importé, pour éviter
  d'écraser un son d'usine par erreur ;
- enregistrement micro direct dans un emplacement, pas seulement import de
  fichier.

---

## 9. PHASE — Studio (Tape & Album)

**Faits techniques figés à respecter :**
- 4 pistes, 6 minutes de durée totale, audio 44,1 kHz / 16 bits ;
- fichiers en Disk mode : `tape/track_1.aif` à `track_4.aif` ;
- un export individuel ne contient ni mix, ni EQ, ni effet master, ni
  drive appliqués par l'OP-1 ;
- Album : faces A/B jusqu'à 6 min chacune, alias de noms à détecter
  (`sideA.aif`, `SideA.aif`, `side_a.aif`) ;
- l'Endless sequencer accepte jusqu'à 128 notes selon le guide officiel ;
- les séquenceurs ne sont pas un fichier de morceau universel exportable ;
- modification directe de `tape.db` : hors périmètre tant que le format
  n'est pas maîtrisé.

**Modèle fiable retenu pour la création de morceau :**
1. arranger des clips sur 4 pistes dans OP-1 Studio ;
2. rendre 4 AIFF synchronisés, 44,1 kHz/16 bits, 6 min max ;
3. sauvegarder l'état actuel de la machine ;
4. préparer un plan de remplacement des pistes ;
5. laisser l'utilisateur finaliser et mixer sur l'OP-1.

**M4 — reste à faire :** lecture synchronisée des 4 pistes, mute/solo,
formes d'onde et repères réels, export individuel/groupé WAV/FLAC, aperçu
Album et détection des alias, archivage du rendu avec le snapshot source.

**M5 — Studio quatre pistes (cible XL) :** projet local non destructif,
clips/découpe/déplacement/gain/fades, rendu 4 stems alignés (6 min max),
plan d'import Tape après sauvegarde, export projet + sources, fenêtre
dédiée avec transport/tempo/boucle/raccourcis, capture MIDI → événements
de projet, grille piano-roll et quantification, mixage local avant export.

**M5.1 — Architecture professionnelle :** `Project` local versionné,
`AudioEngine` isolé, `MidiEngine` isolé, `DeviceTransfer` isolé, chaque
outil dans une fenêtre dédiée avec journal et état propre.

**M5.2 — Cœur projet et moteur audio :** format `Project` JSON versionné
(livré v1), waveforms calculées depuis les fichiers sans décoration
(à faire), trim/déplacement/gain/fades/rendu offline (à faire), tests de
round-trip projet et fixtures audio (à faire), grille et raccourcis reliés
seulement après le reste.

**Ajout concurrentiel :** écran de découpe minimal — une seule forme
d'onde, deux poignées de sélection, durée en direct, deux boutons
seulement (Annuler/Partager), pas de réglages superflus pendant la coupe.

---

## 10. PHASE — Éducation & disposition clavier (M4.5)

- disposition clavier ordinateur configurable (AZERTY/QWERTY) et
  disposition des pads calquée sur le mode Drum ;
- exercices de finger drumming avec retour visuel et rythmique, inspirés
  de [`sampi/finger`](https://github.com/sampi/finger) (recréation Web
  MIDI du séquenceur Finger OP-1/OP-Z) ;
- mode « apprendre un morceau » : import MIDI, surbrillance des touches,
  ralenti, boucle par section ;
- fonctionne en mode Clone OP-1 seul ou avec la machine en entrée MIDI de
  contrôle ;
- fenêtre dédiée, journal de progression local, rien envoyé hors
  l'appareil ;
- trois entrées visibles dès l'ouverture (calqué sur Melodics) :
  apprentissage structuré / leçons ciblées par technique-style / morceaux
  réels avec mode entraînement puis performance complète ;
- réutiliser la grille de pads fidèle construite en section 8, pas un
  clavier générique.

---

## 11. PHASE — Chantier visuel & système de design (M4.6)

- extraire les valeurs répétées (tailles, espacements, couleurs) en jeu
  de tokens unique ;
- découper `app/page.tsx` (~700 lignes) en composants par écran, sans
  changer le rendu ;
- redessiner le clavier du clone pour la vraie disposition OP-1 (rangées
  colorées, zone batterie séparée de la zone synthé) ;
- remplacer toutes les formes d'onde décoratives par de vraies formes
  calculées, partout (Sons, Tape, Studio) ;
- créer les icônes d'application pour Windows/macOS/Linux ;
- **écran d'accueil en grille de cartes par module avec badges de
  compatibilité** (« sans machine » / « OP-1 requis »), inspiré de l'écran
  d'accueil d'OP-1Z Sample Manager, combiné à notre bandeau machine
  existant — pas une refonte de zéro ;
- vérifier la cohérence visuelle des nouvelles fenêtres (Éducation,
  Documentation) avec l'existant ;
- accessibilité : contraste suffisant, navigation clavier complète,
  fermeture des modales avec Échap ;
- captures d'écran propres pour README et fiche de présentation.

---

## 12. PHASE — Empaquetage & distribution desktop (M8)

- construire des installeurs Windows/macOS/Linux à partir de la coque
  Tauri déjà présente (mais non branchée — voir section 2) ;
- accès natif au volume USB de l'OP-1 et à la sortie audio depuis l'app
  installée, sans dépendre du navigateur (Web MIDI/USB) ;
- signature et notarisation par plateforme ;
- vérifier que le Safe Change Engine (section 4) fonctionne identiquement
  en mode installé et en mode développement.

---

## 13. PHASE — Documentation utilisateur française (en continu)

- démarrage rapide : brancher, premier son, première sauvegarde ;
- une page par espace, seulement une fois l'espace réellement livré (pas
  avant, pour ne pas mentir) ;
- FAQ des messages d'erreur réellement observés dans l'app ;
- accessible depuis la fenêtre Documentation de l'app, pas seulement dans
  le dépôt Git ;
- brouillon déjà démarré : `GUIDE_UTILISATEUR.md`.

---

## 14. PHASE — Studio Cloud (M6, après validation de la rétention)

- compte optionnel et jumelage app/service ;
- chiffrement côté client ;
- synchronisation multi-ordinateur ;
- historique distant et politique de rétention ;
- partage privé et révocable ;
- abonnement/facturation seulement après validation d'usage réel.

**Offres à tester (hypothèses de recherche, pas une grille figée) :**

| Offre | Prix test | Contenu |
|---|---:|---|
| Community | 0 € | Détection, sauvegardes locales, restauration vérifiée, firmware officiel, bibliothèque locale, Tape |
| Studio Cloud | 4–6 €/mois ou 35–49 €/an | Historique chiffré distant, sync multi-ordinateur, profils machine, partage privé, priorité support |
| Supporter | achat unique à tester | Badge, thèmes, soutien — aucune fonction de sécurité exclusive |

**Ne doit jamais être payant :** création/vérification d'une sauvegarde
locale, restauration locale, installation guidée d'un firmware officiel
déjà téléchargé, inspection d'intégrité, export de ses propres fichiers,
accès aux journaux nécessaires pour récupérer d'une erreur.

**Expériences à mener avant tarification réelle :**
1. entretiens sur la dernière perte/peur de perte, pas « paieriez-vous ? » ;
2. offrir une seconde sauvegarde locale et mesurer l'usage ;
3. faux choix tarifaire non encaissé (mensuel/annuel/soutien) ;
4. précommande remboursable seulement après démo d'une bêta stable ;
5. cohorte : rétention à 30 et 90 jours avant d'augmenter le stockage
   gratuit.

---

## 15. PHASE — Écosystème (M7)

- packs de sons avec manifestes et licences ;
- import manuel depuis services communautaires (jamais automatique) ;
- adaptateur OP-1 Field séparé, uniquement quand le matériel sera
  disponible pour tester ;
- Labo expert firmware, isolé et opt-in ;
- API/plugin locale documentée ;
- traductions (nécessite la librairie i18n listée en section 2).

---

## 16. Outils externes — décisions consolidées

| Outil | Décision |
|---|---|
| `op1repacker` | Vendored, labo expert isolé uniquement, jamais dans le parcours officiel |
| `op1REpackerGUI` | Référence UX/audit seulement, ne pas reprendre ses écritures telles quelles |
| `op-patch-util` | Intégré (1.1.0) pour patches synth/drum, exécutable isolé |
| `teoperator` | Référence de conversion, fixtures croisées, pas encore dépendance directe |
| `op1tools` | Référence seulement, à réécrire pour le multiplateforme |
| `OP-1Z Sample Manager` | Benchmark direct, code réutilisable si attribution et audit |
| `opie` | Étude historique du flux backup/restore, pas de dépendance directe |
| `op1aiff` | À ajouter en lecture seule pour indexer les patches (pas fait) |
| `op1svg` | À ajouter en validation des mods graphiques (pas fait) |
| `op1-fw-archive` | Métadonnées seulement, jamais de binaire redistribué |
| `op1-docs` | Source technique, copie seulement si licence le permet |
| `connect-op1` | Indicateur de détection VID/PID, jamais preuve unique |
| `OP-PatchStudio` | Inspiration/benchmark UX, moteur OP-1 à valider avant réutilisation |
| `op1-glitter` | Sidecar expert, normalisation et fixtures à ajouter |
| `op1.fun.app` (macOS) | Benchmark UX, pas de dépendance ni téléchargement silencieux |
| `OP-1 Note Quantization` | Recherche seulement, aucun bouton d'installation |
| `op1-decryptor` | Référence historique, aucune clé ni extraction dans l'app |
| `op1dumps` | **Exclu**, risque matériel critique |
| `op1.fun` (service) | Lien/import manuel uniquement, pas de scraping |
| `op1-patch-preview` | Référence UI pour l'aperçu A/B audio |
| `sampi/finger` | Référence technique directe pour le module Éducation |
| `marctdt/op-1-ableton-live-control-surface` | Fork actif à étudier pour les mappings MIDI/DAW (le dépôt officiel TE est archivé) |
| `op1emu` | **Veille uniquement**, trop tôt, question légale sur la ROM firmware |
| `FL-OP1-controller-script` | Mappings transport à adapter au pont MIDI |
| `TOP-1` | Référence moteurs audio/séquenceurs, pas un pilote OP-1 |
| `op1kenobi` | Référence interface web/simulation |
| `Manager for OP1` (iOS) | Référence UX (liste projets, mixeur 4 pistes, trim minimal) ; app à 2.6/5 sur 12 avis — signal que le sujet est mal résolu ailleurs |

**Processus d'adoption obligatoire pour toute nouvelle dépendance
(`CONTRIBUTING.md`) :** documenter URL officielle, version épinglée,
licence SPDX, rôle, plateforme, surface de risque, solution de repli.
Toute dépendance touchant un firmware ou une sauvegarde tourne dans un
processus isolé avec entrées validées.

---

## 17. Tests — matrice complète

| Niveau | Cible | Matériel réel requis |
|---|---|---|
| Unitaire | règles de chemin, plans, limites, manifestes | Non |
| Fixture | volumes Disk/TE-boot simulés, pannes injectées | Non |
| Intégration | sidecars audio et systèmes de montage | Non |
| Hardware-in-loop | détection, copie, sync, éject | Oui, volontaire |
| Firmware | parcours officiel sur matrice OS/version | Oui, protocole strict |

Cas limites obligatoires dans les fixtures : fichiers inconnus, casse
différente, noms Unicode, manque d'espace, volume remonté, interruption
après chaque étape d'écriture.

**Portes de qualité avant tout essai réel :**
1. aucune écriture possible sur une fixture non reconnue ;
2. toutes les traversées de chemin rejetées ;
3. panne injectée à chaque étape avec résultat récupérable ;
4. sauvegarde relue et vérifiée avant activation de TE-boot ;
5. éjection native testée sur chaque OS ;
6. procédure relue face au guide officiel ;
7. bêta volontaire avec machine de test, jamais avec l'unique copie d'un
   morceau.

---

## 18. Backlog technique immédiat (premières issues)

| Issue | Taille | Dépendance |
|---|---:|---|
| Créer le monorepo interface/app/core | M | aucune |
| Définir `DeviceIdentity`, `DeviceMode`, `FirmwareRelease` | S | monorepo |
| Construire les fixtures Disk et TE-boot | M | modèles |
| Scanner un volume en lecture seule | M | fixtures |
| Définir `BackupManifest` v1 | S | modèles |
| Copier + hacher une sauvegarde minimale | M | manifeste |
| Lire et valider l'enveloppe `.op1` sans extraction | M | fixtures firmware |
| Implémenter le `ChangePlan` firmware | M | scanner + backup |
| Relier le prototype au cœur via commandes typées | M | ChangePlan |
| Adaptateurs de sync/éjection par OS | L | ports stabilisés |

---

## 19. Risques prioritaires (produit + sécurité)

- confondre un plan préparé avec une opération machine réussie ;
- écrire sur le mauvais volume USB ou sans manifeste relu ;
- perdre des fichiers sources pendant trim, conversion ou export ;
- mélanger les formats Tape, Album et patches utilisateur ;
- laisser l'interface promettre une fonction que le pont ne réalise pas ;
- traversée de chemin dans une archive ;
- corruption silencieuse d'un fichier audio ;
- contournement d'une confirmation ;
- exécution de contenu non fiable ;
- téléchargement de firmware depuis une origine non approuvée.

Tout bug pouvant viser le mauvais volume ou déclarer un firmware invalide
comme valide est traité comme une vulnérabilité (signalement par avis de
sécurité privé GitHub, jamais de procédure reproductible publiée avant
correction, jamais joindre un firmware propriétaire ou une sauvegarde
complète).

---

## 20. Indicateurs de validation produit (à mesurer, pas à deviner)

- temps médian entre connexion et première sauvegarde vérifiée ;
- part des utilisateurs qui font une deuxième sauvegarde dans les 30 jours ;
- nombre d'opérations annulées avant écriture grâce au plan ;
- taux de restauration vérifiée ;
- coût cloud par utilisateur actif (si M6 activé) ;
- conversion mesurée après usage réel du coffre, jamais avant ;
- incidents matériels critiques par version.

---

## 21. Points encore à confirmer sur du matériel réel

- nom/label exact des volumes sur chaque système et version OS ;
- comportement après copie d'un fichier temporaire ou inconnu ;
- variantes exactes des noms d'album (`sideA`/`SideA`/`side_a`) ;
- limites réelles de patches selon version OS et espace disponible ;
- reconstruction des index après restauration ;
- conservation des chunks AIFF inconnus par les bibliothèques choisies ;
- VID/PID selon mode normal, Disk et TE-boot ;
- bibliothèque audio Rust pure ou FFmpeg obligatoire (décision ouverte) ;
- stratégie d'identifiant stable de machine sans collecter de série
  sensible ;
- méthode d'éjection native par plateforme ;
- format du projet Studio avant rendu vers quatre stems.

---

## 22. Convention de contribution (pour ne pas polluer l'historique)

- préfixes de commit : `feat:`, `fix:`, `docs:`, `test:`, `refactor:`,
  `build:`, `chore:` ;
- ne jamais mélanger une refonte visuelle et une opération critique de
  périphérique dans le même changement ;
- ouvrir une issue d'abord pour toute fonction touchant au firmware, à la
  restauration ou au format de bande ;
- ajouter des tests pour chemins, noms, limites audio, erreurs d'éjection ;
- signaler clairement les essais faits avec une machine réelle et sa
  version d'OS.

---

Fin du document. Si quelque chose manque encore, c'est qu'il n'était dans
aucun fichier du dépôt ni dans cette conversation — à ce moment-là, on
l'ajoute ici, pas ailleurs, pour garder un seul endroit de vérité totale.
