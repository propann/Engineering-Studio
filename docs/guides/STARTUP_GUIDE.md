# 🚀 Guide de Démarrage Complet

Mise en place du **Audio Plugin Rack** en moins de 5 minutes.

---

## ⚡ Démarrage Ultra-Rapide (2 min)

```bash
# 1. Cloner
git clone https://github.com/your-org/Engineering-Studio.git
cd Engineering-Studio

# 2. Installer
npm ci

# 3. Lancer
npm run dev

# ✅ Ouvrir: http://localhost:3000/
```

**C'est tout !** Le rack audio démarre en ~200ms.

---

## 📋 Pré-requis

### Système d'exploitation
- **Linux** (testé: Ubuntu 22.04+)
- **macOS** (Monterey+)
- **Windows** (WSL2 recommandé)

### Logiciels requis
```bash
# Node.js 22+ et npm 10+
node --version    # v22.0.0+
npm --version     # v10.0.0+
```

### Vérifier la configuration
```bash
node --version
npm --version
npm list -g @vitejs/plugin-react
```

---

## 🔧 Installation Étape par Étape

### Étape 1: Cloner le repository

```bash
git clone https://github.com/your-org/Engineering-Studio.git
cd Engineering-Studio
```

**Vérifier**: Vous devez voir le dossier `apps/` et `packages/`

```bash
ls apps/studio-hub/
ls packages/audio-bridge/
ls packages/midi-bridge/
```

### Étape 2: Installer les dépendances

```bash
npm ci
```

**Quoi faire si ça échoue**:
```bash
# Option 1: Force install
npm ci --force

# Option 2: Clean install
rm -rf node_modules package-lock.json
npm install

# Option 3: Version exacte de Node
nvm install 22
nvm use 22
npm ci
```

**Vérifier**: Vous devez voir `node_modules/` créé

```bash
ls node_modules | head -10
# Vous devez voir: react, vite, typescript, etc.
```

### Étape 3: Naviguer dans le dossier du Rack

```bash
cd apps/studio-hub
```

### Étape 4: Lancer le dev server

```bash
npm run dev
```

**Vous devez voir**:
```
  VITE v8.2.1  ready in 208 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.2.59:3000/
```

### Étape 5: Ouvrir dans le navigateur

**Local**:
```
http://localhost:3000/
```

**Réseau** (depuis un autre ordinateur):
```
http://192.168.2.59:3000/
```

---

## 🎮 Première Utilisation

### Page de Landing
1. Cliquez sur **"Outils"** pour accéder au hub

### Tools Hub
2. Cliquez sur **"Audio Plugin Rack"** pour accéder aux synthétiseurs

### Audio Plugin Rack
3. Sélectionnez un **moteur de synthèse**:
   - **MI Plaits** (6 modes: VA, FM, WT, Granular, Speech, Chord)
   - **Dexed FM** (synthèse FM style DX7)
   - **Helm** (subtractive avec crossmod)
   - ... et 12 autres moteurs

4. Chargez un **preset**:
   - 75+ presets factory disponibles
   - Catégorisés par type: Lead, Bass, Pad, Bell, Perc, FX, etc.

5. **Jouez**:
   - Clavier MIDI connecté (WebMIDI)
   - Ou clavier souris (touches QWERTY)

6. **Créez un patch**:
   - Modifiez les paramètres en temps réel
   - Sauvegardez votre création

---

## 🔍 Vérifier que Tout Fonctionne

### Test 1: Service démarre
```bash
npm run dev
# Vous devez voir: "ready in X ms"
```

### Test 2: Réponse HTTP
```bash
curl http://localhost:3000/
# Doit retourner du HTML avec <title>Studio Hub</title>
```

### Test 3: Console navigateur
Ouvrez **DevTools** (F12):
- Allez dans l'onglet **Console**
- Vous ne devez voir **aucune erreur rouge**
- Les warnings jaunes sont ok

### Test 4: Charger un preset
1. Allez dans **Audio Plugin Rack**
2. Sélectionnez un moteur (ex: "MI Plaits")
3. Cliquez sur un preset (ex: "Virtual Analog Saw Lead")
4. Le patch doit se charger sans erreur

---

## 🛠️ Commandes Utiles

### Développement

```bash
# Démarrer le dev server
npm run dev

# Build pour production
npm run build

# Prévisualiser la build
npm run preview

# Vérifier les types TypeScript
npm run typecheck

# Linting (vérifier la qualité du code)
npm run lint
```

### Git

```bash
# Vérifier l'état
git status

# Ajouter les changements
git add .

# Commit
git commit -m "Description du changement"

# Push vers GitHub
git push origin main
```

### Debugging

```bash
# Afficher les logs du dev server
npm run dev 2>&1 | tee server.log

# Vérifier le port 3000
lsof -i :3000

# Tuer le processus sur le port 3000
kill -9 <PID>

# Vérifier la structure des packages
ls packages/
ls packages/audio-bridge/
ls packages/midi-bridge/
```

---

## 🚨 Troubleshooting

### Problème 1: "Cannot find module @studio-hub/audio-bridge"

**Cause**: Les aliases ne sont pas configurés correctement dans Vite

