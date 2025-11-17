#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mode="post"
mkdir -p logs results
logfile="logs/log_${mode}.txt"
server_log="/tmp/html_server.log"
server_pid=0

function cleanup() {
  if [ "$server_pid" -ne 0 ]; then
    kill "$server_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

npm install
nohup python3 -m http.server 3000 > "$server_log" 2>&1 &
server_pid=$!

for i in {1..10}; do
  if curl -sf http://localhost:3000 >/dev/null; then
    break
  fi
  sleep 1
done

RESULT_MODE="$mode" npm test >> "$logfile" 2>&1
curl -sf http://localhost:3000 >/dev/null
