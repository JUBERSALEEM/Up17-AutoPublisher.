# Sprint and delivery status

**Updated:** 2026-11-08 UTC
**Current phase:** functional product implementation, owner-authorized A–J batches
**Current batch:** A–J functional delivery. A deployment repair PARTIAL; B Clay engine COMPLETE locally; C auth/data foundation PARTIAL (hosted DB/Storage-API delete tests PASS; email/hosted browser/temp-cleanup gates pending); D connections broker PARTIAL (local/hosted broker gates PASS; live OAuth BLOCKED by owner setup); E–H demo UI PARTIAL; I–J MISSING
**Owner acceptance:** NOT RECORDED; technical tests are not owner acceptance
**Product integrations/deployment:** Supabase auth/data foundation and nine reviewed migrations applied/DB-tested; Vercel preview build path repaired and Batch D runtime commit `74a6c53c805af349a46f34e20fbb76700e914fb1` preview-verified READY as `dpl_F5tKbh3PJXB8yjbHVQZk33hK5gW9` (exact SHA, `public=false`, SSO-protected, cron declared but not run); real OAuth broker implemented, live provider authorization not configured. See [owner balance](OWNER_REQUIREMENTS_BALANCE.md), [Batch C report](BATCH_C_AUTH_REPORT.md), [Batch D report](BATCH_D_CONNECTIONS_REPORT.md) and [owner setup](OWNER_SETUP.md).

## Active UI batches

| Batch | Scope | State | Evidence / limitation |
|---|---|---|---|
| 1 | Central tokens, four themes, local type/icons, primitives | TESTED (local scope) | Unit 11 PASS; production E2E 4 PASS; four-theme axe 4 PASS; 320px smoke PASS; rendered review complete |
| 2 | Responsive shell, ten destinations, PWA public shell | TESTED (local shell scope) | 14 unit PASS; 27 E2E PASS; 19 axe PASS; 7 viewport PASS; manifest/cache/offline PASS; OS install prompt not exercised |
| 3 | Dashboard, library, workspace, queue, scheduler, accounts | TESTED (local demo scope) | 18 unit PASS; 38 E2E PASS; 25 axe PASS; 13 viewport PASS; browser-local drafts/slots; no upload/publishing/OAuth |
| 4 | Analytics, AI analysis, research, notifications, settings | TESTED (local demo scope) | 22 unit PASS; 48 E2E PASS; 30 axe PASS; 18 viewport PASS; local preferences/briefs/inbox; no live data |
| 5 | Interaction completeness, accessibility, motion, visual polish | TESTED (local scope) | 97 E2E PASS; 75 axe PASS; 84 viewport PASS; four-theme all-destination and six-width matrices; keyboard/touch/storage-denial/reduced-motion PASS |
| 6 | Full verification, evidence, delivery report | TESTED (local scope) | npm audit 0 vulnerabilities; security/docs PASS; final report published; owner acceptance not recorded |
| Repair | Local navigation defect investigation, utility access/active states, development-mode regressions | TESTED (local scope) | 24 unit PASS; 114 production E2E PASS; 80 axe PASS; 90 viewport PASS; 13 development navigation PASS; exact stale-screen symptom not reproduced in a clean browser; external preview origin unreachable from sandbox |

The table below records the completed frontend scope. The owner has subsequently authorized backend, deployment and official integration work; the active A–J balance supersedes the old frontend-only boundary. Existing M1.2/M1.3 and Phase 2 traceability rows remain the canonical requirement mapping; some broader rows stay IN PROGRESS until all their states/interactions are tested. The temporary root primitive preview will be replaced by the dashboard; design-system review remains available at `/design-system`.

## Browser verification update

The original Playwright CDN remains blocked, but a registry-only Chromium fallback now executes real production-build browser assertions. It is verification tooling outside Git/runtime dependencies, not a replacement for standard Playwright setup. See [Batch 1](evidence/ui-batch1-validation.txt) and [Batch 2](evidence/ui-batch2-validation.txt) and [Batch 3](evidence/ui-batch3-validation.txt) and [Batch 4](evidence/ui-batch4-validation.txt) and [Batch 5](evidence/ui-batch5-validation.txt) and [Batch 6](evidence/ui-batch6-validation.txt) evidence. The consolidated result is in [UI_DELIVERY_REPORT.md](UI_DELIVERY_REPORT.md); the follow-up local-navigation investigation is in [NAVIGATION_REPAIR_REPORT.md](NAVIGATION_REPAIR_REPORT.md) and [navigation evidence](evidence/navigation-repair-validation.txt). Earlier M1.1 browser-blocked records are historical, not the current result. M1.1 local technical gates now pass; owner acceptance remains separate.

## Remaining boundaries

- Backend/deployment/official OAuth work is now authorized. Paid providers and actual creator-account publication still require their explicit approvals.
- Integration suite contains 4 local SSR-cookie adapter contract tests; hosted DB isolation and the Batch D broker rollback fixture pass. Live OAuth, upload/queue integration and owner browser acceptance remain pending or blocked.
- Active GitHub CI remains blocked by workflow permission; inactive template preserved.
- Windows runtime and manual screen-reader testing remain NOT RUN.
- Full ten-screen plus Notifications, six-width and four-theme automated accessibility/viewport matrices have passed locally; manual screen-reader and OS install checks remain pending.
- Brand wordmark uses the existing product name; final brand/license decisions remain owner decisions.

## Delivery and audit history

