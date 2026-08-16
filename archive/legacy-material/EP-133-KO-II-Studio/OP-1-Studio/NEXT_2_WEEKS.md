# 📅 OP-1 Studio - Next 2 Weeks Roadmap

**Start Date**: 2026-08-15  
**Target Completion**: 2026-08-29  
**Scope**: Hub Integration (PHASE 1.5 + 2)

---

## 🎯 MISSION THIS WEEK

Make OP-1 Studio work seamlessly with Studio Hub so that:
1. User creates profile in Hub
2. User clicks "Enter OP-1" 
3. OP-1 loads with full profile + workspace ready
4. User can save files to Hub workspace
5. Backups appear in Hub profile

---

## 📋 WEEK 1: Hub Initialization Setup

### Monday (2026-08-18)

#### Morning (2-3 hours)
**Task 1.1: Create playerProfileStore.ts**
```bash
File: /app/core/store/playerProfileStore.ts
Copy from: ROADMAP_CONNECT_TO_HUB.md (lines 213-259)

What it does:
  - Stores player name, avatar, settings
  - Persists to localStorage
  - Loads from Hub via sessionStorage
  - Fallback to local profile

Testing:
  npm run build  # Should still pass
  # Console: usePlayerProfileStore.getState()
```

#### Afternoon (2-3 hours)
**Task 1.2: Create workspaceStore.ts**
```bash
File: /app/core/store/workspaceStore.ts
Copy from: ROADMAP_CONNECT_TO_HUB.md (lines 262-307)

What it does:
  - Stores folder paths + handles
  - Manages OP-1 folder in workspace
  - Loads from storage layer
  - Connects to FSA

Testing:
  npm run build  # Should pass
  # Check: Folder handles are stored/loaded
```

**Deliverable**: Both stores created + exported in `/app/core/store/index.ts`

---

### Tuesday (2026-08-19)

#### Morning (2-3 hours)
**Task 1.3: Create useHubInitialization.ts hook**
```bash
File: /app/hooks/useHubInitialization.ts
Copy from: ROADMAP_CONNECT_TO_HUB.md (lines 89-183)

What it does:
  - Called once at app startup
  - Reads profile from sessionStorage (Hub passes it)
  - Falls back to localStorage (standalone)
  - Initializes all stores
  - Shows onboarding if no profile

Key logic:
  1. Try sessionStorage['hub:playerProfile']
  2. Fall back to localStorage['op1:playerProfile']
  3. Initialize: updateProfile + setWorkspace + setLanguage + setTheme
  4. Log success or show setup screen

Testing:
  npm run build  # Pass
  # Test 3 scenarios in console
```

#### Afternoon (1-2 hours)
**Task 1.4: Add languageStore.ts & themeStore.ts**
```bash
File: /app/core/store/languageStore.ts
File: /app/core/store/themeStore.ts

Simple stores:
  - languageStore: { language: 'en' | 'fr' | 'es', setLanguage }
  - themeStore: { theme: 'light' | 'dark' | 'auto', setTheme }

Reference: EP-133 has languageStore
```

**Deliverable**: All stores created + added to barrel export

---

### Wednesday (2026-08-20)

#### Morning (2-3 hours)
**Task 1.5: Update App.tsx to use useHubInitialization**
```bash
File: /app/page.tsx (main app component)

Changes:
  1. Import { useHubInitialization } from './hooks/useHubInitialization'
  2. Call useHubInitialization() at component start
  3. Get profile: const { profile } = usePlayerProfileStore()
  4. Conditional render:
     - If profile: Show <Header /> + <MainUI />
     - If !profile: Show <OnboardingFlow />

Before:
  export default function App() {
    return <MainUI />
  }

After:
  export default function App() {
    useHubInitialization()  // Load from Hub or local
    const { profile } = usePlayerProfileStore()
    
    return profile ? <MainUI /> : <OnboardingFlow />
  }

Testing:
  npm run dev
  # Should show onboarding if no profile
  # Should show main UI if profile exists
```

#### Afternoon (1-2 hours)
**Task 1.6: Create minimal onboarding screen**
```bash
File: /app/components/OnboardingFlow.tsx

Simple 3-step onboarding:
  1. Name + avatar picker
  2. Language + theme selection
  3. Workspace folder picker (FSA)

Should save to:
  - playerProfileStore
  - workspaceStore
```

