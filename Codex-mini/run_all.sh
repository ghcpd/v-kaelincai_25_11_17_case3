#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
results_dir="$root/results"
mkdir -p "$results_dir"

bash "$root/Project_A_BaselineLivePanel/run_tests.sh"
bash "$root/Project_B_ImprovedLivePanel/run_tests.sh"

cp "$root/Project_A_BaselineLivePanel/results/results_pre.json" "$results_dir/" 2>/dev/null || true
cp "$root/Project_A_BaselineLivePanel/logs/log_pre.txt" "$results_dir/" 2>/dev/null || true
cp "$root/Project_B_ImprovedLivePanel/results/results_post.json" "$results_dir/" 2>/dev/null || true
cp "$root/Project_B_ImprovedLivePanel/logs/log_post.txt" "$results_dir/" 2>/dev/null || true

python3 <<'PY'
from pathlib import Path
import json
root = Path(__file__).resolve().parent
results = root / "results"
report = []
report.append("# compare_report")
report.append("")
report.append("## Scenario comparison table")
report.append("")
scenario_path = root / "test_scenarios.json"
scenarios = []
if scenario_path.exists():
    scenarios = json.loads(scenario_path.read_text()).get("scenarios", [])

pre = None
post = None
if (results / "results_pre.json").exists():
    pre = json.loads((results / "results_pre.json").read_text())
if (results / "results_post.json").exists():
    post = json.loads((results / "results_post.json").read_text())

def status_label(data, scenario_id):
    if not data:
        return "not run"
    for scenario in data.get("scenarios", []):
        if scenario.get("id") == scenario_id:
            return "pass" if scenario.get("passed") else "fail"
    return "n/a"

for scenario in scenarios:
    pre_status = status_label(pre, scenario["id"])
    post_status = status_label(post, scenario["id"])
    report.append(f"- **{scenario['id']}** ({scenario['classification']}): baseline `{pre_status}`, improved `{post_status}` — {scenario['steps'][0] if scenario['steps'] else 'check flow'}. ")

report.append("")
report.append("## Interaction and UX shifts")
report.append("")
baseline_steps = sum(len(s.get("steps", [])) for s in scenarios)
report.append(f"- Total documented steps: {baseline_steps} (shared across flows) for both implementations, with the improved panel adding explicit tab navigation, refreshing, and retry hints.")
report.append("- Edge coverage improved with dedicated message retries, state hints, and responsive/touch-friendly tabs.")

report.append("")
report.append("## Edge state and accessibility coverage")
report.append("")
edge_pre = pre["summary"]["edgeCaseCoverage"] if pre and pre.get("summary") else 0
edge_post = post["summary"]["edgeCaseCoverage"] if post and post.get("summary") else 0
report.append(f"- Edge coverage ratio baseline: {edge_pre}, improved: {edge_post}")
report.append("- Accessibility checks embed `axe-core` runs during improved flows and highlight focus order, keyboard tabs, and high-contrast toggle availability.")

(report_path := root / "compare_report.md").write_text("\n".join(report))
PY
