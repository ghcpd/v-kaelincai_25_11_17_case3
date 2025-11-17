#!/usr/bin/env bash
set -e
# start static server
cd "$(dirname "$0")"
nohup python3 -m http.server 3000 > /tmp/html_server.log 2>&1 &
sleep 1
# run node tests
node tests/run_tests.js
