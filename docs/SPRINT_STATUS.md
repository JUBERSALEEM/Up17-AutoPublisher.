# Sprint and delivery status

**Updated:** 2026-11-08 UTC
**Current phase:** numeric email OTP implementation, strict external-evidence gate and fresh private/SSO Preview verification
**Current batch:** Email OTP + real social account connection enablement; code/tests/docs and safe hosted evidence PASS, hosted Auth template/SMTP and genuine provider consent remain BLOCKED
**Active master milestone:** numeric signup OTP, 15-state honest Accounts readiness, strict timestamped provider evidence, no self-attestation, and real Google/YouTube foundation OAuth readiness. Local implementation/quality gates PASS; live email/provider/owner acceptance remains BLOCKED.
**Owner acceptance:** NOT RECORDED; technical tests are not owner acceptance
**Owner session/workspace:** one confirmed owner user, one owner workspace and one hosted session are recorded; the agent has no owner Vercel SSO or Up17 browser cookies, so hosted owner-authenticated browser acceptance is NOT RECORDED.
**Product integrations/deployment:** Supabase auth/data foundation and eleven reviewed migrations applied/DB-tested; Vercel preview build path repaired. Earlier READY previews are immutable historical evidence; the moving branch alias serves later commits. Real OAuth broker is implemented; live provider authorization is not configured. See [owner balance](OWNER_REQUIREMENTS_BALANCE.md), [Batch C report](BATCH_C_AUTH_REPORT.md), [Batch D report](BATCH_D_CONNECTIONS_REPORT.md) and [owner setup](OWNER_SETUP.md).

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


## Master task — real OAuth visibility, configuration and verification (historical)

**Historical milestone record.** The zero-user, ten-status and missing-keyring statements below describe runtime commit `d4cfbde4508442c819e7779906f90c494c1fc0b9`. The current implementation has 15 statuses, configured server key/keyring, one confirmed owner session/workspace, numeric OTP and strict external evidence; SMTP and provider OAuth remain blocked.

The hidden demo Accounts screen was reproduced and fixed. `/accounts` now always renders the unified real-connection board: three exact provider buttons, historically ten exact statuses (15 currently), explicit Demo mode, a name/boolean-only deployment checklist, the route to real connections and an empty real-account section until an official callback creates one. The demo early return, hardcoded sidebar "No accounts connected" copy and obsolete demo-card E2E expectations were replaced. The OAuth broker, nine applied migrations, encrypted token custody and publishing lock are unchanged.

Non-secret hosted configuration: branch-scoped Vercel Preview `UP17_SITE_URL` plus exact Supabase auth redirect paths/query forms. Vercel SSO remains intact. Runtime commit `d4cfbde4508442c819e7779906f90c494c1fc0b9` and deployment `dpl_2igGhiy79jrgxBhPXABMcqnkS1MN` are READY at the exact SHA. Strict gates PASS: 68 unit, 4 integration, 46 Python, 7 TypeScript security, 16 docs/155 requirements/148 links/209 artifacts, 25-route build, 124 E2E, 85 axe, 153 visual, 62 clay and 13 development navigation assertions.

At that historical point live OAuth was BLOCKED by no custom SMTP, confirmed user, workspace, service key, keyring, provider app/secrets/review, registered provider callback, official consent, real token, refresh/health/disconnect journey or owner-authenticated browser. The current DB has one owner session/workspace and configured keyring, but SMTP and provider OAuth remain blocked. Connecting an account never implies publishing approval. No Smart AI, paid AI, real publishing, next creator phase or production promotion was started. Owner acceptance is NOT RECORDED. See [master OAuth visibility report](MASTER_OAUTH_VISIBILITY_REPORT.md), [executed evidence](evidence/master-oauth-visibility.txt), [owner setup](OWNER_SETUP.md) and [requirements balance](OWNER_REQUIREMENTS_BALANCE.md).

## Autonomous Vercel + Supabase configuration — active session

All permitted reversible Preview/development configuration is implemented and hosted-verified: exact project/branch identity, four preserved Preview variables, four new server-side Preview variables plus the callback base, tenth migration parity, public Bridge Function deployment, external anonymous health/forged-callback tests, one-time receipt/replay/grant tests, six-state evidence-backed readiness, exact external provider redirect URIs and Supabase Auth allowlist updates. Global SSO, Production `main`, `UP17_APP_MODE=DEMO`, nine prior migrations, encrypted custody, publishing lock and Smart AI/video/publishing workflows are intact. No secret value is in Git, chat, URLs or reports.

