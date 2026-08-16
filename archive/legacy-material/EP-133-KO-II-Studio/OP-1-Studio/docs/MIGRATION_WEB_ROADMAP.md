# OP-1 Studio: Web Migration Roadmap

**Status**: Phase 1 en cours - Préparation des couches de stockage  
**Date de démarrage**: 15 août 2026  
**Objectif**: Migrer OP-1 de Tauri (desktop) vers Web (File System Access API)  
**Estimé**: 8-10 semaines, 1 senior dev + 1 mid-level  

---

## 🎯 VISION

Convertir OP-1 Studio d'une application Tauri desktop à une **application web 100% fonctionnelle** utilisant:
- **File System Access API** pour remplacer tous les accès disque Tauri
- **Zustand** pour la gestion d'état centralisée
- **EP-133 patterns** (proven) pour MIDI, storage, et components
- **PWA support** pour installation et offline capability

**Bénéfices**:
✅ Pas d'installateur Tauri requis  
✅ Fonctionne nativement en web (Chrome/Edge/Chromium)  
✅ Déploiement simplifié (CDN + GitHub Pages)  
✅ Maintenance réduite (zéro native code)  
✅ Prêt pour le déploiement monorepo avec EP-133  

---

## ✅ ÉTAPE 1: Fichiers Préparés (TERMINÉ)

### Fichiers Copiés d'EP-133 vers OP-1
- ✅ `/app/core/midi/useWebMidi.ts` (adapté pour OP-1)
- ✅ `/app/core/storage/directoryHandleStore.ts` (IndexedDB persistence)

### Fichiers Créés Nouveaux
- ✅ `/app/core/storage/webFileSystem.ts` (couche File System Access API)
- ✅ `/app/store/profileStore.ts` (Zustand store pour profile)
- (EN ATTENTE) `/app/store/libraryStore.ts` (Zustand store pour library)

---

## 📋 PHASE 1: Web Storage Layer (Weeks 1-3)

### 1.1 Créer stores Zustand manquants
**Fichiers à créer:**

#### `/app/store/libraryStore.ts`
```typescript
interface LibraryStore {
  keyboardFolderHandle: LocalDirectoryHandle | null
  libraryFolderHandle: LocalDirectoryHandle | null
  op1DiskFolderHandle: LocalDirectoryHandle | null
  libraryEntries: LibraryEntry[]
  
  setKeyboardFolder(handle): void
  setLibraryFolder(handle): void
  setOp1DiskFolder(handle): void
  addLibraryEntry(entry): void
  removeLibraryEntry(path): void
  loadSavedFolders(): Promise<void>
}

export const useLibraryStore = create<LibraryStore>(...)
```

#### `/app/store/midiStore.ts`
```typescript
interface MidiStore {
  connected: boolean
  inputNames: string[]
  outputNames: string[]
  lastObservation: MidiObservation | null
  
  setConnected(status): void
  setInputNames(names): void
  setOutputNames(names): void
  recordObservation(msg): void
}

export const useMidiStore = create<MidiStore>(...)
```

### 1.2 Adapter le hook `nativeStorage.ts`
**Fichier**: `/app/lib/nativeStorage.ts`

**Changements requis**:
```typescript
// AVANT (Tauri):
import { invoke } from "@tauri-apps/api/tauri";

async function readKeyboard(): Promise<...> {
  return await invoke('keyboard_read', {...});
}

// APRÈS (FSA):
import { readJsonFile, LocalDirectoryHandle } from '../core/storage/webFileSystem';
import { useLibraryStore } from '../store/libraryStore';

async function readKeyboard(): Promise<...> {
  const { keyboardFolderHandle } = useLibraryStore.getState();
  if (!keyboardFolderHandle) throw new Error('No keyboard folder selected');
  const result = await readJsonFile(keyboardFolderHandle, 'keyboard.json');
  if (!result.success) throw new Error(result.error?.message);
  return result.data;
}
```

