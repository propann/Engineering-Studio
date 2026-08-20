# 🚀 Getting Started - Audio Rack Development

**Start Date**: 2026-08-20  
**Target**: Complete 5 modules in Week 1

---

## ⚡ 5-Minute Setup

### 1. Verify Environment
```bash
cd /home/azoth/Engineering-Studio
node --version    # Doit être 20+ (Vite 8 casse en Node 18)
npm --version     # Should be 9+
```

### 2. Install Dependencies
```bash
npm install       # zustand est déjà dans les dependencies
```

### 3. Start Dev Server
```bash
npm run dev
# Opens https://localhost:3000/
```

### 4. Verify Installation
- Audio Rack loads at https://localhost:3000/
- Console shows no errors
- Sound produces when clicking piano keys

---

## 📋 Next Steps (Choose One)

### Option A: Complete Module 1 (RECOMMENDED)
**Time**: 2-3 hours  
**Steps**:
1. Read: `MODULE_DEVELOPMENT_GUIDE.md`
2. Review: `PatchSearchEngine.ts` (already done)
3. Review: `PatchSearchModule.tsx` (already done)
4. Task: Write tests for PatchSearchEngine
5. Task: Integrate into AudioPluginRack.tsx
6. Task: Test patch search functionality

### Option B: Start Module 2
**Time**: 3-4 hours  
**Steps**:
1. Create: `MultiTapDelayProcessor.ts`
2. Use template from `IMPLEMENTATION_GUIDE.md` Module 2
3. Create: `MultiTapDelayModule.tsx`
4. Write tests
5. Integrate

### Option C: Study the Architecture
**Time**: 1-2 hours  
**Steps**:
1. Read: `core/types/audio.ts` (40+ interfaces)
2. Understand: `core/store/audioRackStore.ts` (Zustand)
3. Review: `MODULE_DEVELOPMENT_GUIDE.md`
4. Plan: Which module to build first

---

## 🎯 Today's Goals

### ✅ Day 1 Goals
Fait le 2026-08-20 :

- [x] Architecture posée — `core/types/audio.ts` (40+ interfaces), `core/store/audioRackStore.ts`
- [x] Module 1 écrit — `PatchSearchEngine.ts` + `PatchSearchModule.tsx`
- [x] Alias `@studio-hub/core/*` déclaré dans `tsconfig.json` et `vite.config.ts`
- [x] `npm run typecheck` : 0 erreur
- [x] `npm run build` : passe
- [x] Déploiement Docker/Coolify : `Dockerfile`, `docker-compose.yml`, `coolify.json`, workflow CI
- [x] Build Docker vérifié en local
- [x] Correctif du sélecteur de dossier (ProfileCreator) + HTTPS sur le serveur de dev
- [x] Documentation réalignée sur l'état réel du dépôt

Reste à faire :

- [ ] **Brancher le module 1 dans `AudioPluginRack.tsx`** — écrit mais importé nulle part
- [ ] Faire consommer le store Zustand par `AudioPluginRack.tsx` (il garde ses 50+ useState)
- [ ] Installer vitest, puis écrire les tests du module 1
- [ ] Module 2 (Multi-Tap Delay) — répertoire vide

### 📈 Expected Progress
- Patch Search: 100% → Ready for production
- Multi-Tap Delay: 0% → 50% (Processor done)
- Code Quality: ~100% TypeScript ✅

---

## 🛠️ Important Files

### Core Infrastructure (Already Created)
```
src/core/
├── types/audio.ts              # ✅ Toutes les interfaces (40+)
└── store/audioRackStore.ts     # ✅ État Zustand

# Le logger n'est pas ici : `createLogger` vient de @studio-hub/audio-bridge
```

Alias TypeScript/Vite : `@studio-hub/core/*` → `apps/studio-hub/src/core/*`
(déclaré dans `tsconfig.json` et `vite.config.ts` — sans ça le typecheck casse).

### Modules Structure
```
src/modules/audio-rack-01-patch-search/
├── PatchSearchEngine.ts        # ✅ DONE
├── PatchSearchModule.tsx       # ✅ DONE
├── types.ts                    # ❌ TODO (les types sont dans core/types/audio.ts)
└── patch-search.test.ts        # ❌ TODO (nécessite vitest, non installé)

src/modules/audio-rack-02-delay/   # répertoire vide
├── MultiTapDelayProcessor.ts   # ❌ TODO
├── MultiTapDelayModule.tsx     # ❌ TODO
├── multi-tap-delay.test.ts     # ❌ TODO
└── types.ts                    # ❌ TODO
```

### Documentation (Already Created)
```
AUDIO_RACK_ROADMAP.md          # Complete plan
AUDIO_RACK_README.md           # Project overview
MODULES_STATUS.md              # Progress tracking
MODULE_DEVELOPMENT_GUIDE.md    # How to build
IMPLEMENTATION_GUIDE.md        # Code examples (2 artifacts)
```

---

## 💻 Development Workflow

### 1. Pick a Module
```bash
cd apps/studio-hub/src/modules/audio-rack-01-patch-search/
```

### 2. Write Code
Follow MODULE_DEVELOPMENT_GUIDE.md template:
- Types first (types.ts)
- Processor class (XXProcessor.ts)
- React component (XXModule.tsx)
- Tests (XX.test.ts)

