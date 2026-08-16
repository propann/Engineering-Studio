# ⚡ Lightweight Refactor Guide

**For the OP-1 Developer**

Current structure is too heavy. Let's simplify while keeping all functionality.

---

## 🎯 CURRENT STRUCTURE (TOO COMPLEX)

```
studio-ecosystem/
├── packages/
│   ├── studio-hub/        ← Keep, this is the hub
│   ├── shared-ui/         ← NOT USED YET, can wait
│   ├── op1-studio/        ← NOT NEEDED YET
│   └── ep133-studio/      ← NOT NEEDED YET
├── tools/                 ← NOT NEEDED YET
└── docs/                  ← Can be in each repo
```

**Problem**: We created the FULL monorepo structure, but we're only using the Hub right now.

---

## ✅ SIMPLIFIED STRUCTURE

```
studio-ecosystem/
├── packages/
│   └── studio-hub/        ← ONLY the Hub for now
├── OP-1-Studio/           ← Stays as separate repo (symlink or reference)
├── EP-133-KO-II-Studio/   ← Stays as separate repo (symlink or reference)
├── README.md
└── LAUNCH_NOW.md
```

**Better**: Hub is the only web app. OP-1 + EP-133 stay independent.

---

## 📋 CLEANUP TASKS

### Phase 1: Remove Unused Packages (Now)
```bash
# Delete these directories (they're not needed yet):
rm -rf packages/shared-ui
rm -rf packages/op1-studio
rm -rf packages/ep133-studio
rm -rf tools/

# They can be created later when actually needed
```

### Phase 2: Simplify Root package.json
```json
{
  "name": "studio-ecosystem",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/studio-hub"
  ],
  "scripts": {
    "dev": "npm run dev -w studio-hub",
    "build": "npm run build -w studio-hub",
    "test": "npm run test -w studio-hub"
  }
}
```

### Phase 3: Move OP-1 & EP-133 Integration to Top Level

Instead of copying into monorepo:
```
studio-ecosystem/
├── packages/studio-hub/
├── ../OP-1-Studio/          (reference, not in monorepo)
├── ../EP-133-KO-II-Studio/  (reference, not in monorepo)
└── docs/
```

Or use git submodules if you want:
```bash
git submodule add ../OP-1-Studio OP-1-Studio
git submodule add ../EP-133-KO-II-Studio EP-133-KO-II-Studio
```

---

## 🎯 WHAT STAYS

✅ **studio-hub/** — The web app (keep everything)
✅ **OP-1-Studio/** — Integration hooks (already created)
✅ **EP-133-KO-II-Studio/** — Integration hooks (already created)
✅ **README.md** — How to use the system
✅ **.gitignore** — Standard git ignore

---

## ❌ WHAT GOES

❌ **packages/shared-ui/** — Not used yet (can create when needed)
❌ **packages/op1-studio/** — Copying OP-1 into monorepo not needed
❌ **packages/ep133-studio/** — Copying EP-133 into monorepo not needed
❌ **tools/** — Can stay in individual repos

---

## 📦 NEW LIGHTWEIGHT STRUCTURE

```
studio-ecosystem/              (Hub monorepo)
├── packages/
│   └── studio-hub/           (Web app, ~244KB)
├── OP-1-Studio/              (Symlink or submodule)
├── EP-133-KO-II-Studio/      (Symlink or submodule)
├── package.json              (1 workspace: studio-hub)
├── README.md
├── LAUNCH_NOW.md
└── .gitignore

Total size: ~1MB (vs 20MB+ with all packages)
Complexity: Simple (vs complex)
Maintainability: High (vs medium)
```

---

## 🔧 WHAT THIS MEANS

### For Development
```bash
# Hub
cd studio-ecosystem
npm install
npm run dev

# OP-1 still has its own setup
cd ../OP-1-Studio
npm install
npm run dev

# EP-133 still has its own setup
cd ../EP-133-KO-II-Studio
npm install
npm run dev
```

### For Integration
```
Hub passes profile → OP-1 reads it (hook already in place)
Hub passes profile → EP-133 reads it (hook already in place)
```

No need to copy entire projects into monorepo.

---

## ✂️ CLEANUP COMMANDS

```bash
cd /home/azoth/studio-ecosystem

# Remove unused packages
rm -rf packages/shared-ui
rm -rf packages/op1-studio
rm -rf packages/ep133-studio
rm -rf tools

# Update package.json (already simplified, no action needed)

# Clean npm
npm prune

# Test it still works
npm install
npm run build
```

---

## 📝 UPDATE FILES

### Root README.md
Keep it simple:
```markdown
# Studio Ecosystem

Hub + OP-1 Studio + EP-133 Studio

## Quick Start

### Hub (Web App)
```bash
cd packages/studio-hub
npm install
npm run dev
```

### OP-1 Studio
```bash
cd ../OP-1-Studio
npm install
npm run dev
```

### EP-133 Studio
```bash
cd ../EP-133-KO-II-Studio
npm install
npm run dev
```
```

### Root .gitignore
```
node_modules/
dist/
*.log
.DS_Store
```

---

## 🎯 RESULT

| Metric | Before | After |
|--------|--------|-------|
| Packages | 4 | 1 |
| npm workspaces | 4 | 1 |
| Git complexity | High | Low |
| Disk usage | 20MB+ | 1-2MB |
| Setup time | 5+ min | 2 min |
| Maintainability | Medium | High |

---

## ⚡ NEXT STEPS FOR OP-1 DEV

1. **Do cleanup** (5 min)
   - Remove unused packages
   - Simplify root package.json

2. **Update documentation** (10 min)
   - New README.md

3. **Test it works** (5 min)
   - `npm install && npm run build`

4. **Commit** (2 min)
   - "refactor: lighten monorepo structure"

5. **Continue integration** (normal steps)
   - Integrate hooks into App.tsx

---

## 💡 WHY LIGHTER IS BETTER

- **Faster install** — Only Hub needs npm
- **Simpler git** — No unnecessary directories
- **Clearer intent** — Hub is web portal, OP-1/EP-133 are independent
- **Future-proof** — Can add shared-ui when actually shared code exists
- **Less confusion** — "monorepo" doesn't imply everything is bundled together

---

## 🎉 SUMMARY

**Old**: Heavy structure with unused packages  
**New**: Lightweight Hub + independent studios  
**Effort**: 15 minutes to refactor  
**Benefit**: Cleaner, faster, easier to maintain  

---

*Refactor Guide: 15 August 2026*  
*For: Next Developer Session*  
*Priority: Medium (nice-to-have, not blocking)*
