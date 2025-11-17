#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
npm install
nohup python3 -m http.server 3000 > /tmp/html_server_improved.log 2>&1 &
sleep 1
status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$status" != "200" ]; then echo "Server not ready: $status"; exit 1; fi
node ./tests/test_runner.js
pkill -f "http.server" || true

echo "Improved tests finished"
