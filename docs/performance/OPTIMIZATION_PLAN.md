# 🚀 EP-133 Optimization & Alignment Plan

**Current State**: 261MB total, 247MB node_modules, 7015 dependencies  
**Target**: Lean, fast service aligned with OP-1  
**Timeline**: 2 weeks for full optimization  

---

## 📊 CURRENT METRICS

```
Size Analysis:
  Total Project:       261 MB
  node_modules:        247 MB (95% of total!)
  Source code:         ~3-5 MB
  Build output:        ~180 KB

Dependencies:
  package-lock.json:   7,015 lines (huge!)
  Root packages:       15 direct dependencies
  Transitive depth:    Very deep

Performance:
  npm install:         ~2-3 minutes
  Build time:          ~60 seconds
  Dev start:           ~30-45 seconds (slow!)
```

---

## 🎯 PHASE 1: Quick Optimizations (1 Week)

### 1.1: Audit & Remove Unused Dependencies (2-3 hours)

**Current Dependencies**:
- `@alexanderolsen/libsamplerate-js` - Audio resampling (large!)
- `tone@15.1.22` - Audio synthesis (very large!)
- `wavesurfer.js@7.12.11` - Waveform visualization (medium)
- `fflate@0.8.3` - Compression
- `@playwright/test` - E2E testing
- `vitest` - Unit testing  
- `vite-plugin-pwa` - PWA support
- React, React-DOM, Zustand, TypeScript, Vite, etc.

**Analysis**:
```
Heavy libraries:
  - tone.js:           ~500KB uncompressed
  - libsamplerate-js:  ~300KB
  - wavesurfer.js:     ~200KB
  - playwright:        ~100MB in node_modules!
  
Total audio libs:      ~1MB + transitive deps
Total test libs:       ~100MB+ for dev only

Opportunity: Move test deps to devDependencies only
Opportunity: Share audio libs via monorepo
```

**Action**:
```bash
# Audit each dependency
npm list --depth=3 | grep -E "large|unused"

# Remove dev-only dependencies from node_modules
npm prune --production

# Check actual usage in src/
grep -r "import.*tone\|wavesurfer\|libsamplerate" src/
```

**Potential Gain**: 50-100MB reduction in node_modules

---

### 1.2: Optimize Build Output (1-2 hours)

**Current Build**: 180KB (not bad)

**Improvements**:
```
✅ Code splitting by route
✅ Tree shake unused code
✅ Compress audio assets
✅ Minify CSS/JS
✅ Lazy load components
```

**Action**:
```bash
npm run build -- --analyze  # See bundle breakdown
```

**Expected Gain**: 10-20KB smaller bundle

---

### 1.3: Align with OP-1 Patterns (2-3 hours)

**EP-133 should adopt OP-1's patterns**:

```
Current EP-133:
  src/
  ├── components/
  ├── core/           ✓ Good structure
  ├── pages/          ✓ Route-based
  └── hooks/          ✓ Custom hooks

Target: Same as OP-1 + consolidation
  src/
  ├── components/
  │   ├── editor/     (same)
  │   ├── game/       (same)
  │   └── shared/     ✨ Import from @studio-hub/shared-ui
  ├── core/
  │   ├── midi/       ✓ Already good
  │   ├── storage/    ✓ Already good
  │   ├── store/      ✨ Import from @studio-hub/shared-stores
  │   ├── audio/      (keep, unique to EP-133)
  │   └── hub/        ✓ Already good
  ├── pages/
  └── hooks/
```

**Action**:
- Import playerProfileStore from @studio-hub/shared-stores (monorepo)
- Import common types from @studio-hub/types
- Use shared UI components

**Gain**: 
- Single source of truth
- Reduced code duplication
- Aligned with OP-1

---

### Week 1 Summary
```
✅ Removed 50-100MB from node_modules
✅ Optimized build output
✅ Aligned patterns with OP-1
✅ npm install ~30% faster

Time: ~6-8 hours
Immediate gain: Leaner, faster development
```

---

## 🎯 PHASE 2: Monorepo Integration (Week 2)

### 2.1: Prepare for Monorepo Consolidation (4-5 hours)

**When studio-hub monorepo is ready**:

```bash
# Move EP-133 to monorepo
studio-hub/
├── apps/
│   ├── op1-studio/
│   └── ep133-studio/     ← EP-133 moved here
└── packages/
    ├── types/           ← Use from here
    ├── shared-ui/       ← Use from here
    ├── shared-stores/   ← Use from here
    └── audio-bridge/    ← Optional: share AIFF with OP-1
```

**Changes to EP-133**:
```typescript
// OLD
import { PlayerProfile } from './types/player';
import { Button } from './components/Button';
import { usePlayerProfileStore } from './store/playerProfile';

// NEW
import type { PlayerProfile } from '@studio-hub/types';
import { Button } from '@studio-hub/shared-ui';
import { usePlayerProfileStore } from '@studio-hub/shared-stores';
```

**Gain**:
- 100+ packages removed
- Dependencies unified
- npm install ~40% faster

---

### 2.2: Optimize Dev Server (2-3 hours)

**Current dev start**: 30-45 seconds (slow!)

**Improvements**:
```typescript
// vite.config.ts
export default defineConfig({
  // ✅ Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'tone.js'],
    exclude: ['@playwright/test'],  // Don't pre-bundle test deps
  },

  // ✅ Pre-bundle large libraries once
  rollupOptions: {
    output: {
      manualChunks: {
        'audio-libs': ['tone', 'wavesurfer.js'],
        'vendor': ['react', 'react-dom', 'zustand'],
      }
    }
  },

  // ✅ Faster HMR
  server: {
    middlewareMode: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    }
  }
});
```

