#!/bin/bash

# Script de démarrage automatique des 3 studios
# Utilisation: bash start-dev.sh

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                           ║"
echo "║              🚀 DÉMARRAGE AUTOMATIQUE DES 3 STUDIOS 🚀                   ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Arrêter les anciens processus
echo "🔄 Nettoyage des anciens processus..."
killall -9 node npm vite 2>/dev/null || true
sleep 2
echo "✅ Anciens processus arrêtés"

echo ""
echo "🧹 Nettoyage des caches..."
rm -rf apps/*/node_modules/.vite 2>/dev/null
rm -rf .vite 2>/dev/null
rm -rf maquette/.next 2>/dev/null
echo "✅ Caches nettoyés"

echo ""
echo "📦 Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
  echo "Installation des dépendances..."
  npm install --prefer-offline
  echo "✅ Dépendances installées"
else
  echo "✅ Dépendances OK"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "🚀 LANCEMENT DES 3 STUDIOS"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Lancer Studio Hub
echo "📍 Hub Studio (5179)..."
cd /home/azoth/Engineering-Studio/apps/studio-hub
npm run dev -- --host 127.0.0.1 --port 5179 > /tmp/hub.log 2>&1 &
HUB_PID=$!
echo "   ✅ Lancé (PID: $HUB_PID)"

# Lancer OP-1 Studio
echo "📍 OP-1 Studio (5175)..."
cd /home/azoth/Engineering-Studio/apps/op1-studio
npm run dev -- --host 127.0.0.1 --port 5175 > /tmp/op1.log 2>&1 &
OP1_PID=$!
echo "   ✅ Lancé (PID: $OP1_PID)"

# Lancer EP-133 Studio
echo "📍 EP-133 Studio (5177)..."
cd /home/azoth/Engineering-Studio/apps/ep133-studio
npm run dev -- --host 127.0.0.1 --port 5177 > /tmp/ep133.log 2>&1 &
EP133_PID=$!
echo "   ✅ Lancé (PID: $EP133_PID)"

cd /home/azoth/Engineering-Studio

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "⏳ Attente du démarrage (15 secondes)..."
echo "════════════════════════════════════════════════════════════════════════════"

sleep 15

echo ""
echo "🔍 Vérification des services..."
echo ""

curl -s http://127.0.0.1:5179/ | grep -q "html" && echo "✅ Hub (5179) - ACTIF" || echo "⏳ Hub - démarrage..."
curl -s http://127.0.0.1:5175/ | grep -q "html" && echo "✅ OP-1 (5175) - ACTIF" || echo "⏳ OP-1 - démarrage..."
curl -s http://127.0.0.1:5177/ | grep -q "html" && echo "✅ EP-133 (5177) - ACTIF" || echo "⏳ EP-133 - démarrage..."

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "🌐 STUDIOS DISPONIBLES:"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "   🔗 Hub:     http://127.0.0.1:5179/"
echo "   🎹 OP-1:    http://127.0.0.1:5175/"
echo "   🥁 EP-133:  http://127.0.0.1:5177/"
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "✅ DÉMARRAGE COMPLET!"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📝 Logs disponibles:"
echo "   - Hub:     tail -f /tmp/hub.log"
echo "   - OP-1:    tail -f /tmp/op1.log"
echo "   - EP-133:  tail -f /tmp/ep133.log"
echo ""
echo "Pour arrêter: killall node npm vite"
echo ""


