# Local navigation defect investigation and repair

**Date:** 2026-11-08 UTC
**Branch:** `arena/698e4880-up17-autopublisher`
**Scope:** local development/demo navigation only; no backend, cloud, OAuth, publishing, paid service or deployment work
**Status:** IMPLEMENTED AND TESTED LOCALLY; owner acceptance NOT RECORDED

## 1. Root cause and reproduction boundary

The reported symptom was that clicking sidebar/menu items appeared to leave the main screen unchanged on a local development server. It was treated as real and investigated independently of the earlier production delivery report.

A clean Chromium session against the documented `npm run dev` server on loopback did **not** reproduce a persistent unchanged-screen failure for the ten canonical sidebar destinations: each click changed the URL, heading, distinctive main content and active sidebar item. The investigation did demonstrate concrete adjacent defects and development-mode gaps:

- Design System was absent from the mobile More menu and search, used the generic heading “Up17 AutoPublisher”, and had no return navigation.
- The mobile More trigger lacked `aria-current`, and the Notifications utility had an active ARIA state but no visible active treatment.
- Browser regressions were production-build only; they did not prove the development-server experience, history/refresh/direct entry, or navigation across all four themes on desktop and mobile.
- A production service worker previously registered on the same localhost origin could remain registered after switching to development. A controlled production-to-development experiment reproduced an inherited `/sw.js` controller; development now unregisters it and best-effort removes app caches.
- A long-lived preview tab showed a transient HMR hydration mismatch after shell edits (old server-rendered text/class versus updated client bundles). It cleared on reload/clean restart. This is recorded as an observed development hazard, not claimed as the exact user’s root cause.

The exact persistent stale-screen symptom was not reproduced in a clean browser. The repair therefore fixes demonstrated navigation/utility gaps, removes inherited development service-worker control, and adds development-mode route-content regressions rather than asserting an unproven single root cause.

## 2. Why the previous tests missed it

Earlier gates were real browser tests, but they targeted production builds and narrower shell assertions. They checked canonical sidebar clicks and generic heading visibility, not development-mode route-specific content for every destination, refresh/direct/back-forward, mobile access to Design System, utility active states, or theme persistence across a full navigation matrix. The Design System preview’s generic heading was accepted by its own foundation test. The More menu count excluded Design System. No development-mode Playwright config existed.

## 3. Changed files

- Navigation model/active matching: `lib/navigation.ts`, `components/shell/icons.tsx`
- Shell/utility navigation: `components/shell/app-shell.tsx`, `app/globals.css`
- Design System route identity/return: `app/design-system/page.tsx`
- Development service-worker cleanup: `components/shell/pwa-provider.tsx`
- Development test infrastructure: `playwright.dev.config.ts`, `next.config.ts`, `package.json`, `.gitignore`, `.prettierignore`, `eslint.config.mjs`
- Regressions: `tests/e2e/navigation.spec.ts`, `tests/unit/navigation.test.ts`, updated `tests/e2e/{foundation,shell,polish}.spec.ts`
- Documentation/evidence: README, `docs/TEST_STRATEGY.md`, `docs/TEST_EVIDENCE.md`, `docs/SPRINT_STATUS.md`, `docs/CHANGELOG.md`, `docs/MASTER_PLAN.md`, `docs/REQUIREMENTS_TRACEABILITY.md`, `docs/UI_DELIVERY_REPORT.md`, `docs/ci/quality.yml.example`, `docs/evidence/navigation-repair-validation.txt`

`docs/PLAN.md` remains unchanged.

## 4. Individual route verification

The development-mode matrix asserts, for every destination: click from a different screen, exact URL, unique heading and distinctive content, active navigation state, reload, direct entry, back and forward. It runs on desktop and mobile in Clay Light, Clay Dark, Bento Light and Bento Dark.

