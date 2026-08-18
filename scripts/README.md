# 🧹 Scripts de Consolidation du Studio

Suite de scripts pour consolider les 4 projets studio et nettoyer les branches Git orphelines.

## 📋 Vue d'Ensemble

| Script | Fonction | Temps |
|--------|----------|-------|
| `consolidate-studio.sh` | **Orchestrateur principal** - Coordonne tous les autres scripts | 15-30 min |
| `audit-branches.sh` | Analyse l'état de chaque branche | 1 min |
| `backup-branches.sh` | Crée des backups complets avant nettoyage | 5-10 min |
| `import-legacy-docs.sh` | Récupère les docs importantes des projets legacy | 1 min |
| `cleanup-branches.sh` | Supprime les branches obsolètes | 1 min |

## 🚀 Démarrage Rapide

### Option 1: Tout automatiquement
```bash
bash scripts/consolidate-studio.sh all
```

### Option 2: Étape par étape
```bash
# 1. Analyser
bash scripts/consolidate-studio.sh audit

# 2. Sauvegarder
bash scripts/consolidate-studio.sh backup

# 3. Importer
bash scripts/consolidate-studio.sh import

# 4. Nettoyer (dry-run)
bash scripts/consolidate-studio.sh cleanup

# 5. Nettoyer (vraiment)
bash scripts/consolidate-studio.sh cleanup --force
```

## 📖 Détail de chaque script

### 1️⃣ `consolidate-studio.sh` - Orchestrateur

**Rôle:** Script principal qui coordonne tous les autres.

**Commandes:**
```bash
# Affiche le menu
bash scripts/consolidate-studio.sh

# Étape individuelle
bash scripts/consolidate-studio.sh audit      # Audit branches
bash scripts/consolidate-studio.sh backup     # Backups
bash scripts/consolidate-studio.sh import     # Import docs
bash scripts/consolidate-studio.sh cleanup    # Cleanup (dry-run)
bash scripts/consolidate-studio.sh cleanup --force  # Cleanup réel

# Tout d'un coup
bash scripts/consolidate-studio.sh all
```

**Résultat:** Menu de coordination avec coloration + exécution des sous-scripts

---

### 2️⃣ `audit-branches.sh` - Analyse des Branches

**Rôle:** Vérifie l'état de chaque branche et identifie les candidates au nettoyage.

**Commande:**
```bash
bash scripts/audit-branches.sh
```

**Résultat:**
```
Branch                                 | Commits  | État
----------------------------------------------+----------+-------------------
✓ main                                 |        - | 📌 Production
ep133-studio-module                    |        0 | 🔴 Peut être supprimée
feature/integrate-maquette-hub         |        5 | 🟢 À conserver
```

**Ce qu'il fait:**
- Liste toutes les branches locales
- Compte les commits différents de `main`
- Recommande les branches à supprimer
- Identifie les petites features à merger

---

### 3️⃣ `backup-branches.sh` - Sauvegarde Complète

**Rôle:** Crée des backups complets avant tout nettoyage.

**Commande:**
```bash
bash scripts/backup-branches.sh
```

**Résultat:**
```
archive/backups/
├── studio-all-20260818-143022.bundle       # Git bundle complet
├── branches-list-20260818-143022.txt       # Liste des branches
├── commit-history-20260818-143022.txt      # Graph complet
├── workbench-20260818-143022.tar.gz        # Engineering-Studio-Workbench
├── ep133-20260818-143022.tar.gz            # EP-133-KO-II-Studio
├── ecosystem-20260818-143022.tar.gz        # studio-ecosystem
└── BACKUP-INFO-20260818-143022.md          # Infos de restoration
```

**Ce qu'il fait:**
- Crée un bundle Git avec tout l'historique
- Exporte les listes de branches
- Génère un log complet
- Archive les répertoires legacy
- Crée un fichier d'info pour restauration

**Restauration en cas de problème:**
```bash
git clone archive/backups/studio-all-*.bundle restored-repo
cd restored-repo
git branch -a  # Voir toutes les branches
```

---

### 4️⃣ `import-legacy-docs.sh` - Import Documents

**Rôle:** Récupère les documents importants des projets legacy.

**Commande:**
```bash
bash scripts/import-legacy-docs.sh
```

**Résultat:**
```
docs/technical/
├── SOUND_EDITOR_TECH_SPEC.md
├── SOUND_EDITOR_PROJECT.md
├── OP1_DISK_MODE_TOOLS.md
├── TESTING_AND_DEPLOYMENT.md
└── TOOLS_AND_SETUP.md

docs/reviews/
├── IMPROVEMENTS_FROM_OP1.md
└── PROJECT_CONTEXT.md

docs/guides/
├── SOUND_EDITOR_INTEGRATION_GUIDE.md
└── SOUND_EDITOR_STARTER.md

archive/
├── e2e-reference/    # Tests E2E du projet EP-133
└── exercises-reference/
```

