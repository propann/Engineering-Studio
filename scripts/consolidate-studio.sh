#!/bin/bash
# Script maître pour consolider complètement le studio
# Orchestrate l'import, audit, backup et nettoyage
# Usage: bash scripts/consolidate-studio.sh [step]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_step() {
  echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Vérifier qu'on est dans le bon répertoire
if [ ! -d ".git" ] || [ ! -f "package.json" ]; then
  print_error "Pas dans le répertoire Engineering-Studio"
  exit 1
fi

# Menu principal si pas de step spécifié
if [ -z "$1" ]; then
  print_header "🎯 Studio Consolidation - Menu Principal"
  echo "Étapes disponibles:"
  echo "  1. audit      - Analyser les branches"
  echo "  2. backup     - Créer les backups"
  echo "  3. import     - Importer les docs legacy"
  echo "  4. cleanup    - Nettoyer les branches (dry-run)"
  echo "  5. all        - Exécuter toutes les étapes"
  echo ""
  echo "Usage: bash scripts/consolidate-studio.sh [step] [options]"
  echo ""
  echo "Exemples:"
  echo "  bash scripts/consolidate-studio.sh audit"
  echo "  bash scripts/consolidate-studio.sh backup"
  echo "  bash scripts/consolidate-studio.sh cleanup --force"
  echo "  bash scripts/consolidate-studio.sh all"
  exit 0
fi

# Étape 1: Audit des branches
if [ "$1" = "audit" ] || [ "$1" = "all" ]; then
  print_header "📊 ÉTAPE 1: Audit des Branches"

  print_step "Récupérer les infos des branches distantes..."
  git fetch --all --quiet
  print_success "Fetched"

  print_step "Analyser les branches..."
  bash scripts/audit-branches.sh

  if [ "$1" = "audit" ]; then
    exit 0
  fi
fi

# Étape 2: Backup
if [ "$1" = "backup" ] || [ "$1" = "all" ]; then
  print_header "💾 ÉTAPE 2: Backup Complet"

  print_warning "Cela peut prendre quelques minutes..."
  bash scripts/backup-branches.sh

  if [ "$1" = "backup" ]; then
    exit 0
  fi
  echo ""
fi

# Étape 3: Import des docs
if [ "$1" = "import" ] || [ "$1" = "all" ]; then
  print_header "📂 ÉTAPE 3: Import Documents Legacy"

  bash scripts/import-legacy-docs.sh

  print_step "Vérifier les imports..."
  git status --short | grep "^??" | wc -l | xargs echo "Fichiers non-trackés:"

  if [ "$1" = "import" ]; then
    exit 0
  fi
  echo ""
fi

# Étape 4: Cleanup
if [ "$1" = "cleanup" ] || [ "$1" = "all" ]; then
  print_header "🧹 ÉTAPE 4: Cleanup des Branches"

  # Passer les arguments additionnels au script de cleanup
  bash scripts/cleanup-branches.sh ${@:2}

  if [ "$1" = "cleanup" ]; then
    exit 0
  fi
  echo ""
fi

# Résumé final si "all"
if [ "$1" = "all" ]; then
  print_header "🎉 CONSOLIDATION COMPLÈTE"

  echo "✅ Toutes les étapes ont été exécutées!"
  echo ""
  echo "Prochaines étapes recommandées:"
  echo "  1. Vérifier les modifications: git status"
  echo "  2. Tester la build: npm run build:all"
  echo "  3. Tester les tests: npm run test:all"
  echo "  4. Committer: git add . && git commit -m 'chore: Import legacy docs'"
  echo "  5. Pour le cleanup réel: bash scripts/cleanup-branches.sh --force"
  echo ""
  echo "📖 Documentation de consolidation disponible dans:"
  echo "   - docs/STUDIO_CONSOLIDATION_REPORT.md"
  echo "   - archive/backups/BACKUP-INFO-*.md"
fi
