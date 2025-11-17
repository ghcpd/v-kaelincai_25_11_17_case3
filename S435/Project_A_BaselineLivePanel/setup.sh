#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
# Install Node deps
if [ -f package.json ]; then
  npm install
  npx playwright install --with-deps || true
fi
# Make directories
mkdir -p logs results

echo "Setup complete for baseline project"
