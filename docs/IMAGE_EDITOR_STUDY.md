# ÉTUDE: Éditeur d'Images OP-1 320×160

**Date:** 2026-08-18  
**Contexte:** Centralisation des outils au Hub  
**Objectif:** Créer un vrai éditeur d'images firmware-compatible

---

## 📋 ANALYSE DU PROBLÈME

### Écran OP-1
- **Format:** 320×160 pixels (écran OLED monochrome)
- **Stockage:** Bitmap pixels binaires (ON/OFF par pixel)
- **Localisation:** Embedded dans le firmware `/content/display/*.svg`
- **Couleurs:** Monochrome blanc sur noir

### Ressources Firmware Actuelles
Trouvées dans `/apps/op1-studio/public/firmware-mods/`:

| Fichier | Lignes | Groupes SVG | Utilité |
|---------|--------|------------|---------|
| **tape.svg** | 240 | 18 | Écran magnétoscope avec animations (bobines, vitesse) |
| **album.svg** | 396 | ? | Album/songs rendering |
| **mixer.svg** | 113 | ? | Mixer 4 canaux |
| **playmode.svg** | 175 | 24 | Modes de jeu avec états de boutons |
| **tapeconfig.svg** | 515 | ? | Configuration tape avancée |
| **rymd.svg** | 62 | ? | Effet "Rymd" (Space) |

**Format:** SVG Vectoriel créé dans Adobe Illustrator  
**Problème:** Vecteurs ≠ Pixels (anti-aliasing, précision)  
**Solution:** Rasteriser à 320×160 exact + convertir en monochrome pur

### Animation System
Les SVG utilisent des **groupes `<g id="...">` pour les animations:**
- Groupes visibles/invisibles = états différents
- Exemple tape.svg: `<g id="reelleft">`, `<g id="reelright">`, `<g id="tapespeed">`
- Machine affiche/cache groupes → Animation fluide

---

## 🔍 RECHERCHE COMMUNAUTÉ

### Outils OP-1 Existants
À explorer:
- [ ] op1-glitter - Theme creator (GitHub: op1hacks/op1-glitter)
- [ ] op1repacker - Firmware modifier (vendored dans ce repo)
- [ ] op1-sample-manager
- [ ] OP-1 Field Firmware Editor
- [ ] Teenage Engineering Official Tools?

### Questions de Recherche
1. Quel éditeur graphique utilise op1-glitter?
2. Comment rasterise-t-on SVG → bitmap 320×160?
3. Existe-t-il un standard de stockage des écrans?
4. Quel format binaire pour les pixels?

---

## 💡 OPTIONS

### Option 1: Réutiliser Éditeur Existant
**Avantages:**
- Déjà testé par la communauté
- Moins de code à maintenir
- Compatibilité garantie

**Inconvénients:**
- Peut ne pas s'intégrer au Hub
- Dépendances externes
- Interface utilisateur figée

**Candidats:**
- Krita (raster, libre, 320×160 template)
- Aseprite (pixel art, payant mais bon)
- Piskel (browser-based, libre, simple)

### Option 2: Créer Notre Éditeur
**Avantages:**
- Intégré au Hub (seamless UX)
- Optimisé pour OP-1 uniquement
- Full control sur le workflow

**Inconvénients:**
- Beaucoup de code custom
- Support des animations complexe
- Maintenance long-terme

**Composants nécessaires:**
1. Canvas pixel editor (déjà partiellement fait)
2. SVG group animator (déjà partiellement fait)
3. Rasterizer SVG → bitmap 320×160
4. Converter bitmap → firmware format
5. Palettes & preview en temps réel

### Option 3: Hybride
**Approche:**
- Intégrer Piskel ou éditeur léger au Hub
- Ajouter nos modules (animator, rasterizer, exporters)
- Réutiliser op1repacker pour les patches

---

## 🎯 TÂCHES DE RECHERCHE

Priority: **HAUTÈ

```bash
# 1. Étudier op1-glitter
git clone https://github.com/op1hacks/op1-glitter
# → Comment modifient-ils les écrans?
# → Quel format de sortie?

# 2. Étudier op1repacker
# → Déjà dans /tools/vendor/op1repacker
# → Voir op1_gfx.py, comprendre les patches

# 3. Chercher forums/docs
# → teenage.engineering guides
# → Reddit r/OP1users
# → op1 Slack community

# 4. Analyser firmware binaire
# → Extraire un firmware officiel
# → Étudier structure /content/display/
# → Voir format pixel réel

# 5. Test de concept
# → Charger tape.svg
# → Rasteriser 320×160
# → Convertir pixels → bitmap
# → Comparer avec original
```

