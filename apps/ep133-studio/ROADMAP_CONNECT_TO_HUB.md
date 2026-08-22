# EP-133 Studio: Hub Integration Roadmap

> **DOCUMENT HISTORIQUE — spécification de raccord initiale.** La feuille de
> route active du monorepo est
> [`../../docs/ROADMAP.md`](../../docs/ROADMAP.md).

**For**: Development Team working on EP-133  
**Purpose**: Guide how to connect EP-133 Studio to Studio Hub  
**Date**: 16 August 2026  
**Status**: Partiellement livré — voir la feuille de route active du monorepo  

> Cette spécification décrit l’intention initiale. Le Hub lance maintenant
> EP‑133, transmet le profil, le nom et la capacité de la machine, transmet le
> workspace, propose le retour Hub et ouvre directement `game`, `sounds`,
> `docs` et `machine-test`. Les statistiques versionnées projets/samples/
> entraînement et le compteur de snapshots sont maintenant livrés côté Hub ;
> les stores partagés et les écritures matérielles restent ouverts.

La source de décision actuelle est [`../../docs/ROADMAP.md`](../../docs/ROADMAP.md).

### Validation locale ajoutée le 16 août 2026

- [x] Le Hub conserve la fiche et ouvre les 8 cartes d’outils dans un test navigateur.
- [x] Le lancement EP‑133 transmet `hubProfile`, machine nommée, capacité et `hubTool`.
- [x] L’écran **Sons & Transfert EP‑133** s’ouvre sans machine et affiche le bouton de connexion.
- [x] Les statistiques versionnées projets/samples/entraînement remontent vers le Hub ; le snapshot du coffre incrémente son compteur.
- [x] Un transfert préparé peut être retiré avant confirmation sans appeler l’écriture machine.
- [ ] Tester un vrai dossier partagé, le retour Hub après modification et les écritures ciblées avec checkpoint/relecture.

---

## 🎯 MISSION

Make EP-133 Studio work seamlessly with Studio Hub, so that:
1. ✅ Users create profile in Hub
2. ✅ Profile automatically loads in EP-133 when entered
3. ✅ EP-133 knows where to save/load files (from Hub workspace)
4. ✅ EP-133 inherits user preferences (language, MIDI channel, theme)
5. ✅ EP-133 can pass data back to Hub (patterns edited, training progress)

---

## 📍 CONTEXT

**Hub is the Portal**:
- User creates profile ("Alex", avatar, workspace folder)
- Hub stores everything in `player-profile/profile.json`
- Hub creates folder structure with `ep133/` subfolder

**EP-133 is a Studio**:
- When user clicks "Enter EP-133", Hub opens EP-133
- EP-133 should receive player profile & workspace path
- EP-133 uses these to initialize its UI & file operations

---

## 🔌 INTEGRATION POINTS

### 1. Hub → EP-133 (Initialization)

**When user clicks "Enter EP-133" from Hub:**

```
Hub (React)                    EP-133 (React)
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
   ├─ Navigate to /ep133/ ────────→
```

### 2. EP-133 → Hub (Updates)

**When user does something in EP-133:**

```
EP-133 (React)                 Hub (React)
   │                              │
   ├─ User edits pattern ──────→  │
   │                              ├─ Check if Hub running
   ├─ Update stats ────────────→  │
   │                              ├─ Refresh profile.stats.ep133
   ├─ Save project ────────────→  │
   │                              ├─ Update lastActiveAt
   │                              │
   │                              └─ Display updated stats
   │
   ├─ Complete training ───────→  │
   │                              ├─ Update trainingProgress
   │                              └─ Reflects in shared folder
```

---

## 🗃️ PLAN INITIAL HISTORIQUE — À RÉÉCRIRE

### STEP 1: Enhance Player Profile Store (WEEK 1)

**File**: `src/core/store/playerProfileStore.ts` (NEW)

**Note**: EP-133 currently has `useLanguageStore` but needs full profile integration

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
  stats: {
    ep133: {
      projectsCloned: number;
      patternsEdited: number;
      trainingProgress: number; // 0-100
      lastActiveAt: string;
    };
  };
}

