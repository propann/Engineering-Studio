#!/bin/bash
# Script pour nettoyer les branches obsolètes
# Usage: bash scripts/cleanup-branches.sh [--dry-run|--force]

DRY_RUN=1
FORCE=0

# Analyser les arguments
if [ "$1" = "--force" ]; then
  FORCE=1
  DRY_RUN=0
  echo "⚠️  Mode FORCE activé - les branches seront vraiment supprimées"
elif [ "$1" = "--dry-run" ]; then
  DRY_RUN=1
  echo "🔍 Mode DRY-RUN - aucune suppression ne sera effectuée"
else
  DRY_RUN=1
  echo "🔍 Mode DRY-RUN (par défaut)"
  echo "   Utilisez --force pour vraiment supprimer les branches"
fi

echo ""

# Branches à nettoyer (candidates)
BRANCHES_TO_CLEAN=(
  "master"
  "integration/studio-hub"
  "consolidation/phase-3-complete"
  "docs-and-config-module"
  "ep133-studio-module"
  "op1-studio-module"
  "shared-packages-module"
  "phase4/adaptive-framework"
)

echo "🧹 Analyse des branches à nettoyer..."
echo ""

DELETED=0
SKIPPED=0

for branch in "${BRANCHES_TO_CLEAN[@]}"; do
  if ! git show-ref --quiet --verify "refs/heads/$branch" 2>/dev/null; then
    echo "⏭️  $branch - n'existe pas (skip)"
    ((SKIPPED++))
    continue
  fi

  # Vérifier les commits non-mergés
  commits=$(git log --oneline main..$branch 2>/dev/null | wc -l)

  if [ "$commits" -eq 0 ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "🟡 $branch - serait supprimée (0 commits)"
    else
      echo "🔴 $branch - supprimée"
      git branch -D "$branch" 2>/dev/null || echo "   Erreur lors de la suppression"
      ((DELETED++))
    fi
  else
    echo "⏭️  $branch - conservée ($commits commits non-mergés)"
    ((SKIPPED++))
  fi
done

echo ""
echo "═══════════════════════════════════════════════"
echo "📊 Résumé:"
echo "   Supprimées: $DELETED"
echo "   Conservées/non-trouvées: $SKIPPED"

if [ "$DRY_RUN" -eq 1 ]; then
  echo ""
  echo "⚠️  Ceci était un DRY-RUN. Aucune branche n'a été supprimée."
  echo "   Utilisez: bash scripts/cleanup-branches.sh --force"
  echo "   pour effectuer le nettoyage réel."
else
  echo ""
  echo "✅ Nettoyage local terminé!"
  echo ""
  echo "🚀 Pour pusher les changements (supprimer du remote):"
  echo "   git push origin --delete master"
  echo "   (Répéter pour chaque branche supprimée)"
fi