**Ce qu'il fait:**
- Copie les tech specs du sound editor
- Récupère les leçons apprises d'EP-133
- Archive les suites de tests
- Intègre les guides d'intégration

---

### 5️⃣ `cleanup-branches.sh` - Nettoyage Branches

**Rôle:** Supprime les branches obsolètes (avec sécurité).

**Commandes:**
```bash
# Simulation (recommandé en premier)
bash scripts/cleanup-branches.sh
bash scripts/cleanup-branches.sh --dry-run

# Vraiment supprimer
bash scripts/cleanup-branches.sh --force
```

**Résultat (dry-run):**
```
🔍 Mode DRY-RUN - aucune suppression ne sera effectuée
   Utilisez --force pour vraiment supprimer les branches

🧹 Analyse des branches à nettoyer...

🟡 master - serait supprimée (0 commits)
🟡 consolidation/phase-3-complete - serait supprimée (0 commits)
⏭️  feature/integrate-maquette-hub - conservée (5 commits)
```

**Branches à supprimer:**
- `master` (ancien default)
- `integration/studio-hub` (déjà mergée)
- `consolidation/phase-3-complete` (archive)
- `*-module` branches (anciennes stratégies)
- `phase4/adaptive-framework` (prototype)

---

## ⚙️ Flux de Travail Recommandé

### Jour 1: Audit & Préparation
```bash
# 1. Audit pour comprendre l'état
bash scripts/consolidate-studio.sh audit

# 2. Créer les backups complets
bash scripts/consolidate-studio.sh backup
```

### Jour 2: Import & Tests
```bash
# 3. Importer les docs legacy
bash scripts/consolidate-studio.sh import

# 4. Vérifier les imports
git status
git diff

# 5. Tester la build
npm run build:all
npm run test:all

# 6. Committer les imports
git add docs/ archive/
git commit -m "docs: Import legacy documentation from ecosystem and EP-133"
git push origin main
```

### Jour 3: Nettoyage (après approbation)
```bash
# 7. Simulation du cleanup
bash scripts/consolidate-studio.sh cleanup --dry-run

# 8. Validation de la simulation
# ✅ Vérifier que les branches correctes sont listées

# 9. Cleanup réel
bash scripts/consolidate-studio.sh cleanup --force

# 10. Pusher les suppressions
git push origin --delete master
git push origin --delete integration/studio-hub
# ... etc pour chaque branche
```

---

## 🔒 Sécurité & Récupération

### En cas de problème

**Si tu as supprimé une branche par erreur:**
```bash
# Restaurer depuis le bundle
git clone archive/backups/studio-all-*.bundle recovery-repo
cd recovery-repo
git branch -a  # Trouver la branche
git show <branch>:<path/to/file>  # Voir le contenu

# Copier vers le repo principal
git show recovery-repo/<branch>:<path> > file
```

**Si tu veux annuler tout le cleanup:**
```bash
# Avant d'avoir pushé
git reset --hard HEAD~N  # N = nombre de commits à annuler

# Après avoir pushé (plus compliqué)
# Contacte l'équipe pour récupérer les branches du remote
```

---

## 💡 Tips & Tricks

### Voir exactement ce qui serait mergé
```bash
git diff --stat main..branch-name
```

### Vérifier qu'une branche est safe à supprimer
```bash
# Aucun commit différent = safe
git log --oneline main..branch-name | wc -l
```

### Créer un snapshot avant cleanup
```bash
git stash
git tag backup-$(date +%Y%m%d) main
git stash pop
```

### Voir la taille des objets Git
```bash
git gc --aggressive
du -sh .git
```

---

## 📞 Besoin d'aide?

Chaque script affiche de l'aide:
```bash
bash scripts/consolidate-studio.sh    # Menu principal
bash scripts/cleanup-branches.sh      # Affiche les options
```

Les fichiers créés dans `archive/backups/` contiennent des instructions de restauration.

---

## 🎯 Checklist Finale

- [ ] Lire la section "Vue d'Ensemble" et comprendre chaque script
- [ ] Exécuter `audit-branches.sh` pour voir l'état actuel
- [ ] Exécuter `backup-branches.sh` pour sauvegarder
- [ ] Exécuter `import-legacy-docs.sh` et tester la build
- [ ] Valider les imports avec l'équipe
- [ ] Committer les imports
- [ ] Exécuter cleanup --dry-run et valider
- [ ] Exécuter cleanup --force
- [ ] Pusher les suppressions
- [ ] Documenter le changement dans CHANGELOG

**Estimation totale:** 2-3 jours de travail
