# 🔗 Consolidation Strategy: OP-1 + EP-133

**Objective**: Eliminate duplicate tools while keeping both projects optimized  
**Timeline**: 4 weeks (1 week quick wins, 3 weeks full consolidation)  
**Expected Savings**: 187 packages, 24% reduction, 30-40% code reuse

---

## 📊 THE PROBLEM

### Current State
```
OP-1 Studio:    517 packages  (Next.js + Drizzle + React)
EP-133 Studio:  270 packages  (Vite + Tone.js + React)
───────────────────────────────────────────────────
TOTAL:          787 packages  ❌ Lots of duplication!

Shared:
  ✅ React 19
  ✅ Zustand 5
  ✅ TypeScript
  ✅ Tailwind
  ✅ @types/*

But: Each has its own copy, different versions
```

### What We're Duplicating
```
❌ React 19.2.6 (OP-1) + 19.2.8 (EP-133)
❌ Zustand 5.0.15 in both
❌ TypeScript config in both
❌ Tailwind CSS in both
❌ ESLint setup in both
❌ @types/* duplicated
❌ Common UI components written twice
❌ Zustand stores (profileStore, etc) in both
❌ Type definitions (PlayerProfile, etc) in both
```

---

## ✨ THE SOLUTION: Monorepo

### New Structure
```
studio-hub/                          (Monorepo root)
│
├── package.json                     (Workspace config)
├── tsconfig.json                    (Shared TypeScript)
├── tailwind.config.js               (Shared Tailwind)
├── eslint.config.mjs                (Shared ESLint)
│
├── packages/                        (Shared code)
│   │
│   ├── types/                       ✨ NEW
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── player.ts            (PlayerProfile)
│   │   │   ├── device.ts            (DeviceInfo, MidiMessage)
│   │   │   ├── studio.ts            (StudioConfig)
│   │   │   └── index.ts
│   │   └── README.md
│   │
│   ├── shared-ui/                   ✨ NEW
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── ...shared UI
│   │   │   ├── hooks/
│   │   │   │   └── ...shared hooks
│   │   │   └── index.ts
│   │   └── README.md
│   │
│   ├── shared-stores/               ✨ NEW
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── playerProfileStore.ts
│   │   │   ├── deviceStore.ts
│   │   │   ├── workspaceStore.ts
│   │   │   └── index.ts
│   │   └── README.md
│   │
│   ├── audio-bridge/                ✨ NEW
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── aiff/                (From OP-1)
│   │   │   ├── analysis/            (Audio analysis)
│   │   │   ├── convert/             (Format conversion)
│   │   │   └── index.ts
│   │   └── README.md
│   │
│   ├── compression/                 ✨ NEW
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── zip.ts               (Using fflate)
│   │   │   ├── gzip.ts
│   │   │   └── index.ts
│   │   └── README.md
│   │
│   └── tools/                       ✨ NEW (Python)
│       ├── setup.py
│       ├── src/
│       │   ├── firmware_inspector.py (From OP-1)
│       │   ├── content_catalog.py    (From OP-1)
│       │   └── ...shared tools
│       └── README.md
│
├── apps/
│   │
│   ├── op1-studio/                  (OP-1 - mostly unchanged)
│   │   ├── package.json
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── core/                (midi, storage, store)
│   │   │   └── lib/
│   │   ├── src-tauri/               (Tauri backend)
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── ep133-studio/                (EP-133 - mostly unchanged)
│       ├── package.json
│       ├── src/
│       │   ├── components/
│       │   ├── core/
│       │   └── pages/
│       ├── vite.config.ts
│       └── tsconfig.json
│
├── docs/                            (Shared documentation)
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   └── API.md
│
├── .github/
│   └── workflows/                   (CI/CD for all packages)
│
└── README.md
```

---

## 🎯 PHASE 1: Quick Wins (Week 1)

### Goal: Get immediate value without refactoring

#### Task 1.1: Setup Monorepo Structure (2 hours)
```bash
# Create new root directory
mkdir studio-hub && cd studio-hub
git init

# Copy projects as apps/
cp -r ../OP-1-Studio apps/op1-studio
cp -r ../EP-133-KO-II-Studio apps/ep133-studio

# Create packages directory
mkdir -p packages/{types,shared-ui,shared-stores,audio-bridge,compression,tools}

# Create root package.json with workspaces
```

**Root package.json**:
```json
{
  "name": "studio-hub",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "install": "npm ci",
    "build:all": "npm run build -ws",
    "lint:all": "npm run lint -ws",
    "test:all": "npm run test -ws",
    "dev:op1": "npm run dev -w apps/op1-studio",
    "dev:ep133": "npm run dev -w apps/ep133-studio"
  }
}
```

