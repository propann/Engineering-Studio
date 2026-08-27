# 🧭 Direction du Projet & Nouvelles Intégrations — Engineering Studio

**Document directeur de cadrage, vision architecturale et feuille de route des intégrations futures.**  
*Dernière mise à jour : 2026-08-26 | Statut : Actif & Référence Technique*

---

## 1. Vision & Piliers Fondateurs

**Engineering Studio** est une plateforme modulaire et temps réel alliant :
1. **L'environnement de production musicale studio** : station de travail audio-numérique (DAW) modulaire, rack DSP de synthèse et d'effets, station de jeu/entraînement rythmique et séquenceurs MIDI multi-échelles.
2. **Le pont matériel & interfaçage physique** : intégration native et sécurisée d'instruments physiques (Teenage Engineering OP-1, EP-133 K.O. II, synthétiseurs modulaires Eurorack via Web MIDI/SysEx) et d'instrumentation d'atelier/bancs de test via protocoles série/USB.
3. **La collaboration distribuée Local-First (Music-Git & P2P)** : gestion de versions décentralisée pour projets audio, arborescences de stems, historique de commits avec empreintes cryptographiques SHA-256 et sessions temps réel sans serveur centralisateur de données privées.

### Les 4 Piliers Techniques Invariants
- **Zéro complaisance & Zéro code fantôme** : Tout module déclaré dispose d'un contrat d'interface rigoureux, d'un typage strict (TypeScript) et d'une validation unitaire/d'intégration automatisée.
- **Fail-Safe & Défense en Profondeur** : Isolation des accès matériels, vérification systématique de l'intégrité des payloads (AIFF, SysEx, G-code, JSON), timeouts stricts et séparation des modes d'écriture machine (`machineWrite: false` par défaut).
- **Architecture Découplée & Event-Driven** : Séparation hermétique entre *Core Domain* (moteurs DSP, séquenceurs pas à pas, graphe audio), *Hardware Drivers / Infrastructure* (Web MIDI, Web Serial, WebRTC, IndexedDB) et *UI Reactive*.
- **Local-First & Respect de la Vie Privée** : L'intégralité des données de travail, profils, enregistrements et projets réside localement sur le poste de l'utilisateur (FS Handles, IndexedDB, `localStorage`), garantissant un fonctionnement 100% hors-ligne.

---

## 2. État Réalisé & Validé (Socle Existant)

| Secteur / Module | Capacité Opérationnelle | Fichiers / Packages Clés |
|---|---|---|
| **Hub Modulaire & Routage** | Navigation sécurisée, registre vérifié de pages orphelines/façades, isolation des composants. | `apps/studio-hub/src/pages/OrphanPages.tsx` |
| **OP-1 Studio** | Clone tactile 4 pistes bande, transport maître, enregistrement REC, mixage, rendu AIFF stéréo. | `apps/op1-studio/app/` |
| **EP-133 Studio** | Interface pads, mapping MIDI 9 groupes, 99 patterns/groupes, allocation mémoire (64 Mo max). | `apps/ep133-studio/`, `packages/midi-bridge/` |
| **Rack DSP Audio** | 15 moteurs de synthèse, 76 patches d'usine, enveloppe ADSR polyphonique, LFO global, EQ, Chorus, Delay 4 taps. | `apps/studio-hub/src/core/audio/`, `packages/musique/` |
| **Générateur de Samples** | Échantillonnage unitaire et chromatique avec conversion automatique AIFF/WAV et métadonnées OP-1. | `apps/studio-hub/src/core/audio/archivePatches.ts` |
| **Music-Git (VCS Audio)** | Système de contrôle de version dédié musique : commits SHA-256, branches, merge, snapshot d'arborescence, métadonnées tempo/pistes. | `packages/music-git/` |
| **P2P Collab Studio** | Multi-pistes audio/MIDI collaboratif, audio bounce hors-ligne, connexions WebRTC pair-à-pair, chat et synchronisation d'état. | `packages/p2p-collab/`, `apps/studio-hub/src/pages/CollabStudio.tsx` |
| **Répartiteur Web MIDI** | Centralisation des flux MIDI matériels/virtuels, protection anti-conflits, exclusion d'accès directs non autorisés. | `packages/midi-dispatch/` |

---

## 3. Nouvelles Intégrations Projetées (Feuille de Route Détaillée)

### A. Intégration Matérielle & Protocoles Avancés

#### 1. EP-133 K.O. II Deep SysEx Protocol & Sample Manager
- **Objectif** : Permettre le transfert bidirectionnel direct d'échantillons audio et de données de projet avec le EP-133 sans passer par un utilitaire tiers ni par le mode disque.
- **Spécifications Techniques** :
  - Parsing et encapsulation des trames SysEx spécifiques TE (`0xF0 0x00 0x20 0x76 ... 0xF7`).
  - Découpage en blocs de données (chunking de 256/512 octets) avec calcul de checksum et poignée de main ACK/NAK.
  - Conversion automatique des sources audio en format natif EP-133 (Mono 16-bit 46.875 kHz ou 44.1 kHz, compression ADPCM si requise).
  - Gestionnaire de mémoire visuel respectant le plafond strict de **64 Mo / 999 slots de samples**.
- **Composant Cible** : `packages/ep133-sysex/` & `apps/studio-hub/src/pages/EP133SampleManager.tsx`.

