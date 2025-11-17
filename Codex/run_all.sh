#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
RESULT_ROOT="$ROOT/results"
mkdir -p "$RESULT_ROOT"

pushd "$ROOT/Project_A_BaselineLivePanel" >/dev/null
bash run_tests.sh
popd >/dev/null

pushd "$ROOT/Project_B_ImprovedLivePanel" >/dev/null
bash run_tests.sh
popd >/dev/null

cp "$ROOT/Project_A_BaselineLivePanel/results/results_pre.json" "$RESULT_ROOT/results_pre.json"
cp "$ROOT/Project_A_BaselineLivePanel/logs/log_pre.txt" "$RESULT_ROOT/log_pre.txt"
cp "$ROOT/Project_B_ImprovedLivePanel/results/results_post.json" "$RESULT_ROOT/results_post.json"
cp "$ROOT/Project_B_ImprovedLivePanel/logs/log_post.txt" "$RESULT_ROOT/log_post.txt"

node "$ROOT/scripts/compare.js"
