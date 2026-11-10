# Sprint and delivery status

**Updated:** 2026-11-08 UTC
**Current phase:** functional product implementation, owner-authorized A–J batches
**Current batch:** A–J functional delivery. A deployment repair PARTIAL; B Clay engine COMPLETE locally; C auth/data foundation PARTIAL (hosted DB/Storage-API delete tests PASS; email/hosted browser/temp-cleanup gates pending); D connections broker PARTIAL (local/hosted broker gates PASS; live OAuth BLOCKED by owner setup); E–H demo UI PARTIAL; I–J MISSING
**Active master milestone:** real owner authentication, verified workspace onboarding, honest Accounts readiness, foundation Google/YouTube OAuth, security, authenticated-storage boundary and deployed Preview verification. Local implementation/quality gates PASS; live email/provider/owner acceptance remains BLOCKED.
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

## Autonomous Vercel + Supabase configuration — active session

All permitted reversible Preview/development configuration is implemented and hosted-verified: exact project/branch identity, four preserved Preview variables, four new server-side Preview variables plus the callback base, tenth migration parity, public Bridge Function deployment, external anonymous health/forged-callback tests, one-time receipt/replay/grant tests, six-state evidence-backed readiness, exact external provider redirect URIs and Supabase Auth allowlist updates. Global SSO, Production `main`, `UP17_APP_MODE=DEMO`, nine prior migrations, encrypted custody, publishing lock and Smart AI/video/publishing workflows are intact. No secret value is in Git, chat, URLs or reports.

Live OAuth remains BLOCKED: no Google/Meta/TikTok app credentials, consent-screen/review/audit, real account authorization, callback validation or secure token persistence. Email delivery and owner-authenticated signup/workspace acceptance are BLOCKED because the connector cannot set SMTP host/user/password or create a Vercel SSO browser session. Storage resumable/upsert compatibility and cross-workspace denial remain CONFIGURED, not VERIFIED, without an authenticated workspace-role test. Historical Batch C probe leftovers remain because their cleanup is destructive and the connector security filter blocked the original SQL. Owner acceptance and Production promotion are NOT RECORDED. See the [autonomous configuration report](evidence/autonomous-configuration-report.md), [plan](evidence/autonomous-configuration-plan.md) and [owner setup](OWNER_SETUP.md).

Final quality gates PASS: `npm run check` (78 unit, 4 integration, 48 Python, 8 TypeScript security, strict docs 16/155/191/217, 25-route build), E2E 124, visual 153, axe 85, clay 62 and development navigation 13. Browser gates used the documented registry-only Chromium fallback after the default Playwright CDN executable was found absent; generated TS config changes were restored. Every gate is local/build evidence, not live OAuth or owner acceptance.

Final runtime commit `df774e42ccf098b0c7c4959a7d144308bbd8cc97` is deployed as Vercel `dpl_4R3BdHpC9qpcNB1Kpo5YeFnn2Jwg` (READY, exact SHA, `public=false`, SSO-protected, Node 22.x, branch alias assigned). Anonymous app access still reaches Vercel SSO; the public callback bridge remains externally reachable. Owner acceptance remains NOT RECORDED.

## New MASTER MILESTONE — real auth, workspace and foundation OAuth

| Letter | Area | State | Actual boundary |
|---|---|---|---|
| A | Real login/signup and DEMO-mode exit for auth | TESTED (local) | `/login`, `/signup`, canonical auth pages, verified `getUser()`, confirmation recovery, reset/update flows and domain-specific safe mode implemented. No hosted signup/session/SMTP delivery exists. |
| B | Secure workspace onboarding | TESTED (local/static) | Migration 11 and `/onboarding` use a confirmed-session RPC with no client-supplied id/role; hosted ACL and zero-data inventory verified. No real owner workspace exists. |
| C | Honest Accounts readiness | TESTED (local) | 13 connection states, six evidence-backed setup states, exact blockers/owner steps, deployment checklist, three always-visible provider buttons and no simulated authorization. |
| D | First Google/YouTube OAuth foundation | IMPLEMENTED / BLOCKED (live) | `youtube.readonly` only, separate publishing scope, exact console path/redirect, evidence-gated start route and Edge Function v3 checks. No Google app, credential, consent, callback or token. |
| E | Security and authenticated storage | CONFIGURED / NOT VERIFIED | RLS, private bucket, four scoped policies, session-bound media access and exact disabled reasons verified statically. Authenticated upload/cross-workspace denial need an owner session. |
| F | Deployed Preview browser verification | READY / SSO BLOCKED | Exact runtime SHA and private/SSO Preview recorded in the final A–G chat delivery; anonymous fetches reach Vercel SSO. Local production-build browser gates pass. |
| G | Docs, cost and owner acceptance | DOCS UPDATED / NOT RECORDED | Five named docs updated; expected incremental cost $0 on existing free allowances with usage limits. Owner acceptance and Production/cron/publishing approvals are NOT RECORDED. |

`UP17_APP_MODE=DEMO` remains global. Authentication, onboarding and Accounts controls are real; video/scheduling/analytics/sample content remain labelled demo; publishing is disabled. Vercel SSO, Production `main`, all prior migrations, service-only custody and Smart AI/analytics/video boundaries are intact. No secret value is in Git, chat, URLs or reports.

Final pinned local gates PASS: `npm run check` (87 unit, 4 integration, 48 Python, 8 TypeScript security, strict docs 16/155/205/223, 27/27 static pages and 27 routes), standalone strict Edge Function TypeScript check, E2E 126, visual 153, axe 85, clay 62 and development navigation 13. An initial E2E run found 3 stale expectations and an initial visual run found 5 Accounts overflow assertions; both were fixed and clean full reruns passed. Generated TS config rewrites were restored. These are local/build gates, not hosted owner acceptance.

Hosted verification found migration 11 applied, Edge Function v3 ACTIVE `verify_jwt=false`, zero auth users/workspaces/members/connections/bridge sessions/receipts, 17 evidence rows, `public_tables_without_rls=0`, bootstrap ACL `[authenticated, postgres]`, email confirmation required and custom SMTP absent. Anonymous app access reaches Vercel SSO; the public bridge health endpoint is reachable. Live OAuth, email delivery, owner-authenticated signup/workspace/storage acceptance, Production promotion, cron and publishing remain BLOCKED/NOT RECORDED. See [owner setup](OWNER_SETUP.md), [test evidence](TEST_EVIDENCE.md), [decisions](DECISIONS.md) and [change log](CHANGELOG.md).
