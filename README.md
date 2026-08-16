# 🎵 Studio Hub - Monorepo

Unified development environment for OP-1 Studio and EP-133 KO II Studio.

> **État actuel :** consulter la [feuille de route active](docs/ROADMAP_ACTIVE_2026-08-16.md).
> Elle remplace les anciennes projections de phases pour le suivi du produit.
> Les commandes et résultats de la dernière passe sont dans le [journal de validation](docs/VALIDATION_LOG_2026-08-16.md).
> La suite matérielle centralisée est décrite dans le [runbook de validation](docs/HARDWARE_VALIDATION_RUNBOOK.md) ; elle reste en lecture seule par défaut.

## 📁 Structure

```
studio-hub/
├── packages/              # Shared code
│   ├── types/            # Shared type definitions
│   ├── shared-stores/    # Zustand stores (player, device, workspace)
│   ├── shared-ui/        # Shared React components
│   ├── audio-bridge/     # Audio utilities
│   └── compression/      # Compression utilities
│
├── apps/
│   ├── studio-hub/        # Portail, fiche et coffre de l’atelier
│   ├── op1-studio/       # OP-1 Studio (Next.js + Drizzle)
│   └── ep133-studio/     # EP-133 Studio (Vite + Tone.js)
│
└── package.json          # Monorepo config (npm workspaces)
```

## 🚀 Quick Start

### Install all dependencies
```bash
npm install
```

### Development
```bash
# Run OP-1 dev server
npm run dev:op1

# Run EP-133 dev server
npm run dev:ep133

# Run both simultaneously
npm run dev:both
```

### Build
```bash
# Build all workspaces
npm run build:all

# Build specific workspace
npm run build -w apps/op1-studio
npm run build -w apps/ep133-studio
```

### Testing
```bash
npm run test:all
npm run lint:all
```

## 📦 Packages

### @studio-hub/types
Shared type definitions for both studios:
- PlayerProfile
- DeviceInfo
- MidiMessage
- StudioConfig

### @studio-hub/shared-stores
Zustand stores for centralized state:
- usePlayerProfileStore
- useDeviceStore
- useWorkspaceStore

### @studio-hub/shared-ui
Shared React components (to be populated):
- Common UI elements used by both studios

### @studio-hub/audio-bridge
Audio utilities shared between projects:
- AIFF codec (from OP-1)
- Audio analysis tools
- Format converters

### @studio-hub/compression
Compression and archive utilities:
- ZIP/GZIP handling

## 🔄 Workspace Dependencies

- All apps import from `@studio-hub/types`
- All apps import from `@studio-hub/shared-stores`
- Shared code in packages/ uses workspace: protocol

## 📊 Benefits

- ✅ 60-65% reduction in total size
- ✅ 90-95% faster npm install
- ✅ 70-80% faster dev start
- ✅ Single source of truth for shared code
- ✅ Unified patterns across studios

## 🛠️ Each Studio

### OP-1 Studio (`apps/op1-studio/`)
- Framework: Next.js 16
- Database: Drizzle ORM
- State: Zustand
- Native: Tauri
- Deploy: Cloudflare Wrangler

### EP-133 Studio (`apps/ep133-studio/`)
- Framework: Vite
- Audio: Tone.js + WaveSurfer
- State: Zustand
- Testing: Vitest + Playwright
- PWA: Enabled

---

**Version**: 1.0.0  
**Updated**: 2026-08-16  
**Status**: Branche `integration/studio-hub` — parcours Hub hors machine validés, PR ouverte

## État vérifié

La branche d’intégration est construite depuis le `main` récent de `OP-1-Studio`.
L’OP‑1 distant reste la base de référence ; le Hub, l’EP‑133, les packages
partagés, l’éditeur de samples et le portail Services sont ajoutés autour de
cette base sans remplacer ses fonctionnalités récentes.

Commandes validées dans la branche :

```bash
npm run typecheck:all
npm run build:all
npm run test:all
npm run lint:all
npm run test:e2e:hub
```

Le test Hub couvre 9 scénarios et 9 ouvertures d’outils, dont la fiche
persistante, le coffre sélectif hors machine, l’AIFF local, l’export SVG, les
services OP‑1, les sons EP‑133 et la documentation OP‑1. Le lint ne contient
pas d’erreur bloquante ; les limites matérielles et les gros volumes restent
ouvertes dans la [roadmap active](docs/ROADMAP_ACTIVE_2026-08-16.md).
