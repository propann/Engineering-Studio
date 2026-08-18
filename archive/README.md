# 📦 Archive Directory

**Studio Consolidation Backups & References**

This directory contains:
- Git backups and bundles
- Archived legacy projects
- Reference documentation
- Recovery instructions

---

## 📂 Structure

```
archive/
├── README.md                          ← You are here
├── backups/                           ← Git & project backups
│   ├── studio-all-*.bundle            ← Complete Git history
│   ├── branches-list-*.txt            ← Branch listing
│   ├── commit-history-*.txt           ← Full commit graph
│   ├── BACKUP-INFO-*.md               ← Recovery guide (READ THIS!)
│   ├── workbench-*.tar.gz             ← Engineering-Studio-Workbench
│   ├── ep133-*.tar.gz                 ← EP-133-KO-II-Studio
│   └── ecosystem-*.tar.gz             ← studio-ecosystem
├── e2e-reference/                     ← E2E tests from EP-133
├── exercises-reference/               ← Tutorials from EP-133
├── studio-legacy/                     ← Archived projects
│   └── workbench/                     ← Engineering-Studio-Workbench
└── consolidation/                     ← This consolidation process
    ├── CONSOLIDATION_*.md             ← Documentation
    ├── scripts/                       ← Automation scripts
    └── ... (other files)
```

---

## 🔄 If You Need to Restore

### Quick Restoration from Bundle

```bash
# Clone from backup bundle
git clone archive/backups/studio-all-*.bundle restored-repo

# Navigate to it
cd restored-repo

# See all branches
git branch -a

# Checkout a specific branch
git checkout <branch-name>

# Or see the commit
git show <commit-hash>
```

### Extract from TAR Archives

```bash
# Restore workbench
tar xzf archive/backups/workbench-*.tar.gz

# Restore EP-133
tar xzf archive/backups/ep133-*.tar.gz

# Restore ecosystem
tar xzf archive/backups/ecosystem-*.tar.gz
```

---

## 📖 Documentation

### Consolidation Process
- **`CONSOLIDATION_INDEX.md`** - Complete index (in root)
- **`CONSOLIDATION_QUICK_START.md`** - Quick start guide (in root)
- **`CONSOLIDATION_EXECUTIVE_SUMMARY.md`** - Full analysis (in root)
- **`BACKUP-INFO-*.md`** - Recovery instructions (in backups/)

### What Was Archived
- **Workbench:** Alternative version of Engineering-Studio (1.1GB)
- **EP-133:** Standalone OP-1 studio with important docs (1.3GB)
- **Ecosystem:** Foundation documentation and packages (177MB)

---

## 🕐 Timestamps

Each backup has a timestamp:
```
studio-all-20260818-143022.bundle
                ↑         ↑
              DATE      TIME (YYYYMMdd-HHMMSS)
```

Use this to find backups from specific moments.

---

## 💡 When to Use Archives

### Normal Development
Don't use these. Work in the main `Engineering-Studio` project.

### Troubleshooting
Use backups if something goes wrong:
```bash
# Something broken locally?
git clone archive/backups/studio-all-*.bundle recovery
cd recovery
# Investigate and copy what you need
```

### Historical Research
Need to understand old decisions or code?
```bash
# Reference the archived projects
ls archive/studio-legacy/workbench/
# Or unarchive and explore
```

### Documentation
Reference docs are here:
```bash
# These were imported to docs/ but backups remain
cat archive/backups/BACKUP-INFO-*.md
```

---

## 🗑️ Cleanup (Safe to Delete After Review)

After confirming everything works, you can safely delete:
- **Old backups:** `archive/backups/studio-all-*.bundle` (keep at least one)
- **Legacy projects:** Only if fully integrated
- **Old timestamp backups:** Keep latest 2-3, delete older ones

Don't delete:
- `BACKUP-INFO-*.md` (restoration guides)
- The reference projects (if still needed)
- `e2e-reference/` and `exercises-reference/` (may be needed)

---

## 📊 Backup Sizes

Check how much space these take:
```bash
du -sh archive/
du -sh archive/backups/
du -sh archive/studio-legacy/
```

To free space:
```bash
# Remove oldest backup bundles
rm archive/backups/studio-all-2026080*.bundle

# Compress less-used archives
gzip archive/backups/*.txt
```

---

## 🔐 Backup Verification

Verify backups are valid:

```bash
# Check bundle integrity
git bundle verify archive/backups/studio-all-*.bundle

# Check tar archives
tar tzf archive/backups/*.tar.gz | wc -l

# Check disk space
ls -lh archive/backups/
```

---

## 📝 Backup Manifest

Create a manifest of what was backed up:

```bash
# Lists all backups with creation date
ls -lhtr archive/backups/ | tail -20
```

---

## ⚠️ Important Notes

- **Git Bundle:** Complete Git history - use to restore any branch
- **Tar Archives:** Project snapshots - useful for reference
- **BACKUP-INFO:** Restoration instructions - read if you need to restore
- **Timestamps:** Use to find the right backup if there are many

---

## 🎯 Recommendations

1. **Keep:** Latest 2-3 backup bundles
2. **Keep:** BACKUP-INFO files (they're small)
3. **Keep:** e2e and exercises references (may be useful)
4. **Keep:** documentation files
5. **Can Delete:** Older tar archives after 3 months

---

## 📞 Quick Access

**I need to restore a file:**
```bash
git clone archive/backups/studio-all-*.bundle recovery
cd recovery && git show <branch>:path/to/file > ~/recovered-file
```

**I need to see old code:**
```bash
tar xzf archive/backups/ep133-*.tar.gz
ls archive/EP-133-KO-II-Studio/
```

**I need to understand what was done:**
```bash
cat archive/backups/BACKUP-INFO-*.md
cat archive/backups/commit-history-*.txt
```

---

**Archive Date:** 2026-08-18  
**Created by:** Studio Consolidation Process  
**Status:** Safe to reference, safe to clean up older files

---

For more information, see:
- `CONSOLIDATION_INDEX.md` (in root)
- `scripts/README.md` (in root)
- `BACKUP-INFO-*.md` (in this directory)
