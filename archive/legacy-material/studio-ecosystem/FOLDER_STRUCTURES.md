# 📁 Workspace Folder Structures

## Overview

When users create a profile and select their machines, Studio Hub automatically creates the necessary folder structure for organizing projects, samples, and backups.

---

## 🎛️ OP-1 Structure

**Location:** `/workspace/op1/`

### Current Directory Structure (Found in repo)
```
OP-1-Studio/data/
├── content/      ✅ Sound libraries
├── firmware/     ✅ Firmware files
├── keyboard/     ✅ Keyboard configurations
└── mods/         ✅ Module configurations
```

### Expanded Structure (Created by Hub)
```
workspace/
└── op1/
    ├── keyboard/       ← Keyboard config backups
    │   ├── default.json
    │   ├── my-setup.json
    │   └── ...
    ├── firmware/       ← Firmware versions & inspection data
    │   ├── current/
    │   ├── backups/
    │   └── ...
    ├── content/        ← Sound libraries & samples
    │   ├── user-sounds/
    │   ├── presets/
    │   └── ...
    ├── mods/           ← Module configurations
    │   ├── custom/
    │   └── ...
    └── backups/        ← Device backups (NEW - added by Hub)
        ├── 2026-08-15-full.json
        ├── 2026-08-14-full.json
        └── ...
```

### What Gets Stored Where

| Folder | Purpose | File Types |
|--------|---------|-----------|
| `keyboard/` | Keyboard layout configs | `.json`, `.txt` |
| `firmware/` | Firmware files & inspection | `.aif`, `.json` |
| `content/` | Sound library & samples | `.aif`, `.sysx`, `.json` |
| `mods/` | Module configurations | `.json` |
| `backups/` | Full device backups | `.json` |

---

## 🥁 EP-133 Structure

**Location:** `/workspace/ep133/`

### Current Directory Structure (Found in repo)
```
EP-133-KO-II-Studio/
├── exercises/    ✅ Training exercises (39 total)
├── etude/        ✅ Study/practice files
├── handbook/     ✅ Documentation
└── public/       ✅ Assets & demo projects
```

### Expanded Structure (Created by Hub)
```
workspace/
└── ep133/
    ├── clone/          ← Cloned device sounds
    │   ├── machine-001/
    │   │   ├── sounds/
    │   │   ├── patterns/
    │   │   └── metadata.json
    │   ├── machine-002/
    │   └── ...
    ├── samples/        ← User sample library
    │   ├── drums/
    │   ├── percussion/
    │   ├── melodic/
    │   └── ...
    ├── library/        ← Sound library & presets
    │   ├── default/
    │   ├── community/
    │   ├── backups/
    │   └── ...
    ├── projects/       ← Song projects & patterns
    │   ├── project-name/
    │   │   ├── song.json
    │   │   ├── patterns/
    │   │   └── samples/
    │   └── ...
    └── exercises/      ← Training exercises
        ├── 01-basics/
        ├── 02-patterns/
        ├── 03-advanced/
        └── ...
```

### What Gets Stored Where

| Folder | Purpose | File Types |
|--------|---------|-----------|
| `clone/` | Device clones & backups | `.json`, `.bin` |
| `samples/` | User uploaded samples | `.wav`, `.aif`, `.mp3` |
| `library/` | Sound library & presets | `.json`, `.sysx` |
| `projects/` | Song projects & patterns | `.json`, `.mid` |
| `exercises/` | Training files & lessons | `.json`, `.md` |

---

## 🔗 Shared Structure

**Location:** `/workspace/shared/`

### Universal Folder
```
workspace/
└── shared/
    ├── midi/           ← MIDI patterns & sequences
    │   ├── templates/
    │   ├── user-created/
    │   └── ...
    ├── audio/          ← Shared audio library
    │   ├── loops/
    │   ├── one-shots/
    │   └── ...
    ├── presets/        ← Shared presets
    │   ├── op1/
    │   ├── ep133/
    │   └── ...
    ├── documentation/  ← Shared docs
    │   ├── getting-started.md
    │   ├── workflows/
    │   └── ...
    └── backups/        ← Shared backups
        └── all-devices/
```

### What Gets Shared

| Folder | Purpose | Accessible From |
|--------|---------|-----------------|
| `midi/` | MIDI patterns | Both OP-1 & EP-133 |
| `audio/` | Audio samples & loops | Both machines |
| `presets/` | Sound presets | Both machines |
| `documentation/` | Shared guides & tips | Studio Hub + both |
| `backups/` | Cross-machine backups | Both machines |

---

## 📊 Complete Directory Tree

```
workspace/
├── op1/
│   ├── keyboard/
│   ├── firmware/
│   ├── content/
│   ├── mods/
│   └── backups/
├── ep133/
│   ├── clone/
│   ├── samples/
│   ├── library/
│   ├── projects/
│   └── exercises/
└── shared/
    ├── midi/
    ├── audio/
    ├── presets/
    ├── documentation/
    └── backups/
```

