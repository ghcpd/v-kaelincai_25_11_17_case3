# City Public Art Live Interaction Panel

Two static HTML iterations live under `Project_A_BaselineLivePanel` (baseline) and `Project_B_ImprovedLivePanel` (UI/UX enhanced) with shared scenario definitions. Both are served with `python3 -m http.server 3000` and tested via Playwright-driven Node scripts.

## Project detection logic

- If a folder contains `app/page.tsx`, it would be treated as a Next.js project. Neither project has that file, so both are built as static HTML experiences (`index.html` + assets + `data/test_scenarios.json`).
- Shared artifacts (scenario definitions, compare report, aggregated logs/results, run-all orchestration) live at the repo root.

## Setup

1. Run `./Project_A_BaselineLivePanel/setup.sh` and `./Project_B_ImprovedLivePanel/setup.sh` to install npm dependencies for the Playwright-powered tests.
2. `setup.sh` installs `playwright`/`axe-core` as declared in each project`s `package.json`.

## Running each version

### Baseline (Project A)
- Start the server: `cd Project_A_BaselineLivePanel && python3 -m http.server 3000`.
- Visit http://localhost:3000 to see the dense Live Interaction Panel mock.
- The layout is intentionally cramped with combined status/action sections and minimal feedback.

### Improved (Project B)
- Start the server: `cd Project_B_ImprovedLivePanel && python3 -m http.server 3000`.
- This version adds clear status/action separation, tabs (Program Interaction / Live Wall / Reservation Queue), manual refresh, optimistic updates, and accessibility hints (aria-live, high-contrast toggle, focus styling).

## Testing

Each project exposes `run_tests.sh` for end-to-end validation.

1. Execute `./Project_A_BaselineLivePanel/run_tests.sh` to:
   - Install dependencies (`npm install`).
   - Launch `python3 -m http.server 3000` with logs in `/tmp/html_server.log`.
   - Run `npm test` (Playwright + Axe) to exercise all scenarios.
   - Write `results/results_pre.json` and `logs/log_pre.txt`.
2. Execute `./Project_B_ImprovedLivePanel/run_tests.sh` (same flow, but writes `results/results_post.json` and `logs/log_post.txt`).
3. Use `./run_all.sh` at the repo root to run both suites, copy their results/logs into `/results`, and regenerate `compare_report.md`.

## Test scenarios

Each scenario in `test_scenarios.json` includes initial data, user steps, and outcome expectations. They are designed to validate core UI/UX flows:

1. **normal-flow** — Task: load the panel, select a program, vote, and post a message. Importance: ensures the typical selection → interaction → confirmation path succeeds with success feedback.
2. **tab-navigation** — Task: switch between Program Interaction, Live Wall, and Reservation Queue views. Importance: ensures consistent tab state, visual cues, and layout stability when navigating sections.
3. **weak-network** — Task: initiate an action while simulating high latency/failure, confirm loading indicators, error messaging, and retry hints. Importance: validates weak-network resilience and optimistic UI that keeps users informed.
4. **maintenance** — Task: observe maintenance state, confirm action buttons are disabled, and that users see clear maintenance messaging. Importance: ensures the panel makes unavailable interactions explicit.
5. **crowded-state** — Task: detect high queue numbers and warnings while still allowing interactions. Importance: surfaces overcrowding without blocking progress, highlighting wait-time hints.
6. **empty-state** — Task: handle no upcoming programs by surfacing helpful guidance while still allowing storytelling via the live wall. Importance: ensures the UI stays meaningful even when content is sparse.
7. **accessibility** — Task: navigate using keyboard-friendly controls, rely on high-contrast mode, and verify aria-live messaging. Importance: validates accessibility practices (focus order, labels, screen-reader hints).

## Shared artifacts

- `test_scenarios.json`: The structured scenario definitions referenced by both front ends and the Playwright tests.
- `run_all.sh`: Orchestrates both suites, aggregates results/logs into `/results`, and regenerates `compare_report.md`.
- `compare_report.md`: Summarizes UX improvements, per-scenario health, edge coverage shifts, and accessibility progress.
- `/results`: Receives aggregated `results_pre.json`, `results_post.json`, `log_pre.txt`, `log_post.txt` each time `run_all.sh` runs.

## Common pitfalls in UI/UX improvement for such panels

- Overloading the screen with variable-length data can hurt readability; improved layout fans out status vs interactions.
- Lack of action feedback (especially when networks are weak) leaves users unsure if their vote/message was accepted; optimistic UI plus retry hints keep users informed.
- Responsive layouts that aren`t mobile-first break on tablets/phones; the improved design uses grid/flex to adapt and exposes keyboard navigation cues.
- Missing accessibility attributes (labels, aria-live regions, focus states) makes the experience unusable for assistive tech; we explicitly label controls and provide screen-reader hints.

## Limitations

- Visual regression claims are validated via DOM assertions instead of pixel-perfect screenshots because the focus here is behavior/data hierarchy rather than tint changes.
- Network simulations are deterministic mock delays/flags in `assets/main.js`, so while they emulate jitter, they don`t cover full production-level websockets or offline caching loops.

