# City Public Art · Live Interaction Panel Experiments

This workspace contains two reproducible web applications that highlight UI/UX improvements for the Live Interaction Panel used at city public art installations.

- **Project_A_BaselineLivePanel** – a dense, single-column baseline with limited feedback.
- **Project_B_ImprovedLivePanel** – an accessible, responsive re-design using modern patterns, tabs, optimistic UI, and stronger feedback loops.

Both apps are static HTML/JS experiences served with `python3 -m http.server 3000`, matching the "static site" branch of the detection logic below.

## Project type detection
- When an experience requires routing, component re-use, or complex data flows, it should be implemented as a Next.js project mounted at `/root/webapp/app/page.tsx`.
- Lightweight panels or prototypes without routing can remain static. Because the Live Interaction Panel is self-contained, both Project A and Project B are static HTML builds bootstrapped in their respective folders. Tailwind CSS is loaded via CDN inside Project B to satisfy the modern styling requirement without a build step.

## Setup & installation
Run the setup script (installs Playwright + helpers) before testing each project:

```bash
bash Project_A_BaselineLivePanel/setup.sh
bash Project_B_ImprovedLivePanel/setup.sh
```

Each setup script simply runs `npm install` within its project directory.

## Starting the dev server on port 3000
Both projects are static. Use the provided `run_tests.sh` or manually start the server:

```bash
cd Project_A_BaselineLivePanel
nohup python3 -m http.server 3000 > /tmp/html_server.log 2>&1 &
```

Replace the directory with `Project_B_ImprovedLivePanel` to preview the improved UI. Visit `http://localhost:3000/?scenario=normal-flow`.

## Automated UI tests
Tests are Playwright-powered scenario runners defined in `tests/run_scenarios.js` (duplicated per project so they can emit project-specific filenames). They read `test_scenarios.json` at the repo root and drive the UI through:

- Scenario-specific states (NORMAL, CROWDED, PAUSED, MAINTENANCE, weak-network)
- Manual refresh, retries, and optimistic updates
- Tabbed navigation (Program ↔ Live Wall ↔ Queue)
- Accessibility behaviors (keyboard navigation, focus rings, `aria-live` regions)
- Responsive viewports (mobile + desktop)

Run tests per project:

```bash
cd Project_A_BaselineLivePanel
bash run_tests.sh

cd ../Project_B_ImprovedLivePanel
bash run_tests.sh
```

Each script:
1. Installs dependencies.
2. Starts `python3 -m http.server 3000` with `nohup`.
3. Waits for `http://localhost:3000` to return HTTP 200.
4. Executes the Playwright scenario runner, which stores:
   - `results/results_pre.json` or `results/results_post.json`
   - `logs/log_pre.txt` or `logs/log_post.txt`
5. Captures the HTTP status check for traceability.

## Run everything & compare
Execute all steps and generate `compare_report.md` with one command:

```bash
bash run_all.sh
```

Artifacts land under `./results` plus per-project `results/` and `logs/`. The compare script aggregates scenario pass/fail counts, edge coverage, accessibility metrics, and interaction flow deltas.

## Test scenarios overview (`test_scenarios.json`)
1. **normal-flow (normal)** – Visitor on a healthy network completes a vote successfully. Validates the baseline flow clarity.
2. **weak-network (edge)** – Manual refresh, loading state, failed wall message, retry UI, and eventual success. Ensures weak-network patterns and optimistic updates.
3. **state-restriction (error-handling)** – Installation PAUSED. Buttons/forms must be disabled with explanatory copy.
4. **crowded-state (edge)** – Reservation tab highlights high queue counts and still lets visitors request a slot.
5. **empty-state (edge)** – Program list empty for the next two hours. UI should show an empty-state call-to-action.
6. **accessibility-nav (accessibility)** – Keyboard-only navigation, focus states, and screen-reader-friendly announcements.

## Common UI/UX pitfalls addressed
- **Visual overload** – Baseline crams all content into one scroll. Improved UI uses tabs & cards to introduce hierarchy.
- **Weak feedback** – Lack of loading states caused confusion; improved version shows optimistic placeholders, manual refresh, and contextual banners.
- **Non-responsive layouts** – Baseline only stacks content; improved layout adapts via CSS grid + Tailwind utility classes.
- **Missing accessibility affordances** – Improved version adds `role="tabpanel"`, keyboard tablist handling, focus-visible styles, and `aria-live` updates.

## Limitations
- DOM-based assertions approximate visual verification; no full pixel diffing is performed.
- Network simulations rely on deterministic timeouts, not real sockets.
- Tailwind is loaded from a CDN to avoid a build pipeline; offline environments should download assets beforehand.
- Tests stop at verifying DOM/ARIA behaviors and do not validate audio/visual output from the actual art installation hardware.