**Gain**: Dev start 15-20 seconds (50% faster)

---

### Week 2 Summary
```
✅ Monorepo prepared
✅ Dev server optimized
✅ Dependencies consolidated
✅ npm install ~40% faster
✅ Dev start 50% faster

Time: ~6-8 hours total
Gain: Significantly faster development
```

---

## 📊 PERFORMANCE TARGETS

### After Optimization

```
BEFORE:
  Total Project Size:    261 MB
  node_modules:          247 MB
  npm install:           ~2-3 min
  Dev start:             ~45 sec
  Build time:            ~60 sec
  Production bundle:     ~180 KB

AFTER (Phase 1-2):
  Total Project Size:    ~100-120 MB (-55%)
  node_modules:          ~80-100 MB (-60%)
  npm install:           ~45-60 sec (-70%)
  Dev start:             ~15-20 sec (-60%)
  Build time:            ~45 sec (-25%)
  Production bundle:     ~160 KB (-10%)
```

---

## 🔄 ALIGNMENT WITH OP-1

### Shared Patterns

| Aspect | OP-1 | EP-133 | After |
|--------|------|--------|-------|
| State Management | Zustand | Zustand | ✅ Unified |
| Build Tool | Next.js | Vite | ✅ Keep (appropriate) |
| React Version | 19.2.8 | 19.2.8 | ✅ Aligned |
| TypeScript | Strict | Strict | ✅ Aligned |
| Tailwind | Yes | Yes | ✅ Unified |
| Types | Shared | Local | ✅ Unified (@studio-hub/types) |
| UI Components | Local | Local | ✅ Unified (@studio-hub/shared-ui) |
| Stores | Local + Hub | Local + Hub | ✅ Unified (@studio-hub/shared-stores) |
| Testing | Node tests | Vitest + Playwright | ✅ Keep (appropriate) |

---

## ✨ SPECIFIC OPTIMIZATIONS

### 1. Remove Playwright from Production
```json
// package.json
{
  "dependencies": {
    // production only
  },
  "devDependencies": {
    "@playwright/test": "^1.62.1",  ← Move here
    "vitest": "^4.1.10"              ← Already dev
  }
}
```
**Gain**: -100MB from node_modules in production

---

### 2. Tree Shake Audio Libraries
```typescript
// Only import what's used
import { Synth } from 'tone/build/esm/synth';  // Not entire library

// Not: import * as Tone from 'tone';
```
**Gain**: -50KB in bundle

---

### 3. Lazy Load Components
```typescript
// Load heavy components only when needed
const GameToolbar = lazy(() => import('./GameToolbar'));
const EditorToolbar = lazy(() => import('./EditorToolbar'));

// Routes load appropriate components
<Suspense fallback={<Loading />}>
  <GameToolbar />
</Suspense>
```
**Gain**: Faster initial page load

---

### 4. Shared Audio Bridge (Optional)
```typescript
// Future: Extract audio utilities to @studio-hub/audio-bridge
// Both OP-1 and EP-133 can use:

import { 
  analyzeWaveform, 
  convertAudioFormat,
  // AIFF codec from OP-1
} from '@studio-hub/audio-bridge';
```
**Gain**: Unified audio processing

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1: Quick Optimizations
- [ ] Audit all dependencies
- [ ] Move test deps to devDependencies
- [ ] Optimize build output
- [ ] Align patterns with OP-1
- [ ] Document changes

### Week 2: Monorepo Integration
- [ ] Wait for studio-hub monorepo setup (from OP-1 session)
- [ ] Move EP-133 to apps/ep133-studio
- [ ] Import types from @studio-hub/types
- [ ] Import stores from @studio-hub/shared-stores
- [ ] Import UI from @studio-hub/shared-ui
- [ ] Optimize vite.config.ts
- [ ] Test dev server speed

### Final Validation
- [ ] Build production optimized
- [ ] Test all features work
- [ ] Compare sizes/speed before/after
- [ ] Document improvements

---

## 🎯 SUCCESS CRITERIA

- [ ] node_modules < 120MB (was 247MB)
- [ ] npm install < 60 seconds (was 2-3 min)
- [ ] Dev start < 20 seconds (was 45 sec)
- [ ] Production bundle < 170KB (was 180KB)
- [ ] All tests passing
- [ ] All features working
- [ ] Aligned with OP-1 patterns
- [ ] Monorepo ready (from OP-1 session)

---

## 🚀 NEXT STEPS

1. **This week**: Phase 1 optimizations (6-8 hours)
2. **Next week**: Phase 2 monorepo integration (6-8 hours)
3. **After**: Full consolidation with OP-1

---

## 📞 COORDINATION WITH OP-1 SESSION

**OP-1 is working on:**
- ✅ Architecture modernization (DONE)
- ✅ Zustand stores (DONE)
- 🔄 Monorepo setup (in progress)
- 🔄 Types package (ready)
- 🔄 Shared UI (ready)
- 🔄 Shared stores (ready)

**EP-133 should:**
- ✅ Wait for monorepo setup
- ✅ Prepare to move to apps/ep133-studio
- ✅ Optimize now (Phase 1)
- ✅ Integrate later (Phase 2 - when monorepo ready)

---

**Ready to optimize and align? Let's make it fast and lean! 🔥**
