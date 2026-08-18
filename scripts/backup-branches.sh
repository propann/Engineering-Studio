#!/bin/bash
# Script de backup complet du repo avant nettoyage
# Usage: bash scripts/backup-branches.sh

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="archive/backups"

echo "💾 Backup complet du repo (timestamp: $TIMESTAMP)..."
mkdir -p "$BACKUP_DIR"

# 1. Créer un bundle git contenant tout l'historique
echo "📦 Créer bundle Git complet..."
git bundle create "$BACKUP_DIR/studio-all-$TIMESTAMP.bundle" --all
echo "✅ Git bundle: $BACKUP_DIR/studio-all-$TIMESTAMP.bundle"

# 2. Exporter les infos de chaque branche
echo "📝 Exporter infos des branches..."
git branch -v > "$BACKUP_DIR/branches-list-$TIMESTAMP.txt"
git branch -a > "$BACKUP_DIR/branches-all-$TIMESTAMP.txt"
echo "✅ Branch listing: $BACKUP_DIR/branches-list-$TIMESTAMP.txt"

# 3. Générer un log complet
echo "📜 Générer log complet..."
git log --all --graph --oneline --decorate > "$BACKUP_DIR/commit-history-$TIMESTAMP.txt"
echo "✅ Commit history: $BACKUP_DIR/commit-history-$TIMESTAMP.txt"

# 4. Créer des archives tar pour les répertoires importants
echo "📁 Archiver répertoires legacy..."
if [ -d "../Engineering-Studio-Workbench" ]; then
  tar czf "$BACKUP_DIR/workbench-$TIMESTAMP.tar.gz" ../Engineering-Studio-Workbench 2>/dev/null
  echo "✅ Workbench backup: $BACKUP_DIR/workbench-$TIMESTAMP.tar.gz"
fi

if [ -d "../EP-133-KO-II-Studio" ]; then
  tar czf "$BACKUP_DIR/ep133-$TIMESTAMP.tar.gz" ../EP-133-KO-II-Studio 2>/dev/null
  echo "✅ EP-133 backup: $BACKUP_DIR/ep133-$TIMESTAMP.tar.gz"
fi

if [ -d "../studio-ecosystem" ]; then
  tar czf "$BACKUP_DIR/ecosystem-$TIMESTAMP.tar.gz" ../studio-ecosystem 2>/dev/null
  echo "✅ Ecosystem backup: $BACKUP_DIR/ecosystem-$TIMESTAMP.tar.gz"
fi

# 5. Créer un résumé
echo "📋 Créer résumé..."
cat > "$BACKUP_DIR/BACKUP-INFO-$TIMESTAMP.md" << EOF
# Backup Information - $TIMESTAMP

## Git Information
- **Repository**: $(pwd)
- **Current branch**: $(git rev-parse --abbrev-ref HEAD)
- **Latest commit**: $(git rev-parse --short HEAD)
- **Total commits**: $(git rev-list --all --count)

## Files Created
- \`studio-all-$TIMESTAMP.bundle\` - Complete Git history
- \`branches-list-$TIMESTAMP.txt\` - Local branches info
- \`branches-all-$TIMESTAMP.txt\` - All branches (local + remote)
- \`commit-history-$TIMESTAMP.txt\` - Full commit graph
- \`workbench-$TIMESTAMP.tar.gz\` - Engineering-Studio-Workbench (if exists)
- \`ep133-$TIMESTAMP.tar.gz\` - EP-133-KO-II-Studio (if exists)
- \`ecosystem-$TIMESTAMP.tar.gz\` - studio-ecosystem (if exists)

## Restoration Instructions
To restore from bundle:
\`\`\`bash
git clone studio-all-$TIMESTAMP.bundle restored-repo
cd restored-repo
git branch -a  # See all branches
\`\`\`

## Size Summary
$(du -sh "$BACKUP_DIR"/*)

## Date Created
$(date -R)
EOF

echo "✅ Backup info: $BACKUP_DIR/BACKUP-INFO-$TIMESTAMP.md"

echo ""
echo "✨ Backup terminé!"
echo ""
du -sh "$BACKUP_DIR"
echo ""
echo "💾 Files are safe in: $BACKUP_DIR"
echo "Ready for cleanup! 🧹"
