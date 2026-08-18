#!/bin/bash
# Script pour importer les documents importants des projets legacy
# Usage: bash scripts/import-legacy-docs.sh

set -e

echo "🔄 Importation des documents des projets legacy..."

# Créer les répertoires s'ils n'existent pas
mkdir -p docs/technical
mkdir -p docs/reviews
mkdir -p docs/performance
mkdir -p docs/guides
mkdir -p archive/e2e-reference

# Importer depuis studio-ecosystem
echo "📂 Copie depuis studio-ecosystem..."
if [ -d "../studio-ecosystem" ]; then
  cp ../studio-ecosystem/SOUND_EDITOR_TECH_SPEC.md docs/technical/ 2>/dev/null && echo "✅ SOUND_EDITOR_TECH_SPEC.md"
  cp ../studio-ecosystem/SOUND_EDITOR_PROJECT.md docs/technical/ 2>/dev/null && echo "✅ SOUND_EDITOR_PROJECT.md"
  cp ../studio-ecosystem/SOUND_EDITOR_INTEGRATION_GUIDE.md docs/guides/ 2>/dev/null && echo "✅ SOUND_EDITOR_INTEGRATION_GUIDE.md"
  cp ../studio-ecosystem/SOUND_EDITOR_STARTER.md docs/guides/ 2>/dev/null && echo "✅ SOUND_EDITOR_STARTER.md"
  cp ../studio-ecosystem/OP1_DISK_MODE_TOOLS.md docs/technical/ 2>/dev/null && echo "✅ OP1_DISK_MODE_TOOLS.md"
  cp ../studio-ecosystem/TESTING_AND_DEPLOYMENT.md docs/technical/ 2>/dev/null && echo "✅ TESTING_AND_DEPLOYMENT.md"
  cp ../studio-ecosystem/TOOLS_AND_SETUP.md docs/technical/ 2>/dev/null && echo "✅ TOOLS_AND_SETUP.md"
else
  echo "⚠️  studio-ecosystem non trouvé"
fi

# Importer depuis EP-133-KO-II-Studio
echo "📂 Copie depuis EP-133-KO-II-Studio..."
if [ -d "../EP-133-KO-II-Studio" ]; then
  cp ../EP-133-KO-II-Studio/IMPROVEMENTS_FROM_OP1.md docs/reviews/ 2>/dev/null && echo "✅ IMPROVEMENTS_FROM_OP1.md"
  cp ../EP-133-KO-II-Studio/OPTIMIZATION_PLAN.md docs/performance/ 2>/dev/null && echo "✅ OPTIMIZATION_PLAN.md"
  cp ../EP-133-KO-II-Studio/PROJECT_CONTEXT.md docs/reviews/ 2>/dev/null && echo "✅ PROJECT_CONTEXT.md"

  # Copier les répertoires de test
  [ -d "../EP-133-KO-II-Studio/e2e" ] && cp -r ../EP-133-KO-II-Studio/e2e archive/e2e-reference && echo "✅ e2e tests"
  [ -d "../EP-133-KO-II-Studio/exercises" ] && cp -r ../EP-133-KO-II-Studio/exercises archive/exercises-reference && echo "✅ exercises"
else
  echo "⚠️  EP-133-KO-II-Studio non trouvé"
fi

echo ""
echo "✨ Import complet!"
echo ""
echo "📋 Fichiers importés:"
find docs/technical docs/reviews docs/performance docs/guides archive/e2e-reference archive/exercises-reference -maxdepth 1 -type f -o -type d | head -20

echo ""
echo "💡 Prochaines étapes:"
echo "1. Vérifier les imports: git status"
echo "2. Éditer/intégrer les documents si nécessaire"
echo "3. Ajouter les fichiers: git add docs/ archive/"
echo "4. Committer: git commit -m 'docs: Import legacy documentation'"
