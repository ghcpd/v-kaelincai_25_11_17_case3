#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
if [ ! -f package-lock.json ]; then
  npm install
else
  npm install --no-audit --no-fund
fi
