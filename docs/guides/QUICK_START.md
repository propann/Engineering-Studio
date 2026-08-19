# ⚡ QUICK START (TL;DR)

**Get up and running in 5 minutes**

---

## 1️⃣ Prerequisites

```bash
# Node 22+
node --version

# NPM 10+
npm --version

# Clone the repo (if not done)
git clone https://github.com/propann/Engineering-Studio.git
cd Engineering-Studio
```

---

## 2️⃣ Install & Run (1 min)

```bash
# Install all dependencies
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:3000/
```

**That's it!** Server running in ~358ms ✅

---

## 3️⃣ What You Get

```
✅ OP-1 Studio       - Synth/Tape editor
✅ EP-133 Studio     - Pattern/Sampler
✅ Audio Rack        - 15 synthesis engines
✅ MIDI Bridge       - Master Clock sync
```

---

## 4️⃣ Try It Out

1. Open http://localhost:3000
2. Select an audio engine
3. Press keys: A, S, D, F, G, H, J, K (C4-C5 notes)
4. Hear real-time synthesis! 🎵

---

## 📚 Learn More

| Want to... | See... |
|-----------|--------|
| Understand the architecture | [docs/architecture/ARCHITECTURE.md](../architecture/ARCHITECTURE.md) |
| Know what to work on | [docs/ROADMAP.md](../ROADMAP.md) |
| Setup details | [STARTUP_GUIDE.md](STARTUP_GUIDE.md) |
| Check project status | [docs/STATUS.md](../STATUS.md) |

---

## 🆘 Troubleshooting

### "Module not found"
```bash
npm install
npm run dev
```

### "Port 3000 in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port
npm run dev -- --port 3001
```

### "No audio"
1. Check browser console for errors
2. Allow web audio context
3. Try different browser (Chrome/Firefox)

---

**Ready to code? Go to [STARTUP_GUIDE.md](STARTUP_GUIDE.md) for full setup.**

**Status**: ✅ Production Ready
