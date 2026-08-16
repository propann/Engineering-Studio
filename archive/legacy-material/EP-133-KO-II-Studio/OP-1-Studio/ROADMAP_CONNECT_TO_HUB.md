# OP-1 Studio: Hub Integration Roadmap

**For**: IA Developer working on OP-1 Web Migration  
**Purpose**: Guide how to connect OP-1 Studio to Studio Hub  
**Date**: 15 August 2026  
**Status**: Implementation Specification  

---

## 🎯 MISSION

Make OP-1 Studio work seamlessly with Studio Hub, so that:
1. ✅ Users create profile in Hub
2. ✅ Profile automatically loads in OP-1 when entered
3. ✅ OP-1 knows where to save/load files (from Hub workspace)
4. ✅ OP-1 inherits user preferences (language, MIDI channel, theme)
5. ✅ OP-1 can pass data back to Hub (backups created, stats updated)

---

## 📍 CONTEXT

**Hub is the Portal**:
- User creates profile ("Alex", avatar, workspace folder)
- Hub stores everything in `player-profile/profile.json`
- Hub creates folder structure with `op1/` subfolder

**OP-1 is a Studio**:
- When user clicks "Enter OP-1", Hub opens OP-1
- OP-1 should receive player profile & workspace path
- OP-1 uses these to initialize its UI & file operations

---

## 🔌 INTEGRATION POINTS

### 1. Hub → OP-1 (Initialization)

**When user clicks "Enter OP-1" from Hub:**

```
Hub (React)                    OP-1 (React)
   │                              │
   ├─ Load profile.json ──────→   │
   │                              ├─ Parse profile
   ├─ Get workspace path ──────→  │
   │                              ├─ Set folder handles
   │                              │
   │                              ├─ Update stores:
   │                              │  • usePlayerProfileStore
   │                              │  • useWorkspaceStore
   │                              │
   │                              ├─ Load UI
   │                              └─ Ready! Display "Welcome Alex!"
   │
   ├─ Navigate to /op1/ ─────────→
```

### 2. OP-1 → Hub (Updates)

**When user does something in OP-1:**

```
OP-1 (React)                   Hub (React)
   │                              │
   ├─ User creates backup ─────→  │
   │                              ├─ Check if Hub running
   ├─ Update profile.json ─────→  │
   │                              ├─ Refresh profile
   ├─ Update stats ────────────→  │
   │                              └─ Display updated stats
   │
   ├─ Save keyboard config ────→  │
   │                              ├─ Reflects in shared folder
   │                              └─ Available to other studios
```

---

## 🛠️ IMPLEMENTATION STEPS

### STEP 1: Create Hub Initialization Hook (PHASE 1.5)

**File**: `/app/hooks/useHubInitialization.ts`

**Purpose**: OP-1 receives profile from Hub when loaded