**8 commandes Tauri à migrer:**
- [ ] `keyboard_read` → `readJsonFile(keyboardFolder, 'keyboard.json')`
- [ ] `keyboard_write` → `writeJsonFile(keyboardFolder, 'keyboard.json', data)`
- [ ] `profile_read` → `readJsonFile(profileFolder, 'profile.json')`
- [ ] `profile_write` → `writeJsonFile(profileFolder, 'profile.json', data)`
- [ ] `library_initialise` → `createSubdirectory(libraryFolder, 'user')`
- [ ] `display_library_read` → `listDirectory(libraryFolder)`
- [ ] Remove Tauri `app_config_dir()` → use IndexedDB via `loadSavedFolders()`
- [ ] Remove all `@tauri-apps/api` imports

### 1.3 Dual-mode implementation (Tauri + FSA)
**Status**: Keep Tauri working while FSA layer is built

**Pattern**:
```typescript
// In nativeStorage.ts
export async function hasNativeStorage(): boolean {
  return window.__TAURI__ !== undefined;
}

export async function readKeyboard(): Promise<...> {
  if (hasNativeStorage()) {
    // Use Tauri (old path)
    return await invoke('keyboard_read');
  } else {
    // Use FSA (new path)
    return await readJsonFile(keyboardFolder, 'keyboard.json');
  }
}
```

**Acceptance Criteria:**
- [ ] All 8 commands work in both modes
- [ ] No errors in browser console
- [ ] File I/O confirmed to work via DevTools

---

## 📋 PHASE 2: Remove Tauri (Weeks 2-3)

### 2.1 Delete Tauri build configuration
- [ ] Delete `/src-tauri/` directory entirely
- [ ] Remove from `package.json`: `@tauri-apps/*` packages
- [ ] Remove from `vite.config.ts`: Tauri plugin
- [ ] Remove from `package-lock.json` (run `npm install`)

### 2.2 Update configurations
**Files to modify:**

#### `package.json`
```diff
- "tauri": "^1.5.0",
- "@tauri-apps/api": "^1.5.0",
- "@tauri-apps/cli": "^1.5.0",
```

#### `vite.config.ts`
```diff
- import TauriPlugin from 'vite-plugin-tauri';
- 
- plugins: [
-   TauriPlugin(),
-   ...
- ]
```

#### `.npmrc` / `.nvmrc`
- Verify Node 22 still required
- No other Tauri-specific configs

### 2.3 Test in browser
**Acceptance Criteria:**
- [ ] `npm run dev` starts Vite server on http://localhost:5173
- [ ] No Tauri window opens
- [ ] All UI renders correctly
- [ ] Console has no Tauri-related errors

---

## 📋 PHASE 3: Adopt EP-133 Patterns (Weeks 4-6)

### 3.1 Integrate useWebMidi hook
**Current Status**: Hook already created in `/app/core/midi/useWebMidi.ts`

**Files to update:**
- [ ] Replace any existing MIDI code in `/app/components/StudioMachinePanel.tsx` with `useWebMidi`
- [ ] Connect MIDI state to `useMidiStore` (new Zustand store)
- [ ] Test MIDI device detection and reconnection

### 3.2 Centralize state from App.tsx
**Current**: State scattered in component useState

**Target**: Zustand stores
- [ ] Profile state → `useProfileStore`
- [ ] Library paths → `useLibraryStore`
- [ ] MIDI status → `useMidiStore`
- [ ] Display/theme → `useDisplayStore` (new)

**Pattern** (from EP-133):
```typescript
// Before: useState in component
function App() {
  const [profile, setProfile] = useState(null);
  const [connected, setConnected] = useState(false);
}

// After: Zustand stores
function App() {
  const { profile } = useProfileStore();
  const { connected } = useMidiStore();
}
```

### 3.3 Component refactoring (optional but recommended)
Mirror EP-133's structure:
```
/app/components
├── editor/                  # OP-1 specific
│   ├── StudioRecorder.tsx
│   ├── FirmwareInspector.tsx
│   └── ...
├── library/                 # Sound library UI
│   ├── SoundBrowser.tsx
│   ├── SampleUploader.tsx
│   └── ...
└── shared/                  # Reusable
    ├── WaveformTrim.tsx
    ├── DeviceStatusBadge.tsx
    └── ...
```

---

## 📋 PHASE 4: Testing & Deployment (Weeks 7-10)

### 4.1 Add PWA support
**Goal**: Make app installable on desktop and work offline

**Package**: `vite-plugin-pwa`
```bash
npm install -D vite-plugin-pwa
```