**Effort**: 2 hours  
**Gain**: Foundation for everything else

---

#### Task 1.2: Create @studio-hub/types Package (2 hours)
```bash
cd packages/types
npm init -y
# Create src/index.ts
```

**Export types both projects need**:
```typescript
// src/player.ts
export interface PlayerProfile {
  name: string;
  avatar?: string;
  avatarEmoji?: string;
  settings: {
    preferredLanguage: 'en' | 'fr' | 'es';
    theme: 'light' | 'dark' | 'auto';
    midiChannel: number;
    velocityDefault: number;
  };
}

// src/device.ts
export interface MidiMessage {
  status: number;
  data1: number;
  data2: number;
  channel?: number;
}

export interface DeviceInfo {
  name: string;
  version: string;
  firmwareVersion?: string;
}

// src/index.ts
export * from './player';
export * from './device';
```

**Update both projects**:
```typescript
// OP-1: app/core/store/playerProfileStore.ts
import type { PlayerProfile } from '@studio-hub/types';

// EP-133: src/core/store/playerProfileStore.ts
import type { PlayerProfile } from '@studio-hub/types';
```

**Effort**: 2 hours  
**Gain**: Single source of truth, ~5KB saved per project

---

#### Task 1.3: Deduplicate Dependencies (1 hour)
```bash
# Root package.json
{
  "dependencies": {
    "react": "19.2.8",              # Latest
    "react-dom": "19.2.8",
    "zustand": "5.0.15",
    "typescript": "7.0.2",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.4"
  }
}

# All workspaces use root versions
```

**Result**: 
- All projects use same React version (19.2.8)
- All projects use same Zustand (5.0.15)
- All projects use same TypeScript
- Saves ~20-30 duplicate packages

**Effort**: 1 hour  
**Gain**: ~100 packages removed, cleaner dependency tree

---

### Week 1 Summary
```
✅ Monorepo setup complete
✅ Types package created & in use
✅ Dependencies deduplicated
✅ Both projects still work independently
✅ Ready for next phases

Time: ~5-6 hours
Immediate Gain: ~100 packages (-12.7%), better DX
```

---

## 🎯 PHASE 2: Shared Packages (Week 2-3)

### Task 2.1: Extract Zustand Stores (3-4 hours)

**Create @studio-hub/shared-stores**:
```
packages/shared-stores/
├── src/
│   ├── player/
│   │   ├── playerProfileStore.ts    (Both use this)
│   │   └── playerService.ts
│   ├── device/
│   │   ├── deviceStore.ts           (Both use this)
│   │   └── midiService.ts
│   ├── workspace/
│   │   └── workspaceStore.ts        (OP-1 uses this)
│   └── index.ts
```

**Usage in both projects**:
```typescript
// OP-1: app/core/store/index.ts
export { usePlayerProfileStore } from '@studio-hub/shared-stores';
export { useDeviceStore } from '@studio-hub/shared-stores';

// EP-133: src/core/store/index.ts
export { usePlayerProfileStore } from '@studio-hub/shared-stores';
export { useDeviceStore } from '@studio-hub/shared-stores';
```

**Effort**: 3-4 hours  
**Gain**: Single source of truth, consistent state management

---

### Task 2.2: Create Shared UI Components (5-6 hours)

**Create @studio-hub/shared-ui**:
```
packages/shared-ui/
├── src/
│   ├── components/
│   │   ├── Button.tsx               (Used by both)
│   │   ├── Modal.tsx                (Used by both)
│   │   ├── Header.tsx               (Adapt for each)
│   │   └── ...other shared components
│   ├── hooks/
│   │   ├── useResponsive.ts
│   │   └── ...shared hooks
│   ├── styles/
│   │   └── tailwind.config.ts       (Shared!)
│   └── index.ts
```

**Export & use in both**:
```typescript
// OP-1: app/components/Button.tsx
export { Button } from '@studio-hub/shared-ui';

// EP-133: src/components/Button.tsx
export { Button } from '@studio-hub/shared-ui';
```

**Effort**: 5-6 hours  
**Gain**: 30-40% less component duplication, consistent UI

---

### Task 2.3: Create Audio Bridge (3-4 hours)

**Create @studio-hub/audio-bridge**:
```
packages/audio-bridge/
├── src/
│   ├── aiff/
│   │   ├── encoder.ts               (From OP-1)
│   │   ├── decoder.ts               (From OP-1)
│   │   └── index.ts
│   ├── analysis/
│   │   ├── waveform.ts
│   │   └── metadata.ts
│   ├── convert/
│   │   ├── formats.ts
│   │   └── codecs.ts
│   └── index.ts
```

