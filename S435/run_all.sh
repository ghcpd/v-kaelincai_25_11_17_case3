#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
mkdir -p results

# Run baseline
pushd Project_A_BaselineLivePanel
chmod +x setup.sh run_tests.sh || true
./setup.sh
./run_tests.sh
popd
# Move results
mv Project_A_BaselineLivePanel/results/results_pre.json results/results_pre.json || true
mv Project_A_BaselineLivePanel/logs/log_pre.txt results/log_pre.txt || true

# Run improved
pushd Project_B_ImprovedLivePanel
chmod +x setup.sh run_tests.sh || true
./setup.sh
./run_tests.sh
popd
# Move results
mv Project_B_ImprovedLivePanel/results/results_post.json results/results_post.json || true
mv Project_B_ImprovedLivePanel/logs/log_post.txt results/log_post.txt || true

# Compare
node ./compare_results.js

echo "All runs complete. Reports in results/ and compare_report.md"
