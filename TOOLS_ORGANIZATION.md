# 📊 Tools Organization Strategy

**Date**: 2026-08-18  
**Status**: À implémenter  
**Complexity**: Haute

---

## 🎯 Objectif

Réorganiser la page des outils (**ToolsHub.tsx**) pour :
1. **Trier les 14+ outils** par studio/module
2. **Créer des sections** claires (Hub, OP-1, EP-133)
3. **Regrouper les outils visuels** → Logiciel de Dessin
4. **Regrouper les outils audio** → Moteur de Son

---

## 📂 Architecture Proposée

### **SECTION 1 : HUB (3 outils)**
*Outils centralisés du Hub Engineering Studio*
- 🔗 **Synchronisation MIDI** (2 machines) - `TRANSPORT`
- 🎵 **Bibliothèque sonore** (stock central) - `SON`
- 💾 **Vault & Restore** (sauvegardes) - `SAUVEGARDE`

### **SECTION 2 : OP-1 STUDIO (5 outils)**
*Tous les outils dédiés à la machine OP-1*
- 🎹 **Tape & Album Studio** (4 pistes) - `STUDIO`
- 🔧 **Firmware Lab** (mods OP-1) - `OP-1`
- 🛠️ **Services OP-1** (patchs, ressources) - `OP-1`
- 📖 **Documentation OP-1** (procédures) - `DOCUMENTATION`
- 🎓 **Exercices OP-1** (training) - `TRAINING LAB`

### **SECTION 3 : EP-133 STUDIO (5 outils)**
*Tous les outils dédiés à la machine EP-133*
- 🥁 **Pattern & Song Studio** (A/B/C/D) - `STUDIO`
- 🎤 **Sons & transferts EP-133** (64/128 Mo) - `SON`
- 🧪 **Test machine EP-133** (diagnostic MIDI) - `DIAGNOSTIC`
- 📖 **Documentation EP-133** (guides) - `DOCUMENTATION`
- 🎮 **Rhythm Hero** (training game) - `TRAINING LAB`

### **SECTION 4 : LOGICIEL DE DESSIN (groupé plus tard)**
*Tous les outils visuels réunis*
- 🎨 **Éditeur d'image** (320×160 pixels) - `CRÉATION`
- 📐 **Pixel Grid & Themes** - À créer
- 🎭 **Sprite Manager** - À créer
- ... (autres outils visuels)

**Statut** : ⏳ À implémenter après stabilisation des 3 studios

### **SECTION 5 : MOTEUR DE SON (infrastructure future)**
*Tous les outils audio rassemblés*
- 🔊 **Synthèse sons**
- 🎸 **Sampling & édition**
- 🎚️ **Mixing & EQ**
- 🎵 **Effects & layers**

**Statut** : ⏳ À planifier avec architecture audio

---

## 🎨 UI Changes Needed

### Current
- Flat list of 14 tools
- No clear hierarchy
- No filtering/tabs

### Proposed
```
[HUB] [OP-1] [EP-133] [DESSIN] [SON]
     ↓ (active tab)
   [Sync MIDI] [Library] [Vault]
   (3 tools displayed)
```

### Features to Add
- [ ] **Tab navigation** (HUB, OP-1, EP-133, etc.)
- [ ] **Filter by category** dropdown
- [ ] **Search tools** by name
- [ ] **Tool cards** with:
  - Icon/visual
  - Title + description
  - Status (REQUIS, LOCAL, etc.)
  - Target studio (op1, ep133, hub)

---

## 🔧 Implementation Steps

### Phase 1: ToolsHub Refactor (This Week)
1. Add tab/filter component
2. Reorganize tools array by category
3. Add visual grouping/sections

### Phase 2: Design Tools (Next Sprint)
1. Create "Logiciel de Dessin" landing page
2. Integrate all visual editors
3. Add design workflow

### Phase 3: Audio Engine (Future)
1. Plan audio architecture
2. Consolidate audio tools
3. Add mixing/mastering workflow

---

## 📝 Current Tools by Category

```
OP-1 (2)
- Firmware Lab
- Services OP-1

SAUVEGARDE (1)
- Sauvegarde OP-1

SON (2)
- Éditeur de samples
- Sons & transferts EP-133

STUDIO (2)
- Tape & Album Studio
- Pattern & Song Studio

CRÉATION (1)
- Éditeur d'image

TRAINING LAB (2)
- Exercices OP-1
- Rhythm Hero

DOCUMENTATION (2)
- Documentation OP-1
- Documentation EP-133

DIAGNOSTIC (1)
- Test machine EP-133

TRANSPORT (1)
- Synchronisation MIDI
```

---

## ✅ Success Criteria

- [ ] Tools organized into 3+ clear sections
- [ ] Each section has 3-5 tools max
- [ ] Tab/filter navigation works
- [ ] Visual hierarchy clear
- [ ] No duplicate tools
- [ ] All tools accessible
- [ ] Mobile responsive

---

**Next**: Wait for "Option A" approval to refactor ToolsHub page
