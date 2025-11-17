#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
LOG_DIR="$DIR/logs"
RESULT_DIR="$DIR/results"
mkdir -p "$LOG_DIR" "$RESULT_DIR"
./setup.sh
TMP_LOG="${TMPDIR:-/tmp}/improved_html_server.log"
nohup python3 -m http.server 3000 > "$TMP_LOG" 2>&1 &
SERVER_PID=$!
cleanup() {
  if ps -p $SERVER_PID > /dev/null 2>&1; then
    kill $SERVER_PID >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT
for i in {1..40}; do
  if curl -s -o /dev/null http://localhost:3000; then
    break
  fi
  sleep 0.5
  if [ $i -eq 40 ]; then
    echo "Server failed to start" >&2
    exit 1
  fi
done
node tests/run_scenarios.js --mode=post --results "$RESULT_DIR/results_post.json" --log "$LOG_DIR/log_post.txt"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 > "$LOG_DIR/http_status.txt"
