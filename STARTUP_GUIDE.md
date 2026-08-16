# 🚀 Studio Hub - Startup Guide

**Quick Start Guide pour mettre en route le projet aligné**

---

## ⚡ Quick Start (5 minutes)

### 1. Clone & Install
```bash
cd /home/azoth/studio-hub
npm install
```

### 2. Verify Installation
```bash
npm run build:all
```

### 3. Start Development (Choose One)

**Start Both Studios:**
```bash
npm run dev:both
```

**Start OP-1 Only:**
```bash
npm run dev:op1
# Opens: http://localhost:3000
```

**Start EP-133 Only:**
```bash
npm run dev:ep133
# Opens: http://localhost:5173
```

---

## 📋 Full Startup Checklist

### Pre-Flight Check
```bash
✓ npm --version        # Should be 10+
✓ node --version       # Should be 22
✓ git --version        # Should be 2.40+
✓ cd /home/azoth/studio-hub
✓ git status           # Should be clean
```

### Installation
```bash
# Clean install
rm -rf node_modules package-lock.json apps/*/node_modules
npm install

# Or quick update
npm install
```

### Verification
```bash
# Type check
npm run typecheck

# Build all
npm run build:all

# Test all
npm run test:all
```

### Development
```bash
# Option 1: Both servers
npm run dev:both

# Option 2: Individual
npm run dev:op1      # Terminal 1
npm run dev:ep133    # Terminal 2

# Option 3: Watch builds only (no servers)
npm run watch -w apps/op1-studio
npm run watch -w apps/ep133-studio
```

---

## 🔧 Detailed Setup Instructions

### System Requirements
- Node.js 22+
- npm 10+
- git 2.40+
- 4GB RAM minimum
- 2GB free disk space

### Installation Steps

#### 1. Verify Environment
```bash
node --version     # >= 22.0.0
npm --version      # >= 10.0.0
git --version      # >= 2.40.0
```

#### 2. Navigate to Hub
```bash
cd /home/azoth/studio-hub
pwd  # Should show: /home/azoth/studio-hub
```

#### 3. Check Git Status
```bash
git status
# Should show: On branch master, working tree clean

git branch
# Should show 6 branches
```

#### 4. Clean Install
```bash
# Option A: Full clean
rm -rf node_modules package-lock.json
find . -name node_modules -type d -exec rm -rf {} + 2>/dev/null
npm install

# Option B: Quick update (if you have node_modules)
npm install
```

#### 5. Verify Installation
```bash
# Check packages installed
npm list react react-dom zustand

# Check workspaces
npm list -w

# Check builds
npm run build:all
```

---

## 🎯 Development Workflow

### For OP-1 Studio Team

**Setup:**
```bash
cd /home/azoth/studio-hub
git checkout op1-studio-module
npm install
npm run dev:op1
```

**Development:**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes in apps/op1-studio/

# Commit and push
git add .
git commit -m "feat(op1-studio): your feature description"
git push origin feature/your-feature-name

# Create PR on GitHub/GitLab
```

**Testing:**
```bash
npm run typecheck -w apps/op1-studio
npm run build -w apps/op1-studio
npm run test -w apps/op1-studio
```

### For EP-133 Studio Team

**Setup:**
```bash
cd /home/azoth/studio-hub
git checkout ep133-studio-module
npm install
npm run dev:ep133
```

**Development:**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes in apps/ep133-studio/

# Commit and push
git add .
git commit -m "feat(ep133-studio): your feature description"
git push origin feature/your-feature-name

# Create PR on GitHub/GitLab
```

**Testing:**
```bash
npm run typecheck -w apps/ep133-studio
npm run build -w apps/ep133-studio
npm run test -w apps/ep133-studio
```

### For Shared Packages

**Setup:**
```bash
cd /home/azoth/studio-hub
git checkout shared-packages-module
npm install
```

**Development:**
```bash
# Create feature branch
git checkout -b feature/your-utility-name

# Make changes in packages/

# Test both studios
npm run dev:both

# After changes, commit and PR to shared-packages-module
```

---

## 🧪 Testing & Verification

### Run All Tests
```bash
npm run test:all
```

### Run Specific Tests
```bash
npm run test -w apps/op1-studio
npm run test -w apps/ep133-studio
npm run test -w packages/types
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint:all
```

### Build Verification
```bash
npm run build:all

# Output should be:
# ✓ OP-1 Studio built
# ✓ EP-133 Studio built
# ✓ All packages built
```

---

## 🚀 Production Deployment

### Prepare Release
```bash
git checkout master
npm install
npm run build:all
npm run test:all
```