interface PlayerProfileStore {
  profile: PlayerProfile | null;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  updateStats: (stats: Partial<PlayerProfile['stats']['ep133']>) => void;
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

      updateStats: (stats) => {
        set((state) => {
          if (!state.profile) return state;
          return {
            profile: {
              ...state.profile,
              stats: {
                ...state.profile.stats,
                ep133: {
                  ...state.profile.stats.ep133,
                  ...stats,
                  lastActiveAt: new Date().toISOString(),
                },
              },
            },
          };
        });
      },

      clearProfile: () => {
        set({ profile: null });
        sessionStorage.removeItem('hub:playerProfile');
      },
    }),
    {
      name: 'ep133-player-profile',
    },
  ),
);
```

---

### STEP 2: Create Workspace Store (WEEK 1)

**File**: `src/core/store/workspaceStore.ts` (NEW)

```typescript
import { create } from 'zustand';
import {
  loadDirectoryHandle,
  saveDirectoryHandle,
  type LocalDirectoryHandle,
} from '../storage/directoryHandleStore';

interface WorkspaceStore {
  rootPath: string | null;
  ep133FolderHandle: LocalDirectoryHandle | null;
  ep133FolderPath: string | null;
  sharedFolderHandle: LocalDirectoryHandle | null;

  setWorkspacePath: (path: string) => void;
  setEp133FolderPath: (path: string) => void;
  setEp133FolderHandle: (handle: LocalDirectoryHandle) => void;
  setSharedFolderHandle: (handle: LocalDirectoryHandle) => void;
  loadSavedFolders: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  rootPath: null,
  ep133FolderHandle: null,
  ep133FolderPath: null,
  sharedFolderHandle: null,

  setWorkspacePath: (path) => {
    set({ rootPath: path });
    localStorage.setItem('ep133:workspace:root', path);
  },

  setEp133FolderPath: (path) => {
    set({ ep133FolderPath: path });
    localStorage.setItem('ep133:workspace:ep133Folder', path);
  },

  setEp133FolderHandle: (handle) => {
    set({ ep133FolderHandle: handle });
    void saveDirectoryHandle('ep133-folder', handle);
  },

  setSharedFolderHandle: (handle) => {
    set({ sharedFolderHandle: handle });
    void saveDirectoryHandle('shared-folder', handle);
  },

  loadSavedFolders: async () => {
    const [ep133Handle, sharedHandle] = await Promise.all([
      loadDirectoryHandle('ep133-folder'),
      loadDirectoryHandle('shared-folder'),
    ]);

    set({
      ep133FolderHandle: ep133Handle,
      sharedFolderHandle: sharedHandle,
    });
  },
}));
```

---

### STEP 3: Create Hub Initialization Hook (WEEK 1)

**File**: `src/hooks/useHubInitialization.ts` (NEW)

```typescript
/**
 * Hook that initializes EP-133 with Hub profile & workspace
 * Called once when EP-133 app starts
 * 
 * Handles:
 * - Loading player profile from Hub
 * - Setting up workspace folder handles
 * - Initializing stores
 * - Applying user preferences
 */

import { useEffect } from 'react';
import { usePlayerProfileStore } from '../core/store/playerProfileStore';
import { useWorkspaceStore } from '../core/store/workspaceStore';
import { useLanguageStore } from '../core/store/languageStore';

interface HubProfile {
  name: string;
  avatar: string;
  avatarEmoji?: string;
  settings: {
    preferredLanguage: 'en' | 'fr' | 'es';
    theme: 'light' | 'dark' | 'auto';
    midiChannel: number;
  };
  workspace: {
    rootPath: string;
    ep133Folder: string;
    sharedFolder: string;
  };
  ownedMachines: {
    ep133?: {
      enabled: boolean;
      serialNumber?: string;
      lastConnected?: string;
    };
  };
}