Live OAuth remains BLOCKED: no Google/Meta/TikTok app credentials, consent-screen/review/audit, real account authorization, callback validation or secure token persistence. Email delivery and owner-authenticated signup/workspace acceptance are BLOCKED because the connector cannot set SMTP host/user/password or create a Vercel SSO browser session. Storage resumable/upsert compatibility and cross-workspace denial remain CONFIGURED, not VERIFIED, without an authenticated workspace-role test. Historical Batch C probe leftovers remain because their cleanup is destructive and the connector security filter blocked the original SQL. Owner acceptance and Production promotion are NOT RECORDED. See the [autonomous configuration report](evidence/autonomous-configuration-report.md), [plan](evidence/autonomous-configuration-plan.md) and [owner setup](OWNER_SETUP.md).

Earlier autonomous-milestone quality gates PASS: `npm run check` (78 unit, 4 integration, 48 Python, 8 TypeScript security, strict docs 16/155/191/217, 25-route build), E2E 124, visual 153, axe 85, clay 62 and development navigation 13. Browser gates used the documented registry-only Chromium fallback after the default Playwright CDN executable was found absent; generated TS config changes were restored. Every gate is local/build evidence, not live OAuth or owner acceptance.

Earlier autonomous-milestone runtime commit `df774e42ccf098b0c7c4959a7d144308bbd8cc97` is deployed as Vercel `dpl_4R3BdHpC9qpcNB1Kpo5YeFnn2Jwg` (READY, exact SHA, `public=false`, SSO-protected, Node 22.x, branch alias assigned). Anonymous app access still reaches Vercel SSO; the public callback bridge remains externally reachable. Owner acceptance remains NOT RECORDED.

## New MASTER MILESTONE — real auth, workspace and foundation OAuth (historical table)

**Historical record.** This A–G table preserves the state at the named runtime/access commits. Current DB and gate state is in the final section below.

| Letter | Area | State | Actual boundary |
|---|---|---|---|
| A | Real login/signup and DEMO-mode exit for auth | TESTED (local) | `/login`, `/signup`, canonical auth pages, verified `getUser()`, confirmation recovery, reset/update flows and domain-specific safe mode implemented. At that time no hosted signup/session/SMTP delivery existed; the current DB has one owner session, while numeric OTP/SMTP delivery remains NOT VERIFIED. |
| B | Secure workspace onboarding | TESTED (local/static) | Migration 11 and `/onboarding` use a confirmed-session RPC with no client-supplied id/role; hosted ACL and historical zero-data inventory verified. The current DB has one owner workspace. |
| C | Honest Accounts readiness | TESTED (local) | 15 connection states, six evidence-backed setup states, exact blockers/owner steps, deployment checklist, three always-visible provider buttons and no simulated authorization. |
| D | First Google/YouTube OAuth foundation | IMPLEMENTED / BLOCKED (live) | `youtube.readonly` only, separate publishing scope, exact console path/redirect, evidence-gated start route and Edge Function v3 checks. No Google app, credential, consent, callback or token. |
| E | Security and authenticated storage | CONFIGURED / NOT VERIFIED | RLS, private bucket, four scoped policies, session-bound media access and exact disabled reasons verified statically. Authenticated upload/cross-workspace denial still need an owner-authenticated browser/storage test. |
| F | Deployed Preview browser verification | READY / SSO BLOCKED | Original runtime commit `e4ba4bf034c49bc882233be99c51b174fc00337a` / `dpl_82xstWVxy92Du9Q5oS8JxqiNEJN7` and fresh access-clarification commit `e18cd394a699afa7b339c756edb40c7cba3f3fa35` / `dpl_3BksENjHFzsNS9T8eNrT3fyLbCQr` are READY private/SSO at immutable URLs; anonymous fetches reach Vercel SSO. Local production-build Chromium 15/15 desktop/mobile/narrow checks PASS; hosted owner-authenticated acceptance NOT RECORDED. |
| G | Docs, cost and owner acceptance | DOCS UPDATED / NOT RECORDED | Five named docs, the auth UI and its E2E assertion updated; expected incremental cost $0 on existing free allowances with usage limits. Owner acceptance and Production/cron/publishing approvals are NOT RECORDED. |

`UP17_APP_MODE=DEMO` remains global. Authentication, onboarding and Accounts controls are real; video/scheduling/analytics/sample content remain labelled demo; publishing is disabled. Vercel SSO, Production `main`, all prior migrations, service-only custody and Smart AI/analytics/video boundaries are intact. No secret value is in Git, chat, URLs or reports.

This historical record preserves the original exact runtime source SHA and READY Preview ID and the fresh access-clarification SHA/ID. Both remain directly addressable at immutable deployment URLs; later Preview commits do not replace them, and the moving branch alias may advance. That deployment evidence did not give the agent an owner browser session; the hosted DB now records an owner session, but hosted owner-authenticated browser acceptance remains NOT RECORDED. The public bridge health endpoint and forged-callback rejection are external negative checks only.

