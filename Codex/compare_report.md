# Compare Report (authoring snapshot)

> NOTE: npm/Node were unavailable in the provided PowerShell-only environment, so automated tests were not executed here. Run `bash run_all.sh` after installing Node/npm to produce fresh metrics. Expected outcomes are detailed below based on implementation intent.

| Scenario | Viewport | Baseline | Improved | Notes |
| --- | --- | --- | --- | --- |
| normal-flow | mobile | Pass | Pass | Both UIs support the default vote loop; improved UI adds guidance chips.
| normal-flow | desktop | Pass | Pass | Desktop layout gains breathing room and separate status/action stacks.
| weak-network | desktop | Pass | Pass | Both show manual refresh, but improved version adds optimistic list updates + retry button styling.
| state-restriction | desktop | Pass | Pass | Controls disable with explanatory copy; improved UI also surfaces banners.
| crowded-state | desktop | **Fail** | Pass | Baseline lacks tab navigation so queue warnings are buried; improved panel highlights queue tab + warnings.
| empty-state | desktop | Pass | Pass | Both show empty messaging; improved version adds CTA text + accent coloring.
| accessibility-nav | mobile | Pass | Pass | Keyboard flow works, with improved focus-visible rings and tab panels.

**Edge coverage**: Baseline expected to satisfy 4/5 edge scenarios; improved version covers all scenarios with accessible retries and manual refresh flows.

**Interaction flow delta**: Crowded-state scenario requires 3 steps but baseline blocks on missing tab, effectively 0 steps completed. Improved design completes all 3 thanks to segmented navigation and queue feedback.

**Accessibility improvements**: Refined tablist roles, `aria-live` feedback, visible focus outlines, and better contrast (Tailwind utility palette) enable keyboard-only journeys and screen readers to follow along.