**Solution**:
```bash
# Vérifiez que les fichiers existent
ls packages/audio-bridge/index.ts
ls packages/midi-bridge/index.ts

# Vérifiez vite.config.ts
cat apps/studio-hub/vite.config.ts | grep "@studio-hub"
```

**Doit afficher**:
```typescript
"@studio-hub/midi-bridge": path.resolve(..."/packages/midi-bridge/index.ts"),
"@studio-hub/audio-bridge": path.resolve(..."/packages/audio-bridge/index.ts"),
```

### Problème 2: Port 3000 déjà utilisé

**Cause**: Un autre processus utilise le port 3000

**Solution**:
```bash
# Option 1: Vite utilisera automatiquement le port suivant
# (strictPort: false dans vite.config.ts)

# Option 2: Tuer le processus existant
lsof -i :3000
kill -9 <PID>

# Option 3: Changer le port dans vite.config.ts
server: { port: 3001 }
```

### Problème 3: "npm: command not found"

**Cause**: Node.js/npm n'est pas installé

**Solution**:
```bash
# Installer Node.js 22+
# Télécharger depuis: https://nodejs.org/

# Vérifier l'installation
node --version   # Doit afficher v22+
npm --version    # Doit afficher npm 10+
```

### Problème 4: Build échoue

**Cause**: Dépendances corrompues ou incompatibles

**Solution**:
```bash
# Réinstallation propre
rm -rf node_modules package-lock.json
npm cache clean --force
npm ci
```

### Problème 5: TypeScript erreurs

**Cause**: Types TypeScript manquants

**Solution**:
```bash
# Lancer le typecheck
npm run typecheck

# Installer les types manquants
npm install --save-dev @types/node
```

---

## 📁 Structure Attendue

Après installation, vous devez avoir:

```
Engineering-Studio/
├─ node_modules/              ✅ Dépendances npm
├─ apps/
│  └─ studio-hub/
│     ├─ src/                 ✅ Code source React
│     ├─ node_modules/        ✅ Dépendances locales
│     ├─ vite.config.ts       ✅ Configuration Vite (avec aliases)
│     └─ package.json         ✅
├─ packages/
│  ├─ audio-bridge/
│  │  └─ index.ts             ✅ Logger et audio utils
│  └─ midi-bridge/
│     └─ index.ts             ✅ MIDI routing
├─ docs/                      ✅ Documentation
├─ package.json               ✅ Root dependencies
├─ package-lock.json          ✅ Lock file
├─ tsconfig.json              ✅ Config TypeScript
├─ README.md                  ✅ Documentation
└─ .git/                      ✅ Repository Git
```

---

## 🌐 Accès Réseau

### Local (Machine actuelle)
```
http://localhost:3000/
http://127.0.0.1:3000/
```

### Réseau (Autres machines)
```
http://<your-local-ip>:3000/
# Exemple: http://192.168.2.59:3000/
```

### Trouver votre IP locale
```bash
# Linux/macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

---

## 💾 Sauvegarder votre Travail

### Commits Git
```bash
# Ajouter les changements
git add .

# Commit local
git commit -m "Créer mon patch personnalisé"

# Pousser vers GitHub
git push origin main
```

### Exporter les Patches (à venir)
La fonction d'export des patches sera disponible dans les prochaines versions.

---

## 🎯 Étapes Suivantes

### Après le démarrage
1. ✅ Explorer les 15 moteurs de synthèse
2. ✅ Charger et modifier des presets
3. ✅ Créer vos propres patches
4. ✅ Connecter un contrôleur MIDI
5. ✅ Contribuer au code (voir CONTRIBUTING.md)

### Si vous voulez développer
1. Créer une branche feature: `git checkout -b feature/xxx`
2. Modifier le code dans `apps/studio-hub/src/`
3. Le dev server redémarre automatiquement (hot reload)
4. Commit et push quand c'est prêt

### Ressources
- [README.md](../../README.md) — Vue d'ensemble du projet
- [QUICK_START.md](QUICK_START.md) — TL;DR (30 sec)
- [STATUS.md](../STATUS.md) — État du projet
- [ROADMAP.md](../ROADMAP.md) — Prochaines étapes

---

## 📞 Aide

### Vérifier les logs
```bash
# Terminal 1: Lancer le dev server
npm run dev

# Terminal 2: Vérifier les logs
tail -f /tmp/studio-hub.log
```

### Questions ?
- Consulter la documentation dans `/docs/`
- Vérifier le STATUS.md
- Ouvrir une issue sur GitHub

---

## ✅ Checklist de Configuration

- [ ] Node.js 22+ installé
- [ ] npm 10+ installé
- [ ] Repository cloné
- [ ] `npm ci` réussi
- [ ] `npm run dev` démarre sans erreur
- [ ] http://localhost:3000/ répond
- [ ] Audio Plugin Rack s'affiche
- [ ] Un preset se charge sans erreur
- [ ] Console navigateur: aucune erreur rouge
- [ ] Port 3000 accessible depuis un autre PC

---

**Status**: ✅ Ready to Go!  
**Version**: 1.0.0  
**Last Updated**: 2026-08-20
