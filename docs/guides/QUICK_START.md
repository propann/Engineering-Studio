# ⚡ Quick Start (30 secondes)

**Lancer le Rack Audio en 3 commandes**

---

## 🚀 Go!

```bash
# 1. Installer
npm ci

# 2. Lancer
npm run dev

# 3. Ouvrir
# → http://localhost:3000/
```

**C'est tout !** ✅

---

## 🎛️ Qu'est-ce que c'est?

Un **rack de synthèse audio logiciel** avec:
- **15 moteurs** (Mutable Instruments + open source)
- **75+ presets** (Sons prêts à l'emploi)
- **Interface web** (React + Vite)
- **En temps réel** (Web Audio API)

---

## 🎮 Utilisation

1. **Landing Page** → Cliquer "Outils"
2. **Tools Hub** → Sélectionner "Audio Plugin Rack"
3. **Rack Interface** → Choisir un moteur, charger un preset
4. **Jouer** → Clavier MIDI ou souris

---

## 📋 Pré-requis (30 sec)

```bash
node --version    # v22.0.0+
npm --version     # v10.0.0+
```

Si manquant: https://nodejs.org/

---

## 🛠️ Commandes

```bash
npm run dev        # Lancer (port 3000)
npm run build      # Build prod
npm run typecheck  # Vérifier types
```

---

## 🐛 Ça ne marche pas?

```bash
# Réinstaller propre
rm -rf node_modules package-lock.json
npm ci

# Port occupé?
lsof -i :3000
kill -9 <PID>
```

---

## 📚 Plus d'infos?

- [STARTUP_GUIDE.md](STARTUP_GUIDE.md) — Guide complet (5 min)
- [README.md](../../README.md) — Vue d'ensemble
- [STATUS.md](../STATUS.md) — État du projet

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0
