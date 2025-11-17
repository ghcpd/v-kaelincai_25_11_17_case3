#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
# Install deps
npm install
# Start server
nohup python3 -m http.server 3000 > /tmp/html_server_baseline.log 2>&1 &
sleep 1
# Verify HTTP 200
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$status" != "200" ]; then echo "Server not ready: $status"; exit 1; fi
# Run tests
node ./tests/test_runner.js
# Kill server
pkill -f "http.server" || true

echo "Baseline tests finished"