| Destination | Route | Unique content asserted | Active state asserted | Result |
|---|---|---|---|---|
| Overview | `/` | “Your next great clip starts here.” / welcome copy | Sidebar/bottom Overview | PASS |
| Video Studio | `/video-studio` | “One source, many possibilities.” | Sidebar/bottom Videos | PASS |
| AI Content | `/ai-content` | “No model has run” | Sidebar/More | PASS |
| Smart Scheduler | `/scheduler` | “Plan demo slots” | Sidebar/More | PASS |
| Publishing Queue | `/queue` | “never submits a real publication” | Sidebar/bottom Queue | PASS |
| Creator Studio | `/creator-studio` | “Shape the title, cover and settings” | Sidebar/More | PASS |
| Research Centre | `/research` | “Live research is not connected” | Sidebar/More | PASS |
| Performance Lab | `/performance` | “No analytics are connected” | Sidebar/More | PASS |
| Accounts | `/accounts` | “No real identity is connected” | Sidebar/bottom Accounts | PASS |
| Settings | `/settings` | “Personalize the local experience” | Sidebar/More | PASS |
| Notifications | `/notifications` | “interface examples” | Topbar utility/More | PASS |
| Design System | `/design-system` | “Clay-first creator studio foundation” | Standalone design-system navigation/More | PASS |

## 5. Desktop and mobile results

Desktop: ten canonical sidebar links, Notifications topbar utility and Design System profile-menu link reach distinct screens. Mobile: four bottom-nav primaries and eight More-menu destinations reach distinct screens; More closes after selection and exposes the current destination. The More menu now contains all twelve destinations. Theme selection persists across reload and navigation in all four themes.

## 6. Related interaction repairs

- Design System is reachable from mobile More and search, has a unique heading, current-page marker and “Back to Overview” link.
- Active matching is segment-aware (`/accounts/demo-1` matches Accounts; `/accounts-archive` does not; root is exact).
- Notifications has a visible active treatment; More exposes `aria-current` for non-primary destinations.
- Development mode unregisters an inherited production `/sw.js` worker and best-effort deletes `up17-shell-*` caches.
- Audited tabs, filters, dropdowns, dialogs and disabled controls. No additional practical dead button was found; unavailable publishing/automation controls remain intentionally disabled and explained rather than converted into fake success.

## 7. Executed tests

Exact commands and outputs are recorded in [navigation-repair-validation.txt](evidence/navigation-repair-validation.txt).

| Gate | Result |
|---|---|
| `npm run format:check` | PASS |
| `npm run lint` | PASS — zero warnings |
| `npm run typecheck` | PASS |
| `npm run test:unit` | PASS — 24 tests |
| `npm run test:security` | PASS — 34 Python + 2 TS checks; 155 requirements |
| `npm run build` | PASS — 15 routes |
| `npm run test:e2e` | PASS — 114 production-browser assertions |
| `npm run test:a11y` | PASS — 80 axe scans, zero violations |
| `npm run test:visual` | PASS — 90 viewport checks |
| `npm run test:navigation:dev` | PASS — 13 development-mode assertions, including 8 desktop/mobile four-theme matrices |
| `npm run check` | PASS |

## 8. Console, network and hydration findings

The development navigation matrix fails on page errors, console errors, HTTP responses ≥400 and non-aborted request failures. Final runs recorded none. Superseded Next.js RSC prefetch requests sometimes abort with `net::ERR_ABORTED` while the final route/content assertions pass; these are classified as navigation cancellations, not runtime failures. A transient HMR hydration mismatch was observed in a long-lived preview after shell edits and cleared on reload/clean restart; clean development regression runs did not reproduce it.

## 9. Preview-origin limitation

The sandbox browser could not reach the external Arena preview hostname (`ERR_CONNECTION_CLOSED`), so the proxied preview origin was not independently browser-tested from this environment. Loopback development was browser-tested, and `allowedDevOrigins` retains the Arena preview wildcard plus loopback hosts. A server-side probe against the running dev server returned HTTP 200 for a real development chunk requested with the Arena preview Host/Origin and HTTP 403 for an unlisted origin. The live preview server binds to `0.0.0.0` and browser-facing code uses relative URLs. After a controlled clean `.next/dev` restart, a hydrated live-preview smoke check passed 24/24 desktop/mobile destination clicks with zero counted console/network errors.

## 10. Commit and branch verification

Work is committed only to `arena/698e4880-up17-autopublisher`. The final commit hash and remote match are recorded in the immediate post-push session audit and sprint delivery history; a commit cannot contain its own final hash.

## 11. Does every menu destination now genuinely change screens?

Yes for the tested local development and production browser matrices: all twelve menu destinations now change to their own URL, heading, distinctive content and active state on desktop and mobile, including refresh, direct entry and back/forward. This is a technical verification result, not owner acceptance. Manual screen-reader review, Windows runtime, OS install behavior and the external preview-origin browser check remain outside the executed evidence.
