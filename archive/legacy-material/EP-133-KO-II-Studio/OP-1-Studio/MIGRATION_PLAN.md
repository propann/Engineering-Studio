# 🚀 OP-1 Studio - Migration Plan (EP-133 Patterns)

**Status**: Ready to Start  
**Scope**: Adopt EP-133 architecture patterns in OP-1  
**Timeline**: 8-10 semaines (can be parallelized)

---

## 📋 PHASE 1: Architecture Setup (Week 1)

### Task 1.1: Create Core Directory Structure
```bash
# Current state: /app only has components, api, lib
# New state: Add /app/core with organized subsystems

mkdir -p /app/core/{midi,storage,store,audio,utils}
```

**Files to Create:**
- [ ] `/app/core/midi/useWebMidi.ts` (copy from EP-133)
- [ ] `/app/core/storage/directoryHandleStore.ts` (copy from EP-133)
- [ ] `/app/core/storage/webFileSystem.ts` (NEW - dual-mode: Tauri + FSA)
- [ ] `/app/core/store/profileStore.ts` (NEW - Zustand)
- [ ] `/app/core/store/libraryStore.ts` (NEW - Zustand)
- [ ] `/app/core/store/deviceStore.ts` (NEW - Zustand)

**Effort**: 1-2 hours  
**Dependencies**: None (structural only)

---

### Task 1.2: Add Zustand Dependency
```bash
npm install zustand@latest
npm install --save-dev @types/zustand
```

**Effort**: 15 minutes

---

## 📋 PHASE 2: State Management (Weeks 2-3)

### Task 2.1: Create profileStore.ts
**What**: Centralize profile state (currently scattered in useState)

**File**: `/app/core/store/profileStore.ts`
**Template** (based on EP-133's languageStore.ts):

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OpProfile {
  name: string;
  selectedPatchIndex: number;
  selectedSampleIndex: number;
  metronomeEnabled: boolean;
  masterVolume: number;
}

export const useProfileStore = create<OpProfile>()(
  persist(
    (set) => ({
      name: 'OP-1 Default',
      selectedPatchIndex: 0,
      selectedSampleIndex: 0,
      metronomeEnabled: false,
      masterVolume: 100,
      
      setProfile: (profile: Partial<OpProfile>) =>
        set((state) => ({ ...state, ...profile })),
    }),
    { name: 'op1-profile-store' }
  )
);
```

**Effort**: 2-3 hours (includes testing)  
**Impact**: Replaces 5-7 useState calls in components

---

### Task 2.2: Create libraryStore.ts
**What**: Centralize library paths & file handles

**File**: `/app/core/store/libraryStore.ts`

```typescript
import { create } from 'zustand';
import { directoryHandleStore } from '../storage/directoryHandleStore';

interface LibraryStore {
  libraryPath: string | null;
  keyboardLayoutPath: string | null;
  setLibraryPath: (path: string) => void;
  setKeyboardLayoutPath: (path: string) => void;
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  libraryPath: localStorage.getItem('libraryPath'),
  keyboardLayoutPath: localStorage.getItem('keyboardLayoutPath'),
  
  setLibraryPath: (path: string) => {
    set({ libraryPath: path });
    localStorage.setItem('libraryPath', path);
    // Notify directoryHandleStore
    directoryHandleStore.setHandle('library', /* handle */);
  },
  
  setKeyboardLayoutPath: (path: string) => {
    set({ keyboardLayoutPath: path });
    localStorage.setItem('keyboardLayoutPath', path);
  },
}));
```

**Effort**: 2-3 hours  
**Impact**: Single source of truth for paths

---

### Task 2.3: Create deviceStore.ts
**What**: Track OP-1 device connection state

**File**: `/app/core/store/deviceStore.ts`

```typescript
import { create } from 'zustand';

interface DeviceStore {
  isConnected: boolean;
  deviceInfo: { name: string; version: string } | null;
  connect: (info: DeviceStore['deviceInfo']) => void;
  disconnect: () => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  isConnected: false,
  deviceInfo: null,
  connect: (info) => set({ isConnected: true, deviceInfo: info }),
  disconnect: () => set({ isConnected: false, deviceInfo: null }),
}));
```

**Effort**: 1 hour  
**Impact**: Replaces component prop drilling

---

## 📋 PHASE 3: Web Storage & File System (Weeks 4-5)

### Task 3.1: Create webFileSystem.ts (Dual-Mode: Tauri + FSA)

**File**: `/app/core/storage/webFileSystem.ts`

**Why**: Allow OP-1 to work both with Tauri (native) and File System Access API (web).

```typescript
import { invoke } from '@tauri-apps/api/tauri';

