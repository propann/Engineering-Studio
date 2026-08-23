#!/bin/bash

# Studio Hub - Automatic Project Launcher
# This script sets up and launches the entire project

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║                    🚀 STUDIO HUB - PROJECT LAUNCHER                       ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Check Environment
echo "📋 Step 1: Checking Environment"
echo "────────────────────────────────────────────────────────────────────────────"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 22+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm 10+"
    exit 1
fi

# Check git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_status "git found: $GIT_VERSION"
else
    print_error "git not found. Please install git 2.40+"
    exit 1
fi

echo

# Step 2: Navigate to Studio Hub
echo "📁 Step 2: Navigate to Studio Hub"
echo "────────────────────────────────────────────────────────────────────────────"

cd "$PROJECT_ROOT" || {
    print_error "Failed to navigate to $PROJECT_ROOT"
    exit 1
}

print_status "Working directory: $(pwd)"
echo

# Step 3: Check Git Status
echo "🔗 Step 3: Check Git Status"
echo "────────────────────────────────────────────────────────────────────────────"

if [ -d ".git" ]; then
    print_status "Git repository found"
    CURRENT_BRANCH=$(git branch --show-current)
    print_status "Current branch: $CURRENT_BRANCH"
else
    print_error "Git repository not found"
    exit 1
fi

echo

# Step 4: Install Dependencies
echo "📦 Step 4: Install Dependencies"
echo "────────────────────────────────────────────────────────────────────────────"

if [ -d "node_modules" ]; then
    print_warning "node_modules already exists"
    read -p "Clean install? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Cleaning..."
        rm -rf node_modules package-lock.json
        echo "Installing..."
        npm install
    else
        echo "Updating existing installation..."
        npm install
    fi
else
    echo "Installing packages..."
    npm install
fi

print_status "Dependencies installed"
echo

# Step 5: Verify Installation
echo "✅ Step 5: Verify Installation"
echo "────────────────────────────────────────────────────────────────────────────"

echo "Checking package versions..."
npm list react react-dom zustand 2>/dev/null | head -5 || true

echo
print_status "Installation verified"
echo

# Step 6: Display Options
echo "🎯 Step 6: Choose How to Start"
echo "────────────────────────────────────────────────────────────────────────────"
echo
echo "Choose one of the following:"
echo "  1) Start both dev servers (OP-1 + EP-133)"
echo "  2) Start only OP-1 dev server"
echo "  3) Start only EP-133 dev server"
echo "  4) Run build verification only"
echo "  5) Run full test suite"
echo "  6) Exit"
echo

read -p "Enter choice (1-6): " choice

echo

case $choice in
    1)
        echo "🚀 Starting both dev servers..."
        echo
        echo "OP-1 will be available at: http://localhost:3000"
        echo "EP-133 will be available at: http://localhost:5173"
        echo
        print_status "Launching development servers..."
        bash start-dev.sh
        ;;
    2)
        echo "🚀 Starting OP-1 dev server..."
        echo
        echo "OP-1 will be available at: http://localhost:3000"
        echo
        print_status "Launching OP-1 development server..."
        cd apps/op1-studio && npm run dev
        ;;
    3)
        echo "🚀 Starting EP-133 dev server..."
        echo
        echo "EP-133 will be available at: http://localhost:5173"
        echo
        print_status "Launching EP-133 development server..."
        cd apps/ep133-studio && npm run dev
        ;;
    4)
        echo "🔨 Running build verification..."
        echo
        npm run build
        echo
        print_status "Build verification complete"
        ;;
    5)
        echo "🧪 Running test suite..."
        echo
        npm run typecheck
        npm run test
        npm run typecheck --prefix apps/op1-studio
        npm run typecheck --prefix apps/ep133-studio
        npm run test --prefix apps/ep133-studio
        echo
        print_status "Test suite complete"
        ;;
    6)
        echo "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║                     ✅ Project launched successfully!                     ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