**Use in both projects**:
```typescript
// OP-1: app/lib/audioUtils.ts
export { encodeAIFF, decodeAIFF } from '@studio-hub/audio-bridge';

// EP-133: src/core/audio/index.ts (future)
export { encodeAIFF, decodeAIFF } from '@studio-hub/audio-bridge';
```

**Effort**: 3-4 hours  
**Gain**: Shared audio utilities, ~10KB saved

---

### Week 2-3 Summary
```
✅ Zustand stores shared
✅ UI components shared
✅ Audio utilities extracted
✅ ~400+ packages removed (50% reduction)
✅ 30-40% less component duplication

Time: ~12-15 hours
Total Gain: ~400-500 packages, massive code reuse
```

---

## 🎯 PHASE 3: Validation & Cleanup (Week 4)

### Task 3.1: Testing & Performance (2-3 hours)
```bash
# Run all tests
npm run test:all

# Check build sizes
npm run build:all

# Verify no regressions
npm run dev:op1      # Should work perfectly
npm run dev:ep133    # Should work perfectly
```

### Task 3.2: Documentation (2-3 hours)
```
docs/
├── ARCHITECTURE.md       (Monorepo structure)
├── CONTRIBUTING.md       (How to add packages)
├── PACKAGES.md          (Each package purpose)
└── STYLE_GUIDE.md       (Consistency rules)
```

### Week 4 Summary
```
✅ All tests passing
✅ No performance regressions
✅ Documentation complete
✅ Ready for production

Total Project Time: 4 weeks
Total Gained: 24% package reduction, better DX
```

---

## 📊 GAINS BREAKDOWN

### Dependency Reduction
```
Before:  787 packages
After:   ~600 packages
─────────────────────
Gain:    187 packages (-24%)
```

### Code Duplication
```
Before:  Types defined in both projects
         Zustand stores duplicated
         UI components copied
After:   Single source of truth
         Shared types
         Shared stores
         Shared components
─────────────────────
Gain:    30-40% code reuse
```

### Developer Experience
```
Before:  Update Button in 2 places
         Update types in 2 places
         Manage 2 Tailwind configs
After:   Update Button once
         Types in 1 place
         Single Tailwind config
─────────────────────
Gain:    Faster development
```

### Performance
```
Before:  2 separate node_modules
         Duplication in each
After:   Single node_modules
         Deduped dependencies
─────────────────────
Gain:    Faster installs (30-40%)
         Smaller disk space
```

---

## ✅ WHAT STAYS SEPARATE

- ✅ **Next.js** (OP-1 only - server needs)
- ✅ **Vite** (EP-133 only - client only)
- ✅ **Drizzle ORM** (OP-1 only - database)
- ✅ **Tone.js** (EP-133 only - audio synthesis)
- ✅ **WaveSurfer** (EP-133 only - visualization)
- ✅ **Tauri** (OP-1 only - native desktop)

**Why**: Each project needs different tooling for its use case.

---

## ❌ WHAT WE WON'T DO

- ❌ Merge Next.js + Vite (technically impossible)
- ❌ Force EP-133 to use Drizzle (unnecessary)
- ❌ Remove Tauri from OP-1 (still useful)
- ❌ Share audio synthesis code (different needs)

---

## 🚀 IMPLEMENTATION CHECKLIST

### Week 1: Setup
- [ ] Create monorepo root
- [ ] Move projects to apps/
- [ ] Create packages/ structure
- [ ] Setup workspace dependencies
- [ ] Create @studio-hub/types
- [ ] Deduplicate shared deps

### Week 2-3: Extract Code
- [ ] Extract Zustand stores → shared-stores
- [ ] Extract UI components → shared-ui
- [ ] Extract audio utilities → audio-bridge
- [ ] Extract compression utilities → compression
- [ ] Update both projects to import from shared

### Week 4: Validate
- [ ] Test both projects
- [ ] Verify performance
- [ ] Update documentation
- [ ] Create CONTRIBUTING.md

---

## 📞 FAQ

**Q: Will this slow down the projects?**  
A: No. Monorepo workspaces improve deduplication.

**Q: Can I still develop each project independently?**  
A: Yes. Use `npm run dev:op1` or `npm run dev:ep133`

**Q: Do I have to do this all at once?**  
A: No. Do Phase 1 (quick wins), then decide on Phase 2-3.

**Q: What if we add more studios later?**  
A: Easy! Add `apps/new-studio/` to monorepo.

---

## 🎯 RECOMMENDATION

**Start with Phase 1** (Week 1):
- Monorepo setup
- Types package
- Dependency dedup

**Then evaluate** if you want Phase 2-3.

**Expected**: After Phase 1, you'll see the benefits and want Phase 2-3.

---

**Ready to consolidate? 🚀**