type FileSystemMode = 'tauri' | 'web';

interface IFileSystem {
  mode: FileSystemMode;
  readFile(path: string): Promise<ArrayBuffer>;
  writeFile(path: string, data: ArrayBuffer): Promise<void>;
  listFiles(path: string): Promise<string[]>;
}

class TauriFileSystem implements IFileSystem {
  mode: FileSystemMode = 'tauri';
  async readFile(path: string): Promise<ArrayBuffer> {
    return invoke('read_file', { path });
  }
  // ... implement other methods
}

class WebFileSystem implements IFileSystem {
  mode: FileSystemMode = 'web';
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  
  async readFile(path: string): Promise<ArrayBuffer> {
    if (!this.directoryHandle) throw new Error('No directory selected');
    const file = await this.directoryHandle.getFileHandle(path);
    return file.getFile().then(f => f.arrayBuffer());
  }
  // ... implement other methods
}

// Auto-detect which to use
export async function getFileSystem(): Promise<IFileSystem> {
  if (window.__TAURI__) {
    return new TauriFileSystem();
  } else if ('showDirectoryPicker' in window) {
    return new WebFileSystem();
  } else {
    throw new Error('No file system API available');
  }
}
```

**Effort**: 4-6 hours  
**Impact**: Opens path to remove Tauri dependency later

---

### Task 3.2: Copy EP-133's directoryHandleStore.ts

```bash
cp /home/azoth/EP-133-KO-II-Studio/src/core/storage/directoryHandleStore.ts \
   /home/azoth/OP-1-Studio/app/core/storage/
```

**File**: `/app/core/storage/directoryHandleStore.ts`  
**Why**: Proven FSA pattern from EP-133

**Effort**: 30 minutes  
**Impact**: Web-safe folder selection

---

### Task 3.3: Copy EP-133's MIDI Hook

```bash
cp /home/azoth/EP-133-KO-II-Studio/src/core/midi/useWebMidi.ts \
   /home/azoth/OP-1-Studio/app/core/midi/
```

**File**: `/app/core/midi/useWebMidi.ts`  
**Why**: Production-hardened, better error handling than OP-1's current MIDI

**Effort**: 1 hour (testing with OP-1)  
**Impact**: More reliable MIDI reconnection

---

## 📋 PHASE 4: Component Refactoring (Weeks 6-7)

### Task 4.1: Migrate useState → Zustand (StudioMachinePanel.tsx)

**Current** (useState scattered):
```typescript
const [profile, setProfile] = useState(defaultProfile);
const [libraryPath, setLibraryPath] = useState(null);
const [isConnected, setIsConnected] = useState(false);
```

**New** (Zustand):
```typescript
const profile = useProfileStore((s) => s.profile);
const setProfile = useProfileStore((s) => s.setProfile);

const libraryPath = useLibraryStore((s) => s.libraryPath);
const isConnected = useDeviceStore((s) => s.isConnected);
```

**Files to Update**:
- [ ] `app/components/StudioMachinePanel.tsx` (major)
- [ ] `app/components/StudioTapeEditor.tsx` (minor)
- [ ] `app/components/FileLibraryPanel.tsx` (major)
- [ ] `app/page.tsx` (major - main page)

**Effort**: 8-10 hours  
**Testing**: All MIDI/file operations must work

---

### Task 4.2: Update useWebMidi Hook Integration

**File**: `app/components/StudioMachinePanel.tsx`

Replace OP-1's MIDI with EP-133's hook:
```typescript
import { useWebMidi } from '../core/midi/useWebMidi';

