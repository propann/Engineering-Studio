#!/bin/bash

# Script de démarrage automatique des studios
# Utilisation: bash start-dev.sh

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                           ║"
echo "║              🚀 DÉMARRAGE AUTOMATIQUE DES STUDIOS 🚀                     ║"
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
echo "🚀 LANCEMENT DES STUDIOS"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Lancer les studios
npm run dev:all

