# OP-1 Studio Web Migration: Quick Start for Next Session

**TL;DR**: Complete 2 stores, migrate nativeStorage.ts, test. That's it.

---

## 🚀 DO THIS FIRST (Today)

### 1. Check What Exists
```bash
cd /home/azoth/OP-1-Studio
ls -la app/store/
ls -la app/core/storage/
ls -la app/core/midi/
```

**Expected**: 
- ✅ `app/store/profileStore.ts` (CREATED)
- ✅ `app/core/storage/webFileSystem.ts` (CREATED)
- ✅ `app/core/storage/directoryHandleStore.ts` (CREATED)
- ✅ `app/core/midi/useWebMidi.ts` (CREATED/ADAPTED)
- ⏳ `app/store/libraryStore.ts` (NEEDS COMPLETION)
- ⏳ `app/store/midiStore.ts` (DOESN'T EXIST YET)

### 2. Install Zustand (If Not Already)
```bash
npm list zustand
# If not there:
npm install zustand
```

---

## ✏️ YOUR JOBS (In Order)

### Job 1: Create `app/store/libraryStore.ts` (1-2 hours)
**Copy the template from** `HANDOFF_STATUS.md` (section "Step 1a")

**File location**: `/home/azoth/OP-1-Studio/app/store/libraryStore.ts`

**Key methods to implement**:
```typescript
- setKeyboardFolder(handle)
- setLibraryFolder(handle)
- setOp1DiskFolder(handle)
- addLibraryEntry(entry)
- removeLibraryEntry(path)
- loadSavedFolders()  // Load persisted handles
```

**Test checklist**:
- [ ] TypeScript compiles (no errors)
- [ ] Stores can be instantiated
- [ ] Methods are callable

---

### Job 2: Create `app/store/midiStore.ts` (1 hour)
**Copy the template from** `HANDOFF_STATUS.md` (section "Step 1b")

**File location**: `/home/azoth/OP-1-Studio/app/store/midiStore.ts`

**Key methods to implement**:
```typescript
- setConnected(status)
- setInputNames(names)
- setOutputNames(names)
- recordObservation(msg)
```

---

### Job 3: Migrate `app/lib/nativeStorage.ts` (4-6 hours)
**CRITICAL FILE** — This replaces all Tauri `invoke()` calls

**Reference**: `HANDOFF_STATUS.md` section "Step 2"

**What to do**:
1. Open `/home/azoth/OP-1-Studio/app/lib/nativeStorage.ts`
2. Find all `invoke()` calls (8 total)
3. Replace with dual-mode pattern:

```typescript
// PATTERN:
async function myCommand(): Promise<MyType> {
  if (hasNativeStorage()) {
    // OLD TAURI PATH
    return await invoke('my_command', {...});
  } else {
    // NEW FSA PATH
    const { keyboardFolderHandle } = useLibraryStore.getState();
    const result = await readJsonFile(keyboardFolderHandle, 'keyboard.json');
    if (!result.success) throw new Error(result.error?.message);
    return result.data;
  }
}
```

**8 Commands to migrate**:
- [ ] `keyboard_read` → `readJsonFile(keyboardFolder, 'keyboard.json')`
- [ ] `keyboard_write` → `writeJsonFile(keyboardFolder, 'keyboard.json', data)`
- [ ] `profile_read` → `readJsonFile(profileFolder, 'profile.json')`
- [ ] `profile_write` → `writeJsonFile(profileFolder, 'profile.json', data)`
- [ ] `library_initialise` → `createSubdirectory(libraryFolder, 'user')`
- [ ] `display_library_read` → `listDirectory(libraryFolder)`
- [ ] Remove `app_config_dir()` calls → Use `loadSavedFolders()`
- [ ] Remove `@tauri-apps` imports

---

### Job 4: Test Everything Locally (2 hours)
```bash
npm run typecheck    # Should PASS
npm run build        # Should SUCCEED
npm run dev          # Should START
# Open http://localhost:5173 in Chrome
```

**Manual Testing Checklist**:
- [ ] UI loads without errors
- [ ] Console has NO red errors
- [ ] File picker button (if any) works
- [ ] Can select a folder
- [ ] Can read/write files to that folder
- [ ] MIDI device detection works

---

## 📚 REFERENCE FILES

**Read in this order if confused:**

1. **This file** ← You are here
2. `/HANDOFF_STATUS.md` — Detailed status report
3. `/docs/MIGRATION_WEB_ROADMAP.md` — Full 8-10 week plan
4. `/app/store/profileStore.ts` — Example implementation (copy pattern)
5. `/home/azoth/EP-133-KO-II-Studio/src/core/store/languageStore.ts` — Another example

---

## 🔧 IMPORTS YOU'LL NEED

**For libraryStore.ts**:
```typescript
import { create } from 'zustand';
import type { LocalDirectoryHandle } from '../core/storage/directoryHandleStore';
import { storageHelpers } from '../core/storage/webFileSystem';
```

**For midiStore.ts**:
```typescript
import { create } from 'zustand';
import { MidiObservation } from '../core/midi/useWebMidi';
```

**For nativeStorage.ts** (additions):
```typescript
import { readJsonFile, writeJsonFile, hasFileSystemAccess } from '../core/storage/webFileSystem';
import { useLibraryStore } from '../store/libraryStore';
import { useProfileStore } from '../store/profileStore';

export async function hasNativeStorage(): boolean {
  return window.__TAURI__ !== undefined;
}
```

---

## ❌ DON'T DO (YET)

- ❌ Don't delete `/src-tauri/` (Phase 2 — later)
- ❌ Don't remove Tauri from package.json (Phase 2 — later)
- ❌ Don't add PWA support (Phase 4 — later)
- ❌ Don't change vite.config.ts (Phase 2 — later)

---

## ✅ SUCCESS = When You Can Say:

"I've:
- [ ] Created `libraryStore.ts` (compiles, tests pass)
- [ ] Created `midiStore.ts` (compiles, tests pass)
- [ ] Migrated `nativeStorage.ts` to dual-mode (8 commands updated)
- [ ] Ran `npm run dev` successfully
- [ ] Tested file picker and file I/O in Chrome
- [ ] No console errors"

---

## 📞 IF STUCK

1. **TypeScript errors?** → Check imports match your file paths
2. **Runtime errors?** → Look at console (F12 → Console tab)
3. **Forgotten how dual-mode works?** → Read `/app/store/profileStore.ts` again
4. **Not sure about FSA API?** → See `/app/core/storage/webFileSystem.ts` for all function signatures

---

## 🎉 When Done

Create a git commit:
```bash
git add app/store/libraryStore.ts app/store/midiStore.ts app/lib/nativeStorage.ts
git commit -m "feat: complete phase 1 stores and dual-mode nativeStorage migration"
git push
```

Then mark this handoff as ✅ COMPLETE and move to Phase 2.

---

**Estimated Time**: 8-10 hours  
**Difficulty**: Medium (mostly copy-paste pattern matching)  
**Blocker Risk**: LOW (Tauri still works as fallback)  

---

*Good luck! 🚀*
