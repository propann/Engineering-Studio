# Architecture technique proposée

## Choix directeur

Le produit partage une interface React/TypeScript entre deux surfaces :

- une application **Tauri 2** avec cœur Rust pour toute opération matérielle ;
- un service navigateur pour le compte, la bibliothèque distante et la synchronisation optionnelle.

Le navigateur standard ne constitue pas une base suffisante pour le firmware. WebUSB protège notamment la classe USB Mass Storage, et la File System Access API dépend du navigateur et d’un choix manuel de dossier ; elle ne fournit pas une stratégie portable d’identification et d’éjection sûre. L’app native est donc le produit matériel de référence. Un pont local navigateur pourra être étudié plus tard, après sécurisation du protocole.

Cette architecture réduit la taille du paquet par rapport à Electron, permet de réutiliser des bibliothèques Rust liées aux patches et garde les opérations critiques dans un langage à mémoire sûre.

## Couches

```mermaid
flowchart TB
    VIEW["Interface React partagée"]
    APP["App Tauri"]
    WEB["Service web"]
    DOMAIN["Domaine Rust\nplans, règles, manifestes"]
    OS["Adaptateurs OS\nWindows · macOS · Linux"]
    CLOUD["API compte + cloud"]
    VIEW --> APP --> DOMAIN --> OS
    VIEW --> WEB --> CLOUD
    APP -. compte optionnel .-> CLOUD
```

### Présentation

- composants accessibles au clavier ;
- états de connexion explicites ;
- waveform et lecture audio sans écriture implicite ;
- résumé humain + détail technique pour chaque plan.

Le monorepo partage les composants, contrats et traductions, mais les capacités disponibles sont injectées par environnement. Une page web ne doit jamais afficher un bouton d’écriture matérielle actif en l’absence de l’app.

### Domaine

- `DeviceIdentity` : modèle, mode, point de montage, identifiants USB observés ;
- `DeviceSnapshot` : inventaire immuable et capacité ;
- `ChangePlan` : copies, remplacements, suppressions, espace et préconditions ;
- `BackupManifest` : version de schéma, chemins relatifs, tailles, dates et SHA‑256 ;
- `AudioAsset` : source, format mesuré, durée, aperçu et cible ;
- `FirmwareRelease` : version, URL officielle, notes, empreintes vérifiées localement ;
- `OperationJournal` : phases, résultat de chaque fichier et recommandations de reprise.

### Adaptateurs

- découverte des volumes et périphériques USB/MIDI ;
- lecture/écriture avec synchronisation et éjection natives ;
- décodage, resampling et encodage audio ;
- coffre de sauvegardes local ;
- client HTTPS limité aux origines autorisées ;
- éventuels outils tiers lancés comme processus isolés.

## Modes de la machine

| Mode logique | Signal possible | Droits dans l’application |
|---|---|---|
| Normal | USB audio/MIDI, VID/PID si disponible | Informations et audio/MIDI, pas de fichiers |
| Disk | Volume avec structure OP‑1 attendue | Lecture ; écriture seulement après plan |
| TE‑boot | Petit volume de maintenance attendu | Firmware officiel uniquement |
| Inconnu | Nom ressemblant mais preuves insuffisantes | Lecture système minimale, aucune écriture |

L’identifiant USB `2367:0004` est documenté par le projet `connect-op1` pour l’OP‑1 original, mais il ne suffit pas à lui seul. Le moteur combine plusieurs preuves et exige une structure compatible avant toute mutation.

## Transaction de fichiers

```mermaid
stateDiagram-v2
    [*] --> Observed
    Observed --> Planned: préparer
    Planned --> Approved: confirmer
    Approved --> Writing: revalider le volume
    Writing --> Verifying: sync + relire
    Verifying --> Completed: empreintes valides
    Writing --> RecoverableError: erreur partielle
    Verifying --> RecoverableError: écart détecté
    RecoverableError --> [*]
    Completed --> [*]
```

Avant `Writing`, l’application recalcule l’identité du volume, contrôle l’espace libre et compare la génération de l’inventaire. Un fichier est d’abord copié vers un nom temporaire sur la même destination lorsque le format de volume le permet, synchronisé, vérifié, puis renommé. Les suppressions sont reportées à la fin.

## Sauvegardes

Structure proposée :

```text
OP-1 Studio Backups/
└── original-op1_<device-id>/
    └── 2026-08-11T14-32-05Z_<snapshot-id>/
        ├── manifest.json
        ├── device.json
        ├── files/...
        └── previews/...
```

Les fichiers audio ne sont pas dédupliqués dans le premier prototype. Une couche de blobs adressés par contenu pourra être ajoutée après mesure, sans changer le manifeste public. Les aperçus sont reproductibles et ne comptent pas dans la preuve de sauvegarde.

## Audio

Le pipeline mesure toujours le média réel avant conversion : canaux, fréquence, profondeur, durée et pic. La cible OP‑1 originale est un AIFF PCM compatible, généralement mono 44,1 kHz / 16 bits pour les échantillons, avec une limite de 6 s pour le synth sampler et 12 s pour le drum sampler. Les pistes de bande sont conservées à 44,1 kHz / 16 bits.

Les moteurs possibles sont :

- bibliothèques Rust pour l’inspection et les opérations simples ;
- FFmpeg comme sidecar optionnel pour les formats d’entrée larges ;
- `op-patch-util` ou logique compatible pour les métadonnées de patch, après audit de licence et tests.

Une version exacte du sidecar doit être épinglée et son SHA‑256 vérifié à l’installation.

## Firmware

Le cœur standard sait uniquement : lire un catalogue, télécharger depuis une origine officielle, valider le conteneur connu, confirmer le mode TE‑boot, copier le fichier, synchroniser et demander l’étape physique suivante. Il ne décompresse ni ne modifie le code du firmware dans le parcours normal.

L’analyse/repack communautaire est un module séparé, désactivé par défaut et incapable d’écrire directement sur un volume. Voir [FIRMWARE_SAFETY.md](FIRMWARE_SAFETY.md).

## Stockage de configuration

- préférences : configuration applicative native, sans secret ;
- catalogue : JSON signé ou livré avec l’application, rafraîchi depuis une source contrôlée ;
- bibliothèque : SQLite locale pour l’index, fichiers audio hors base ;
- sauvegardes : manifestes JSON versionnés et lisibles sans l’application ;
- journaux : rotation locale, chemins personnels pseudonymisés.

## Tests

| Niveau | Cible | Matériel réel requis |
|---|---|---|
| Unitaire | règles de chemin, plans, limites, manifestes | Non |
| Fixture | volumes Disk/TE‑boot simulés, pannes injectées | Non |
| Intégration | sidecars audio et systèmes de montage | Non |
| Hardware-in-loop | détection, copie, sync, eject | Oui, volontaire |
| Firmware | parcours officiel sur matrice OS/version | Oui, protocole strict |

Les tests de fixture doivent inclure fichiers inconnus, casse différente, noms Unicode, manque d’espace, volume remounté et interruption après chaque étape d’écriture.

## Décisions encore ouvertes

- bibliothèque audio Rust pure ou FFmpeg obligatoire ;
- stratégie d’identifiant stable de machine sans collecter de série sensible ;
- méthode d’éjection native par plateforme ;
- support exact des alias de fichiers `sideA`, `SideA` ou `side_a` ;
- limites réelles de patches selon version OS et espace disponible ;
- format du projet Studio avant rendu vers quatre stems.