---

## 📊 DOCUMENTATION ACTUELLE

### Hub Integration
- ✅ Éditeur accessible via `/outils` → "Éditeur d'image"
- ✅ Mode Dessin (pixel drawing)
- ✅ Mode Animations (SVG group control)
- ✅ Galerie firmware (6 fichiers)
- ❓ Export format (PNG ok, SVG animation?, firmware binary?)

### Architecture
```
ImageEditorOP1.tsx
├── Mode DRAW
│   ├── Canvas (320×160)
│   ├── Outils: pencil, brush, eraser, line, rect, circle
│   └── Export: PNG
├── Mode ANIMATE
│   ├── Load SVG firmware
│   ├── Extract groups <g id="...">
│   ├── Frame animator
│   ├── Real-time preview
│   └── Export: SVG + ?
└── Shared
    ├── Undo/Redo (40 steps)
    ├── Zoom 1×-16×
    └── Color picker (OP-1 palette)
```

### Gaps
- [ ] SVG rasterizer pour pixel-perfect 320×160
- [ ] Monochrome converter (gris → noir/blanc)
- [ ] Firmware binary exporter
- [ ] Animation frame sequencer
- [ ] Group visibility serializer

---

## 📝 PROCHAINES ÉTAPES

1. **RECHERCHE (3 heures max)**
   - Clone op1-glitter, analyse code
   - Cherche GitHub OP-1 screen editors
   - Lit op1repacker documentation
   - Teste rasterization SVG.js ou Fabric.js

2. **DÉCISION**
   - Réutiliser Piskel/Aseprite + nos modules?
   - Créer de toutes pièces?
   - Hybrid approach?

3. **PROTOTYPE**
   - SVG → PNG 320×160 (pixel perfect)
   - Monochrome converter
   - Test export vers firmware

4. **INTÉGRATION**
   - Brancher au Hub
   - UI/UX polish
   - Documentation utilisateur

---

## 🔗 RESSOURCES

### Repos OP-1
- teenage.engineering/guides (documentation officielle)
- op1hacks/op1-glitter (theme customizer)
- op1-sample-manager
- op1-firmware-modder

### Libraries candidates
- **SVG:** svg.js, Fabric.js, svgexport
- **Pixel:** Pixelmator, Piskel, Krita
- **Rasterize:** sharp, ImageMagick, puppeteer
- **Animation:** GSAP, Anime.js

### Docs
- FIRMWARE_MOD_CATALOG.md (ce repo)
- OP1_KNOWLEDGE_BASE.md (ce repo)
- /tools/vendor/op1repacker/VENDORED.md


---

## 🔥 ÉTUDE EXISTANTE: PIXEL_EDITOR_ARCHITECTURE.md

**TROUVÉE:** Documentation détaillée du projet original  
**Auteurs:** Studio Hub architecture team  
**Status:** Décisions arrêtées, roadmap définie

### Décision Clé: NE PAS réutiliser d'éditeur généraliste

> "Nous ne devons pas intégrer un éditeur graphique généraliste tel quel. Le bon choix est un éditeur natif OP-1 Studio, construit autour d'une grille entière et d'un modèle d'asset contrôlé."

### Candidates Étudiés

| Projet | Verdict | Pourquoi |
|--------|---------|---------|
| **Piskel** | ❌ Rejeté | Appli entière, dépendances, pas d'export SVG OP-1 |
| **miniPaint** | ❌ Rejeté | Trop généraliste, raster PNG/JPG au centre |
| **Dotting** | ⭐ MEILLEUR | React, MIT, zoom/pan, grille, calques, outils pixel |
| **PixelCraft** | ❌ Rejeté | Lent pour >128×128 (besoin 320×160) |
| **Poxil** | ❌ Rejeté | Trop de features, appli produit complète |
| **STRd6** | ⚠️ Référence | Petit éditeur, mais CoffeeScript ancien |

### Choix: Éditeur Custom Inspiré de Dotting

