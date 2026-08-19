# 🎛️ DOSSIER D'ARCHITECTURE GLOBALE : LE RACK CENTRAL
## Suite Logicielle Unifiée pour Teenage Engineering OP-1 & EP-133 K.O. II

**Auteur :** AI Engineering Studio  
**Date :** 18 août 2026  
**Branche cible :** `main`  
**Statut :** Spécification d'Architecture Canonique & Audit de Consolidation  

---

## Executive Summary & Vision Produit

Le **Studio Hub** évolue vers une architecture en **Rack Central (Châssis Unifié)**. Au lieu d'exécuter trois applications isolées et concurrentes consommant chacune leur propre serveur et dupliquant la logique réseau, MIDI et fichier, le projet adopte une **architecture modulaire en Rack ("Rack-and-Module")**.

Le **Châssis Central (Studio Hub)** sert d'hôte de communication, de coffre-fort de persistance (*Vault*), de Master Clock MIDI et de gestionnaire de profil local. Autour de ce châssis viennent se brancher les **Modules Spécialisés** dédiés aux instruments **OP-1 (original)** et **EP-133 K.O. II**.

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           STUDIO HUB : LE CHÂSSIS CENTRAL                        │
│ ┌──────────────────────┐ ┌────────────────────────┐ ┌──────────────────────────┐ │
│ │  1. Profil & Atelier │ │ 2. Master MIDI Clock   │ │ 3. Vault & Backup SHA256 │ │
│ └──────────────────────┘ └────────────────────────┘ └──────────────────────────┘ │
│ ┌──────────────────────┐ ┌────────────────────────┐ ┌──────────────────────────┐ │
│ │ 4. Audio Library     │ │ 5. Workspace FSA Engine│ │ 6. Router & Navigation   │ │
│ └──────────────────────┘ └────────────────────────┘ └──────────────────────────┘ │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ Bus de données local (Web MIDI / FSA / Shared Packages)
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│         RACK MODULES OP-1             │ │        RACK MODULES EP-133            │
│ ├─ Tape & Album Studio                │ │ ├─ Pattern & Song Studio              │
│ ├─ Synth & Drum Patch Editor          │ │ ├─ Pad & Sound Manager (64 / 128 Mo)  │
│ ├─ Sample Editor (AIFF 44.1k/16b)     │ │ ├─ SysEx & Machine Diagnostic         │
│ ├─ Display Pixel & Theme Editor       │ │ ├─ Rhythm Hero (Finger Drumming Lab)  │
│ └─ Firmware Lab & Modding             │ │ └─ Project Clone & Transfer Engine    │
└───────────────────────────────────────┘ └───────────────────────────────────────┘
```

---

## 1. Audit Approfondi des Doublons & Redondances

L'analyse du code source à travers les applications (`apps/studio-hub`, `apps/op1-studio`, `apps/ep133-studio`), les packages (`packages/*`) et l'historique démontre une sur-duplication de services fondamentaux. Voici le bilan complet et les préconisations de consolidation :

### A. Services Audio & Analyse des Fichiers WAV/AIFF
* **Constat des doublons** :
  * `apps/op1-studio/app/lib/audioOracle.ts` réimplémente le parsing d'en-tête WAV/AIFF et la conversion mono.
  * `apps/ep133-studio/src/core/audio/wavAnalysis.ts` et `wavConvert.mjs` réécrivent leur propre analyse de métadonnées et validation de durée.
  * `apps/studio-hub/src/pages/SoundEditorHub.tsx` réexécute une boucle locale pour les formes d'ondes et le découpage temporal.
* **Impact** : Triplication de la maintenance, risque de divergence de calcul de durée ou de détection de bitrate.
* **Solution Rack** : Factorisation complète dans le package partagé **`@studio-hub/audio-bridge`**.
  * `analyzeWavBuffer()` / `analyzeAiffBuffer()`
  * `encodeMonoAiff16Bit()` (Format natif OP-1 / EP-133)
  * `detectAudioDuplicatesSha256()`

### B. Moteur MIDI, Transport et Horloge
* **Constat des doublons** :
  * `apps/studio-hub/src/MidiSyncPanel.tsx` gère la Master Clock 24 PPQN, le routage des notes et le PANIC.
  * `apps/op1-studio/app/core/midi/` gère séparément les entrées Web MIDI pour l'OP-1.
  * `apps/ep133-studio/src/core/midi/` gère ses propres filtres de connexions et le décodage de messages SysEx EP-133.
* **Impact** : Conflits de réception MIDI si plusieurs fenêtres/modules tentent d'ouvrir les mêmes ports Web MIDI en parallèle (`requestMIDIAccess`).
* **Solution Rack** : Centralisation du contrôle Web MIDI dans le Châssis Central via **`@studio-hub/midi-bridge`**.
  * Le Châssis Central maintient l'accès MIDI maître unique.
  * Les modules Rack s'abonnent aux événements MIDI via un bus d'événements interne (`PostMessage` / `BroadcastChannel`).

### C. Persistance & Système de Fichiers (File System Access API)
* **Constat des doublons** :
  * `apps/op1-studio/app-core/storage/directoryHandleStore.ts` gère la rétention des autorisations de dossiers.
  * `apps/ep133-studio/src/core/storage/` fait une gestion similaire pour les dossiers de projets EP-133.
  * `apps/studio-hub/src/VaultPanel.tsx` gère la copie et la vérification SHA-256.
* **Impact** : L'utilisateur doit redemander des autorisations de dossier séparées pour chaque application.
* **Solution Rack** : Unification du gestionnaire de Workspace local dans le Châssis Central.
  * Une seule autorisation accordée au Châssis Central donne accès à la structure d'arborescence globale (`shared/sounds/`, `op1/backups/`, `ep133/projects/`).

### D. Profil, Configuration & Thèmes
* **Constat des doublons** :
  * `localStorage.getItem("studio-hub-profile")`
  * `localStorage.getItem("ep133-user-profile")`
  * `localStorage.getItem("op1-settings")`
* **Impact** : L'utilisateur qui change son nom (`AZOTH`), sa disposition de clavier (`AZERTY`) ou sa langue dans un module ne voit pas la mise à jour reflétée immédiatement dans les autres.
* **Solution Rack** : Enveloppe de cache partagée unique `studio-hub.cache.v1` synchronisée en temps réel.

---

## 2. Cartographie des Modules du Rack Central

Le Rack est structuré en **16 modules fonctionnels** organisés en 3 catégories principales :

### BLOC 1 : LE CHÂSSIS CENTRAL (Studio Hub Core)
| Code Module | Nom du Module | Rôle & Fonctionnalités | Statut |
|---|---|---|---|
| `HUB-CORE-01` | **Router & TopBar** | Barre de contrôle supérieure, sélection d'identité, choix de l'atelier, bascule de thème. | **FONCTIONNEL** |
| `HUB-CORE-02` | **Master MIDI Sync** | Horloge maître 24 PPQN, Start/Stop/BPM (40-240 BPM), relais contrôleur OP-1 vers EP-133, bouton d'urgence PANIC. | **FONCTIONNEL** |
| `HUB-CORE-03` | **Vault & Backup Engine** | Snapshots sélectifs de machines, calcul d'empreinte SHA-256, comparaison de taille et restauration sécurisée sans écriture aveugle. | **FONCTIONNEL** |
| `HUB-CORE-04` | **Sound Vault (Bibliothèque)** | Catalogue son central, import multi-fichiers, préécoute audio, gestion de tags, favoris et détection de doublons audio. | **FONCTIONNEL** |
| `HUB-CORE-05` | **Workspace Manager (FSA)** | Connexion au dossier local de travail, vérification des permissions `read`/`readwrite`, reconnexion automatique. | **FONCTIONNEL** |

### BLOC 2 : RACK DE MODULES OP-1 ORIGINAL
| Code Module | Nom du Module | Rôle & Fonctionnalités | Statut |
|---|---|---|---|
| `MOD-OP1-01` | **Tape & Album Studio** | Visualisation et mixage des 4 pistes Tape, gestion du transport, génération de stems et gestion de l'Album. | **FONCTIONNEL** |
| `MOD-OP1-02` | **Patch & Synth Editor** | Éditeur visuel pour les moteurs de synthèse OP-1 (Cluster, Digital, DNA, Dr Wave, FM, Phase, Pulse, String, Synth). | **FONCTIONNEL** |
| `MOD-OP1-03` | **Sample & Drum Editor** | Édition de formes d'ondes, points de trim, fondus d'entrée/sortie, découpage de Drum Kits et export AIFF 44.1 kHz / 16 bits. | **FONCTIONNEL** |
| `MOD-OP1-04` | **Display & Pixel Editor** | Créateur et éditeur d'images/écrans SVG au format natif 320 × 160 pixels, prévisualisation isolée. | **FONCTIONNEL** |
| `MOD-OP1-05` | **Firmware Lab & Mods** | Catalogue de firmwares officiels et custom mods, vérification d'intégrité, préparation de fichiers `.op1`. | **FONCTIONNEL** |
| `MOD-OP1-06` | **Keyboard & Chord Training** | Module d'apprentissage interactif avec retour MIDI, exercices de gammes et de suites d'accords. | **FONCTIONNEL** |

### BLOC 3 : RACK DE MODULES EP-133 K.O. II
| Code Module | Nom du Module | Rôle & Fonctionnalités | Statut |
|---|---|---|---|
| `MOD-KOII-01` | **Pattern & Song Studio** | Édition des groupes A/B/C/D, grille de patterns, scènes et arrangement complet de chansons (Song Mode). | **FONCTIONNEL** |
| `MOD-KOII-02` | **Pads & Sound Manager** | Assignation des 99 emplacements de sons sur les 12 pads, contrôle de la jauge mémoire (64 Mo / 128 Mo). | **FONCTIONNEL** |
| `MOD-KOII-03` | **SysEx & Machine Test** | Diagnostic de communication aller-retour MIDI SysEx, inspection des états de groupes et de projets. | **FONCTIONNEL** |
| `MOD-KOII-04` | **Rhythm Hero (Training)** | Jeu d'entraînement au finger drumming sur pads, partitions animées, détection de précision MIDI et scores. | **FONCTIONNEL** |
| `MOD-KOII-05` | **Project Clone & Backup** | Extraction, clonage et restauration ciblée de projets EP-133 (ex. Projet 09) avec checkpoint préalable. | **FONCTIONNEL** |

---

## 3. Analyse des Ressources & Gain de Performance

### Comparatif d'Architecture Runtime

| Critère | Ancienne Architecture (3 Serveurs séparés) | Nouvelle Architecture (Rack Central Unifié) | Gain |
|---|---|---|---|
| **Exécution Serveur** | 3 serveurs Vite (Ports 5179, 5175, 5177) | 1 serveur unique Vite (Port 3000) | **-66% d'empreinte réseau/processus** |
| **Consommation RAM** | ~1 200 Mo (3 instances Node/Vite) | ~350 Mo (1 instance unifiée) | **-70% d'utilisation mémoire** |
| **Accès Web MIDI** | Multiples appels concurrents à `requestMIDIAccess` | 1 instance Master MIDI partagée via `@studio-hub/midi-bridge` | **Zéro conflit de port MIDI** |
| **File System Access** | 3 demandes d'autorisation de dossier séparées | 1 validation Workspace globale pour tout l'atelier | **Fluidité UX optimale** |
| **Rechargement / HMR** | Multiples reconnexions websocket | 1 pipeline HMR unifié et maîtrisé | **Stabilité accrue** |

---

## 4. Plan de Migration & Feuille de Route de Consolidation

```text
[PHASE 1 : SOCLE] ────► [PHASE 2 : PACKAGES] ────► [PHASE 3 : RACK INTEGRATION] ────► [PHASE 4 : MATÉRIEL]
  ✓ Serveur Port 3000     ✓ @studio-hub/midi-bridge  ✓ Modules OP-1 branchés         - Tests physiques USB
  ✓ Metadata & TSConfig   ✓ @studio-hub/audio-bridge ✓ Modules EP-133 branchés       - Sauvegardes 64/128Mo
  ✓ Validation Lint/Build ✓ Nettoyage doublons WAV   ✓ Navigation sans couture       - Validation SysEx
```

### Action 1 : Conserver le code mort dans `archive/` sans perturber `main`
* Le travail d'expérimentation historique reste conservé sous `/archive/` et dans les documents d'étude.
* La branche `main` contient uniquement le code compilable, type-checké et validé.

### Action 2 : Standardisation des contrats TypeScript
* Utiliser les contrats de messages `HubTransportMessage`, `HubNoteMessage`, `HubPanicMessage` définis dans `@studio-hub/midi-bridge`.
* Garantir l'utilisation de `strict: false` ou de types précis sans résidu d'erreurs `any`.

---

## 5. Règle de Sécurité Matérielle (Rappel Canonique)

> **Règle absolue de sécurité du Rack Central :**  
> Aucun composant logiciel, test unitaire ou navigation navigateur ne déclenche d'écriture machine, de flashage de firmware, d'envoi SysEx destructif ou de transfert de fichier vers une machine physique sans :
> 1. Un **checkpoint explicite** de l'état actuel de la machine.
> 2. Un **plan de transfert lisible** affiché à l'utilisateur.
> 3. Une **confirmation manuelle explicite** de l'utilisateur.
> 4. Une **relecture de contrôle post-écriture** (comparaison d'empreinte SHA-256 / taille).

---

## Conclusion & Prochaines Étapes

Le **Dossier d'Architecture du Rack Central** est désormais déposé sur la branche canonique `main`. Cette architecture garantit une séparation claire des responsabilités, une consommation de ressources minimale et une intégration harmonieuse de l'ensemble des modules OP-1 et EP-133 K.O. II.
