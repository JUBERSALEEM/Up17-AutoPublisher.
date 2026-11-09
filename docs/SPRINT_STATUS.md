# Sprint and delivery status

**Updated:** 2026-11-08 UTC
**Current phase:** functional product implementation, owner-authorized A–J batches
**Current batch:** A–J functional delivery. A deployment repair PARTIAL; B Clay engine COMPLETE locally; C auth/data foundation PARTIAL (hosted DB tests PASS; email/hosted browser/Storage-delete gates pending); D–J remain demo/missing unless separately recorded
**Owner acceptance:** NOT RECORDED; technical tests are not owner acceptance
**Product integrations/deployment:** Supabase auth/data foundation applied and DB-tested; Vercel preview build path repaired but SSO-protected; creator workflows not live. See [owner balance](OWNER_REQUIREMENTS_BALANCE.md) and [Batch C report](BATCH_C_AUTH_REPORT.md).

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
- Integration suite now contains 4 local SSR-cookie adapter contract tests and passes; hosted DB isolation is evidenced separately by `supabase/tests/rls.sql`. OAuth/upload/queue integration tests remain pending.
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

A commit cannot contain its own final hash. The latest session audit reports the current commit. Frontend M1.2 browser execution is resolved locally; functional Batch C is recorded in [BATCH_C_AUTH_REPORT.md](BATCH_C_AUTH_REPORT.md) and [evidence](evidence/batch-c-auth.txt). Push/deployment audit for Batch C is reported in the session delivery audit after the commit is pushed.