#### 2. WebUSB & Web Serial Universal Hardware Driver (Microcontrôleurs & Bancs de Test)
- **Objectif** : Interfacer l'atelier avec des cartes de développement (Teensy 4.1, ESP32-S3, Raspberry Pi Pico, Arduino) pour le contrôle physique, l'instrumentation et la conversion CV/Gate (Eurorack physique).
- **Spécifications Techniques** :
  - Abstraction `HardwareDriver` avec détection automatique de périphériques (VendorID/ProductID).
  - Protocole binaire compact / SLIP / COBS pour transmission haute vitesse (<2ms de latence).
  - Télémétrie bidirectionnelle : lecture de potentiomètres, encodeurs rotatifs, capteurs de tension et envoi de signaux de synchronisation (Triggers/Gates).
- **Composant Cible** : `packages/serial-bridge/` & `apps/studio-hub/src/core/hardware/`.

#### 3. Streamer d'Instructions CNC / Fabrication & E-Stop Prioritaire
- **Objectif** : Piloter des outils d'usinage légers (CNC de gravure PCB de façades, bancs de test optique) depuis le hub d'ingénierie.
- **Spécifications Techniques** :
  - Parser G-code avec validation de syntaxe et contrôle des limites d'axes (XYZ soft limits).
  - Buffer d'exécution avec régulation de flux (Ping-Pong / Character-Counting).
  - Bouton physique & virtuel **Emergency Stop (E-Stop)** à priorité absolue, injectant immédiatement la commande de neutralisation (`!`, `0x85`, ou reset matériel) hors de la file d'attente standard.
- **Composant Cible** : `apps/studio-hub/src/pages/MachiningStudio.tsx` & `packages/machine-control/`.

---

### B. Moteurs Audio, DSP & Live Coding

#### 4. Intégration Live-Coding Strudel / Algorithmes Génératifs
- **Objectif** : Fournir une interface de programmation musicale en direct basée sur la syntaxe Strudel (TidalCycles pour le web), connectée directement aux 15 moteurs du rack et aux sorties MIDI physiques.
- **Spécifications Techniques** :
  - Interpréteur de motifs rythmiques et polyrythmies euclidiennes en temps réel.
  - Synchronisation stricte sur l'horloge maître partagée (`packages/musique/divisions.ts` et `packages/rack-bus/transport.ts`).
  - Sortie commutable : déclenchement des oscillateurs DSP internes ou émission MIDI vers OP-1 / EP-133.
- **Composant Cible** : `apps/studio-hub/src/pages/StrudelLiveStudio.tsx`.

#### 5. Moteur DSP WebAssembly (WASM / Rust / C++)
- **Objectif** : Dépasser les limites de calcul CPU des AudioWorklets JS purs pour des émulations analogiques lourdes (filtres ladder Moog, saturation à transformateurs, réverbérations à convolution).
- **Spécifications Techniques** :
  - Pipeline de compilation modulaire vers WebAssembly SIMD.
  - Zero-copy buffer exchange entre l'audio thread et la mémoire WASM.
  - Analyseur de spectre FFT temps réel 4096 points et oscilloscope vectoriel à 60 FPS sans chute de trame.
- **Composant Cible** : `packages/audio-dsp-wasm/`.

---

### C. Collaboration & Écosystème Local-First

#### 6. Music-Git V2 & Synchronisation Temps Réel Multi-Postes
- **Objectif** : Pousser la collaboration musicale au niveau des standards du développement logiciel moderne (Pull Requests musicales, visualiseur de différences spectrales et de pistes).
- **Spécifications Techniques** :
  - Diffing visuel de pistes audio et de séquences MIDI (mise en évidence des notes ajoutées/supprimées).
  - Protocole de verrouillage de piste optimiste avec résolution non destructive des conflits de mixage.
  - Stockage par blocs adressables par contenu (Content-Addressed Audio Chunks) pour éviter la duplication des fichiers WAV volumineux lors des variations de mix.
- **Composant Cible** : `packages/music-git/` & `packages/p2p-collab/`.

#### 7. Horloge Maître Distribuée ultra-basse gigue (P2P Clock Sync)
- **Objectif** : Synchroniser le tempo (BPM), le départ/arrêt et le positionnement métrique entre plusieurs machines physiques et sessions navigateurs distantes via WebRTC.
- **Spécifications Techniques** :
  - Algorithme de compensation d'offset et de latence réseau (type NTP/PTP audio).
  - Gigue maximale tolérée : < 3 millisecondes.
- **Composant Cible** : `packages/rack-bus/p2p-clock.ts`.

---

## 4. Matrice de Priorisation & Jalons de Développement

```
JALON 1 (Court terme) ──► Stabilisation SysEx EP-133 & Export Direct de Patches OP-1
JALON 2 (Moyen terme) ──► Module Live Coding Strudel & Diffing Visuel Music-Git
JALON 3 (Long terme)  ──► Drivers WebSerial / Microcontrôleurs & DSP Wasm haute fidélité
```

### Critères d'Acceptation & Validation Rigoureuse
Pour que chaque nouvelle intégration soit déclarée terminée :
1. **Tests unitaires et d'intégration** : 100% de passage sur Vitest avec couverture complète des cas limites (payload corrompu, perte de connexion, mémoire pleine).
2. **Conformité TypeScript** : `tsc --noEmit` zéro erreur en mode strict.
3. **Documentation Vivante** : Enregistrement dans `docs/INDEX.md`, mise à jour du registre des pages `OrphanPages.tsx` et respect des garde-fous documentaires (`documentation.test.ts`).
4. **Vérification Matérielle** : Protocole documenté dans `docs/TESTS_PHYSIQUES.md` avec machine physique connectée et validation à l'oreille.