export function StudioMachinePanel() {
  const { devices, connected, send } = useWebMidi();
  const { isConnected, connect } = useDeviceStore();
  
  useEffect(() => {
    if (connected && !isConnected) {
      connect({ name: devices[0]?.name || 'OP-1', version: '246' });
    }
  }, [connected]);
  
  // Use send() instead of onSendMidi()
  const noteOn = (note: number) => {
    send([0x90, note, 100]);
  };
}
```

**Effort**: 2-3 hours  
**Testing**: Real OP-1 hardware test required

---

## 📋 PHASE 5: Testing & Validation (Weeks 8-9)

### Task 5.1: Add Vitest Setup (from EP-133)

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react
cp /home/azoth/EP-133-KO-II-Studio/vitest.config.ts /home/azoth/OP-1-Studio/
```

**Files to Create**:
- [ ] `vitest.config.ts`
- [ ] `tests/store.test.ts` (Zustand stores)
- [ ] `tests/storage.test.ts` (FSA + Tauri)
- [ ] `tests/midi.test.ts` (useWebMidi hook)

**Effort**: 4-5 hours  
**Impact**: Better code reliability

---

### Task 5.2: Hardware Testing

- [ ] Connect real OP-1 via USB
- [ ] Test MIDI: Note on/off, CC messages
- [ ] Test File System: Load keyboards, patches, samples
- [ ] Test Zustand state: Profile persistence across sessions
- [ ] Test dual-mode: Try both Tauri and FSA APIs

**Effort**: 3-4 hours  
**Critical**: Must pass before release

---

## 📋 PHASE 6: Cleanup & Deployment (Week 10)

### Task 6.1: Update Documentation

- [ ] Update README.md with new architecture
- [ ] Document `app/core/*` module exports
- [ ] Add Zustand store API docs
- [ ] Update CONTEXT.md with migration notes

**Effort**: 2-3 hours

---

### Task 6.2: Version Bump & Release

```bash
npm version minor  # 0.1.0 → 0.2.0
git tag v0.2.0
git push origin main --tags
```

**Effort**: 1 hour

---

## 🎯 Quick Start: Do This NOW

**This Week (Next 2 hours):**

```bash
cd /home/azoth/OP-1-Studio

# Step 1: Setup structure
mkdir -p app/core/{midi,storage,store,audio,utils}

# Step 2: Add Zustand
npm install zustand@latest

# Step 3: Copy key files from EP-133
cp ../EP-133-KO-II-Studio/src/core/storage/directoryHandleStore.ts app/core/storage/
cp ../EP-133-KO-II-Studio/src/core/midi/useWebMidi.ts app/core/midi/

# Step 4: Create first Zustand store
cat > app/core/store/profileStore.ts << 'EOF'
import { create } from 'zustand';

export const useProfileStore = create((set) => ({
  profileName: 'OP-1 Default',
  setProfileName: (name: string) => set({ profileName: name }),
}));
EOF

# Step 5: Test build
npm run build
```

**Expected Result**: Build passes, new stores usable

---

## 📊 Effort Summary

| Phase | Tasks | Hours | Duration |
|-------|-------|-------|----------|
| 1 | Setup dirs, add deps | 2-3 | 1 day |
| 2 | Create Zustand stores | 5-7 | 2-3 days |
| 3 | Web FS + copy files | 6-8 | 2-3 days |
| 4 | Refactor components | 10-15 | 3-4 days |
| 5 | Testing + hardware | 7-9 | 2-3 days |
| 6 | Docs + release | 3-4 | 1 day |
| **TOTAL** | **~45 tasks** | **~40-50h** | **8-10 weeks** |

---

## 🚨 Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking MIDI functionality | Keep old API as fallback, test with real OP-1 |
| State conflicts (Zustand + useState) | Migrate incrementally, one component at a time |
| File System API not supported (old browsers) | Detect + fallback to Tauri + web modal error |
| Lost configurations | Test localStorage + Drizzle persistence |

---

## ✅ Success Criteria

- [ ] All tests pass (31/31 + new Zustand tests)
- [ ] MIDI works: Notes, CC, device reconnection
- [ ] File operations work: Load/save keyboards, patches, samples
- [ ] State persists: Profile + library paths survive session
- [ ] Build succeeds: `npm run build` < 200ms
- [ ] Hardware test: Real OP-1 responds to commands
- [ ] No console errors: Clean dev server output

---

**Next**: Ready to start Task 1.1? I can guide you through each step. 🚀