**Total subfolders:** 20  
**Root folders:** 3 (op1, ep133, shared)  
**Depth:** 2-3 levels

---

## 🛠️ How Folder Creation Works

### 1. User Creates Profile
```typescript
// In CreateProfile.tsx
const folderHandle = await pickWorkspaceFolder()
// User selects /Music folder
```

### 2. System Creates Structure
```typescript
// In webFileSystem.ts
await createWorkspaceStructure(
  folderHandle,
  enableOP1: true,  // Create /op1/
  enableEP133: true // Create /ep133/
)
```

### 3. Folders Appear
```
Music/
├── op1/
│   ├── keyboard/
│   ├── firmware/
│   ├── content/
│   ├── mods/
│   └── backups/
├── ep133/
│   ├── clone/
│   ├── samples/
│   ├── library/
│   ├── projects/
│   └── exercises/
└── shared/
    ├── midi/
    ├── audio/
    ├── presets/
    ├── documentation/
    └── backups/
```

### 4. Profile Stores References
```json
{
  "workspace": {
    "folderName": "Music",
    "op1": {
      "keyboard": "keyboard",
      "firmware": "firmware",
      "content": "content",
      "mods": "mods",
      "backups": "backups"
    },
    "ep133": {
      "clone": "clone",
      "samples": "samples",
      "library": "library",
      "projects": "projects",
      "exercises": "exercises"
    },
    "shared": "shared"
  }
}
```

### 5. Studios Use References
```typescript
// In OP-1
const profile = useHubInitialization()
const keyboardPath = profile.workspace.op1.keyboard
// → Load from Music/op1/keyboard/

// In EP-133
const profile = useHubInitialization()
const samplesPath = profile.workspace.ep133.samples
// → Load from Music/ep133/samples/
```

---

## 💡 Design Decisions

### Why These Folders?

1. **op1/keyboard/** — Multiple keyboard layouts can be saved
2. **op1/firmware/** — Version control & rollback capability
3. **op1/content/** — Separate sounds from other data
4. **op1/mods/** — Modular configuration management
5. **op1/backups/** — Security & recovery

6. **ep133/clone/** — Multiple device clones
7. **ep133/samples/** — User-uploaded sample organization
8. **ep133/library/** — Factory + custom sounds
9. **ep133/projects/** — Song organization
10. **ep133/exercises/** — Training file separation

11. **shared/** — Cross-machine data sharing

### Naming Conventions

- **Lowercase only** — Cross-platform compatibility
- **No spaces** — Easier path handling
- **Descriptive** — Clear purpose at glance
- **Consistent** — Similar structure for both machines

---

## 🔄 Migration Path (Future)

If users already have existing folders:

```typescript
// Detect existing structure
const existing = await getExistingFolderStructure()

if (existing.op1) {
  // Link to existing /op1/ folder
  // Don't create duplicate
} else {
  // Create new /op1/ folder
}
```

This allows:
- Existing users to keep their current setup
- New users to start fresh
- Gradual migration if needed

---

## 🎯 File Organization Best Practices

### For Users (Recommended)

**OP-1 Content Organization:**
```
op1/content/
├── synth-leads/
│   ├── bass-heavy/
│   ├── bright/
│   └── dark/
├── drums/
├── percussion/
├── atmospheric/
└── experimental/
```

**EP-133 Projects:**
```
ep133/projects/
├── 2026/
│   ├── 08-summer/
│   │   ├── track-1/
│   │   └── track-2/
│   └── 09-autumn/
└── archive/
```

**Shared Patterns:**
```
shared/midi/
├── templates/
│   ├── 4-bar/
│   ├── 8-bar/
│   └── 16-bar/
├── chord-progressions/
└── drum-patterns/
```

---

## 📌 Important Notes

1. **Permissions:** Browser must ask for folder access first time
2. **Persistence:** Permissions persist across sessions
3. **Security:** Each app gets its own isolated folder access
4. **Speed:** Creating ~20 folders takes <100ms
5. **Error Handling:** User sees friendly error if folder creation fails

---

## 🚀 Testing Checklist

- [ ] Can pick workspace folder
- [ ] OP-1 folders created correctly
- [ ] EP-133 folders created correctly
- [ ] Shared folders created correctly
- [ ] Profile stores folder references
- [ ] Can access folders from OP-1 studio
- [ ] Can access folders from EP-133 studio
- [ ] Folder permissions persist after page refresh
- [ ] Works with nested folders (e.g., /Music/Studio/Workspace)

---

*Folder Structure Reference*  
*Updated: August 15, 2026*  
*For: Studio Ecosystem v1.0*
