# Éditeur d'Images OP-1 — Vision & Roadmap

**Date:** 2026-08-18  
**Statut:** Planification  
**Objectif:** Outil self-contained pour éditer thèmes firmware et recompiler

---

## 🎯 VISION

**Hub contient tout dans le ventre:**
- ✅ Firmware OP-1 original embedded
- ✅ 61 images SVG extraites
- ✅ Éditeur visuel pour les modifier
- ✅ Compilateur (op1repacker local)
- ✅ Export firmware.op1 modifié

**Utilisateur:**
1. Ouvre Hub → Éditeur d'images
2. Voit les 61 images du firmware original
3. Édite pour créer son thème
4. Clique "Compiler"
5. Télécharge firmware.op1 personnalisé

**Pas d'upload, pas de services externes = Autonome!**

---

## 📦 RESSOURCES DISPONIBLES

### Firmware Officiel
- **Source:** Téléchargeable via `tools/firmware_fetch.py`
- **Versions:** OP-1 OS 246 (referencé dans le repo)
- **Stockage:** `backups/firmware-builds/` (gitignored, local)
- **Extraction:** `tools/display_bridge.py` → 61 SVG

### Outils Internes
- **op1repacker:** `/apps/op1-studio/tools/vendor/op1repacker/` (✅ DISPONIBLE)
  - `op1_repack.py` - Dézipper/zipper .op1
  - `op1_gfx.py` - Patcher images SVG
  - `op1_patches.py` - Générer/appliquer patches
  - `op1_analyze.py` - Analyser firmware
  - ⚠️ **STATUS**: Outil Python prêt, manque UI React pour l'intégrer au Hub
- **display_bridge.py:** Inventaire + extraction SVG
- **firmware_fetch.py:** Télécharger firmware officiel

### Données
- **Catalogue:** `/data/firmware/catalog.json`
- **Observations:** `/data/firmware/op1_246-observation.json`
- **Exemples:** `/public/firmware-mods/` (6 fichiers)

---

## 📐 ARCHITECTURE

```
HUB APPLICATION
│
├─ EMBEDDED FIRMWARE
│  ├─ /public/firmware-original/
│  │  └─ 61 SVG extraites (zip compressé)
│  └─ Metadata (catalog.json)
│
├─ UI LAYER (React/TypeScript)
│  ├─ Gallery: Voir 61 images
│  ├─ Editor: Éditer une image
│  ├─ Themes: Gérer variations
│  └─ Export: Compiler & télécharger
│
├─ PROCESSING (Python via CLI/API)
│  ├─ Extract: display_bridge.py
│  ├─ Patch: op1_gfx.patch_image_file
│  ├─ Compile: op1_repack.repack
│  └─ Validate: op1_analyze
│
└─ OUTPUT
   └─ firmware-modified.op1 (download)
```

---

## 🗺️ ROADMAP (6 Phases)

### **PHASE 1: Fondations** (Week 1)
**Goal:** Embarquer firmware + afficher galerie

- [ ] Télécharger firmware officiel OS 246
- [ ] Extraire 61 SVG avec `display_bridge.py`
- [ ] Compresser SVG → `/public/firmware-original.zip`
- [ ] Créer composant React `FirmwareGallery`
  - Charger zip au démarrage
  - Afficher 61 images (nom + viewBox + catégorie)
  - Preview + métadonnées
- [ ] Tester affichage complet

**Output:** Galerie des 61 images du firmware ✓

---

### **PHASE 2: Édition Simple** (Week 2)
**Goal:** Éditer une image (SVG ou pixels)

- [ ] Créer `ImageEditor` component
  - Charger image du firmware
  - Afficher SVG + rendu canvas
  - 2 modes: SVG text / Pixel canvas
