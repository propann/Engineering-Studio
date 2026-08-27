# 🎛️ Étude Comparative & Spécification Live-Coding Strudel — Engineering Studio

**Auteur :** Lead Software Architect & Systems Engineer  
**Date :** 2026-08-26  
**Statut :** Spécification Technique de Référence & Étude Comparative  
**Cible :** Intégration dans le Rack Audio, P2P Jam & Routage MIDI Matériel (OP-1 / EP-133)

---

## 1. Contexte & Enjeux du Live-Coding Moderne

Le live-coding (musique algorithmique en direct) a émergé comme une discipline de performance majeure dans les scènes électroniques d'avant-garde (Algorave, Modular Live, ambient générative). **Strudel** est le portage Web moderne officiel de la syntaxe **TidalCycles** (conçue par Alex McLean).

Dans l'écosystème **Engineering Studio**, l'intégration d'un environnement Strudel répond à 3 besoins stratégiques :
1. **Pilotage génératif de nos racks DSP** : Envoyer des séquences polyrythmiques et micro-tonales complexes vers nos 15 moteurs audio (Plaits, Dexed FM, Open303, Rings).
2. **Contrôle matériel physique synchronisé** : Piloter simultanément les 9 pistes du **EP-133 K.O. II** et la bande 4 pistes du **OP-1** par flux Web MIDI horodatés à faible gigue.
3. **Collaboration P2P en temps réel** : Permettre à deux musiciens distants d'éditer le même code en direct tout en synchronisant leurs transports respectifs.

---

## 2. Étude Comparative des Approches d'Intégration Strudel

Nous avons analysé les 3 architectures possibles d'intégration pour garantir une exécution ultra-légère, réactive et un rendu visuel haut de gamme digne des professionnels.

| Critère | Approche A : iFrame Strudel Officiel | Approche B : Bundle `@strudel/core` + Web Audio Interne | Approche C : Interpréteur Pattern Léger (Mini-Tidal) |
| :--- | :--- | :--- | :--- |
| **Empreinte mémoire** | 🔴 Lourde (~45 Mo, iframe isolée, double AudioContext) | 🟡 Moyenne (~4 Mo bundle, réutilise notre Web Audio graph) | 🟢 Ultra-légère (< 250 Ko, parsing pur, 0 dépendance externe) |
| **Latence & Gigue** | 🔴 Variable (> 20 ms due au bridge postMessage) | 🟢 Précise (< 3 ms, synchronisée à notre Transport maître) | 🟢 Micro-seconde (synchrone avec `AudioContext.currentTime`) |
| **Look & Feel Visuel** | 🔴 Générique (UI standard Strudel externe) | 🟢 **Studio Pro Dark** (Monochrome, Vectoriel, Highlight réactif) | 🟢 **Sur-mesure** (Intégration totale au design system Studio) |
| **Routage Audio / MIDI** | 🔴 Limité (sortie audio navigateur standard) | 🟢 **Total** (Rack A, Rack B, Web MIDI OP-1/EP-133) | 🟢 **Total** (Routage direct vers notre `midi-dispatch` & DSP) |
| **Capacité Hors-Ligne** | 🔴 Dépendant de CDN externes | 🟢 **100% Local-First & Autonome** | 🟢 **100% Local-First & Autonome** |

### 🏆 Choix Retenu : Approche Hybride B/C (Moteur Mini-Notation Typé & Connecteur Web Audio / MIDI)
- **Cœur d'interprétation synchrone** : Support de la mini-notation TidalCycles (`s("bd sd, hh*4")`, `note("c3 eb3 g3 bb3").fast(2)`, `decay(0.2)`, `gain(0.8)`, `euclid(3, 8)`).
- **Routage multi-cibles** : Commutable à la volée entre les moteurs internes du Rack (Rack A Mélodique, Rack B Percussions/Basses) et les ports Web MIDI physiques (OP-1, EP-133).
- **Interface Visuelle Pro** : Éditeur dark theme haute lisibilité, mise en surbrillance en temps réel des pas joués (*step flash*), sélecteur de presets de performance (Techno berlinoise, Ambient euclidienne, Glitch breakbeat, Acid 303).

---

## 3. Architecture du Double Rack de Synthèse (Rack A & Rack B)

Afin d'optimiser la charge CPU et la clarté opérationnelle en live set, nous scindons l'univers des synthèses en **deux racks spécialisés interconnectés** :

```
                        ┌──────────────────────────────────────────────┐
                        │         HORLOGE MAÎTRE / TRANSPORT P2P       │
                        └──────────────┬───────────────────────────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 ▼                                           ▼
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│     RACK SYNTHÈSE A (Mélodie)   │         │    RACK SYNTHÈSE B (Rythme/Bas) │
│ - Mutable Plaits / Braids       │         │ - Open303 Acid Bass             │
│ - Mutable Rings (Modal Pluck)   │         │ - Dexed FM Percussions & Basses │
│ - Mutable Clouds (Granulaire)   │         │ - Mutable Elements (Percussif)  │
│ - Surge XT / Helm Wavetable     │         │ - Amy Engine / Faust Noise      │
│ - Bus Effets A (Chorus, Delay)  │         │ - Bus Effets B (Drive, Reverb)  │
└────────────────┬────────────────┘         └────────────────┬────────────────┘
                 │                                           │
                 └─────────────────────┬─────────────────────┘
                                       ▼
                        ┌─────────────────────────────┐
                        │      BUS MASTER & MIXEUR    │
                        │ - Crossfader A ◄──► B       │
                        │ - Limiteur / Brickwall DSP  │
                        │ - Export Direct / Bounce    │
                        └─────────────────────────────┘
```

---

## 4. Spécification de l'Identité Client & Fichier Clé (.studio-key)

Pour s'affranchir de toute dépendance à un serveur d'authentification centralisé tout en offrant une expérience utilisateur professionnelle :
1. **Génération d'Identité Cryptographique** : Paire de clés Ed25519 / WebCrypto générée côté client dès la première session.
2. **Empreinte & ShortID d'Artiste** : Calcul d'un identifiant lisible (ex: `ARTIST-7A2F`) avec avatar vectoriel déterministe.
3. **Fichier Clé Portable (`.studio-key`)** :
   - Fichier JSON sécurisé contenant : `alias`, `publicKeyHex`, `privateKeyHex` (ou seed cryptographique), `role`, `creationDate`, `signature`.
   - Boutons **"Exporter ma Clé Studio"** et **"Importer une Clé Existante"** directement dans la barre d'outils du Hub.
   - Les commits Music-Git sont automatiquement signés numériquement avec cette clé client.

---

## 5. Spécification du Mini-Chat & Partage Musical Temps Réel

Dans le studio collaboratif (`CollabStudio.tsx`) :
- **Canaux Thématiques** :
  - `#general` : Discussions globales de session et synchronisation.
  - `#stems` : Partage direct de fichiers stems audio (WAV/AIFF) transférés via WebRTC DataChannels en P2P direct.
  - `#mix-master` : Échanges sur les niveaux, EQ et retours d'écoute.
  - `#live-jam` : Journal des commandes Strudel et des déclenchements de motifs.
- **Partage Musical Intégré** :
  - Chaque message peut contenir une charge utile musicale (`MusicTrackLane`, `TrackPattern`, `PatchPreset` ou `StrudelSnippet`).
  - Un clic sur **"Pré-écouter"** joue le son immédiatement.
  - Un clic sur **"Injecter dans la Session"** ajoute instantanément la piste ou le motif dans la grille de travail sans recharger la page.