export function useHubInitialization() {
  const { updateProfile } = usePlayerProfileStore();
  const { setWorkspacePath, setEp133FolderPath } = useWorkspaceStore();
  const { setLanguage } = useLanguageStore();

  useEffect(() => {
    const initializeFromHub = async () => {
      try {
        // Method 1: Get from sessionStorage (Hub passes it)
        const hubProfileJson = sessionStorage.getItem('hub:playerProfile');
        if (hubProfileJson) {
          const hubProfile = JSON.parse(hubProfileJson) as HubProfile;

          // Apply to EP-133 stores
          updateProfile({
            name: hubProfile.name,
            avatar: hubProfile.avatar,
            avatarEmoji: hubProfile.avatarEmoji,
            settings: hubProfile.settings,
          });

          setWorkspacePath(hubProfile.workspace.rootPath);
          setEp133FolderPath(hubProfile.workspace.ep133Folder);

          setLanguage(hubProfile.settings.preferredLanguage);

          // Store MIDI channel as preference
          localStorage.setItem(
            'ep133:midiChannel',
            hubProfile.settings.midiChannel.toString()
          );

          console.log(
            `✅ EP-133 initialized from Hub for ${hubProfile.name}`
          );
          return;
        }

        // Method 2: Get from localStorage fallback (for standalone mode)
        const localProfileJson = localStorage.getItem(
          'ep133:playerProfile'
        );
        if (localProfileJson) {
          const localProfile = JSON.parse(localProfileJson);
          updateProfile(localProfile);
          console.log(
            `ℹ️ EP-133 using local profile (not from Hub)`
          );
          return;
        }

        // Method 3: No profile found → Show onboarding
        console.warn('⚠️ No profile found. EP-133 should show setup.');
      } catch (error) {
        console.error('Failed to initialize from Hub:', error);
      }
    };

    initializeFromHub();
  }, [updateProfile, setWorkspacePath, setEp133FolderPath, setLanguage]);
}
```

**Usage in App.tsx**:
```typescript
export function App() {
  // Initialize with Hub profile first
  useHubInitialization();

  const { profile } = usePlayerProfileStore();

  if (!profile) {
    return <OnboardingFlow />;
  }

  return (
    <div className="ep133-studio">
      <Header greeting={`Welcome back, ${profile.name}!`} />
      <MainUI />
    </div>
  );
}
```

---

### STEP 4: Update Studio Library to Use Workspace (WEEK 2)

**File**: `src/core/project/studioLibrary.ts` (EXISTING, UPDATE)

Currently uses hardcoded paths. Update to use workspace folder:

```typescript
import { useWorkspaceStore } from '../store/workspaceStore';

export class StudioLibrary {
  async getProjectsPath(): Promise<LocalDirectoryHandle> {
    const { ep133FolderHandle } = useWorkspaceStore.getState();
    
    if (!ep133FolderHandle) {
      throw new Error('EP-133 workspace not configured');
    }

    // projects/ folder should exist from Hub setup
    return await ep133FolderHandle.getDirectoryHandle('projects');
  }

  async getSamplesPath(): Promise<LocalDirectoryHandle> {
    const { ep133FolderHandle } = useWorkspaceStore.getState();
    
    if (!ep133FolderHandle) {
      throw new Error('EP-133 workspace not configured');
    }

    return await ep133FolderHandle.getDirectoryHandle('samples');
  }

  // All existing methods now use workspace paths
}
```

---

### STEP 5: Create Hub Communication Module (WEEK 2)

**File**: `src/core/hub/hubCommunication.ts` (NEW)

```typescript
/**
 * Communication channel between EP-133 Studio and Studio Hub
 * Handles:
 * - Profile updates (stats, last active time)
 * - Pattern creation notifications
 * - Training progress updates
 */

