# EP-133: Cleanup - Remove Local Profile System

**Purpose**: Remove local player profile creation from EP-133  
**Reason**: Profile now managed ONLY by Studio Hub (centralized)  
**Status**: Specification for cleanup  
**Date**: 15 August 2026  

---

## 🎯 MISSION

**Before (Old)**:
```
EP-133 has its own player profile creation
├── Pages/PlayerProfilePage.tsx
├── Store/playerProfileStore.ts (local)
├── Settings for user (local)
└── Avatar, name, stats (EP-133 only)
```

**After (New - Hub Centralized)**:
```
Studio Hub creates SINGLE profile
├── Player profile created in Hub
├── EP-133 READS from Hub
├── No local creation in EP-133
└── All studios share same profile
```

---

## 🧹 FILES TO REMOVE

### Pages to DELETE:
```
src/pages/PlayerProfilePage.tsx
  ✗ REMOVE entirely
  → This was for local profile management
  → Hub now provides this
```

### Components to DELETE:
```
src/components/shared/Avatar.tsx (if only for local profile)
  ? Check if used elsewhere
  ? If only in PlayerProfilePage → REMOVE
  ? If used in other places → KEEP

src/components/PlayerProfileForm.tsx (if exists)
  ✗ REMOVE entirely
  → Local form no longer needed
```

### Stores to KEEP (but modify):
```
src/core/store/ 
├── playerProfileStore.ts
│   → KEEP but change to READ-ONLY
│   → Only accepts profile from Hub
│   → No local create/edit
│   └── Remove: updateProfile(), createProfile()
│   └── Keep: profile getter, setProfile() for Hub data

└── (Don't create new local stores)
```

---

## 📋 CHECKLIST: WHAT TO REMOVE

### Code Files
- [ ] `src/pages/PlayerProfilePage.tsx` — DELETE
- [ ] `src/components/PlayerProfileForm.tsx` — DELETE (if exists)
- [ ] `src/components/PlayerProfileEditor.tsx` — DELETE (if exists)
- [ ] Any profile-related components that are UI for LOCAL editing

### Routes
- [ ] Remove route to `/player-profile/` page
- [ ] Remove from navigation menu (PlayerProfilePage link)

### Store Logic
- [ ] In `playerProfileStore.ts`: Remove `createProfile()` method
- [ ] In `playerProfileStore.ts`: Remove `updateProfile()` method (except for Hub sync)
- [ ] Remove any localStorage code that persists profile LOCALLY
- [ ] Remove any form validation for profile creation

### Settings/UI
- [ ] Remove profile edit option from settings menu
- [ ] Remove "Create Profile" flow from onboarding (if exists)
- [ ] Remove profile customization UI

---

## 📝 WHAT TO KEEP/MODIFY

### playerProfileStore.ts - NEW VERSION

```typescript
import { create } from 'zustand';

interface PlayerProfile {
  name: string;
  avatar: string;
  avatarEmoji?: string;
  settings: {
    preferredLanguage: 'en' | 'fr' | 'es';
    theme: 'light' | 'dark' | 'auto';
    midiChannel: number;
    velocityDefault: number;
  };
  stats?: {
    ep133: {
      patternsEdited: number;
      trainingProgress: number;
      lastActiveAt: string;
    };
  };
}

interface PlayerProfileStore {
  profile: PlayerProfile | null;
  
  // ✅ KEEP THIS
  setProfile: (profile: PlayerProfile | null) => void;
  updateStats: (stats: Partial<PlayerProfile['stats']['ep133']>) => void;
  
  // ❌ REMOVE THESE
  // createProfile() — No longer needed
  // updateProfile() — No longer needed
  // editName() — No longer needed
  // editAvatar() — No longer needed
}

export const usePlayerProfileStore = create<PlayerProfileStore>((set) => ({
  profile: null,

  setProfile: (profile) => {
    set({ profile });
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
              ...state.profile.stats?.ep133,
              ...stats,
              lastActiveAt: new Date().toISOString(),
            },
          },
        },
      };
    });
  },

  // REMOVED:
  // createProfile() {}
  // updateProfile() {}
  // editName() {}
  // editAvatar() {}
}));
```

---

## 🔄 WHERE PROFILE COMES FROM NOW

### OLD FLOW (Remove this):
```
User opens EP-133
  └── No profile found?
      └── Show onboarding/setup screen
          └── User creates profile IN EP-133
              └── Profile stored locally
```

### NEW FLOW (Implement this):
```
User opens Hub
  └── Create profile in Hub
      └── Click "Enter EP-133"
          └── Hub passes profile to EP-133
              └── EP-133 reads from Hub
                  └── Profile displayed (read-only)
```

---

## 📍 COMPONENTS THAT READ PROFILE (KEEP THESE)

