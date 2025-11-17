#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
nohup python3 -m http.server 3000 > /tmp/html_server.log 2>&1 &
sleep 1
node tests/run_tests.js