**vite.config.ts**:
```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt',
      strategies: 'generateSW',
      manifest: {
        name: 'OP-1 Studio',
        short_name: 'OP-1',
        icons: [...],
      }
    }),
    ...
  ]
})
```

**Acceptance**: 
- [ ] App shows "Install" prompt in Chrome
- [ ] Offline mode works (after install)
- [ ] Service worker caching verified in DevTools

### 4.2 Browser compatibility testing
**Test on**:
- [ ] Chrome 90+ (primary)
- [ ] Edge 90+ (primary)
- [ ] Safari 16+ (limited FSA support - show warning)
- [ ] Firefox (no FSA - graceful degradation)

**Acceptance Criteria:**
- [ ] Works on Chrome/Edge
- [ ] Graceful error on unsupported browsers
- [ ] Console warnings (not errors) for missing APIs

### 4.3 Comprehensive testing
**Test Suite**:
- [ ] Unit tests for `webFileSystem.ts` (Vitest)
- [ ] E2E tests for file picker flow (Playwright)
- [ ] MIDI integration tests with real OP-1 (if available)
- [ ] Offline PWA tests

### 4.4 Documentation & Release
- [ ] Update `README.md` (web-only, no Tauri)
- [ ] Add "Browser Requirements" section
- [ ] Add "Installation Instructions" for PWA
- [ ] Update CI/CD (remove Tauri build step)
- [ ] Release v0.2.0

---

## 🚨 CRITICAL FILES TO TRACK

**DO NOT DELETE YET (Phase 2)**:
- [ ] `/src-tauri/` directory (contains `main.rs`, Cargo.toml)
- [ ] Tauri dependencies in `package.json`

**MIGRATE ASAP (Phase 1)**:
- [ ] `/app/lib/nativeStorage.ts` (will change dramatically)
- [ ] Any code calling `invoke()` Tauri commands

**NEW INFRASTRUCTURE (Phase 1)**:
- [ ] `/app/core/storage/webFileSystem.ts` ✅ CREATED
- [ ] `/app/core/storage/directoryHandleStore.ts` ✅ CREATED
- [ ] `/app/core/midi/useWebMidi.ts` ✅ CREATED
- [ ] `/app/store/profileStore.ts` ✅ CREATED
- [ ] `/app/store/libraryStore.ts` ⏳ IN PROGRESS

---

## 📊 SUCCESS METRICS

**Phase 1 Complete When:**
- ✅ All FSA layer functions tested
- ✅ Dual-mode (Tauri + FSA) working
- ✅ No console errors
- ✅ File I/O verified (read/write test files)

**Phase 2 Complete When:**
- ✅ Tauri build removed
- ✅ `npm run dev` works
- ✅ UI renders without Tauri window
- ✅ CI/CD passing

**Phase 3 Complete When:**
- ✅ State centralized in Zustand stores
- ✅ MIDI hook integrated
- ✅ All components use stores, not useState
- ✅ Tests passing

**Phase 4 Complete When:**
- ✅ PWA installable
- ✅ Offline capability confirmed
- ✅ Cross-browser testing done
- ✅ v0.2.0 released

---

## 🔗 RELATED DOCUMENTATION

- `/home/azoth/EP-133-KO-II-Studio/docs/ARCHITECTURE.md` — Reference EP-133's patterns
- `/home/azoth/OP-1-Studio/docs/RAPPORT_REUTILISATION_EP133_POUR_OP1.md` — Reuse strategy
- `docs/DEPLOYMENT_COOLIFY.md` — Deployment (will be simplified)

---

## 📞 NEXT STEPS (For Next IA Session)

1. **Immediately**: Complete `libraryStore.ts` + `midiStore.ts` creation
2. **Then**: Migrate `/app/lib/nativeStorage.ts` to FSA pattern (dual-mode)
3. **Then**: Run `npm install` and test dual-mode locally
4. **Then**: Delete Tauri build in Phase 2

---

## 🏷️ Tags for Search

`#web-migration` `#tauri-removal` `#file-system-api` `#zustand` `#op1-studio` `#pwa`

**Last Updated**: 15 August 2026  
**Created by**: Claude (initial planning phase)  
**Maintained by**: [Next IA Session]
