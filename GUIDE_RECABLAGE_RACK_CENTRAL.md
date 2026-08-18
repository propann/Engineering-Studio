# 🔌 GUIDE DE RECÂBLAGE & D'INTÉGRATION DU RACK CENTRAL
## Manuel de Raccordement des Modules OP-1 & EP-133 K.O. II

**Auteur :** AI Engineering Studio  
**Date :** 18 août 2026  
**Branche cible :** `main`  
**Statut :** Guide Technique & Schéma de Câblage Canonique  

---

## 1. Schéma Général de Câblage (Wiring Diagram)

Le schéma ci-dessous illustre le recâblage propre des 5 bus d'échange principaux entre le **Châssis Central (Studio Hub)**, les **Packages Partagés** et les **Modules Spécialisés** :

```text
                               ┌──────────────────────────────────────────────┐
                               │       SYSTÈME DE FICHIERS LOCAL (FSA)        │
                               │  - shared/sounds/     - op1/backups/         │
                               │  - ep133/projects/    - ep133/samples/       │
                               └──────────────────────┬───────────────────────┘
                                                      │ [Bus FSA Direct]
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   STUDIO HUB (CHÂSSIS CENTRAL)                                  │
│                                                                                                 │
│  ┌─────────────────────────┐   ┌─────────────────────────┐   ┌───────────────────────────────┐  │
│  │  BUS STATE & PROFIL     │   │  BUS MASTER MIDI CLOCK  │   │   BUS SAUVEGARDE & VAULT      │  │
│  │ (studio-hub-profile)    │   │ (24 PPQN / Start / Stop)│   │ (SHA-256 / Integrity Check)   │  │
│  └────────────┬────────────┘   └────────────┬────────────┘   └───────────────┬───────────────┘  │
└───────────────┼─────────────────────────────┼────────────────────────────────┼──────────────────┘
                │                             │                                │
                │ [State Hydration]           │ [PostMessage / Web MIDI]       │ [Vault Direct]
                ▼                             ▼                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       PACKAGES PARTAGÉS                                         │
│                                                                                                 │
│      ┌───────────────────────────────────┐         ┌───────────────────────────────────┐        │
│      │     @studio-hub/midi-bridge       │         │     @studio-hub/audio-bridge      │        │
│      │  - buildMidiClockWindow()         │         │  - analyzeWavBuffer()             │        │
│      │  - buildMidiNotePacket()          │         │  - parseWavHeader()               │        │
│      │  - buildMidiPanicPackets()        │         │  - Formats mono AIFF 44.1k/16b    │        │
│      └─────────────────┬─────────────────┘         └─────────────────┬─────────────────┘        │
└────────────────────────┼─────────────────────────────────────────────┼──────────────────────────┘
                         │                                             │
                         ├──────────────────────────────┐              │
                         ▼                              ▼              ▼
┌─────────────────────────────────────────┐ ┌─────────────────────────────────────────────────────┐
│          RACK MODULES OP-1              │ │             RACK MODULES EP-133                     │
│  - Tape & Album Studio                  │ │  - Pattern & Song Studio                            │
│  - Patch & Synth Editor                 │ │  - Pads & Sound Manager (64 / 128 Mo)              │
│  - Sample Editor (WAV/AIFF)             │ │  - SysEx & Machine Test                             │
│  - Display Pixel Editor (320x160)       │ │  - Rhythm Hero (Finger Drumming Lab)                │
│  - Firmware Lab & Mods                  │ │  - Project Clone & Backup                           │
└─────────────────────────────────────────┘ └─────────────────────────────────────────────────────┘
```

---

## 2. Procédure de Recâblage Pas à Pas

### ÉTAPE 1 : Recâblage du Bus de Transport MIDI (Master Clock & PANIC)

Tous les modules du rack doivent écouter le Master MIDI Clock du Châssis Central plutôt que de réinitialiser leurs propres connexions Web MIDI.

#### Code à intégrer dans les modules consommateurs (OP-1 / EP-133) :

```typescript
// Importation du contrôleur unifié depuis le package partagé
import { 
  createHubTransportMessage, 
  createHubPanicMessage,
  HubTransportMessage,
  HubNoteMessage,
  HubPanicMessage 
} from "@studio-hub/midi-bridge";

// Écouteur de bus universel (PostMessage / BroadcastChannel)
export function connectModuleToMidiBus(onTransport: (action: string, bpm: number) => void) {
  const handleMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "hub-transport") {
      const msg = data as HubTransportMessage;
      onTransport(msg.action, msg.bpm);
    } else if (data.type === "hub-panic") {
      console.warn("PANIC général reçu du Châssis Central - Coupure audio");
      // Arrêt immédiat des voix synth/sample
    }
  };

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}
```

---

### ÉTAPE 2 : Recâblage des Services Audio (WAV & AIFF)

