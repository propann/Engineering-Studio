# 🚀 PLAN MASTER DE TRANSFORMATION DU RACK CENTRAL
## Blueprint d'Architecture, Spécification Complète et Manuel de Développement pour Codex & Équipe IA

**Auteur :** AI Engineering Studio  
**Date :** 18 août 2026  
**Branche canonique :** `main`  
**Public cible :** Développeurs, Agents IA (Codex, Claude, etc.)  
**Statut :** Document Maître d'Architecture & Guide de Programmation Officiel  

---

## 1. Vision Unifiée & Architecture du Rack Central

Le projet **Studio Hub** transforme trois applications historiquement séparées (`apps/studio-hub`, `apps/op1-studio`, `apps/ep133-studio`) en une **Suite Logicielle Modulaire Unifiée en Rack ("Rack-and-Module")**.

Le **Châssis Central (Studio Hub)** s'exécute sur le **Port 3000** unique. Il héberge la barre de contrôle, la Master Clock MIDI 24 PPQN, le coffre de sauvegarde SHA-256 (*Vault*), la bibliothèque sonore centrale et le gestionnaire d'Espace de Travail (*Workspace File System Access*).

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   STUDIO HUB (CHÂSSIS CENTRAL)                                 │
│  - TopBar & Profil ("AZOTH")                           - Master MIDI Clock (24 PPQN, BPM, PANIC)│
│  - Vault SHA-256 & Snapshots                           - Workspace Local (FSA API)             │
└───────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
┌──────────────────────────────────────────────┐              ┌──────────────────────────────────┐
│          RACK MODULES OP-1 ORIGINAL          │              │      RACK MODULES EP-133 KO II   │
│  - Tape & Album Studio (4 pistes)            │              │  - Pattern & Song Studio         │
│  - Patch & Synth Editor (9 moteurs)          │              │  - Pads & Memory Manager (64/128M)│
│  - Sample & Drum Editor (AIFF 44.1k/16b)     │              │  - SysEx & Machine Test          │
│  - OLED Display & Pixel Creator (320x160)    │              │  - Rhythm Hero (Finger Drumming) │
│  - Firmware Lab & Mods                       │              │  - Project Clone & Transfer      │
│  - Keyboard & Chord Training                 │              └──────────────────────────────────┘
└──────────────────────────────────────────────┘
```

---

## 2. Les 3 Principes Inviolables de Développement

Pour garantir la simplicité de développement, la stabilité du code et la sécurité du matériel :

1. **Zero-Cloud Mandatory (Local-First Strict)** :  
   Toutes les données (profils, projets, samples, sauvegardes) restent stockées localement sur le disque de l'utilisateur via l'API *File System Access* ou `localStorage`. Aucun serveur externe n'est requis.
2. **Safety-First (Sécurité Matérielle Absolue)** :  
   Aucune écriture sur le volume de la machine physique (OP-1 ou EP-133) ne s'effectue sans :
   - Un **checkpoint SHA-256** préalable dans le Coffre (*Vault*).
   - Un **Plan de Transfert** explicite affiché à l'écran.
   - Une **confirmation manuelle** de l'utilisateur (`--confirm`).
3. **Modularité & Zéro-Doublon** :  
   Les traitements lourds (audio, MIDI, calcul d'empreinte SHA-256) résident exclusivement dans les packages partagés (`@studio-hub/audio-bridge` et `@studio-hub/midi-bridge`). Aucun module ne doit réécrire son propre parseur audio ou MIDI.

---

## 3. Spécification Détaillée des Blocts d'Applications

### BLOC A : CHÂSSIS CENTRAL (`apps/studio-hub`)
* **Role** : Hôte principal de l'application, serveur Vite sur le port 3000, routage dynamique des vues, gestion de l'état global et du Master Clock MIDI.
* **Composants Clés** :
  * `App.tsx` : Routeur central et gestionnaire d'état Zustand.
  * `MidiSyncPanel.tsx` : Générateur d'horloge 24 PPQN, contrôle de BPM (40–240 BPM), routage de notes et bouton d'urgence PANIC.
  * `VaultPanel.tsx` : Moteur de sauvegarde différentielle avec vérification d'intégrité SHA-256.
  * `SoundLibraryPanel.tsx` : Catalogue sonore unifié, import drag-and-drop, préécoute audio et détection de doublons.
  * `ProfileCreator.tsx` : Gestion du profil utilisateur (`AZOTH`), choix du répertoire d'Atelier local et disposition clavier (`AZERTY` / `QWERTY`).

### BLOC B : MODULES OP-1 ORIGINAL (`apps/op1-studio`)
* **Role** : Suite d'outils pour l'OP-1 original (écran OLED 320x160, synthétiseurs, Tape 4 pistes, Album, firmwares).
* **Modules Intégrés** :
  1. `StudioTapeEditor.tsx` : Manipulation des 4 pistes Tape, export Stems et Album en **AIFF Mono 44.1 kHz / 16 bits**.
  2. `SoundControlsPanel.tsx` : Édition des 9 moteurs de synthèse (`Cluster`, `Digital`, `DNA`, `Dr Wave`, `FM`, `Phase`, `Pulse`, `String`, `Synth`).
  3. `SampleEditorPanel.tsx` : Éditeur de formes d'ondes, tracé de boucles, découpe de kits de batterie et export AIFF.
  4. `Op1PixelEditor.tsx` & `DisplayCreatorPanel.tsx` : Créateur d'images au format natif 320 × 160 pixels et thématisation.
  5. `FirmwareSubtabs.tsx` : Catalogue de mods (Iter, Filter, thèmes), contrôle CRC/LZMA/TAR et plan de build sécurisé.
  6. `ExercisePanel.tsx` : Module d'apprentissage avec descente de notes, jugement du timing et score.

### BLOC C : MODULES EP-133 K.O. II (`apps/ep133-studio`)
* **Role** : Suite d'outils pour le sampler/séquenceur EP-133 K.O. II (64/128 Mo, 99 projets, SysEx, 32 pads).
* **Modules Intégrés** :
  1. `PatternSongStudio` : Grille d'édition des groupes A/B/C/D, séquenceur de scènes et rangement de morceaux.
  2. `PadSoundManager` : Assignation des 99 emplacements de sons sur les 12 pads avec jauge mémoire 64 Mo / 128 Mo.
  3. `SysExObserver` : Diagnostic de communication bidirectionnelle MIDI SysEx et état des groupes.
  4. `RhythmHero` : Jeu d'entraînement au finger drumming sur pads avec partitions animées et détection MIDI.
  5. `ProjectCloner` : Extraction et restauration ciblée de projets (P01–P99) avec sauvegarde préalable.

### BLOC D : PACKAGES PARTAGÉS (`packages/*`)
* **`@studio-hub/midi-bridge`** :
  * `createHubTransportMessage(action, bpm)` : Message de transport universel.
  * `createHubPanicMessage()` : Signal d'urgence coupant toutes les voix synth/sample.
  * `buildMidiClockWindow(bpm)` : Ticks d'horloge à 24 Pulses Per Quarter Note (PPQN).
* **`@studio-hub/audio-bridge`** :
  * `analyzeWavBuffer(arrayBuffer)` : Analyse du taux d'échantillonnage, bitrate, durée et écrêtage.
  * `parseWavHeader(buffer)` : Décodage rapide d'en-tête WAV/AIFF.

---

## 4. Manuel de Développement pour Codex & Les Développeurs

Pour ajouter ou modifier un module dans le Rack Central, suivre ces 4 étapes simples :

### Étape 1 : Créer ou Éditer un Composant Module
Placer les composants du module sous `apps/studio-hub/src/pages/` ou `apps/studio-hub/src/components/`.

### Étape 2 : Connecter le Module au Bus Master MIDI
Tout module nécessitant la synchronisation tempo ou la coupure audio doit inclure ce bloc de code :

```typescript
import { useEffect } from "react";
import { HubTransportMessage } from "@studio-hub/midi-bridge";

export function useMidiTransport(onTransport: (action: string, bpm: number) => void) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "hub-transport") {
        const msg = event.data as HubTransportMessage;
        onTransport(msg.action, msg.bpm);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onTransport]);
}
```

### Étape 3 : Utiliser le Traitement Audio Partagé
Tout import ou conversion audio doit faire appel au package partagé :

```typescript
import { analyzeWavBuffer } from "@studio-hub/audio-bridge";

export async function checkSampleConformity(file: File) {
  const buffer = await file.arrayBuffer();
  const report = analyzeWavBuffer(buffer);
  
  // Vérification du format strict OP-1 / EP-133 (44100 Hz, 16 bits)
  const isConform = report.sampleRate === 44100 && report.bitDepth === 16;
  return { isConform, report };
}
```

### Étape 4 : Raccorder au Coffre SHA-256 (*Vault*)
Avant toute écriture ou modification de projet, enregistrer l'état dans le coffre :

```typescript
import { childDirectory, permission } from "../VaultPanel";

export async function createProjectBackup(workspaceHandle: FileSystemDirectoryHandle, machineName: "op1" | "ep133") {
  await permission(workspaceHandle, "readwrite");
  const backupsDir = await childDirectory(workspaceHandle, `${machineName}/backups`, true);
  const snapshotId = `${machineName}_snapshot_${Date.now()}`;
  const snapshotDir = await backupsDir.getDirectoryHandle(snapshotId, { create: true });
  return snapshotDir;
}
```

---

## 5. Guide de Validation & Check-list avant Pull Request

Avant de fusionner tout code sur `main`, exécuter et valider la séquence suivante :

```bash
# 1. Verification de la compilation TypeScript globale
npm run lint

# 2. Verification du build unifie sur le Port 3000
npm run build
```

### Grille d'Évaluation de la Pull Request :
- [ ] Le code compile sans avertissement ni erreur TypeScript (`tsc --noEmit`).
- [ ] Les imports audio/MIDI utilisent exclusivement `@studio-hub/audio-bridge` et `@studio-hub/midi-bridge`.
- [ ] Le module réagit correctement aux messages de transport Master MIDI Clock (`hub-transport`).
- [ ] Aucune écriture physique sur machine ne s'exécute sans confirmation explicite (`--confirm`).
- [ ] La documentation du module a été mise à jour dans `INDEX.md`.

---

## Conclusion

Grâce à ce **Plan Master de Transformation**, le développement de la suite **Studio Hub** devient totalement modulaire, fluide et prévisible. Codex, Claude et l'ensemble des développeurs disposent d'un cadre technique rigoureux pour faire évoluer le **Rack Central** en toute sécurité.
