# 🎛️ Audio Plugin Rack - Studio Hub

Un **rack audio logiciel professionnel** avec 15 moteurs de synthèse intégrés (Mutable Instruments Eurorack + synthétiseurs open source de référence).

> **Status**: ✅ **Production Ready** — Service stable, entièrement fonctionnel

---

## 🚀 Démarrage Rapide (60 secondes)

### Pré-requis
- **Node.js** 22+ et **npm** 10+
- Port 3000 disponible

### Lancer le Rack

```bash
# 1. Cloner et installer
git clone <repo>
cd Engineering-Studio
npm ci

# 2. Démarrer le service
cd apps/studio-hub
npm run dev

# ✅ Le rack est prêt !
# → http://localhost:3000/
```

**C'est tout !** Le service démarre en ~200ms. Une seule application, un seul port, zéro configuration.

---

## 🎹 Qu'est-ce que c'est ?

### Architecture
```
┌─────────────────────────────────────────────────────┐
│         AUDIO PLUGIN RACK (studio-hub)              │
│                  React + Vite                        │
│                   Port 3000                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🎹 15 Moteurs de Synthèse                          │
│  📋 75+ Presets (Factory + User)                    │
│  🎼 MIDI Bridge (Master Clock 24 PPQN)             │
│  🔊 Web Audio API (Real-time synthesis)            │
│                                                      │
│  OP-1 & EP-133 Integration Support                 │
│  Firmware Labs & Theme Editors                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Moteurs de Synthèse (15)

**Mutable Instruments Eurorack Suite (5)**
| Moteur | Type | Spécialité |
|--------|------|-----------|
| **Plaits** | Multi-engine | 6 modes (VA, FM, WT, Granular, Speech, Chord) |
| **Braids** | Oscillator | CS-80 SAW, Wavetable, Vowel, Bell, Sub |
| **Rings** | Resonator | Modal synth (String, Tube, Plate) |
| **Clouds** | Granular FX | Pitch-shift, Time-stretch, Ambient reverb |
| **Elements** | Physical Model | Strike/bow excitation, modal synthesis |

**Top 10 Open Source Engines (10)**
| Moteur | Type | Spécialité |
|--------|------|-----------|
| **Dexed FM** | FM Synth | DX7-style synthesis |
| **Surge XT** | Wavetable | 50+ oscillators, morphing |
| **ZynAddSubFX** | Additive | 32 harmonics, resonant filters |
| **Helm** | Subtractive | Crossmod, LFO modulation |
| **FluidSynth** | SoundFont | Piano, strings, drums |
| **AMSynth** | Analog Model | Oscillator + filter synthesis |
| **Amy Engine** | FM/Additive | 24-voice polyphony |
| **PL Synth** | Polyphonic | Real-time synthesis |
| **Open303** | Acid | TB-303 emulation |
| **FAUST DSP** | Functional | DSP language synthesis |

### Bibliothèque de Presets

**75+ Presets Factory**
- Leads, Bass, Pads, Bells, Percussion, FX, Ambient, Keys, Vocals, Brass, etc.
- Chaque moteur : 5-6 presets optimisés
- Catégorisés par type sonore

**Système de Patch User**
- Créer, sauvegarder, charger des patches
- Paramètres persistants
- Export/import (en dev)

---

## 📂 Structure du Projet

```
Engineering-Studio/
├─ apps/
│  └─ studio-hub/              ← Service principal (Vite + React)
│     ├─ src/
│     │  ├─ pages/
│     │  │  ├─ AudioPluginRack.tsx    (Rack UI + 15 engines)
│     │  │  ├─ SoundEditorHub.tsx
│     │  │  ├─ Landing.tsx
│     │  │  └─ ... (autres pages)
│     │  ├─ components/
│     │  │  └─ TopBar.tsx
│     │  ├─ App.tsx              (Router principal)
│     │  └─ main.tsx             (Entry point React)
│     ├─ vite.config.ts         (Avec aliases @studio-hub/*)
│     └─ package.json
│
├─ packages/                    (Librairies partagées)
│  ├─ audio-bridge/             (Audio processing)
│  │  ├─ index.ts
│  │  └─ logger.ts
│  └─ midi-bridge/              (MIDI routing)
│     └─ index.ts
│
├─ docs/                        (Documentation)
│  ├─ README_RACK.md           ← Documentation technique
│  ├─ STARTUP_GUIDE.md         ← Guide de démarrage détaillé
│  ├─ QUICK_START.md           ← TL;DR
│  ├─ STATUS.md                ← État du projet
│  └─ ... (autres guides)
│
└─ .git/                        (Repository)
```

---

## ⚙️ Configuration

### vite.config.ts (Important)
```typescript
// Path aliases pour les imports
resolve: {
  alias: {
    "@studio-hub/midi-bridge": "../../packages/midi-bridge/index.ts",
    "@studio-hub/audio-bridge": "../../packages/audio-bridge/index.ts",
  },
},

// Dev server
server: { 
  host: "0.0.0.0", 
  port: 3000, 
  strictPort: false 
}
```

### Package.json (Root)
```json
{
  "type": "module",
  "scripts": {
    "dev": "cd apps/studio-hub && npm run dev"
  },
  "dependencies": {
    "react": "^19.2.8",
    "tone": "^15.1.22",
    "wavesurfer.js": "^7.12.11",
    "zustand": "^5.0.15"
  }
}
```

---

## 🎮 Utilisation

### Lancer le Rack
```bash
npm run dev
# ou manuellement:
# cd apps/studio-hub && npm run dev
```

### Accéder à l'interface
- **Local**: http://localhost:3000/
- **Réseau**: http://<your-ip>:3000/

### Interface Utiliselle
1. **Landing** → Page d'accueil
2. **Tools Hub** → Sélecteur de fonctions
3. **Audio Plugin Rack** → Interface synthétiseur
   - Sélectionner un moteur (15 choix)
   - Charger un preset ou créer un custom
   - Jouer au clavier MIDI ou souris
   - Exporter le patch

---

## 🔧 Commandes npm

```bash
# Développement
npm run dev          # Lancer le Rack (port 3000)
npm run build        # Build pour production
npm run preview      # Tester la build
npm run typecheck    # Vérifier les types TypeScript
npm run lint         # Linting (TypeScript)
```

---

## 📋 Dépendances Principales

| Package | Version | Rôle |
|---------|---------|------|
| React | 19.2.8 | Framework UI |
| Vite | 8.2.1 | Build tool |
| TypeScript | 5.9.3 | Type safety |
| Tone.js | 15.1.22 | Web Audio API |
| WaveSurfer.js | 7.12.11 | Audio visualization |
| Zustand | 5.0.15 | State management |

---

## 🧹 Setup Complet (Détaillé)

### 1. Cloner le repo
```bash
git clone https://github.com/your-org/Engineering-Studio.git
cd Engineering-Studio
```

### 2. Installer les dépendances
```bash
npm ci  # Utilise le package-lock.json exact
```

### 3. Lancer le dev server
```bash
npm run dev
```

### 4. Attendre le démarrage (~200ms)
```
  VITE v8.2.1  ready in 208 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.2.59:3000/
```

### 5. Ouvrir dans le navigateur
```
http://localhost:3000/
```

**C'est prêt !** Aucune autre configuration nécessaire.

---

## 🐛 Troubleshooting

### Erreur: "Cannot find module @studio-hub/audio-bridge"
**Solution**: Les aliases sont configurés dans `vite.config.ts`. Vérifiez que:
```bash
ls packages/audio-bridge/index.ts    # Doit exister
ls packages/midi-bridge/index.ts     # Doit exister
```

### Port 3000 déjà utilisé
```bash
# Vite essaiera automatiquement le port suivant (strictPort: false)
# Ou tuer le processus:
lsof -i :3000
kill -9 <PID>
```

### Build échoue
```bash
npm ci --force  # Forcer une réinstallation
rm -rf node_modules
npm ci
```

---

## 📚 Documentation

- **[STARTUP_GUIDE.md](docs/guides/STARTUP_GUIDE.md)** — Setup détaillé
- **[QUICK_START.md](docs/guides/QUICK_START.md)** — Démarrage rapide (TL;DR)
- **[STATUS.md](docs/STATUS.md)** — État du projet
- **[ROADMAP.md](docs/ROADMAP.md)** — Prochaines étapes

---

## 🔄 Git Workflow

### Branches
- **main** → Branche canonique (production)
- Feature branches: `feature/xxx`
- Fix branches: `fix/xxx`

### Commit
```bash
git add .
git commit -m "Description courte"
git push origin main
```

---

## 📊 Architecture Technique

### Layers
```
┌─────────────────────────────┐
│  UI Layer (React Components)│
│  - AudioPluginRack.tsx      │
│  - SoundEditorHub.tsx       │
│  - Landing.tsx              │
└─────────────────┬───────────┘
                  │
┌─────────────────▼───────────┐
│  Application Layer          │
│  - Audio synthesis engines  │
│  - MIDI routing             │
│  - Patch management         │
└─────────────────┬───────────┘
                  │
┌─────────────────▼───────────┐
│  Bridge Layer               │
│  - audio-bridge             │
│  - midi-bridge              │
└─────────────────┬───────────┘
                  │
┌─────────────────▼───────────┐
│  Web Audio API              │
│  - Synthesis engines        │
│  - Real-time processing     │
└─────────────────────────────┘
```

---

## 🎯 État du Projet

- ✅ **Infrastructure** — Monorepo configuré
- ✅ **Audio Engines** — 15 moteurs opérationnels
- ✅ **UI/UX** — Interface reactive complète
- ✅ **MIDI Support** — Master Clock 24 PPQN
- ✅ **Documentation** — Guides complets
- 🔄 **Tests** — En cours
- 📈 **Performance** — Optimisation continue

---

## 👥 Contribution

Pour contribuer:
1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/xxx`)
3. Commit les changements (`git commit -am 'Add xxx'`)
4. Push vers la branche (`git push origin feature/xxx`)
5. Ouvrir une Pull Request

---

## 📝 Licence

Voir les fichiers LICENSE de chaque app pour les détails.

---

## 📞 Support

Pour les problèmes ou suggestions:
- Ouvrir une issue sur GitHub
- Consulter la documentation dans `/docs/`
- Vérifier le STATUS.md pour l'état du projet

---

**Last Updated**: 2026-08-20
**Version**: 1.0.0
**Status**: ✅ Production Ready