**Deliverable**: App now loads profile from Hub or shows setup

---

### Thursday (2026-08-21)

#### Morning (2-3 hours)
**Task 1.7: Testing & Verification**
```bash
Test Scenarios:

Scenario 1: Hub Mode
  - Simulate Hub passing profile via sessionStorage
  - Verify: Profile loads automatically
  - Verify: Workspace path initialized
  - Verify: UI shows "Welcome {name}!"

Scenario 2: Standalone Mode
  - Clear sessionStorage
  - Load OP-1 directly
  - Verify: Shows onboarding
  - Complete setup locally
  - Verify: Profile saved to localStorage

Scenario 3: Re-launch
  - Quit OP-1
  - Relaunch
  - Verify: Profile loaded from localStorage
  - No onboarding shown

npm run lint   # 0 errors
npm run build  # Pass
npm run test   # 31/31 pass
```

#### Afternoon (1 hour)
**Task 1.8: Documentation & Commit**
```bash
git add -A
git commit -m "feat: add Hub integration stores & initialization

- Create playerProfileStore (Zustand)
- Create workspaceStore (Zustand)
- Create languageStore & themeStore
- Add useHubInitialization hook
- Update App.tsx for Hub/standalone detection
- Add OnboardingFlow component
- All tests passing (31/31)
- Build: 0 errors

Phase 1.5 complete - Hub initialization ready"
```

---

### Friday (2026-08-22)

#### All Day: Buffer + Polish
- [ ] Fix any lint warnings
- [ ] Polish onboarding UI
- [ ] Test edge cases
- [ ] Update documentation

**End of Week 1 Deliverable**: 
- ✅ OP-1 can load profile from Hub
- ✅ OP-1 works in standalone mode
- ✅ All stores initialized
- ✅ Tests passing
- ✅ Build clean

---

## 📋 WEEK 2: File Operations & Components

### Monday (2026-08-25)

#### Morning (3-4 hours)
**Task 2.1: Update nativeStorage.ts**
```bash
File: /app/lib/nativeStorage.ts

Current pattern:
  async readKeyboard() {
    return invoke('keyboard_read')  // Tauri
  }

New pattern:
  async readKeyboard() {
    const { op1FolderHandle } = useWorkspaceStore.getState()
    if (!op1FolderHandle) throw new Error('No folder')
    
    const result = await readJsonFile(op1FolderHandle, 'keyboard.json')
    if (!result.success) throw new Error(result.error?.message)
    return result.data
  }

Functions to update:
  - readKeyboard() → use FSA
  - writeKeyboard(data) → use FSA
  - readProfile() → use FSA
  - writeProfile(data) → use FSA
  - All file operations → use workspace path

Key: Keep Tauri as fallback if FSA not available
```

#### Afternoon (2-3 hours)
**Testing file operations**
```bash
Test:
  1. Create keyboard.json in test folder
  2. Load via readKeyboard()
  3. Verify content matches
  4. Modify via writeKeyboard()
  5. Verify file updated
  6. Test both Hub and standalone modes
```

---

### Tuesday (2026-08-26)

#### Morning (3-4 hours)
**Task 2.2: Migrate StudioMachinePanel.tsx**
```bash
File: /app/components/StudioMachinePanel.tsx

Current: Lots of useState scattered
New: Use Zustand stores

Changes:
  Before:
    const [profile, setProfile] = useState(defaultProfile)
    const [isConnected, setIsConnected] = useState(false)
    const [libraryPath, setLibraryPath] = useState(null)
  
  After:
    const profile = useProfileStore(s => s.profile)
    const isConnected = useDeviceStore(s => s.isConnected)
    const libraryPath = useLibraryStore(s => s.libraryPath)

Testing:
  - MIDI works
  - Keyboard loads/saves
  - State persists
```

#### Afternoon (2-3 hours)
**Task 2.3: Migrate other components**
```bash
Files to update:
  - /app/components/StudioTapeEditor.tsx
  - /app/components/FileLibraryPanel.tsx
  - Any other components with file operations

Pattern: Replace useState → Zustand stores
```

---

### Wednesday (2026-08-27)

