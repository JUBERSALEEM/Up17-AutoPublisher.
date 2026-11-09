# Changelog

## Unreleased — Batch C auth/data foundation (2026-11-08)

- Added Supabase SSR authentication, protected workspace/preferences/inbox paths, five applied hosted migrations, private media bucket policies and a rollback multi-user RLS fixture.
- Closed direct preference/workspace writes behind a revision-checked audited RPC; added category/platform integrity and multi-workspace selection fallback.
- Local aggregate/browser/accessibility/viewport/clay/navigation gates and hosted DB isolation fixture pass; hosted email delivery, SSO-protected browser acceptance and Storage-API delete remain explicit unverified gates. See [Batch C report](BATCH_C_AUTH_REPORT.md).

## Unreleased — Batch B sculptural Clay engine (2026-11-08)

- Added family-scoped Clay Light/Dark material tokens and tactile shared-component states across all 12 screens; Bento remains flat.
- Added 62 dedicated material/screenshot/accessibility checks with 12 committed viewport baselines; full local browser gates pass.
- Moved the stable theme script out of the head without lint suppression. See the Batch B report for exact evidence and remaining acceptance boundaries.

## Unreleased — local navigation repair (2026-11-08)

- Investigated the reported development-server menu/screen defect with real Chromium on localhost, desktop and mobile, all twelve destinations, refresh/direct/history and four themes. The exact stale-screen symptom was not reproduced in a clean browser; a transient HMR hydration mismatch in a long-lived preview cleared on reload/clean restart.
- Added development-mode Playwright regressions with isolated `.next-e2e-dev` output, route-specific content/active-state assertions, mobile More coverage, theme persistence and inherited production service-worker cleanup.
- Made Design System reachable from mobile More/search, gave it a unique heading and return link, added segment-aware active-state helper and visible Notifications/More active states.
- Updated README troubleshooting, test strategy/evidence, sprint status and traceability. No backend, cloud, OAuth, publishing or deployment work; owner acceptance remains separate.

## Unreleased — UI Batch 6: final verification and delivery report (2026-11-08)

- Completed final dependency audit (0 known vulnerabilities), security/documentation validation and consolidated frontend delivery report.
- Recorded exact browser/axe/viewport evidence, verified batch commits, remaining blockers and the explicit boundary between local UI completeness and unimplemented live services.
- Updated sprint/master-plan/test-strategy/traceability status without claiming owner acceptance or live integration success.

## Unreleased — UI Batch 5: polish and accessibility verification (2026-11-08)

- Added four-theme axe coverage for every main destination plus Notifications, and six-width overflow/navigation coverage for every destination.
- Added keyboard skip-link/tab-arrow/dialog-focus checks, storage-denial session fallback checks, local/device reduced-motion checks, open-dialog/mobile-menu axe scans and a touch-phone library-to-draft journey.
- Increased coarse-pointer touch targets for small buttons/tabs/toggles/checkboxes without changing desktop rhythm.
- Corrected settings preference notices to report session-only fallback when storage is denied.

## Unreleased — UI Batch 4: supporting screens (2026-11-08)

- Populated Settings, Notifications, Research Centre, AI Content and Performance Lab with honest local/demo or unavailable states.
- Added validated browser-local workspace preferences, theme/motion controls, notification category/read state, research brief CRUD, known-key local export and confirmed demo reset.
- Added explicitly simulated generic analysis markers (no detections/confidence invented), editorial prompts rather than fake trends, and analytics filters that never fabricate metrics.
- Added supporting unit/browser/axe/phone tests; fixed brief create/edit identity, dialog labels and empty-state assertions found by browser tests.

## Unreleased — UI Batch 3: core creator screens (2026-11-08)