- [ ] Mode Pixel (améliorer ce qu'on a)
  - Rasteriser SVG → pixels 320×160
  - Dessiner avec outils (pencil, brush, etc.)
  - Undo/redo
- [ ] Mode SVG (texte)
  - Afficher/éditer XML SVG brut
  - Voir preview en temps réel
- [ ] Validation
  - Vérifier modifications possibles
  - Alerter si format incompatible

**Output:** Édition fonctionnelle d'une image ✓

---

### **PHASE 3: Thèmes Globaux** (Week 3)
**Goal:** Créer variations de thèmes

- [ ] Créer système `ThemeEditor`
  - Couleur → Couleur mapping
  - Appliquer à toutes images (ou sélection)
  - Prévisualiser avant/après
- [ ] Intégrer `op1-glitter` logic
  - Global color substitution (regex)
  - Préserver structure SVG
- [ ] Sauvegarder thèmes
  - Format: `theme.json` (compatible op1-glitter)
  - Liste des thèmes
  - Appliquer thème existant

**Output:** Créer thèmes globaux ✓

---

### **PHASE 4: Compilation Firmware** (Week 4)
**Goal:** Générer firmware modifié

- [ ] Intégrer `op1repacker` (CLI ou Python import)
- [ ] Workflow compilation:
  1. Charger images modifiées (61 SVG)
  2. Générer patches via `op1_gfx.patch_image_file`
  3. Appliquer patches au firmware copy
  4. Valider avec `op1_analyze`
  5. Repack → firmware.op1
- [ ] Validation sécurité
  - Vérifier aucune modification binaire
  - Hash avant/après
  - Manifeste complet
- [ ] Export
  - Télécharger firmware.op1
  - Inclure rapport de compilation
  - Permettre rollback

**Output:** Firmware modifié généré ✓

---

### **PHASE 5: UI Polish** (Week 5)
**Goal:** Interface professionnelle

- [ ] Design gallery (cards/grid)
- [ ] Modal éditeur (full-screen smooth)
- [ ] Progress bar compilation
- [ ] Error handling + user feedback
- [ ] Documentation in-app
- [ ] Keyboard shortcuts
- [ ] Dark/light mode

**Output:** UI Production-ready ✓

---

### **PHASE 6: Avancé** (Week 6+)
**Goal:** Fonctionnalités expert

- [ ] Import themes externes (op1-glitter format)
- [ ] Comparison before/after (visuellement)
- [ ] Batch operations (multiple images)
- [ ] Community themes gallery
- [ ] Backup/restore points
- [ ] Animation preview (groupes SVG)
- [ ] Direct machine upload (si USB possible)

**Output:** Outil complet expert ✓

---

## 🔧 DÉTAILS TECHNIQUES

### Stockage Firmware
```
/public/firmware-original.zip (max 5MB compressé)
├─ manifest.json (61 images metadata)
├─ images/
│  ├─ tape.svg (320×160)
│  ├─ album.svg
│  ├─ ... (61 total)
│  └─ opfont.svg (2182×1444 locked)
└─ lib/
   ├─ firmware.op1 (ref pour repack)
   └─ op1repacker/ (tools)
```

### Édition Workflow
```
User selects image
  ↓
Load SVG from zip
  ↓
Render canvas preview
  ↓
User edits (pixel or SVG text)
  ↓
Validate changes
  ↓
Apply patch to copy
  ↓
Store in session (not saved yet)
  ↓
[Continue editing or...]
  ↓
Generate firmware (all patches)
  ↓
Export .op1
```

### Compilation Workflow
```
Collect all modified SVG
  ↓
For each: Generate patch via op1_gfx
  ↓
Create temp firmware copy
  ↓
Apply patches sequentially
  ↓
Validate with op1_analyze
  ↓
Generate hash manifest
  ↓
Repack → firmware.op1
  ↓
Cleanup temp files
  ↓
Output + Report
```

---

## ✅ QUALITÉ REQUISE

- [ ] Zéro modification firmware original (readonly)
- [ ] Tout en temp files jusqu'à export
- [ ] Hash validation avant/après
- [ ] Manifeste complet avec trace d'éditions
- [ ] Test aller-retour: import → edit → export → import
- [ ] Zéro coordonnées fractionnaires en pixels
- [ ] Zéro perte détails vectoriels (SVG intact)
- [ ] Error recovery (rollback possible)

---

## 📊 DÉCISIONS CLÉS

1. **Pas d'upload:** Firmware embedded (autonomie)
2. **Pas d'external services:** Tout local
3. **Pas d'modification directe machine:** Toujours export + user upload
4. **SVG = Source:** Édite SVG, pas pixels (réversible)
5. **op1repacker = Single source:** Utiliser outil communautaire éprouvé

---

## 📊 STATUT ACTUEL (2026-08-18)

**PHASES COMPLÉTÉES:**
- ✅ Phase 1: Firmware embedded + Gallery (61 images, 14 catégories)
- ✅ Phase 1.5: Animation groups editor (SVG group extraction)
- ✅ Phase 2: OP-1 color palette (100% machine authentique)
- ✅ Phase 3: Theme Editor (couleur mapping + presets)
- ✅ Phase 4: Advanced Image Editor (full-screen pixel editor)

**PHASES EN ATTENTE:**
- ⏳ Phase 5: Firmware Compilation (op1repacker integration)
- ⏳ Phase 6: Advanced Features (MIDI, community themes, etc)

## 🚀 NEXT STEPS

**Phase 5 Priority:**
1. ✅ op1repacker DÉJÀ DISPONIBLE (`/apps/op1-studio/tools/vendor/op1repacker/`)
2. 🎯 CRÉER UI React pour:
   - Charger firmware modifié
   - Appliquer modifications à toutes 61 images
   - Générer patches via op1repacker
   - Repack firmware.op1
   - Export pour téléchargement (client-side)

**Phase 6 (Futur):**
1. Connexion MIDI en temps réel
2. Aperçu animation avancé
3. Galerie thèmes communautaires
4. Import/export op1-glitter compatible

---

## 📝 NOTES

- Document mis à jour: 2026-08-18
- Inspiré par op1-glitter + PIXEL_EDITOR_ARCHITECTURE.md
- Dépend de op1repacker 0.2.6 (déjà vendored)
- Scope: OP-1 standard (320×160), pas OP-1 Field
- Timeline: 6-8 semaines pour complet

## 🎯 TEST STRATEGY

**Important:** Visual testing (colors, rendering, UI) is deferred until:
1. All development phases complete
2. All features functional
3. Ready for comprehensive visual validation

This prevents premature optimization and focuses on getting features working first.

## ✅ COMPLETED PHASES

### Phase 1: Firmware Embedded + Gallery (2026-08-18) ✅
- Downloaded official OP-1 OS 246 firmware (13 MB)
- Extracted 61 SVG images (14 categories)
- Embedded in Hub as ZIP (322 KB)
- Created FirmwareGallery component with filtering
- Responsive grid layout

### Phase 1.5: Animation Groups Editor (2026-08-18) ✅
- Automatic SVG group extraction (`<g id="...">`)
- Multi-frame animation support
- Group visibility toggles per frame
- Frame navigation (1, 2, 3... +)
- Shows group count (e.g., "17 groupes")

### Phase 2: OP-1 Color Palette (2026-08-18) ✅
- Applied official OP-1 colors across entire Hub
- #383572 (dark violet) - borders, text
- #dfd9ff (light white) - backgrounds
- #00ed95 (green) - primary buttons
- #698eff (blue) - secondary
- #ff3a5d (red) - danger
- 100% machine-authentic appearance
- Zero generic web colors

### Phase 3: Theme Editor (2026-08-18) ✅
- Color mapping system (old hex → new hex)
- Save/load themes via localStorage
- Live preview on sample firmware images
- Preset palette buttons (8 OP-1 colors)
- Delete saved themes
- SvgPreview component rendering

### Phase 4: Advanced Image Editor (2026-08-18) ✅
- Full-screen pixel editor (320×160 canvas)
- Complete drawing toolset: pencil, brush, eraser, fill, picker
- Zoom levels: 1×, 2×, 4×, 8×, 16×
- Brush controls: size (1-20px), opacity (0-100%)
- Undo/redo with 40-state history
- Grid overlay (1 pixel = 1 grid square)
- Export PNG functionality
- OP-1 color palette integrated
- Sidebar animation editor (retractable left)
- Button interactions with hover states
- Connected to TopBar navigation
