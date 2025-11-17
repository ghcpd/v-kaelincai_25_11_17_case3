#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ -f package.json ]; then
  npm install
  npx playwright install --with-deps || true
fi
mkdir -p logs results

echo "Setup complete for improved project"
