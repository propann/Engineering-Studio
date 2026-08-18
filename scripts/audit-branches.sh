#!/bin/bash
# Script pour auditer toutes les branches locales et voir leur état
# Usage: bash scripts/audit-branches.sh

echo "🔍 Audit des branches Git..."
echo ""
echo "Branch                                 | Commits  | État"
echo "----------------------------------------------+----------+-------------------"

git fetch --all 2>/dev/null

# Analyser chaque branche
git branch | while read branch; do
  branch=${branch// /}
  [ -z "$branch" ] && continue

  if [ "$branch" = "main" ]; then
    echo "✓ $branch" | awk '{printf "%-40s | %8s | %s\n", $2, "CURRENT", "📌 Production"}'
    continue
  fi

  # Compter les commits différents de main
  commits=$(git log --oneline main..$branch 2>/dev/null | wc -l)

  # Déterminer le statut
  if [ "$commits" -eq 0 ]; then
    status="🔴 Peut être supprimée"
  elif [ "$commits" -lt 5 ]; then
    status="🟡 À évaluer"
  else
    status="🟢 À conserver"
  fi

  printf "%-40s | %8d | %s\n" "$branch" "$commits" "$status"
done

echo ""
echo "💡 Interprétation:"
echo "  🔴 0 commits = Déjà mergée ou dupliquée"
echo "  🟡 1-4 commits = Petite feature à merger ou supprimer"
echo "  🟢 5+ commits = Travail significatif à évaluer"
echo ""
echo "Branchements à supprimer en priorité:"
git branch | grep -E "consolidation|module|integration|agent" | while read branch; do
  branch=${branch// /}
  commits=$(git log --oneline main..$branch 2>/dev/null | wc -l)
  [ "$commits" -eq 0 ] && echo "  git branch -D $branch"
done
