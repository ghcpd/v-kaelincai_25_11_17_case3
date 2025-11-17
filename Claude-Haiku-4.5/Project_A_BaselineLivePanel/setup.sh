#!/bin/bash

# setup.sh for Project A Baseline Live Panel
# Installs dependencies and prepares the development environment

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Setting up Project A - Baseline Live Panel"
echo "=========================================="
echo "Project Directory: $PROJECT_DIR"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "[1/3] Installing dependencies..."
npm install

# Build project
echo "[2/3] Building project..."
npm run build

# Generate types
echo "[3/3] Generating TypeScript types..."
npm run build

echo ""
echo "=========================================="
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start dev server: npm run dev"
echo "  2. Open http://localhost:3000 in browser"
echo "  3. Run tests: npm test"
echo ""
echo "For automated testing: bash run_tests.sh"
echo "=========================================="