| Milestone | Commit | Branch | Verified result |
|---|---|---|---|
| M0.1 planning package | `067f569` | `arena/698e4880-up17-autopublisher` | Remote hash matched; immediate audit delivered |
| Phase 0 audit-trail update | `ddded10` | same fixed branch | Remote hash matched; immediate audit delivered |
| M1.1 initial local attempt | `85a10ef` (unpushed, superseded locally) | same fixed branch | Push rejected: workflow permission; no shared history rewritten |
| M1.1 foundation without active workflow | `34246d3` | same fixed branch | SUCCESS — remote matched `34246d3c3a4ea77a3b7ca0240195668cd8679877`; immediate audit delivered |
| M1.1 delivery-record update | `d9250a6` | same fixed branch | SUCCESS — remote matched `d9250a619801149ada8ed86aee281ea6f635535e`; immediate audit delivered |
| M1.1 foundation hardening | `241d3aa` | same fixed branch | SUCCESS — remote matched `241d3aa5f4292ddb64a836ddfdcd57e028385d37`; immediate audit delivered; browser/axe verification still pending |
| Batch D runtime commit and preview | `74a6c53` | same fixed branch | Remote matched `74a6c53c805af349a46f34e20fbb76700e914fb1`; Vercel `dpl_F5tKbh3PJXB8yjbHVQZk33hK5gW9` READY at exact SHA, `public=false`, SSO-protected, pinned npm/Node build PASS; no owner acceptance |
| Master OAuth visibility runtime | `d4cfbde` | same fixed branch | Remote matched `d4cfbde4508442c819e7779906f90c494c1fc0b9`; Vercel `dpl_2igGhiy79jrgxBhPXABMcqnkS1MN` READY at exact SHA, `public=false`, SSO-protected; exact preview `UP17_SITE_URL` present; live OAuth still BLOCKED and owner acceptance NOT RECORDED |

A commit cannot contain its own final hash. The latest session audit reports the current commit. Frontend M1.2 browser execution is resolved locally; functional Batch C is recorded in [BATCH_C_AUTH_REPORT.md](BATCH_C_AUTH_REPORT.md) and [evidence](evidence/batch-c-auth.txt). Push/deployment audit for Batch C is reported in the session delivery audit after the commit is pushed.


## Batch D — official connections broker (2026-11-10)

Server-only OAuth state/PKCE/binding, encrypted token custody, provider adapters, refresh/health/disconnect RPCs, a bearer-protected cron endpoint, a real accounts board and nine applied hosted migrations are in place. Local/remote migration parity and the hosted rollback broker fixture pass; the fixture leaves zero synthetic rows. Strict env-example/Vercel cron guards and connection unit tests are added. Final local gates: 59 unit, 4 integration, 46 Python validator, 6 TypeScript security, 123 E2E, 85 axe, 153 viewport, 62 clay, 13 development navigation, 25-route build and 0 audit vulnerabilities. One initial development service-worker test failure was corrected and rerun. See [Batch D report](BATCH_D_CONNECTIONS_REPORT.md), [evidence](evidence/batch-d-connections.txt) and [owner setup](OWNER_SETUP.md).

Live OAuth is BLOCKED: owner SMTP, service key, token keyring, provider apps/secrets, app review, cron bearer secret and an owner-authenticated callback deployment are not configured by the agent. Vercel Hobby cron is daily/production-only. The Batch C temporary SQL cleanup was blocked by the connector provider security filter before execution; owner-run instructions are recorded. Publishing/Smart AI are untouched and owner acceptance is NOT RECORDED. A later documentation-only commit records the preview verification above; runtime code is unchanged.


## Master task — real OAuth visibility, configuration and verification

The hidden demo Accounts screen was reproduced and fixed. `/accounts` now always renders the unified real-connection board: three exact provider buttons, ten exact statuses, explicit Demo mode, a name/boolean-only deployment checklist, the route to real connections and an empty real-account section until an official callback creates one. The demo early return, hardcoded sidebar "No accounts connected" copy and obsolete demo-card E2E expectations were replaced. The OAuth broker, nine applied migrations, encrypted token custody and publishing lock are unchanged.

Non-secret hosted configuration: branch-scoped Vercel Preview `UP17_SITE_URL` plus exact Supabase auth redirect paths/query forms. Vercel SSO remains intact. Runtime commit `d4cfbde4508442c819e7779906f90c494c1fc0b9` and deployment `dpl_2igGhiy79jrgxBhPXABMcqnkS1MN` are READY at the exact SHA. Strict gates PASS: 68 unit, 4 integration, 46 Python, 7 TypeScript security, 16 docs/155 requirements/148 links/209 artifacts, 25-route build, 124 E2E, 85 axe, 153 visual, 62 clay and 13 development navigation assertions.

Live OAuth remains BLOCKED: no custom SMTP, confirmed user, workspace, service key, keyring, provider app/secrets/review, registered provider callback, official consent, real token, refresh/health/disconnect journey or owner-authenticated browser. Connecting an account never implies publishing approval. No Smart AI, paid AI, real publishing, next creator phase or production promotion was started. Owner acceptance is NOT RECORDED. See [master OAuth visibility report](MASTER_OAUTH_VISIBILITY_REPORT.md), [executed evidence](evidence/master-oauth-visibility.txt), [owner setup](OWNER_SETUP.md) and [requirements balance](OWNER_REQUIREMENTS_BALANCE.md).