```typescript
/**
 * Hook that initializes OP-1 with Hub profile & workspace
 * Called once when OP-1 app starts
 * 
 * Handles:
 * - Loading player profile from Hub
 * - Setting up workspace folder handles
 * - Initializing stores
 * - Applying user preferences
 */

import { useEffect } from 'react';
import { usePlayerProfileStore } from '../store/playerProfileStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useLanguageStore } from '../store/languageStore';
import { useThemeStore } from '../store/themeStore';

interface HubProfile {
  name: string;
  avatar: string;
  avatarEmoji?: string;
  settings: {
    preferredLanguage: 'en' | 'fr' | 'es';
    theme: 'light' | 'dark' | 'auto';
    midiChannel: number;
    velocityDefault: number;
  };
  workspace: {
    rootPath: string;
    op1Folder: string;
  };
  ownedMachines: {
    op1?: {
      enabled: boolean;
      serialNumber?: string;
      lastConnected?: string;
    };
  };
}

export function useHubInitialization() {
  const { updateProfile } = usePlayerProfileStore();
  const { setWorkspacePath, setOp1FolderPath } = useWorkspaceStore();
  const { setLanguage } = useLanguageStore();
  const { setTheme } = useThemeStore();

  useEffect(() => {
    // Try to get profile from Hub (via window.parent or sessionStorage)
    const initializeFromHub = async () => {
      try {
        // Method 1: Get from sessionStorage (Hub passes it)
        const hubProfileJson = sessionStorage.getItem('hub:playerProfile');
        if (hubProfileJson) {
          const hubProfile = JSON.parse(hubProfileJson) as HubProfile;
          
          // Apply to OP-1 stores
          updateProfile({
            name: hubProfile.name,
            avatar: hubProfile.avatar,
            avatarEmoji: hubProfile.avatarEmoji,
          });
          
          setWorkspacePath(hubProfile.workspace.rootPath);
          setOp1FolderPath(hubProfile.workspace.op1Folder);
          
          setLanguage(hubProfile.settings.preferredLanguage);
          setTheme(hubProfile.settings.theme);
          
          // Store MIDI channel as preference
          localStorage.setItem('op1:midiChannel', hubProfile.settings.midiChannel.toString());
          
          console.log(`✅ OP-1 initialized from Hub for ${hubProfile.name}`);
          return;
        }

        // Method 2: Get from localStorage fallback (for standalone mode)
        const localProfileJson = localStorage.getItem('op1:playerProfile');
        if (localProfileJson) {
          const localProfile = JSON.parse(localProfileJson);
          updateProfile(localProfile);
          console.log(`ℹ️ OP-1 using local profile (not from Hub)`);
          return;
        }

        // Method 3: No profile found → Show onboarding
        console.warn('⚠️ No profile found. OP-1 should show setup.');
        
      } catch (error) {
        console.error('Failed to initialize from Hub:', error);
      }
    };

    initializeFromHub();
  }, [updateProfile, setWorkspacePath, setOp1FolderPath, setLanguage, setTheme]);
}
```

**Usage in App.tsx**:
```typescript
function App() {
  // Initialize with Hub profile first
  useHubInitialization();
  
  const { profile } = usePlayerProfileStore();
  
  return (
    <div className="op1-studio">
      {profile ? (
        <>
          <Header greeting={`Welcome back, ${profile.name}!`} />
          <MainUI />
        </>
      ) : (
        <OnboardingFlow />
      )}
    </div>
  );
}
```

---

### STEP 2: Create Stores for Hub Integration (PHASE 1.5)

**File**: `/app/store/playerProfileStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlayerProfile {
  name: string;
  avatar: string;
  avatarEmoji?: string;
  settings: {
    preferredLanguage: 'en' | 'fr' | 'es';
    theme: 'light' | 'dark' | 'auto';
    midiChannel: number;
    velocityDefault: number;
  };
}

interface PlayerProfileStore {
  profile: PlayerProfile | null;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  clearProfile: () => void;
}

export const usePlayerProfileStore = create<PlayerProfileStore>()(
  persist(
    (set) => ({
      profile: null,

      updateProfile: (updates) => {
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates }
            : (updates as PlayerProfile),
        }));
      },

      clearProfile: () => {
        set({ profile: null });
        sessionStorage.removeItem('hub:playerProfile');
      },
    }),
    {
      name: 'op1-player-profile',
    },
  ),
);
```

**File**: `/app/store/workspaceStore.ts`

```typescript
import { create } from 'zustand';
import type { LocalDirectoryHandle } from '../core/storage/directoryHandleStore';
import { loadDirectoryHandle, saveDirectoryHandle } from '../core/storage/directoryHandleStore';

interface WorkspaceStore {
  rootPath: string | null;
  op1FolderHandle: LocalDirectoryHandle | null;
  op1FolderPath: string | null;
  
  setWorkspacePath: (path: string) => void;
  setOp1FolderPath: (path: string) => void;
  setOp1FolderHandle: (handle: LocalDirectoryHandle) => void;
  loadSavedFolder: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  rootPath: null,
  op1FolderHandle: null,
  op1FolderPath: null,

  setWorkspacePath: (path) => {
    set({ rootPath: path });
    localStorage.setItem('op1:workspace:root', path);
  },

  setOp1FolderPath: (path) => {
    set({ op1FolderPath: path });
    localStorage.setItem('op1:workspace:op1Folder', path);
  },

  setOp1FolderHandle: (handle) => {
    set({ op1FolderHandle: handle });
    void saveDirectoryHandle('op1-folder', handle);
  },

  loadSavedFolder: async () => {
    const handle = await loadDirectoryHandle('op1-folder');
    if (handle) {
      set({ op1FolderHandle: handle });
    }
  },
}));
```