Historical final pinned local gates PASS on the access-clarification tree: `npm run check` (87 unit, 4 integration, 48 Python, 8 TypeScript security, strict docs 16/155/205/223, 27/27 static pages and 27 routes), standalone strict Edge Function TypeScript check, E2E 126, visual 153, axe 85, clay 62 and development navigation 13, plus a separate local production-build Chromium check of the five named routes at desktop/mobile/narrow widths (15/15). Generated TS config rewrites were restored. These are local/build gates, not hosted owner acceptance.

Historical hosted verification at that commit found migration 11 applied, Edge Function v3 ACTIVE `verify_jwt=false`, zero auth users/workspaces/members/connections/bridge sessions/receipts, 17 evidence rows, `public_tables_without_rls=0`, bootstrap ACL `[authenticated, postgres]`, email confirmation required and custom SMTP absent. Current counts are in the final section below. Anonymous app access reaches Vercel SSO; the public bridge health endpoint is reachable. Live OAuth, email delivery, owner-authenticated signup/workspace/storage acceptance, Production promotion, cron and publishing remain BLOCKED/NOT RECORDED. See [owner setup](OWNER_SETUP.md), [test evidence](TEST_EVIDENCE.md), [decisions](DECISIONS.md) and [change log](CHANGELOG.md).

**Preview access (new).** Vercel Standard Protection `all_except_custom_domains` on the `public=false` Preview intercepts anonymous requests before Next.js; it is not an Up17 auth failure. The connected Vercel account is already a confirmed team OWNER, so no invitation is required for that account. Minimum documented role for a different Pro/Enterprise team/project member is Viewer; on Hobby prefer one deployment-specific external grant or one revocable Shareable Link (one link per account). The connected Vercel connector exposes `invite_team_member(VIEWER)` but no Shareable Link/alias/access tool; Supabase exposes no SMTP setter. No invitation or link was created. Fresh Preview `dpl_3BksENjHFzsNS9T8eNrT3fyLbCQr` at `e18cd394a699afa7b339c756edb40c7cba3f3fa35` is recommended through its immutable URL; the branch alias is moving. Global SSO, Production, publishing, `UP17_APP_MODE=DEMO`, RLS, private storage and Up17 authentication remain unchanged. Hosted owner-authenticated browser acceptance is NOT RECORDED; local production-build Chromium desktop/mobile/narrow checks and exact owner steps are in the owner setup and test evidence documents.

## Current numeric OTP and strict evidence update (2026-11-08)

**State.** Code, tests and docs for official six-digit signup OTP, 15 owner-visible connection statuses, six setup states, exact-state review dialogs and no-self-attestation provider evidence are complete. The hosted DB has one confirmed owner user, one owner workspace and one session; 26 evidence rows honestly distinguish code-only `CONFIGURED` from `OWNER ACTION REQUIRED` and `BLOCKED`. No provider redirect/review/account row is `VERIFIED`, no real social connection exists and no token was stored. Expected incremental cost is $0 on existing free allowances with usage-limit/possible-charge disclosure.

**Executed gates.** Pinned `npm run check` PASS (format, zero-warning lint, strict TypeScript, 14 unit files / 90 tests, 1 integration file / 4 tests, 48 Python validator tests, 2 TypeScript security files / 8 tests, strict docs, 27/27 static pages and 27 routes). Standalone strict Edge Function TypeScript check PASS. Browser gates PASS: E2E 128, visual 154, axe 86, clay 62 and development navigation 13; generated TS config rewrites restored. Separate local production-build Chromium PASS 18/18 for six routes at desktop/mobile/320px. Staged whitespace and high-confidence secret scans remain part of the delivery gate. These are local/build/technical checks, not hosted owner acceptance.

**Blockers.** Hosted Supabase Auth still uses a confirmation-link template, eight-digit OTP setting and no SMTP; only the owner dashboard or an owner-created Management API token can change them. Real numeric-code email delivery and password recovery must be tested with an owner inbox. Google Cloud/Meta/TikTok apps, exact redirect registration, consent/review/account eligibility, provider credentials, real consent/callback and timestamped `VERIFIED` external evidence remain owner-only. Owner-authenticated hosted browser verification, authenticated storage upload/cross-workspace denial, Production promotion, cron execution and publishing remain NOT RECORDED. See [owner setup](OWNER_SETUP.md), [test evidence](TEST_EVIDENCE.md), [decisions](DECISIONS.md) and [change log](CHANGELOG.md).