### Verify Everything
```bash
# All tests pass
# All builds succeed
# Git status clean
```

### Deploy
```bash
# Your deployment command here
# Example: npm run deploy
```

---

## 🐛 Troubleshooting

### Problem: `npm install` fails

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Remove lock file
rm package-lock.json

# Reinstall
npm install
```

### Problem: Port already in use (3000 or 5173)

**Solution:**
```bash
# Find process using port
lsof -i :3000      # For OP-1
lsof -i :5173      # For EP-133

# Kill process
kill -9 <PID>

# Or use different ports
npm run dev:op1 -- --port 3001
npm run dev:ep133 -- --port 5174
```

### Problem: Git branch conflicts

**Solution:**
```bash
# Sync with latest master
git fetch origin
git rebase origin/master

# Or merge
git merge origin/master
```

### Problem: TypeScript errors

**Solution:**
```bash
# Check TypeScript version
npm ls typescript

# Rebuild
npm run typecheck

# Clean and rebuild
npm run clean
npm run build:all
```

### Problem: Package version mismatch

**Solution:**
```bash
# Check package versions
npm ls react react-dom zustand

# Update if needed
npm install react@19.2.8 react-dom@19.2.8
```

---

## 📊 Useful Commands Reference

### Development
```bash
npm run dev:op1              # Start OP-1 dev server
npm run dev:ep133            # Start EP-133 dev server
npm run dev:both             # Start both
```

### Building
```bash
npm run build:all            # Build everything
npm run build -w apps/op1-studio
npm run build -w apps/ep133-studio
npm run build -w packages/types
```

### Testing
```bash
npm run test:all             # Test everything
npm run test -w apps/ep133-studio
npm run typecheck            # Check types
npm run lint:all             # Lint all
```

### Workspace Management
```bash
npm list                     # Show all packages
npm list -w                  # Show workspaces
npm ls react                 # Check specific package
```

### Cleanup
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

---

## 📁 Project Structure Quick Reference

```
studio-hub/
├── apps/
│   ├── op1-studio/          # Next.js + Tauri + Drizzle
│   │   ├── app/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   └── ep133-studio/        # Vite + Tone.js
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   ├── types/               # Shared types
│   ├── shared-stores/       # Zustand stores
│   ├── shared-ui/           # React components
│   ├── audio-bridge/        # Audio utilities
│   └── compression/         # Compression tools
│
├── docs/                    # Documentation
│
├── package.json             # Root workspace
├── tsconfig.json
├── eslint.config.mjs
└── .git/

```

---

## 🎓 Learning Resources

### First Time Setup
1. Read: [INDEX.md](./INDEX.md) - Navigation guide
2. Read: [README.md](./README.md) - Monorepo overview
3. Read: [BRANCHING_STRATEGY.md](./BRANCHING_STRATEGY.md) - Git workflows

### Development
1. Read: [STATUS.md](./STATUS.md) - Technical architecture
2. Read: [PROGRESS.md](./PROGRESS.md) - Project tracking
3. Reference: [TEAM_SYNC.md](./TEAM_SYNC.md) - Team coordination

### Troubleshooting
1. Check: [ANALYSIS_AND_OPTIMIZATION.md](./ANALYSIS_AND_OPTIMIZATION.md) - Dependencies
2. Check: [GIT_ALIGNMENT_REPORT.md](./GIT_ALIGNMENT_REPORT.md) - Git setup

---

## ✅ Startup Verification Checklist

After following this guide, verify:

- [ ] Node.js 22+ installed
- [ ] npm 10+ installed
- [ ] git configured
- [ ] Cloned /home/azoth/studio-hub
- [ ] `npm install` completed
- [ ] `npm run build:all` succeeds
- [ ] `npm run test:all` passes
- [ ] `npm run dev:both` starts both servers
- [ ] OP-1 accessible at http://localhost:3000
- [ ] EP-133 accessible at http://localhost:5173
- [ ] git branches visible (`git branch`)
- [ ] Ready to develop!

---

## 🎉 You're Ready!

Once all checks pass, you're ready to:
1. Choose your team's module branch
2. Create feature branches
3. Start developing
4. Make pull requests
5. Deploy from master

**Happy coding! 🚀**

---

**Last Updated**: 2026-08-15  
**Version**: 1.0  
**Status**: Guide de démarrage maintenu ; ne vaut pas validation matérielle

> Pour le statut produit actuel et les tests réellement passés, consulter
> [`docs/ROADMAP_ACTIVE_2026-08-16.md`](docs/ROADMAP_ACTIVE_2026-08-16.md).
