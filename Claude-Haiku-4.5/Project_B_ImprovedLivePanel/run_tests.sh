#!/bin/bash

# run_tests.sh for Project B Improved Live Panel
# This script prepares environment, runs dev server, executes tests, and collects results

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${PROJECT_DIR}/logs"
RESULTS_DIR="${PROJECT_DIR}/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$LOG_DIR" "$RESULTS_DIR"

echo "=========================================="
echo "Improved Live Interaction Panel - Test Run"
echo "=========================================="
echo "Project Directory: $PROJECT_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

# Step 1: Install dependencies
echo "[1/5] Installing dependencies..."
if [ ! -d "${PROJECT_DIR}/node_modules" ]; then
    cd "$PROJECT_DIR"
    npm install 2>&1 | tee "${LOG_DIR}/install_${TIMESTAMP}.log"
else
    echo "  node_modules already exists, skipping npm install"
fi

# Step 2: Build the project
echo "[2/5] Building project..."
cd "$PROJECT_DIR"
npm run build 2>&1 | tee "${LOG_DIR}/build_${TIMESTAMP}.log"

# Step 3: Start dev server in background
echo "[3/5] Starting development server on port 3000..."
cd "$PROJECT_DIR"
npm run dev > "${LOG_DIR}/server_${TIMESTAMP}.log" 2>&1 &
DEV_SERVER_PID=$!
echo "  Dev server started with PID: $DEV_SERVER_PID"

# Wait for server to be ready
sleep 5
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "  ✓ Server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "  ✗ Server failed to start"
        kill $DEV_SERVER_PID 2>/dev/null || true
        exit 1
    fi
    echo "  Waiting for server... ($i/30)"
    sleep 1
done

# Step 4: Run tests
echo "[4/5] Running Jest tests..."
cd "$PROJECT_DIR"
npm test -- --coverage --forceExit 2>&1 | tee "${LOG_DIR}/test_${TIMESTAMP}.log"
TEST_EXIT_CODE=$?

# Step 5: Verify server is accessible
echo "[5/5] Verifying server is accessible..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "  ✓ Server returned HTTP $HTTP_STATUS"
else
    echo "  ✗ Server returned HTTP $HTTP_STATUS"
fi

# Generate result summary
RESULT_FILE="${RESULTS_DIR}/results_post_${TIMESTAMP}.json"
cat > "$RESULT_FILE" << EOF
{
  "project": "Project_B_ImprovedLivePanel",
  "timestamp": "$TIMESTAMP",
  "status": "$([ $TEST_EXIT_CODE -eq 0 ] && echo 'PASSED' || echo 'FAILED')",
  "server_status": "$HTTP_STATUS",
  "test_exit_code": $TEST_EXIT_CODE,
  "test_log": "${LOG_DIR}/test_${TIMESTAMP}.log",
  "server_log": "${LOG_DIR}/server_${TIMESTAMP}.log",
  "features_tested": [
    "clear_status_area",
    "tab_navigation",
    "tab_switching",
    "program_interaction_tab",
    "live_wall_tab",
    "queue_tab",
    "responsive_layout",
    "accessibility_features",
    "weak_network_handling",
    "proper_visual_hierarchy",
    "touch_target_sizing",
    "keyboard_navigation",
    "aria_attributes"
  ],
  "improvements": [
    "clear_separation_of_status_vs_actions",
    "tabbed_interface",
    "better_information_hierarchy",
    "responsive_mobile_first_design",
    "accessibility_compliance",
    "weak_network_friendly_patterns",
    "visual_feedback_mechanisms",
    "improved_error_handling"
  ],
  "notes": "Improved version with comprehensive UI/UX enhancements, Tailwind CSS, and accessibility features"
}
EOF
echo "  ✓ Results saved to $RESULT_FILE"

# Cleanup
echo ""
echo "Shutting down development server..."
kill $DEV_SERVER_PID 2>/dev/null || true
sleep 2

echo ""
echo "=========================================="
echo "Test run completed"
echo "Exit code: $TEST_EXIT_CODE"
echo "=========================================="

exit $TEST_EXIT_CODE