type HubEventType =
  | 'pattern_created'
  | 'song_edited'
  | 'training_completed'
  | 'clone_updated'
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
      this.isConnected = true;
      console.log('✅ EP-133 detected as running inside Hub');
    } else if (window.opener) {
      this.isConnected = true;
      console.log('✅ EP-133 detected as running from Hub');
    } else {
      console.log('ℹ️ EP-133 running in standalone mode (not from Hub)');
    }
  }

  sendEvent(event: HubEvent) {
    if (this.isConnected) {
      window.parent.postMessage(
        {
          source: 'ep133-studio',
          event,
        },
        '*'
      );
    } else {
      this.eventQueue.push(event);
    }
  }

  notifyPatternCreated(count: number) {
    this.sendEvent({
      type: 'pattern_created',
      timestamp: new Date().toISOString(),
      data: { count },
    });
  }

  notifyTrainingCompleted(exerciseId: string, score: number) {
    this.sendEvent({
      type: 'training_completed',
      timestamp: new Date().toISOString(),
      data: { exerciseId, score },
    });
  }

  updateStats(stats: { patternsEdited: number; trainingProgress: number }) {
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
// When user completes training exercise
hubCommunication.notifyTrainingCompleted('exercise-001', 92);

// Hub can then update profile: {ep133.trainingProgress: 65}
```

---

### STEP 6: Add Hub Navigation (WEEK 3)

**File**: `src/components/shared/HubNavigation.tsx` (EXISTING, UPDATE)

Add Hub button to existing navigation:

```typescript
import { usePlayerProfileStore } from '../../core/store/playerProfileStore';

export function HubNavigation() {
  const { profile } = usePlayerProfileStore();

  function navigateToHub() {
    const hubOrigin = new URL(new URLSearchParams(window.location.search).get('hubReturn') || window.location.origin).origin;
    // Method 1: If in iframe/window from Hub
    if (window.parent !== window) {
      window.parent.postMessage({ action: 'go-to-hub' }, hubOrigin);
    }
    // Method 2: If standalone, just go to home
    else {
      window.location.href = '/';
    }
  }

  return (
    <nav className="ep133-hub-nav">
      <div className="nav-left">
        <button onClick={() => navigateToHub()}>🏠 Hub</button>
        <span className="divider">|</span>
        <span className="active">EP-133 Studio</span>
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

## 📋 CHECKLIST

**Week 1**:
- [ ] Create `playerProfileStore.ts` (Zustand)
- [ ] Create `workspaceStore.ts` (Zustand)
- [ ] Create `useHubInitialization.ts` hook
- [ ] Update `App.tsx` to use hook
- [ ] Test: Profile loads when EP-133 launches
- [ ] Test: Workspace paths set correctly
- [ ] Test: Language preference applied

**Week 2**:
- [ ] Update `studioLibrary.ts` to use workspace
- [ ] Create `hubCommunication.ts` module
- [ ] Test: Projects save to correct folder
- [ ] Test: Can read cloned samples
- [ ] Test: Notifications send to Hub

**Week 3**:
- [ ] Update navigation to include Hub button
- [ ] Test: Can navigate back to Hub
- [ ] Test: Stats update in Hub when EP-133 used
- [ ] End-to-end test: Hub → EP-133 → Edit → Hub

---

## 🔗 REFERENCE

**Hub Profile Structure**: See `/STUDIO_HUB_ONBOARDING_SYSTEM.md`
- `profile.workspace.ep133Folder` → Use this path
- `profile.settings.midiChannel` → Use this for MIDI
- `profile.settings.preferredLanguage` → Already in useLanguageStore

**Workspace Folder Structure**: See `/STUDIO_HUB_ONBOARDING_SYSTEM.md` "Step 3"

---

## 🧪 TESTING

### Scenario 1: Hub → EP-133 (Profile Loading)
```
1. User creates profile in Hub (name: "Alex")
2. User clicks "Enter EP-133"
3. EP-133 loads, displays "Welcome Alex! 😎"
4. EP-133 folder handle initialized
5. Can access projects/samples folders
6. ✅ PASS
```

### Scenario 2: EP-133 → Hub (Stats Update)
```
1. User edits patterns in EP-133
2. hubCommunication.updateStats() called
3. Hub receives message
4. Hub profile updated: patternsEdited: 5
5. User returns to Hub
6. Stats visible on dashboard
7. ✅ PASS
```

---

## 📞 QUESTIONS?

- **Q**: Should EP-133 always require Hub profile?
- **A**: No. Can work standalone. Hub profile is optional enhancement.

- **Q**: What if workspace folder is deleted?
- **A**: Show error, allow user to reconfigure in Hub.

- **Q**: Should EP-133 auto-save stats?
- **A**: On significant events (pattern save, training complete). Not every keystroke.

---

*Roadmap Created: 15 August 2026*  
*For EP-133 Development Team*  
*Expected Completion: 3 weeks*