#### All Day: Integration Testing
```bash
Test Plan:

Hub Mode Test:
  1. Start Hub
  2. Create test profile in Hub
  3. Click "Enter OP-1"
  4. Verify OP-1 loads with profile
  5. Load/save keyboard config
  6. Verify files in Hub workspace
  7. Go back to Hub
  8. Verify config is there

Standalone Mode Test:
  1. Open OP-1 directly (no Hub)
  2. Complete setup locally
  3. Create keyboard config
  4. Verify files saved locally
  5. Quit and reopen
  6. Verify config persisted

MIDI Test (Real Hardware):
  1. Connect real OP-1 via USB
  2. Test MIDI in Hub mode
  3. Test MIDI in standalone mode
  4. Both should work identically

npm run build   # < 200ms
npm run lint    # 0 errors
npm run test    # 31/31 pass
```

---

### Thursday (2026-08-28)

#### Morning: Documentation
```bash
Update:
  - STATUS.md → Phase 1.5 + 2 complete
  - SYNC_ALIGNMENT.md → Update progress
  - Create RELEASE_NOTES.md for v0.2.0
```

#### Afternoon: Commit & Tag
```bash
git add -A
git commit -m "feat: hub integration phase 2 complete

- Update nativeStorage.ts for FSA
- Migrate components to Zustand stores
- All file operations use workspace paths
- Hub mode fully tested
- Standalone mode fully tested
- MIDI tested with real hardware
- Build: 0 errors, 180ms
- Tests: 31/31 passing

Phase 1.5 + 2 complete - Ready for production"

git tag v0.2.0
git push origin main --tags
```

---

### Friday (2026-08-29)

#### Buffer Day: Final Polish
- [ ] Edge case testing
- [ ] Performance optimization
- [ ] Final UI polish
- [ ] Release documentation ready
- [ ] Ready for announcement

**End of Week 2 Deliverable**:
- ✅ Hub integration complete
- ✅ All file operations working
- ✅ Components migrated
- ✅ Tests passing
- ✅ MIDI tested
- ✅ Documentation complete
- ✅ v0.2.0 ready for release

---

## 🚀 PHASE 3 (Optional - Week 3+)

If time permits:
- [ ] Add backup notifications to Hub
- [ ] Add stats updates to Hub
- [ ] Add Hub navigation in OP-1 UI
- [ ] Add profile editing

---

## ✅ SUCCESS CRITERIA

By Friday 2026-08-29:

- [ ] Profile loads from Hub automatically
- [ ] Files save to Hub workspace
- [ ] Standalone mode still works
- [ ] All components use Zustand stores
- [ ] MIDI tested with real OP-1
- [ ] ESLint: 0 errors
- [ ] Build: < 200ms
- [ ] Tests: 31/31 passing
- [ ] Documentation: Complete
- [ ] v0.2.0 tagged and ready

---

## 📊 Daily Standup Template

```
Date: YYYY-MM-DD
✅ Completed:
  - Task X.Y (file created/updated)
  - Tests: passing
  - Build: clean

🔄 In Progress:
  - Task X.Z

🚨 Blockers:
  - None / [issue description]

📅 Tomorrow:
  - Task A.B
  - Task C.D
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] playerProfileStore load/save
- [ ] workspaceStore path management
- [ ] useHubInitialization scenarios
- [ ] fileSystem read/write

### Integration Tests
- [ ] Profile flows from Hub → OP-1
- [ ] Files read/write to workspace
- [ ] State persists across sessions

### E2E Tests
- [ ] Hub → Enter OP-1 flow
- [ ] Create backup → See in Hub
- [ ] Standalone setup flow
- [ ] MIDI with real hardware

---

## 💻 Development Setup

```bash
# Start dev server
npm run dev

# Run tests
npm run test

# Check lint
npm run lint

# Build for production
npm run build

# Useful during development
# Watch for changes
npm run test:watch  # If available

# Open in browser
# Usually: http://localhost:5173
```

---

## 🆘 If You Get Stuck

1. Check ROADMAP_CONNECT_TO_HUB.md for implementation details
2. Reference EP-133 patterns in /src/core/store
3. Check SYNC_ALIGNMENT.md for architecture overview
4. Run `npm run lint` and fix errors
5. Run `npm run build` to check compilation

---

**Let's ship this! 🚀 Ready to start Monday?**