Remplacement des parseurs locaux par l'importateur canonique `@studio-hub/audio-bridge`.

#### Remplacement dans les éditeurs de samples :

```typescript
// ❌ ANCIEN : Import local dupliqué
// import { parseWav } from "../core/audio/wavAnalysis";

// ✅ NOUVEAU : Recâblage sur le package partagé
import { analyzeWavBuffer, parseWavHeader, WavAnalysisReport } from "@studio-hub/audio-bridge";

export async function processAudioSample(file: File): Promise<WavAnalysisReport> {
  const arrayBuffer = await file.arrayBuffer();
  const report = analyzeWavBuffer(arrayBuffer);
  
  console.log(`Echantillon analysé : ${report.sampleRate} Hz, ${report.bitDepth} bits, Stereo: ${report.isStereo}`);
  return report;
}
```

---

### ÉTAPE 3 : Recâblage de l'État & du Profil Utilisateur

L'état du profil (`AZOTH`), des machines enregistrées et des préférences est centralisé dans `localStorage.getItem("studio-hub-profile")`.

#### Hook de synchronisation inter-modules :

```typescript
import { useState, useEffect } from "react";

export interface StudioProfile {
  name: string;
  bio?: string;
  avatar?: string;
  workspace?: string;
  keyboardLayout?: "AZERTY" | "QWERTY";
}

export function useStudioProfile(): StudioProfile {
  const [profile, setProfile] = useState<StudioProfile>({ name: "AZOTH" });

  useEffect(() => {
    const loadProfile = () => {
      try {
        const raw = localStorage.getItem("studio-hub-profile");
        if (raw) setProfile(JSON.parse(raw));
      } catch {
        // Fallback local par défaut
      }
    };

    loadProfile();
    window.addEventListener("storage", loadProfile);
    return () => window.removeEventListener("storage", loadProfile);
  }, []);

  return profile;
}
```

---

### ÉTAPE 4 : Recâblage du Dossier de Travail Local (File System Access)

Le Châssis Central vérifie et maintient la structure des sous-dossiers locaux :

```text
/MonDossierAtelier/
├── shared/
│   └── sounds/        <-- Stock de samples partagés
├── op1/
│   ├── backups/       <-- Snapshots Tape & Synth OP-1
│   └── projects/      <-- Fichiers projets OP-1
└── ep133/
    ├── projects/      <-- Projets P01-P99 EP-133
    └── samples/       <-- Sons et banques EP-133
```

#### Fonction de vérification et d'initialisation des sous-dossiers :

```typescript
export async function verifyWorkspaceStructure(rootHandle: FileSystemDirectoryHandle) {
  const requiredDirs = [
    "shared/sounds",
    "op1/backups",
    "op1/projects",
    "ep133/projects",
    "ep133/samples"
  ];

  for (const path of requiredDirs) {
    const segments = path.split("/");
    let current = rootHandle;
    for (const seg of segments) {
      current = await current.getDirectoryHandle(seg, { create: true });
    }
  }
  return true;
}
```

---

## 3. Matrice de Test & Validation du Recâblage

Avant d'envoyer toute mise à jour de module en production, valider la check-list suivante :

| Étape de Test | Procédure de Vérification | Résultat Attendu |
|---|---|---|
| **1. Horloge MIDI** | Démarrer le transport (120 BPM) dans le Hub | Les modules reçoivent `start` et les ticks 24 PPQN sans décalage |
| **2. Bouton PANIC** | Déclencher le PANIC dans le Hub | Envoi immédiat des CC 123/121 et coupure des voix sur OP-1 & EP-133 |
| **3. Analyse Audio** | Glisser un fichier WAV 44.1kHz / 16bit | Détection exacte de la durée, fréquence et compatibilité OP-1/EP-133 |
| **4. Profil Utilisateur** | Modifier le profil (`AZOTH` → `STUDIO-01`) | Mise à jour instantanée dans la TopBar et tous les modules ouverts |
| **5. Espace de Travail** | Sélectionner un dossier local via FSA | Création automatique des sous-dossiers `shared/`, `op1/`, `ep133/` |
| **6. Coffre SHA-256** | Effectuer un snapshot sélectif | Empreinte SHA-256 identique entre la source et la copie vérifiée |

---

## 4. Bilan & Invariants de Recâblage

1. **Aucun Import Circulaire** : Les modules dépendent des packages (`packages/*`), mais les packages ne dépendent jamais des applications.
2. **Gestion Propre des Exceptions** : En cas de déconnexion MIDI ou de refus de permission FSA, le module repasse silencieusement en mode déconnecté sans bloquer l'UI.
3. **Compatibilité Vient de l'Index** : Le serveur racine sur le port 3000 distribue l'ensemble des modules sans rupture de lien ni erreur de chemin relative.
