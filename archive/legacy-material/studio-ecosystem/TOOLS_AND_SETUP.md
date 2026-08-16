# 🛠️ GUIDE COMPLET DES OUTILS - Studio Ecosystem

---

## 📋 Table des Matières

1. [Outils de Développement](#outils-de-développement)
2. [Outils d'Analyse](#outils-danalyse)
3. [Outils de Test](#outils-de-test)
4. [Outils de Build](#outils-de-build)
5. [Configuration des Outils](#configuration-des-outils)
6. [Scripts npm](#scripts-npm)
7. [Workflow de Développement](#workflow-de-développement)
8. [Troubleshooting des Outils](#troubleshooting-des-outils)

---

## 🛠️ Outils de Développement

### 1. **Node.js & npm**

**Description:** Runtime JavaScript et package manager

**Installation:**
```bash
# Télécharger depuis https://nodejs.org/
# Recommandé: LTS (18+)

# Vérifier l'installation
node --version  # v18.x.x
npm --version   # 9.x.x
```

**Usage:**
```bash
npm install         # Installer les dépendances
npm run dev         # Lancer le dev server
npm run build       # Build production
npm list            # Lister les packages
npm update          # Mettre à jour les packages
```

---

### 2. **Vite**

**Description:** Build tool et dev server ultra-rapide

**Version:** 5.4.21

**Configuration:** `packages/studio-hub/vite.config.ts`

**Features:**
- ⚡ Dev server instantané (< 300ms startup)
- 🔄 Hot Module Replacement (HMR)
- 📦 Optimized production builds
- 🎯 TypeScript support natif

**Usage:**
```bash
npm run dev       # Dev server (http://localhost:5173/)
npm run build     # Build production (→ dist/)
npm run preview   # Preview du build
```

**Config:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
```

---

### 3. **TypeScript**

**Description:** Langage typé au-dessus de JavaScript

**Version:** ^5.0

**Configuration:** `tsconfig.json` & `tsconfig.node.json`

**Features:**
- 📝 Types statiques
- 🔍 Détection d'erreurs au build
- 🎯 Autocompletion IDE

**Usage:**
```bash
# Vérifier les types (Vite bypass les erreurs)
npx tsc --noEmit

# Compiler TypeScript
npx tsc
```

**Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

### 4. **React**

**Description:** Framework UI

**Version:** 19.2.8

**Features:**
- ⚛️ Component-based architecture
- 🔄 Virtual DOM
- 🪝 Hooks (useState, useEffect, custom hooks)

**Patterns Utilisés:**
```typescript
// Functional Components
export function MyComponent() {
  const [state, setState] = useState(0);
  
  useEffect(() => {
    // Side effects
  }, []);
  
  return <div>Content</div>;
}
```

---

### 5. **Zustand**

**Description:** State management library

**Version:** 5.0.15

**Features:**
- 📦 Minimal & elegant
- 💾 Persistence middleware
- 🎯 TypeScript first

**Usage:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      state: null,
      setState: (value) => set({ state: value })
    }),
    { name: 'store-name' }
  )
);
```

---

## 🔍 Outils d'Analyse

### 1. **code-analysis.js** (Custom)

**Créé pour:** Vérifier la qualité du code

**What it checks:**
- ✅ Imports inutilisés
- ✅ Exports non utilisés  
- ✅ Complexité cyclomatique
- ✅ Utilisation des types
- ✅ Convention de nommage
- ✅ Sécurité

**Usage:**
```bash
node code-analysis.js
```

**Output:**
```
✅ BON CODE! Seulement 2 petit(s) problème(s) mineur(s)
```

---

### 2. **ESLint** (À implémenter)

**Description:** Linter pour JavaScript/TypeScript

**Setup:**
```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin

# Config
npx eslint --init
```

**Usage:**
```bash
npx eslint src/
npx eslint src/ --fix  # Fix automatique
```

---

### 3. **Prettier** (À implémenter)

**Description:** Code formatter

**Setup:**
```bash
npm install --save-dev prettier
echo '{}' > .prettierrc.json
```

**Usage:**
```bash
npx prettier --write src/
```

---

## 🧪 Outils de Test

### 1. **test-suite.js** (Custom)

**Créé pour:** Vérifier les correctifs appliqués

**Tests:**
- ✅ 20 tests de vérification
- ✅ Build verification
- ✅ Integrity checks

**Usage:**
```bash
node test-suite.js
```

**Result:** 95% success rate

---

### 2. **functional-test.js** (Custom)

**Créé pour:** Tester la logique du store

**Tests:**
- ✅ 12 tests fonctionnels
- ✅ Store logic
- ✅ Data integrity
- ✅ localStorage optimization

**Usage:**
```bash
node functional-test.js
```

**Result:** 100% success rate

---

### 3. **Jest** (À implémenter)

**Description:** Testing framework

**Setup:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest

# jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
};
```

**Usage:**
```bash
jest
jest --watch
```

---

### 4. **React Testing Library** (À implémenter)

**Description:** Test React components

**Example:**
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

---

## 📦 Outils de Build

### 1. **Vite Build**

**Commande:** `npm run build`

**Process:**
1. Compile TypeScript → JavaScript
2. Bundle modules
3. Optimize assets
4. Generate dist/

**Output:**
```
dist/
├── index.html
├── assets/
│   ├── index-*.js
│   ├── index-*.css (si applicable)
│   └── ...
```

**Performance:**
- Build time: ~1 second
- Bundle size: 254.92 kB (gzip: 72.05 kB)

### 2. **Compression**

Vite génère automatiquement des versions gzippées pour le serveur.

**Vérifier:**
```bash
npm run build
ls -lah dist/assets/
# Voir les .js et .css compressés
```

---

## ⚙️ Configuration des Outils

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",                    // Dev server
    "build": "vite build",            // Production build
    "preview": "vite preview",        // Preview build
    "type-check": "tsc --noEmit",     // TypeScript check
    "lint": "eslint src/",            // ESLint (à ajouter)
    "format": "prettier --write src/" // Prettier (à ajouter)
  }
}
```

### Environment Variables

Créer `.env.local`:
```bash
VITE_API_URL=http://localhost:3000
VITE_ENV=development
```

Usage dans le code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### TypeScript Config

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

---

## 📝 Scripts npm

### Development

```bash
npm run dev
# Démarre Vite sur http://localhost:5173/
# Hot reload automatique au changement de fichier
```

### Production Build

```bash
npm run build
# Crée un build optimisé dans dist/
# À déployer sur un serveur
```

### Preview Build

```bash
npm run preview
# Prévisualise le build production en local
# Aide à tester avant de déployer
```

### Type Checking

```bash
npm run type-check
# Vérife les types TypeScript
# Note: Vite compile quand même en cas d'erreur
```

---

## 🔄 Workflow de Développement

### 1. Setup Initial

```bash
# Cloner et installer
git clone <repo-url>
cd studio-ecosystem
npm install
cd packages/studio-hub
npm run dev
```

### 2. Développement

```bash
# Lancer le dev server
npm run dev

# Faire des changements
# → Hot reload automatique
# → Voir les changements en temps réel
```

### 3. Avant de Committer

```bash
# Tester le code
npm run build          # Vérifier que ça compile
npm run type-check     # Vérifier les types

# Lancer les tests
node code-analysis.js
node test-suite.js
node functional-test.js
```

### 4. Production

```bash
# Build final
npm run build

# Déployer dist/ sur un serveur
# (Vercel, Netlify, AWS S3, etc.)
```

---

## 🐛 Troubleshooting des Outils

### Problème: npm install échoue

```bash
# Clear cache
npm cache clean --force

# Réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Problème: Vite dev server ne démarre pas

```bash
# Port déjà utilisé
npm run dev -- --port 3000

# Ou arrêter le processus existant
lsof -ti:5173 | xargs kill -9
```

### Problème: TypeScript errors mais build réussit

```bash
# C'est normal avec Vite (transpile sans erreur)
# Pour être strict:
npm run type-check
```

### Problème: Build production trop lourd

```bash
# Analyser la taille
npm install --save-dev vite-plugin-visualizer

# Vérifier dist/
ls -lah dist/assets/

# Optimiser:
# 1. Lazy load les routes
# 2. Code splitting
# 3. Tree shaking
```

### Problème: localhost:5173 refuse la connexion

```bash
# Vite pas encore prêt
# Attendre 5 secondes

# Ou relancer manuellement
npm run dev

# Ou vérifier le port
netstat -tlnp | grep 5173
```

---

## 📊 Performance des Outils

| Outil | Temps | Status |
|-------|-------|--------|
| Dev startup | ~210ms | ✅ Très rapide |
| Build | ~1s | ✅ Très rapide |
| Type check | ~2s | ✅ Rapide |
| Code analysis | ~0.5s | ✅ Instant |
| Tests | ~1s | ✅ Rapide |

---

## 🚀 Recommandations

### Pour Démarrer

1. **Installer Node.js 18+**
2. **npm install** dans la racine
3. **npm run dev** pour développer
4. **npm run build** avant de déployer

### For Production

1. **npm run build** pour générer dist/
2. **npm run preview** pour tester
3. Déployer `dist/` sur un CDN/serveur
4. Utiliser HTTPS
5. Activer la compression gzip

### Best Practices

- ✅ Utiliser TypeScript strict
- ✅ Tester avant de merger
- ✅ Lancer la suite de tests
- ✅ Vérifier la taille du bundle
- ✅ Utiliser .env pour les secrets
- ✅ Committer les node_modules dans .gitignore

---

## 📚 Ressources

- **Vite Docs:** https://vitejs.dev/
- **React Docs:** https://react.dev/
- **TypeScript Docs:** https://www.typescriptlang.org/
- **Zustand Docs:** https://github.com/pmndrs/zustand

---

**Dernière mise à jour:** 2024-08-15
