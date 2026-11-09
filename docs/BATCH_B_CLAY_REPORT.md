# Batch B — sculptural Clay material engine

**Date:** 2026-11-08 UTC (execution environment clock crossed into 2026-11-09 during the run). **Status:** COMPLETE for the requested theme-engine scope, locally verified; owner visual acceptance is separate. This does not make demo workflows real.

## Implemented

- Added `app/clay.css`: centralized material tokens for Clay Light and Clay Dark. Each raised material combines ambient/contact shadows with an upper highlight and lower occlusion; wells use opposing inner shadows. Buttons have distinct sculptural hover, pressed, keyboard-focus and flat disabled states. Inputs, cards, badges, dialogs, navigation, toggles and screen-level panels consume the same roles.
- Preserved all four theme IDs and the existing responsive layout. Every material rule is scoped to `[data-theme^="clay-"]`; Bento Light/Dark remain flat, with no clay gradients or inset material shadows.
- Applied through shared primitives and shell classes across all 12 destinations, not an Overview-only redesign.
- Moved the stable pre-paint theme script out of the head to avoid React 19's executable-script warning; no lint suppression was added.

## Executed verification

Registry-only Chromium 153 fallback, production build, Linux:

| Gate | Result |
|---|---|
| `test:clay` | **62 PASS** — 12 screenshot baselines (4 themes × mobile/tablet/desktop), computed material/state contracts, 48 all-destination family checks, 2 Clay axe scans |
| `test:e2e` (includes a11y/visual tags) | **116 PASS** |
| `test:a11y` | **82 PASS** |
| `test:visual` | **150 PASS** |
| `check` | PASS — formatting, zero-warning lint, types, 33 unit, 36 Python + 2 TS security, build |

The dedicated suite compares committed PNG baselines with a 1% pixel tolerance and independently asserts shadow-layer counts, gradients, radius, hover/pressed/focus/disabled behavior and Bento isolation. Baselines were generated only after the material contracts passed; the final run was a comparison run, not `--update-snapshots`. Screenshots were visually inspected for Clay Light, Clay Dark and Bento Light. Logs: `/home/user/ui-review/clay-{final,e2e,a11y,visual,check}.log` (outside Git).

Initial test failures were corrected at root cause: the new clay script initially lacked a pretest build; Bento inset tokens were explicitly flattened; focus assertions now use real keyboard traversal; disabled controls are excluded from raised-material assertions. No accessibility rule or failing assertion was suppressed.

## Boundaries

Manual screen-reader review, non-Chromium engines, physical devices and owner acceptance remain NOT RUN. Baselines are Linux/Chromium-specific; other platforms need their own reviewed baselines. The hosted preview still has Vercel SSO protection, so hosted visual acceptance is pending even though the deployment build passed. Demo labels remain intact.