### 3. Test Locally
```bash
# ⬜ Nécessite vitest (non installé) :
# npm run test -- patch-search.test.ts
npm run dev  # See it working
```

### 4. Commit
```bash
git add .
git commit -m "feat: Complete Patch Search module

- Implement PatchSearchEngine tests
- Integrate into AudioPluginRack
- Fix search performance

Closes #1"
```

### 5. Next Module
Repeat for Modules 2-5

---

## 🔗 Useful Commands

```bash
# Development
npm run dev              # Serveur de dev Vite (HTTPS, port 3000)
npm run build            # Build de production -> dist/
npm run preview          # Sert le build (HTTP, port 3000)

# Code Quality
npm run typecheck        # tsc --noEmit
npm run lint             # identique à typecheck

# ⬜ PAS DISPONIBLE à la racine : `npm run test`, `npm run format`.
# Aucun runner de test ni formateur n'est installé sur studio-hub.
# (L'app apps/ep133-studio a, elle, son propre vitest.)

# Git
git status               # Check changes
git branch -a            # List branches
git log --oneline        # Recent commits
```

---

## 🎓 Learning Resources

### Web Audio API
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web Audio API Spec](https://www.w3.org/TR/webaudio/)
- [Getting Started with Web Audio API](https://www.html5rocks.com/en/tutorials/webaudio/intro/)

### React Hooks
- [React Hooks Docs](https://react.dev/reference/react)
- [useEffect Best Practices](https://react.dev/reference/react/useEffect)
- [Custom Hooks Guide](https://react.dev/learn/reusing-logic-with-custom-hooks)

### Zustand
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Advanced TypeScript](https://www.typescriptlang.org/docs/handbook/advanced-types.html)

---

## 🎛️ Testing Pattern (Example)

```typescript
// patch-search.test.ts
import { describe, it, expect } from 'vitest'
import { PatchSearchEngine } from './PatchSearchEngine'

describe('PatchSearchEngine', () => {
  const mockPatches = [
    { id: '1', name: 'Acid Lead', engine: 'open303', category: 'Lead', tags: ['acid'], ... },
    { id: '2', name: 'Warm Pad', engine: 'mi_rings', category: 'Pad', tags: ['warm'], ... },
  ]

  it('should search by name', () => {
    const engine = new PatchSearchEngine(mockPatches)
    const results = engine.search('Acid')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Acid Lead')
  })

  it('should filter by engine', () => {
    const engine = new PatchSearchEngine(mockPatches)
    const results = engine.search('', { engine: 'mi_rings' })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Warm Pad')
  })

  it('should return favorites', () => {
    const engine = new PatchSearchEngine(mockPatches)
    mockPatches[0].isFavorite = true
    const results = engine.getFavorites()
    expect(results).toHaveLength(1)
  })
})
```

---

## 🚨 Common Pitfalls to Avoid

### ❌ DON'T
- Don't modify AudioPluginRack.tsx directly yet (it has 1500+ lines)
- Don't write complex logic in React components
- Don't use global state (use Zustand store)
- Don't forget to test edge cases
- Don't skip TypeScript types

### ✅ DO
- Do follow MODULE_DEVELOPMENT_GUIDE.md patterns
- Do write tests alongside code
- Do use Zustand for state
- Do profile performance early
- Do commit frequently

---

## 📞 Need Help?

1. **Check Documentation**
   - AUDIO_RACK_ROADMAP.md
   - MODULE_DEVELOPMENT_GUIDE.md
   - IMPLEMENTATION_GUIDE.md (2 artifacts)

2. **Review Examples**
   - PatchSearchEngine.ts (complete example)
   - PatchSearchModule.tsx (complete UI)

3. **Check Git**
   - `git log --all` for recent work
   - `git diff HEAD` to see changes

4. **Debug in Browser**
   - F12 → Console (check for errors)
   - F12 → Network (check API calls)
   - F12 → Performance (check CPU usage)

---

## 📊 Expected Outcome

### After Day 1 (2-3h):
- ✅ Patch Search fully functional
- ✅ Tests passing
- ✅ Integrated in UI
- 📈 1/12 modules complete (8%)

### After Week 1 (40-50h):
- ✅ 5 modules complete
- ✅ 90%+ test coverage
- ✅ Performance profiled
- 📈 5/12 modules complete (42%)

### After Week 2 (80-90h):
- ✅ 12 modules complete
- ✅ Export functionality working
- ✅ Sample packs generating
- 📈 12/12 modules complete (100%)

---

## 🎯 Your First Task

### RIGHT NOW (Next 30 minutes):
1. [ ] Open `/apps/studio-hub/src/modules/audio-rack-01-patch-search/`
2. [ ] Review `PatchSearchEngine.ts` (already complete)
3. [ ] Review `PatchSearchModule.tsx` (already complete)
4. [ ] Read `MODULE_DEVELOPMENT_GUIDE.md`
5. [ ] Decide: Write tests or start Module 2?

---

**Remember**: You have a solid foundation with:
- ✅ Complete type system
- ✅ Zustand store ready
- ✅ Module structure in place
- ✅ Full documentation
- ✅ Module 1 partially done

**Now let's build!** 🚀🎛️✨

---

**Created**: 2026-08-20  
**Status**: Ready to develop  
**Next**: Pick Module 1 or 2 and start coding!

