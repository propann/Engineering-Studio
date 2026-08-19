# 📐 Audit Technique et Documentation d'Architecture — Suite Teenager Engineering EP-133 & OP-1 (v1.0)

## 1. Vision et Objectif de la Suite
Cette suite logicielle modulaire est conçue pour piloter et enrichir l'expérience des instruments **Teenage Engineering OP-1 (Original)** et **EP-133 K.O. II**. Elle offre un atelier complet en local (Web-first) combinant :
- Le contrôle MIDI & SysEx temps réel
- La gestion et la préparation des banques de sons (WAV / AIFF PCM 16-bit 44.1kHz / 46.875kHz)
- L'édition de motifs (Patterns, Songs, Grids, Piano Roll)
- La sauvegarde et restauration sécurisée (snapshots SHA-256)
- La personnalisation graphique (écrans 320×160 et thèmes)
- Le perfectionnement du jeu aux pads (Rhythm Hero & exercices d'accords)

---

## 2. Architecture Globale du Monorepo

```
.
├── apps/
│   ├── studio-hub/          # Application hôte centrale (Hub Single-Page Application)
│   ├── ep133-studio/        # Application Studio EP-133 K.O. II complète
│   └── op1-studio/          # Application Studio OP-1 (Original) complète
├── packages/
│   ├── audio-bridge/        # Moteur partagé d'analyse audio, formes d'onde & trim
│   └── midi-bridge/         # Pont partagé WebMIDI, horloge 24-PPQN, Panic & cache Hub
└── package.json             # Workspace npm unifié
```

---

## 3. Analyse et Déduplication des Composants Partagés

### 🔊 Package Audio Partagé (`@studio-hub/audio-bridge`)
Auparavant, chaque application redéfinissait ses propres structures de calcul WAV/AIFF. L'audit a permis de centraliser dans `packages/audio-bridge` :
- **`analyzeWavBuffer` & `parseWavFormat`** : Analyse des en-têtes PCM (44.1 kHz / 46.875 kHz), détection stéréo/mono et durée exacte.
- **`computeWaveformPeaks`** : Génération uniforme des min/max/values pour l'affichage des formes d'onde audio.
- **`detectSilenceTrim`** : Détection automatique des silences de début et fin de sample.
- **`readSignedSample` & `suggestNormalizationGainDb`** : Lecture des échantillons signés 8/16/24/32 bits et calcul de gain de normalisation.

### 🎛️ Package MIDI Partagé (`@studio-hub/midi-bridge`)
- **Transport & Horloge 24 PPQN** : Format d'événement unifié pour `start`, `stop`, `continue`, `clock`.
- **Note-On / Note-Off & Velocity** : Normalisation du routage entre le contrôleur virtuel et les machines physiques.
- **Panic MIDI** : Envoi groupé des commandes CC 123 (All Notes Off) et CC 121 (Reset Controllers) sur les 16 canaux.
- **Cache & Profil Unifié** : Clés `HUB_CACHE_KEYS` pour la synchronisation fluide du profil joueur et des préférences entre le Hub et les Studios.

---

## 4. Bilan et Audit des Applications

| Application | Statut Intégration | Composants Clés & Fonctionnalités |
| :--- | :--- | :--- |
| **Studio Hub** | **Inclus (Hôte)** | Navigation globale, atelier profil, gestionnaire d'outils, documentation FR/EN/ES, Sound Library locale. |
| **EP-133 Studio** | **Intégré à 100%** | RhythmGrid, PianoRoll, SongArranger (A/B/C/D), PadStrip, gestion mémoire 64/128 Mo, Test SysEx, Rhythm Hero. |
| **OP-1 Studio** | **Intégré à 100%** | Tape & Album Studio 4-pistes, Firmware Lab & Mods, Sauvegardes SHA-256, Éditeur Pixel 320x160, Services OP-1. |

---

## 5. Prochaines Étapes Rapprochées (Pistes d'Affinement Visuel)
1. **Micro-Ajustements UI/UX** : Continuer d'ajuster le CSS et la disposition au pixel près pour coller exactement à l'esthétique originale de l'interface Teenage Engineering.
2. **Harmonisation des Palettes** : Consolider les variables CSS de couleurs (Orange EP-133 `#ff5500`, Gris OP-1 `#e6e6e6`) dans une feuille de style partagée.
3. **Optimisation Web Audio** : Partager le contexte d'écoute audio singleton lors des transitions entre le Hub et les Studios.
