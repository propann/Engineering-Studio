# 🎹 SPÉCIFICATION TECHNIQUE ET DOSSIER DU MODULE OP-1 STUDIO
## Guide de Programmation & Fiche de Transposition pour Codex / Équipe Dev

**Auteur :** AI Engineering Studio  
**Date :** 18 août 2026  
**Branche cible :** `main`  
**Destinataire principal :** Codex & Équipe Développement  
**Statut :** Spécification Fonctionnelle & Technique Validée  

---

## 1. Vision Fonctionnelle & Rôle du Module OP-1 Studio

Le module **OP-1 Studio** regroupe l'ensemble des outils dédiés au synthétiseur/sampler **Teenage Engineering OP-1 original** au sein du **Rack Central (Studio Hub)**.

sa philosophie est résumée par la règle :  
> *"L'interface montre exactement ce qu'elle va faire avant d'agir. Le bouton ne porte pas de cape."*

Le module est découpé en **6 sous-modules spécialisés** interagissant directement avec le Châssis Central via le bus MIDI maître, l'API *File System Access* (FSA) et le coffre de sauvegarde SHA-256.

---

## 2. Cartographie Détaillée des 6 Sous-Modules OP-1 Studio

### `MOD-OP1-01` — Tape & Album Studio
* **Composants source** : `StudioTapeEditor.tsx`, `StudioTapeScreen.tsx`, `StudioTrackList.tsx`, `StudioTransportPanel.tsx`.
* **Fonctionnalités** :
  * Emulation visuelle des **4 pistes de la bande OP-1** (Tape).
  * Transport synchrone (Play, Pause, Rec, Loop, BPM, Marker).
  * Piano-Roll MIDI éditable et quantifiable.
  * Moteur de rendu audio offline (Web Audio API).
  * Export des **Stems** (`track_1.aif`..`track_4.aif`) et de l'**Album** (`side_a.aif`, `side_b.aif`) au format strict **AIFF Mono 44.1 kHz / 16 bits**.

### `MOD-OP1-02` — Patch & Synth Engine Editor
* **Composants source** : `SoundControlsPanel.tsx`, `SoundsPanel.tsx`.
* **Fonctionnalités** :
  * Inspection et édition des paramètres des **9 moteurs de synthèse OP-1** :
    * `Cluster`, `Digital`, `DNA`, `Dr Wave`, `FM`, `Phase`, `Pulse`, `String`, `Synth`.
  * Gestion des enveloppes ADSR, des filtres, des LFO et des effets (Cower, Phone, Nitro, Grid, Spring).
  * Affichage des paramètres sous forme de boutons rotatifs aux couleurs officielles (Bleu, Ocre, Vert, Blanc).

### `MOD-OP1-03` — Sample & Drum Kit Editor
* **Composants source** : `SampleEditorPanel.tsx`, `WaveformMarkers.tsx`, `SoundPadGrid.tsx`.
* **Fonctionnalités** :
  * Forme d'onde interactive avec marqueurs de début/fin (*Start / End*), points de boucle (*Loop*) et points d'attaque (*Slice* pour les kits de batterie).
  * Préflight de conformité audio : vérification du taux d'échantillonnage, écrêtage, durée et canaux.
  * Conversion locale vers le format natif AIFF mono 44.1 kHz / 16 bits avec métadonnées JSON intégrées au chunk `APPL`.

### `MOD-OP1-04` — OLED Display 320×160 & Pixel Editor
* **Composants source** : `DisplayCreatorPanel.tsx`, `Op1PixelEditor.tsx`.
* **Fonctionnalités** :
  * Rendu et tri des **61 écrans SVG officiels** du firmware OP-1.
  * **Créateur de dessin original** : Canevas 320 × 160 pixels avec palette machine stricte (Noir, Blanc, Bleu, Orange/Rouge).
  * **Éditeur Pixel non destructif** : Retouche pixel par pixel avec prévisualisation isolée.
  * **Mode Thème Global** : Recoloration dynamique et cohérente de toutes les fenêtres compatibles.

### `MOD-OP1-05` — Firmware Lab & Mods
* **Composants source** : `FirmwareSubtabs.tsx`.
* **Fonctionnalités** :
  * Catalogue de mods documentés (moteurs cachés *Iter* & *Filter*, adoucissement FX, thèmes graphiques).
  * Inspection d'intégrité de fichier `.op1` (contrôle CRC, LZMA, TAR, SHA-256).
  * Plan en 4 étapes : *Source → Mods → Contrôles → Export*.
  * **Sécurité absolue** : Aucune écriture automatique ou flashage direct de la machine via le navigateur.

### `MOD-OP1-06` — Keyboard & Chord Training Lab
* **Composants source** : `ExercisePanel.tsx`, `KeyboardEditor.tsx`.
* **Fonctionnalités** :
  * Écran de notes qui tombent aligné colonne par colonne avec le clavier physique de l'OP-1.
  * 4 modes d'entraînement : *Drumkit*, *Mélodie*, *Suite d'accords*, *Import de fichier MIDI*.
  * Détection physique de disposition de clavier ordinateur (**AZERTY / QWERTY**) basée sur la position physique des touches (KeyCodes).
  * Calcul de score, timing et progression locale.