---

### STEP 3: Update File Operations (PHASE 2)

**File**: `/app/lib/nativeStorage.ts` (already being migrated)

**Key change**: Use workspace path from store

```typescript
import { useWorkspaceStore } from '../store/workspaceStore';
import { readJsonFile, writeJsonFile } from '../core/storage/webFileSystem';

async function readKeyboard() {
  const { op1FolderHandle } = useWorkspaceStore.getState();
  
  if (!op1FolderHandle) {
    throw new Error('OP-1 folder not configured. Run onboarding.');
  }

  // OLD: return await invoke('keyboard_read');
  // NEW: Use FSA
  const result = await readJsonFile(op1FolderHandle, 'keyboard.json');
  if (!result.success) throw new Error(result.error?.message);
  return result.data;
}

async function writeKeyboard(data: any) {
  const { op1FolderHandle } = useWorkspaceStore.getState();
  
  if (!op1FolderHandle) {
    throw new Error('OP-1 folder not configured.');
  }

  const result = await writeJsonFile(op1FolderHandle, 'keyboard.json', data, {
    atomic: true,
  });
  if (!result.success) throw new Error(result.error?.message);
  
  // Notify Hub that config was updated
  notifyHubUpdate('keyboard_config', { timestamp: new Date().toISOString() });
}
```

---

### STEP 4: Create Hub Communication Module (PHASE 3)

**File**: `/app/core/hub/hubCommunication.ts`

**Purpose**: Send updates back to Hub

```typescript
/**
 * Communication channel between OP-1 Studio and Studio Hub
 * Handles:
 * - Profile updates (stats, last active time)
 * - Backup notifications
 * - Shared resource updates
 */

type HubEventType =
  | 'backup_created'
  | 'keyboard_config_saved'
  | 'library_sound_added'
  | 'session_update'
  | 'error';

interface HubEvent {
  type: HubEventType;
  timestamp: string;
  data?: any;
}

class HubCommunicationChannel {
  private isConnected: boolean = false;
  private eventQueue: HubEvent[] = [];

  constructor() {
    this.detectHub();
  }

  private detectHub() {
    // Check if running inside Hub (iframe or parent window)
    if (window.parent !== window) {
      // Running in iframe inside Hub
      this.isConnected = true;
      console.log('✅ OP-1 detected as running inside Hub');
    } else if (window.opener) {
      // Running as popup from Hub
      this.isConnected = true;
      console.log('✅ OP-1 detected as running from Hub');
    } else {
      // Running standalone
      console.log('ℹ️ OP-1 running in standalone mode (not from Hub)');
    }
  }

  sendEvent(event: HubEvent) {
    if (this.isConnected) {
      // Send to Hub
      window.parent.postMessage(
        {
          source: 'op1-studio',
          event,
        },
        '*'
      );
    } else {
      // Queue for later
      this.eventQueue.push(event);
    }
  }

  notifyBackupCreated(backupInfo: { timestamp: string; size: number }) {
    this.sendEvent({
      type: 'backup_created',
      timestamp: new Date().toISOString(),
      data: backupInfo,
    });
  }

  notifyKeyboardConfigSaved() {
    this.sendEvent({
      type: 'keyboard_config_saved',
      timestamp: new Date().toISOString(),
    });
  }

  updateStats(stats: { editTime: number; soundsCreated: number }) {
    this.sendEvent({
      type: 'session_update',
      timestamp: new Date().toISOString(),
      data: stats,
    });
  }
}

export const hubCommunication = new HubCommunicationChannel();
```

**Usage**:
```typescript
// When backup is created
hubCommunication.notifyBackupCreated({
  timestamp: new Date().toISOString(),
  size: fileSize,
});

// Hub can then update profile: {op1.backupsCreated: 4}
```