**Ce qu'on prend de Dotting:**
- Composant React (pas d'iframe)
- Grille pixel avec zoom/pan
- Calques et outils (crayon, gomme, remplissage)
- License MIT open

**Ce qu'on change:**
- Format interne = matrice pixels OP-1 contrôlée
- Palette = couleurs autorisées machine
- Export = SVG/patch déterministe (pas PNG libre)
- Import SVG = adaptateur réversible
- Validation stricte dimensions + contrôles firmware

### Feuille de Route Recommandée

**Phase 1:** Inventaire & Verrouillage
- ✅ Lire viewBox chaque SVG
- ✅ Classer profils (320×160, overlays, font, internes)
- ✅ Conserver SVG original + hash

**Phase 2:** Éditeur Pixel Sécurisé (PROTOTYPE)
- ✅ Canvas grille, zoom, coordonnées
- ✅ Crayon, gomme, pipette, remplissage, ligne, rectangle
- ✅ Palette limitée couleurs autorisées
- ✅ Undo/redo, remise à l'original
- ✅ Import rasterisé dimensions déclarées
- ❌ Pas encore export firmware

**Phase 3:** Export Contrôlé
- SVG déterministe (pas script, image externe, filtre)
- Regrouper pixels adjacents → rectangles
- Validation dimensions, palette, coordonnées
- Manifeste avant/après + hashes

**Phase 4:** Préparation Firmware
- Appliquer patch sur copie déballée
- Vérifier fichier target + profil
- Reconstruire firmware output
- ❌ Jamais écrire directement machine

**Phase 5:** Profils Avancés
- Éditeurs pour 340×170
- Traiter easter eggs
- Police opfont.svg en mode vectoriel

**Phase 6:** Thèmes Complets
- Import dossier `/content/display` entier
- Thème global couleur source → cible
- Prévisualiser avant/après
- Génération patch par fichier

### Inventaire Firmware Local (13 août 2026)

61 SVG total dans firmware OS 246:

| Profil | Nombre | Règle |
|--------|--------|-------|
| **320×160** | **53** | ✅ Éditable - écran standard |
| 340×170 | 5 | ⚠️ Overlays spécifiques |
| 1000×700 | 1 | 🔒 Easter egg Lander |
| 2182×1444 | 1 | 🔒 Police opfont.svg |
| Autres | 1 | 🔒 colors.svg (internal) |

### Critères de Qualité à Vérifier

- [ ] Zéro coordonnée fractionnaire dans pixel
- [ ] Zéro perte de l'original après import
- [ ] Test aller-retour import → export → import
- [ ] Patch appliqué sur copie temporaire UNIQUEMENT
- [ ] Refus si hash, dimension ou chemin ne correspondent
- [ ] Test visuel 1× et fort zoom
- [ ] Tests TypeScript, Python et build

---

## 🛠️ RECOMMANDATIONS POUR CE PROJET

### À FAIRE (Priority HAUTE)

1. **Étudier Dotting** (hunkim98/dotting)
   - Extraire modèle pixel + outils
   - Adapter pour grille entière OP-1
   - Tester zoom/pan sur 320×160

2. **Valider Rasterisation SVG**
   - Charger tape.svg
   - Rasteriser à 320×160 exact
   - Convertir monochrome (gris → noir/blanc)
   - Comparer avec original

3. **Implémenter SVG → Pixels**
   - Parser viewBox dimensions
   - Vérifier exact 320×160
   - Extraire bitmap pixels
   - Stocker en matrice interne

4. **Tester Export SVG Deterministe**
   - Pixels → rectangles adjacents
   - Validation palette
   - Génération manifeste
   - Test patch sur copie firmware

### À ÉVITER

- ❌ Dépendances externes (CDN, services)
- ❌ Coordonnées flottantes/fractionnaires
- ❌ Anti-aliasing ou filtres
- ❌ Export PNG présenté comme firmware
- ❌ Modification directe firmware (toujours copie)

---

## 🔗 RESSOURCES DOCUMENTÉES

**Dans ce repo:**
- `PIXEL_EDITOR_ARCHITECTURE.md` ← Architecture complète
- `FIRMWARE_MOD_CATALOG.md` ← Catalog des mods
- `/tools/display_bridge.py` ← Point d'entrée inventaire
- `/tools/vendor/op1repacker/` ← Logique patch/validation

**External:**
- https://github.com/op1hacks/op1-glitter ← Theme customizer community
- https://github.com/hunkim98/dotting ← React pixel editor (MIT)
- https://github.com/piskelapp/piskel ← Reference UX complète
- Teenage Engineering guides ← Format machine