---

## 3. Formats de Fichiers & Contrats de Données OP-1

Codex et les développeurs doivent strictement respecter la structure des fichiers de l'OP-1 :

```text
/Volumes/OP-1 Disk/
├── synth/
│   ├── user/           <-- Patches de synthétiseur (.aif avec chunk JSON)
│   └── 1.aif .. 8.aif
├── drum/
│   ├── user/           <-- Patches de batterie 24 slices (.aif)
│   └── 1.aif .. 8.aif
├── tape/
│   ├── track_1.aif     <-- Piste 1 Tape (AIFF 44.1kHz / 16bit)
│   ├── track_2.aif     <-- Piste 2 Tape
│   ├── track_3.aif     <-- Piste 3 Tape
│   └── track_4.aif     <-- Piste 4 Tape
└── album/
    ├── side_a.aif      <-- Face A Album
    └── side_b.aif      <-- Face B Album
```

### Contrat du Chunk JSON d'un Patch OP-1 (dans le fichier `.aif`) :
```json
{
  "op1_patch": {
    "type": "synth",
    "synth_type": "cluster",
    "fx_type": "nitro",
    "lfo_type": "element",
    "octave": 0,
    "synth_params": [8192, 12000, 4000, 16384],
    "fx_params": [1000, 8000, 0, 0],
    "lfo_params": [0, 0, 0, 0],
    "envelope_params": [0, 8000, 16384, 4000]
  }
}
```

---

## 4. Guide de Programmation pour Codex (Besoins & Tâches)

Afin de finaliser l'intégration d'OP-1 Studio dans le Rack Central, Codex doit exécuter les 5 tâches suivantes :

### TÂCHE 1 : Raccorder le Moteur Tape au Master MIDI Transport
* **Fichier cible** : `apps/studio-hub/src/pages/SoundEditorHub.tsx` / `apps/op1-studio/app/components/StudioTransportPanel.tsx`.
* **Action** : S'abonner aux événements `hub-transport` émises par `@studio-hub/midi-bridge`.
* **Règle** : Quand le Hub émet `action === "start"`, le Tape OP-1 démarre sa lecture synchrone au BPM spécifié.

### TÂCHE 2 : Raccorder le Convertisseur Audio au Package Partagé
* **Fichier cible** : `apps/op1-studio/app/components/SampleEditorPanel.tsx`.
* **Action** : Remplacer l'appel local à `audioOracle` par :
  ```typescript
  import { analyzeWavBuffer } from "@studio-hub/audio-bridge";
  ```
* **Règle** : Valider que tout sample importé qui n'est pas en 44.1 kHz mono est signalé avec une option de conversion en un clic.

### TÂCHE 3 : Raccorder la Sauvegarde OP-1 au Coffre Hub SHA-256 (`HUB-CORE-03`)
* **Fichier cible** : `apps/op1-studio/app/components/BackupPanel.tsx`.
* **Action** : Utiliser la méthode `collectFiles()` et `childDirectory()` de `VaultPanel.tsx` pour créer un snapshot de la structure Disk Mode OP-1 sous `op1/backups/snapshot_<timestamp>/`.
* **Règle** : Chaque snapshot génère un manifeste JSON avec le hash SHA-256 de chaque fichier.

### TÂCHE 4 : Unifier le Profil Utilisateur & Clavier
* **Fichier cible** : `apps/op1-studio/app/components/LocalProfilePanel.tsx` et `ExercisePanel.tsx`.
* **Action** : Lire le profil depuis `localStorage.getItem("studio-hub-profile")`.
* **Règle** : Si l'utilisateur a configuré son clavier en `AZERTY` dans le Hub, le module Exercices utilise automatiquement les KeyCodes physiques `KeyQ` / `KeyW` / `KeyE`.

### TÂCHE 5 : Valider le Mode Web Sans Bridge Python Obligatoire
* **Action** : S'assurer que le mode Web (navigateur pur) propose des alternatives JS/Wasm pour la vérification d'images et la prévisualisation SVG quand les scripts Python locaux ne sont pas exécutés.

---

## 5. Règle d'Inviolabilité & Sécurité Matérielle

1. **Aucune Écriture Masquée** : L'interface ne doit jamais lancer de copie ou d'effacement de fichier vers un volume monté OP-1 sans présenter un **Plan de Transfert** explicite indiquant :
   - Fichiers sources.
   - Fichiers cibles.
   - Empreinte SHA-256 avant / après.
2. **Confirmation obligatoire** : Bouton de validation explicite exigeant un clic intentionnel du utilisateur.
3. **Maintien du Checkpoint** : En cas d'échec de transfert, le coffre permet la restauration du snapshot précédent en un clic.