---

### STEP 5: Hub Navigation Integration (PHASE 3)

**File**: `/app/components/shared/HubNavigation.tsx`

```typescript
import { usePlayerProfileStore } from '../../store/playerProfileStore';
import { useNavigateToHub } from '../../hooks/useNavigateToHub';

export function HubNavigation() {
  const { profile } = usePlayerProfileStore();
  const navigateToHub = useNavigateToHub();

  return (
    <nav className="op1-hub-nav">
      <div className="nav-left">
        <button onClick={() => navigateToHub()}>🏠 Hub</button>
        <span className="divider">|</span>
        <span className="active">OP-1 Studio</span>
      </div>

      <div className="nav-center">
        {profile && (
          <span className="player-name">
            {profile.avatar} {profile.name}
          </span>
        )}
      </div>

      <div className="nav-right">
        <button onClick={() => openSettings()}>⚙️</button>
      </div>
    </nav>
  );
}
```

---

## 📋 CHECKLIST FOR IA-OP-1

**Complete in this order:**

### Phase 1.5 (This Week)
- [ ] Create `useHubInitialization.ts` hook
- [ ] Create `playerProfileStore.ts` (Zustand)
- [ ] Create `workspaceStore.ts` (Zustand)
- [ ] Update `App.tsx` to use `useHubInitialization()`
- [ ] Test: Profile loads when OP-1 launches
- [ ] Test: Workspace paths are set correctly

### Phase 2 (Week 2)
- [ ] Update `nativeStorage.ts` to use workspace folder handles
- [ ] Test: Can read/write files to Hub workspace
- [ ] Test: keyboard.json found in correct folder
- [ ] Test: Works in both Hub and standalone modes

### Phase 3 (Week 3+)
- [ ] Create `hubCommunication.ts` module
- [ ] Add Hub navigation to OP-1 UI
- [ ] Send backup notifications to Hub
- [ ] Update Hub profile stats when OP-1 actions happen
- [ ] Test round-trip: Create backup in OP-1 → See in Hub profile

---

## 🔗 REFERENCE POINTS

**Hub Profile Structure**: See `/STUDIO_HUB_ONBOARDING_SYSTEM.md`
- `profile.workspace.op1Folder` → Use this path
- `profile.settings.midiChannel` → Use this for MIDI
- `profile.settings.preferredLanguage` → Use this for i18n

**Hub Communication Pattern**: See `hubCommunication.ts` above

**Workspace Folder Structure**: See `/STUDIO_HUB_ONBOARDING_SYSTEM.md` "Step 3"

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Hub → OP-1 (Profile Loading)
```
1. User creates profile in Hub (name: "Alex", avatar: 😎)
2. User clicks "Enter OP-1"
3. Hub passes profile via sessionStorage
4. OP-1 loads, displays "Welcome Alex! 😎"
5. OP-1 folder handle initialized
6. ✅ PASS
```

### Scenario 2: OP-1 → Hub (Backup Notification)
```
1. User in OP-1 creates backup
2. OP-1 sends hubCommunication.notifyBackupCreated()
3. Hub receives message, updates profile stats
4. User goes back to Hub
5. Stats show: backupsCreated: 1
6. ✅ PASS
```

### Scenario 3: Standalone Mode (No Hub)
```
1. User opens OP-1 directly (not from Hub)
2. Hub initialization detects no Hub connection
3. Falls back to localStorage profile
4. OP-1 shows onboarding
5. User completes setup locally
6. ✅ PASS (both modes work)
```

---

## 📞 QUESTIONS?

- **Q**: What if user doesn't complete Hub onboarding?
- **A**: OP-1 can still run in standalone mode, complete local setup

- **Q**: Does OP-1 need to support multi-user?
- **A**: Not now. Each profile is per-device. Hub manages switching.

- **Q**: How often to update Hub stats?
- **A**: On significant events (backup, config save). Not on every keystroke.

---

*Roadmap Created: 15 August 2026*  
*For IA-OP-1 Developer*  
*Expected Completion: Phase 1.5 by end of week*