### Components that DISPLAY profile (keep):
```
src/components/shared/PlayerCard.tsx
  ✓ KEEP - Shows player info
  ✓ Just remove edit button

src/components/shared/HubNavigation.tsx
  ✓ KEEP - Shows player in header
  ✓ Clicking goes to Hub

src/components/SessionIndicator.tsx
  ✓ KEEP - Shows session stats
  ✓ Read-only display
```

### Pages that READ profile (keep):
```
src/pages/HomePage.tsx
  ✓ KEEP - Welcome greeting
  ✓ Just remove "Edit Profile" button

src/pages/App.tsx
  ✓ KEEP - Initialize profile from Hub
  ✓ Call useHubInitialization()
```

---

## 🔧 IMPLEMENTATION TASKS

### Step 1: Remove Profile Page & Routes
```typescript
// In src/App.tsx or route config
// REMOVE THIS:
// import PlayerProfilePage from './pages/PlayerProfilePage';
// route: { path: '/player-profile', component: PlayerProfilePage }
```

### Step 2: Remove Edit Buttons
```typescript
// In HomePage.tsx or components
// REMOVE:
// <button onClick={() => navigate('/player-profile')}>Edit Profile</button>

// REMOVE from settings menu:
// <MenuItem onClick={() => navigate('/player-profile')}>Profile Settings</MenuItem>
```

### Step 3: Clean Up Stores
```typescript
// In playerProfileStore.ts
// REMOVE these functions:
// - createProfile()
// - updateProfile()
// - editName()
// - editAvatar()
// - saveToLocalStorage()

// KEEP:
// - setProfile() (for Hub data)
// - updateStats() (for session tracking)
```

### Step 4: Remove Local Storage Profile Code
```typescript
// REMOVE:
// localStorage.getItem('ep133:playerProfile')
// localStorage.setItem('ep133:playerProfile', ...)
// localStorage.removeItem('ep133:playerProfile')

// KEEP only Hub initialization:
// sessionStorage.getItem('hub:playerProfile')
```

### Step 5: Update Navigation
```typescript
// Remove profile links from menus:
// - Settings panel
// - Nav bar
// - Sidebar
// - Anywhere showing "Edit Profile"
```

---

## ✅ FINAL STATE

After cleanup, EP-133 will:

✅ **Receive profile from Hub** (on startup)  
✅ **Display profile info** (read-only)  
✅ **Track personal stats** (patterns, training)  
✅ **Send updates to Hub** (via hubCommunication)  
✅ **NO local profile creation** (centralized in Hub)  
✅ **NO local profile editing** (centralized in Hub)  

---

## 📋 FILES AFFECTED

| File | Action | Why |
|------|--------|-----|
| `src/pages/PlayerProfilePage.tsx` | DELETE | No longer needed |
| `src/pages/HomePage.tsx` | UPDATE | Remove "Edit" button |
| `src/App.tsx` | UPDATE | Remove profile route |
| `src/core/store/playerProfileStore.ts` | MODIFY | Keep read-only |
| `src/components/shared/HubNavigation.tsx` | UPDATE | Remove profile edit link |
| Settings menu | UPDATE | Remove "Edit Profile" option |

---

## 🎯 VALIDATION CHECKLIST

After cleanup, verify:

- [ ] PlayerProfilePage is deleted
- [ ] No "Edit Profile" buttons exist
- [ ] Profile route doesn't exist
- [ ] playerProfileStore only has: setProfile(), updateStats()
- [ ] Profile loads from Hub on startup
- [ ] Profile displays correctly (read-only)
- [ ] Stats update when editing patterns
- [ ] Navigation to Hub works
- [ ] No localStorage profile code remains
- [ ] All tests pass

---

## 📝 COMMIT MESSAGE

```
refactor: centralize player profile in Studio Hub

- Remove local player profile creation from EP-133
- Remove PlayerProfilePage and related components
- Clean up playerProfileStore (read-only now)
- Remove profile editing UI
- Keep profile display components
- Profile now managed ONLY by Hub
- EP-133 reads profile from Hub on init

Fixes #issue-number
```

---

## 🔗 RELATED DOCUMENTS

See:
- `/STUDIO_HUB_COMPLETE_VISION.md` — Hub manages profiles
- `/STUDIO_HUB_ONBOARDING_SYSTEM.md` — Profile creation in Hub
- `/EP-133-KO-II-Studio/ROADMAP_CONNECT_TO_HUB.md` — Integration

---

## ✨ RESULT

**EP-133 becomes a clean, focused studio that:**
- ✨ Receives its identity from Hub
- ✨ Displays player info beautifully
- ✨ Tracks personal stats
- ✨ No redundant local profile management
- ✨ Perfect companion to OP-1

---

*Cleanup Specification: 15 August 2026*  
*Ready for implementation*