- Populated Overview, Video Studio, Creator Studio, Smart Scheduler, Publishing Queue and Accounts with explicitly labelled demo presentation data.
- Added real library search/filter/sort/view/selection/details, browser-local per-platform drafts and demo schedule slots, queue filters/attempt details, and disconnected account requirements/settings.
- Added typed demo contracts/selectors, draft validation and browser-local storage with stable snapshots; no backend, upload, OAuth, AI or publishing calls.
- Added core unit/browser/axe/phone tests; corrected draft hydration/remount behavior, queue attention filtering and a 320px accounts overflow found during verification.

## Unreleased — UI Batch 2: responsive shell and PWA (2026-11-08)

- Added the ten canonical destinations, desktop sidebar, mobile bottom navigation/More, workspace details, destination search, profile and theme controls.
- Added original app icons, manifest, public-only service-worker cache, offline fallback and explicit update/install affordances.
- Replaced the temporary root preview with the Overview shell placeholder; retained `/design-system` for primitive review.
- Added navigation unit tests, shell/PWA browser tests, eleven-route axe coverage and six-width viewport checks. Corrected visible-label/accessibility-name mismatches found by axe.

## Unreleased — UI Batch 1: four-theme design system (2026-11-08)

- Added centralized Clay Light/Dark and Bento Light/Dark tokens, pre-paint theme resolution, local persistence/system mode, and shared tactile UI primitives.
- Added local Inter Variable/Lucide assets and an interactive primitive review with honest unavailable states.
- Corrected real axe contrast failures; added CSS-source contrast tests, theme/keyboard browser tests and four-theme axe coverage.
- Browser gates now build and own a fresh production server; documented registry-only Chromium fallback and safe launch configuration. No backend, publishing, OAuth or cloud work.

## Unreleased — M1.1 foundation hardening (2026-11-08)

- Added `server-only` protection and a real browser-condition bundle regression test; DEMO behavior unchanged.
- Removed integration-test false-green behavior; empty suites now exit 1 and no placeholder tests were added.
- Expanded Git-index/worktree secret/cloud-artifact validation, ignore rules and positive/negative validator tests.
- Enforced exact npm 11.21.2 and added portable Node/Python wrappers plus `fileURLToPath` aliases for Windows-compatible local development.
- Added a real axe accessibility scan/script; browser download remains blocked, so browser/axe/visual assertions are NOT RUN and M1.1 is not fully verified/owner-accepted.
- No M1.2 work, publishing functionality, cloud resources, OAuth setup or external account connections.

## M1.1 local foundation (2026-11-08)

- Added the approved Next.js/React/TypeScript/Tailwind foundation with locked dependencies, strict quality scripts and an inactive local-only CI template (GitHub workflow permission blocked).
- Added a temporary truthful DEMO foundation page, client-source secret-boundary tests and preview-compatible local server configuration.
- Added Playwright/axe test configuration; browser execution remains blocked by sandbox download egress and is not claimed tested.
- Recorded owner plan approval and npm/toolchain compatibility decisions. No product screens, cloud resources or integrations were added.

## Phase 0 planning package (2026-11-08)

### Added / documented

- Audited the complete two-file repository, two-commit history, branches, remote metadata and available tooling without creating cloud resources.
- Preserved the original master brief and README mission; added a repository-specific phased implementation plan with small milestone/commit boundaries and explicit approval gates.
- Added 155 requirements tracing every original brief section to a milestone, proposed implementation destination and test/evidence contract.
- Proposed a shared-media/independent-account architecture, refined data model, threat model, token/storage design and premium mobile-first claymorphism system.
- Researched official YouTube, Instagram and TikTok capabilities; recorded approval, quota, documentation-conflict and automation-consent limitations without claiming live support.
- Added decision/risk registers, test strategy/evidence ledger and a dependency-free documentation consistency checker with 10 passing validation tests.

### Not delivered yet

No website, design primitives, product workflow, database, authentication, upload service, AI analysis, social connection, publishing integration, analytics sync or deployment. No requirement is owner-accepted. All future product work remains visible in the traceability matrix and sprint status.
