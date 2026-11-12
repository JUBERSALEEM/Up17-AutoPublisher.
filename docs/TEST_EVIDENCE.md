# Test evidence ledger

This ledger records executed checks, not aspirational test names. See [TEST_STRATEGY.md](TEST_STRATEGY.md) for the future application catalog.

## Current numeric OTP and strict evidence gate (2026-11-08)

**Scope:** official six-digit signup OTP, 15-state Accounts readiness, removal of owner self-attestation, strict external provider evidence, updated auth/Accounts/browser assertions, fresh local/build verification and safe hosted evidence inspection. Hosted template/SMTP configuration, real inbox delivery, provider consent/callback, encrypted token persistence, authenticated storage acceptance and owner-authenticated hosted browser acceptance are NOT VERIFIED.

| Check | Actual result |
|---|---|
| Pinned `npm run check` | PASS — format, ESLint `--max-warnings 0`, strict TypeScript, 14 unit files / 90 tests, 1 integration file / 4 tests, 48 Python validator tests, 2 TypeScript security files / 8 tests, strict docs structure/traceability/link/artifact policy, production build 27/27 static pages and 27 routes |
| Standalone Edge Function strict TypeScript check | PASS — reviewed Deno runtime declarations; static check only, not hosted Deno execution |
| `npm run test:e2e` | PASS — 128, including numeric OTP paste/Backspace, legacy signup-link rejection, exact-state Connect review dialog and no simulated OAuth |
| `npm run test:visual` | PASS — 154, including `/auth/verify-email` at 320px after a scoped `min-width: 0` grid fix |
| `npm run test:a11y` | PASS — 86 |
| `npm run test:clay` | PASS — 62 |
| `npm run test:navigation:dev` | PASS — 13; generated `tsconfig.json`/`next-env.d.ts` rewrites restored |
| Separate local production-build Chromium | PASS — 18/18 across `/login`, `/signup`, `/auth/verify-email`, `/accounts`, `/onboarding`, `/settings` at desktop, mobile and 320px; exact headings, no overflow, OTP controls and disabled “Continue to provider” review dialog checked |
| Hosted owner/session inspection | PASS — `auth.users=1`, confirmed=1, signed-in=1, one owner workspace/membership/preferences and one session; agent has no owner browser cookies |
| Fresh hosted Auth config inspection | PASS — owner-configured custom six-digit `{{ .Token }}` Confirm signup template, `mailer_otp_length=6`, `mailer_otp_exp=3600`, custom SMTP, `mailer_autoconfirm=false`, Postgres audit disabled; exact signup error and inbox delivery NOT TESTED |
| Hosted evidence inspection | PASS/BLOCKED — 26 rows; `auth-otp-code=CONFIGURED`, `otp-template`/`email-smtp=OWNER ACTION REQUIRED`, provider credentials `BLOCKED`, all provider redirect/review/account rows `OWNER ACTION REQUIRED`; no provider `VERIFIED` |
| Real OTP email / recovery / Google consent / callback / token storage | NOT VERIFIED / NOT RUN — owner inbox, Supabase dashboard/Management API and provider dashboards required |
| Owner-authenticated hosted browser / storage isolation / Production / cron / publishing | NOT RECORDED / NOT RUN — separate owner approvals |

No fake user, autoconfirm bypass, SMTP credential, provider credential, owner self-attestation evidence, connection, token, permanent SSO bypass or Production change was created in this update. Expected incremental cost is $0 on existing free allowances, subject to usage limits and separately approved paid services. Exact owner actions are in [owner setup](OWNER_SETUP.md); decisions are in [decisions](DECISIONS.md).



## Batch C — auth/data foundation (2026-11-08)

**Scope:** Supabase SSR auth, relational workspace/preferences/inbox persistence, RLS/private storage policies and multi-user database isolation. See [Batch C report](BATCH_C_AUTH_REPORT.md) and [executed evidence](evidence/batch-c-auth.txt). Hosted email delivery, SSO-protected hosted browser acceptance and Storage-API delete are NOT VERIFIED.

| Check | Actual result |
|---|---|
| Hosted `supabase/tests/rls.sql` | PASS — expected `P0001: ROLLBACK_FIXTURE_COMPLETE`; synthetic rows fully rolled back |
| Migration parity | PASS — five local files match remote history after removing SQL line comments/whitespace; raw byte parity not claimed |
| `npm run check` | PASS — 51 unit, 4 integration, 42 Python + 6 TS security, 23-route build |
| `npm run test:e2e` | PASS — 123 |
| `npm run test:a11y` | PASS — 85 |
| `npm run test:visual` | PASS — 153 |
| `npm run test:clay` | PASS — 62 |
| `npm run test:navigation:dev` | PASS — 13 |
| `npm audit` | PASS — 0 known vulnerabilities |
| Hosted email/recovery | NOT VERIFIED — SMTP absent, default rate 2/hour |
| Hosted browser/auth walkthrough | BLOCKED — Vercel preview SSO |
| Storage-API delete | NOT TESTED — direct SQL delete blocked by Supabase guard; policy inspected only |

## Navigation repair — development-mode verification (2026-11-08)

**Scope:** reported local-development menu/screen defect, twelve menu destinations, desktop/mobile, four themes, history/refresh/direct entry and inherited service-worker cleanup. No backend, deployment or live integration was exercised. See [executed gate output](evidence/navigation-repair-validation.txt) and the [repair report](NAVIGATION_REPAIR_REPORT.md).

| Check | Exact command | Result |
|---|---|---|
| Formatting | `npm run format:check` | PASS |
| ESLint | `npm run lint` | PASS — zero warnings |
| TypeScript | `npm run typecheck` | PASS |
| Unit | `npm run test:unit` | PASS — 8 files / 24 tests |
| Security/docs | `npm run test:security` | PASS — 34 Python + 2 TS checks; 155 requirements |
| Production build | `npm run build` | PASS — 15 routes |
| Production E2E | `npm run test:e2e` | PASS — 114 assertions |
| Accessibility | `npm run test:a11y` | PASS — 80 axe scans, zero violations |
| Viewport | `npm run test:visual` | PASS — 90 checks |
| Development navigation | `npm run test:navigation:dev` | PASS — 13 assertions; 8 four-theme desktop/mobile matrices cover all 12 destinations with click, URL, unique content, active state, refresh, direct entry and back/forward |
| Aggregate | `npm run check` | PASS |

Limitations: the external Arena preview hostname could not be reached from the sandbox browser (`ERR_CONNECTION_CLOSED`); loopback development and the configured preview-origin wildcard were verified instead. Superseded Next.js RSC prefetch cancellations (`net::ERR_ABORTED`) were observed while final route/content assertions passed; they are not counted as runtime failures. A transient HMR hydration mismatch was seen in a long-lived preview after shell edits and cleared on reload/clean restart; the exact user-reported stale-screen symptom was not reproduced in a clean browser. Manual screen-reader, Windows and OS install checks remain NOT RUN; owner acceptance is separate.

## UI Batch 1 — design system (2026-11-08)

**Scope:** four-theme engine, local font/icons, reusable primitives and interactive review surface. No product workflow or integration is claimed. See [executed gate output](evidence/ui-batch1-validation.txt).

- Browser execution is now available through a registry-only `@sparticuz/chromium` 153.0.0 fallback (Chromium 153.0.8010.0), outside application dependencies/Git. The original Playwright CDN download remains blocked. Safe launch arguments only; no disabled web security.
- Production-build E2E: **4 passed** (theme persistence, system appearance changes, honest preview notice/reset, native dialog Escape/focus return). Axe: **4 passed**, one scan per theme, zero violations for the tested preview. Mobile smoke: **1 passed at 320px**, no page overflow. Unit: **5 files / 11 tests passed**, including actual CSS token completeness/contrast.
- Aggregate `npm run check`: PASS (format, zero-warning lint, strict types, unit, 34 Python + 2 TS security checks, preserved brief, production build). Dependency audit: zero known vulnerabilities.
- Visual review: all four desktop themes rendered and inspected; mobile screenshot captured separately outside Git. This is a rendered review, not a six-width/full-application acceptance claim. Subsequent batches expand viewport and keyboard coverage.
- Corrections retained: initial axe found low-contrast accent/danger badges; tokens were darkened and regression-tested. Development-server hydration was unreliable in the fallback; production tests now build first and own a fresh port-3100 server. A stale-server/configuration mistake caused a setup timeout and was corrected before the final passing runs. Local dev origins now explicitly include loopback hosts as well as the Arena preview wildcard.
- Browser fallback artifacts live in `/tmp` and the ignored user cache, not Git. Recreate them or install standard Playwright Chromium on another machine. No Windows, screen-reader, live-provider or owner acceptance result is claimed.

## Phase 0 final pre-commit gate (historical)

At the Phase 0 gate the documentation run reported **154 requirements: 8 TESTED, 1 IN PROGRESS, 145 PLANNED; 0 ACCEPTED**. The eight TESTED items are Phase 0 documentation deliverables only. Owner approval remains in progress; recurring commit/audit controls are not claimed complete for future milestones. All product requirements remain planned.

The validator's 10 unit tests pass (valid baseline plus nine rejection cases). Python syntax compilation passes. The original brief preservation diff is empty. Staged whitespace, intended-file and credential-pattern checks are recorded below after staging; a push is never inferred from these checks.

## Phase 0 — M0.1

**Date:** 2026-11-08 UTC
**Baseline:** `b16202cc61c12a4ae374bedcca94680882064a9f`
**Environment:** Node 22.22.3, npm 10.9.8, Python 3.11.2, Git 2.39.5; documentation-only worktree.

| Check | Exact command / procedure | Result |
|---|---|---|
| Repository inventory/history | `find`, `git ls-tree`, `git status`, `git branch -avv`, `git ls-remote`, `git fetch --unshallow origin main`, GitHub CLI read queries | PASS — findings in REPOSITORY_AUDIT.md; initial unsupported GitHub JSON-field query corrected |
| Full source read | Read `docs/PLAN.md` lines 1–1022 across overlapping chunks; inspect all section headings | PASS — all 19 numbered sections covered; no separate named attachment found |
| Dependency/framework inventory | File/manifest search and Git tree/history inspection | PASS — none exist; registry metadata read only, no install |
| Documentation validation | `python3 scripts/check_docs.py` | PASS — 154 requirements, 14 required docs, 41 local links; all references/source coverage valid |
| Validator tests | `PYTHONPYCACHEPREFIX=/tmp/up17-pycache python3 -m unittest discover -s scripts -p 'test_*.py' -v` | PASS — 10 tests: valid baseline plus missing doc/broken link/duplicate ID/invalid status/unknown milestone/unknown test/changed brief/missing coverage/premature app artifact |
| Validator syntax | `PYTHONPYCACHEPREFIX=/tmp/up17-pycache python3 -m py_compile scripts/check_docs.py scripts/test_check_docs.py` | PASS |
| Whitespace | `git diff --check` | PASS — rerun on staged diff before commit |
| Source preservation | `git diff --exit-code b16202cc61c12a4ae374bedcca94680882064a9f -- docs/PLAN.md` | PASS — original brief byte-for-byte unchanged |
| Secret/artifact review | Inspect intended file list/diff; search added text for credential patterns; confirm no env/media/db/build artifacts | PASS — 17 intended text files; no high-confidence credential patterns or premature application/cloud/media/build artifacts; manual diff reviewed |
| Staged whitespace | `git diff --cached --check` | PASS — initial check found Markdown hard-break spaces; removed them from new docs only, restaged and reran successfully |
| Application formatting/lint/type/unit/E2E/build | No application/package scripts exist | NOT RUN — not applicable to Phase 0; do not report as PASS |
| Live social/AI/storage tests | No authorization, credentials or connected resources | NOT RUN — documentation research is not integration evidence |
| Commit/push | `git commit`, `git push -u origin arena/698e4880-up17-autopublisher`, `git ls-remote --heads origin refs/heads/arena/698e4880-up17-autopublisher` | PASS — commit `067f569`; remote matched full hash `067f569a569d5299acb30986f0f3e01dbaf5821f`; immediate audit delivered |

The final validator output is recorded in `docs/evidence/phase-0-validation.txt`. The first structural run found five milestones without direct requirement rows; explicit queue/platform/publishing requirements were added (147 → 154), then all checks passed. A later evidence-status edit temporarily produced eight-column rows; the validator and its negative tests caught it, the seven affected rows were repaired, and both suites passed again. These failures and corrections are retained in the audit trail. Owner acceptance remains separate.

## M1.1 — local application foundation

**Date:** 2026-11-08 UTC. **Scope:** toolchain and truthful temporary foundation page only; no product workflows/integrations.

See [m1-1-validation.txt](evidence/m1-1-validation.txt) for exact commands, results and compatibility notes. Clean npm 11.21.2 install, format, lint, strict typecheck, 3 unit tests, foundation security checks, production build and dependency audit pass. Local HTTP/preview-host smoke returns 200 with honest demo/no-connection content.

Playwright browser assertions are **NOT RUN**: browser download failed with TLS ECONNRESET and the executable is absent; the attempted visual command failed before assertions. HTTP smoke does not replace browser/accessibility evidence. Product integration and live-provider suites are also NOT RUN because those features/authorizations do not exist. The browser blocker must be resolved before M1.2 acceptance.

### M1.1 delivery blocker

The initial local commit `85a10ef` could not be pushed: GitHub refused a workflow update without workflow permission. Remote remained `ddded10`. The CI file was preserved as an inactive example and the unpushed commit replaced locally; no force-push or shared-history rewrite. The replacement commit's push must be independently verified. Active CI and browser assertions remain NOT RUN.

The replacement M1.1 commit `34246d3` was pushed successfully; `git ls-remote` matched `34246d3c3a4ea77a3b7ca0240195668cd8679877`, and the immediate audit was delivered. Active CI remains blocked/not run.

## M1.1 — foundation hardening (2026-11-08)

**Starting commit:** `d9250a619801149ada8ed86aee281ea6f635535e`, verified present locally and on the fixed remote branch before edits. **Scope:** maintenance only; no M1.2, publishing, cloud resource, OAuth setup or simulated success.

See [m1-1-hardening-validation.txt](evidence/m1-1-hardening-validation.txt) for exact commands, exit statuses and limitations.

| Check | Actual result |
|---|---|
| Wrong npm enforcement | PASS — global npm 10.9.8 `npm ci --dry-run` exits 1 with EBADENGINE under `engine-strict=true` |
| Clean pinned install | PASS — npm 11.21.2 `npm ci`; only new dependency is `server-only` 0.0.1 |
| Toolchain / lock consistency | PASS — exact npm declaration, executing-CLI check and lock-root manifest assertion |
| Formatting / zero-warning lint / strict types | PASS |
| Unit tests | PASS — 4 files, 8 tests, including real browser-condition bundle rejection of the foundation module |
| Integration empty suite | EXPECTED FAIL — `npm run test:integration` exits 1, “No test files found”; no fake tests added |
| Documentation/security validator | PASS — 34 Python tests + 2 TypeScript security tests; Git-index/worktree artifact policy checked |
| Production build / dependency audit | PASS — Next.js build succeeds; `npm audit` reports 0 known vulnerabilities |
| Browser install | FAIL SETUP — Chromium v1254 download from `cdn.playwright.dev` fails with TLS ECONNRESET |
| E2E / axe accessibility / visual | NOT RUN — commands exit 1 at browser launch because the executable is absent; no page/axe/viewport assertion executed |
| Local HTTP / preview-host smoke | PASS — 200 and unchanged honest DEMO/no-connection/disabled-publishing content; not browser evidence |
| Active CI / Windows runtime / live providers | NOT RUN — workflow permission missing; sandbox is Linux; no provider authorization/resources |

The real `@axe-core/playwright` scan is implemented with WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags and no disabled rules, but it has **not** executed. No genuine accessibility violation result is available yet. M1.1 hardening is implemented, not fully verified or owner-accepted, until browser/axe evidence is obtained. The hardening commit `241d3aa5f4292ddb64a836ddfdcd57e028385d37` was pushed successfully and verified against the remote; the immediate audit was delivered. Browser/axe verification remains pending.


## Frontend UI delivery — Batches 1–6 (2026-11-08)

**Scope:** local frontend/demo only. **Environment:** Linux, Node 22.22.3, npm 11.21.2, Next.js 16.4.5; Chromium 153.0.8010.0 from the documented registry-only fallback with safe launch arguments. Standard Playwright CDN download remains blocked.

| Check | Actual result |
|---|---|
| Formatting / zero-warning lint / strict types | PASS |
| Unit tests | PASS — 22 tests / 8 files |
| Production E2E (`npm run test:e2e`) | PASS — 97 assertions |
| Axe (`npm run test:a11y`) | PASS — 75 scans, including 11 destinations × 4 themes |
| Viewport (`npm run test:visual`) | PASS — 84 checks, including 11 destinations × 6 widths |
| Security/docs validator | PASS — 34 Python tests + 2 TypeScript security tests; 155 requirements; preserved brief |
| Production build | PASS — 15 routes |
| Dependency audit | PASS — `npm audit --audit-level=moderate`: 0 vulnerabilities |
| Manual screen-reader / OS install / Windows / live providers | NOT RUN — outside executed local evidence or unauthorized |

Detailed logs: [Batch 1](evidence/ui-batch1-validation.txt), [Batch 2](evidence/ui-batch2-validation.txt), [Batch 3](evidence/ui-batch3-validation.txt), [Batch 4](evidence/ui-batch4-validation.txt), [Batch 5](evidence/ui-batch5-validation.txt), [Batch 6](evidence/ui-batch6-validation.txt). Consolidated interpretation: [UI_DELIVERY_REPORT.md](UI_DELIVERY_REPORT.md). Owner acceptance remains NOT RECORDED.


## Batch D — official connections broker (2026-11-10)

**Scope:** server-only state/PKCE broker, encrypted credential custody, provider adapters, refresh/health/disconnect RPCs, real accounts UI, strict configuration guards and a hosted rollback isolation fixture. See [Batch D report](BATCH_D_CONNECTIONS_REPORT.md), [executed evidence](evidence/batch-d-connections.txt) and [owner setup](OWNER_SETUP.md).

| Check | Actual result |
|---|---|
| Applied migration parity | PASS — nine local canonical MD5 values matched hosted statements; do not reapply |
| Hosted broker rollback fixture | PASS — expected `P0001: ROLLBACK_BROKER_FIXTURE_COMPLETE`; synthetic users/connections/credentials/audit rows all zero afterwards |
| Local aggregate gates | PASS — `npm run check`: 59 unit, 4 integration, 46 Python validator, 6 TypeScript security, 16 docs/155 requirements/148 links/206 artifacts, 25-route build |
| Browser E2E/axe/visual/clay/navigation | PASS — 123 E2E, 85 axe, 153 viewport, 62 clay and 13 development navigation assertions; dev service-worker test corrected with a fresh page after unregister |
| Live OAuth / provider app review / SMTP / owner browser | NOT RUN / BLOCKED — owner configuration required |
| Vercel preview build verification | PASS — deployment `dpl_F5tKbh3PJXB8yjbHVQZk33hK5gW9` READY at exact SHA `74a6c53c805af349a46f34e20fbb76700e914fb1`, `public=false`, SSO-protected; pinned npm 11.21.2/Node 22.x, 0 npm vulnerabilities, TypeScript/production build PASS; cron declared but not run on preview |
| Production cron / publication / owner acceptance | NOT RUN / NOT RECORDED |

Corrections retained: a 42702 ambiguous PL/pgSQL `connection_id` was fixed by `20261110042107`; a 23514 disconnect-state check violation was fixed by `20261110042815`; the development service-worker cleanup test now verifies a genuinely fresh page after registration removal. The Batch C Storage-API delete probe passed with a 30-second cached-download limitation. Its temporary SQL cleanup was blocked by the connector provider security filter before execution; owner-run instructions are in [owner setup](OWNER_SETUP.md).

Vercel connector verification: the runtime commit was pushed to the fixed branch and built from the exact SHA. The deployment is READY, `public=false` and SSO-protected; build events record pinned `npm@11.21.2 ci`, Next.js 16.4.5, 420 installed packages, 0 vulnerabilities, compiled successfully in 6.1s, TypeScript in 11.9s and Build Completed in 45s. The deployment metadata contains the reviewed `0 3 * * *` cron declaration but no service key, token keyring, provider secret or cron bearer secret. An anonymous request to the branch alias returns Vercel's **Protected Deployment** login; no app page or hosted browser acceptance was reached. Vercel Hobby cron is daily/production-only, so the preview does not execute the cron.


## Master task — real OAuth visibility, configuration and verification

**Scope:** reproduce the hidden demo Accounts experience, remove the demo-only early return, always show the three real provider cards with exact statuses, expose name/boolean-only deployment readiness, configure the exact non-secret preview origin and auth redirect paths, and verify strict local/browser gates. Live OAuth, provider consent and owner acceptance are not claimed. See [master OAuth visibility report](MASTER_OAUTH_VISIBILITY_REPORT.md), [executed evidence](evidence/master-oauth-visibility.txt), [owner setup](OWNER_SETUP.md) and [requirements balance](OWNER_REQUIREMENTS_BALANCE.md).

Runtime commit `d4cfbde4508442c819e7779906f90c494c1fc0b9`; preview deployment `dpl_2igGhiy79jrgxBhPXABMcqnkS1MN` READY at that exact SHA, `public=false`, SSO-protected. The deployment build environment includes `UP17_SITE_URL` alongside the two public Supabase names and `UP17_APP_MODE`; provider secrets, service key, keyring and `CRON_SECRET` remain absent.

| Check | Actual result |
|---|---|
| Local reproduction of owner-visible page | PASS — HTTP 200 with demo board: "No real identity is connected", seven "Demo identity" labels, "Frontend only" and disabled "OAuth unavailable"; real OAuth board hidden by null workspace |
| Root-cause code/hosted evidence | PASS — `getViewer()`/`getWorkspaceContext()` requirements, zero hosted users/workspaces/connections, missing env names and SSO login recorded |
| Non-secret hosted configuration | PASS — branch-scoped Vercel Preview `UP17_SITE_URL` created; Supabase auth redirect query forms and `/auth/update-password` paths added; Vercel SSO kept intact |
| Hosted inventory after deployment | PASS — zero auth users, confirmed users, workspaces, members, owner/admins, preferences, connections, social accounts, private credentials, OAuth attempts and audit rows |
| Formatting / zero-warning lint / strict types | PASS |
| Unit | PASS — 12 files, 68 tests |
| Integration | PASS — 1 file, 4 tests |
| Python docs/artifact validator | PASS — 46 tests |
| TypeScript security | PASS — 2 files, 7 tests |
| Strict docs | PASS — 16 docs, 155 requirements, 148 links, 209 artifact candidates |
| Production build | PASS — compiled, 25/25 static pages, 25 routes |
| Browser E2E | PASS — 124 |
| Axe | PASS — 85 |
| Viewport / visual | PASS — 153 |
| Clay material contract | PASS — 62 |
| Development navigation | PASS — 13 on clean rerun after one dev-only service-worker timeout; generated TS config changes restored |
| Staged diff secret scan / whitespace | PASS — no populated secret pattern; `git diff --check` clean |
| Live OAuth / SMTP / provider apps / owner browser | BLOCKED / NOT RUN |

Nine hosted migrations were not reapplied, duplicated or reset. No provider was authorized, no real token was stored, nothing was published, no production promotion occurred and owner acceptance remains NOT RECORDED.

## Autonomous Vercel + Supabase configuration — active session

**Scope:** inspect the actual connected projects, configure every permitted reversible Preview/development prerequisite, deploy a public OAuth callback bridge without disabling global SSO, make readiness evidence-backed, and verify hosted schema/security gates. Live provider authorization, custom SMTP delivery and owner acceptance remain BLOCKED. See the [autonomous configuration report](evidence/autonomous-configuration-report.md), [change-control plan](evidence/autonomous-configuration-plan.md) and [owner setup](OWNER_SETUP.md).

| Check | Actual result |
|---|---|
| Project identity / branch / target | PASS — Vercel `prj_uh7RosdHFABdfwRkSRg7JNmu67bK` in team `team_jEJR74nCGB4nVczqRwF0ljmM`; Supabase `hxgokimjdormlktxjsbg` in org `xjzpxfeqrdhjsyijotvh`; fixed branch and Preview only |
| Vercel Preview env inventory / changes | PASS — four original plain vars preserved; server key, keyring, cron bearer secret and callback base added as branch-scoped Preview vars; no Production change |
| Supabase tenth migration | PASS — `20261110072807_up17_oauth_callback_bridge` applied; hosted/local canonical MD5 match; nine prior migrations not reapplied |
| Hosted schema / RLS / storage inventory | PASS — all exposed public tables have RLS; private bucket with scoped SELECT/INSERT/UPDATE/DELETE policies; five service-only bridge RPCs; `anon`/`authenticated` EXECUTE denied |
| Public callback bridge external reachability | PASS — anonymous HTTPS health returned `ok:true`; forged callback without bridge cookie returned an error; main app SSO unchanged |
| One-time receipt / replay / grants | PASS — synthetic receipt consumed once; second consume rejected; fixture deleted; service-only grants verified |
| Evidence-backed readiness | PASS — six exact states, service-only evidence table, 17 rows; VERIFIED requires timestamped evidence; no secret values exposed |
| Live signup / email delivery / workspace | BLOCKED — no custom SMTP, no owner-authenticated browser session, zero hosted app data |
| Google / Instagram / TikTok authorization | BLOCKED — no external app credentials, review, consent, callback validation or secure token persistence |
| Owner acceptance / Production promotion / cron execution | NOT RECORDED / NOT RUN — separate approvals |

Strict local gates and the final Preview verification are recorded in the [autonomous configuration report](evidence/autonomous-configuration-report.md).

Earlier autonomous-milestone local execution with pinned Node 22.22.3 / npm 11.21.2: `npm run check` PASS (13 unit files / 78 tests, 1 integration / 4 tests, 48 Python validator tests, 2 TypeScript security files / 8 tests, strict docs 16 / 155 / 191 / 217, 25/25 static pages and 25 routes). Browser gates used the documented registry-only Chromium 153 fallback because the default Playwright CDN executable was absent; the first invocation failed on that environment prerequisite, then clean reruns passed: E2E 124, visual 153, axe 85, clay 62 and development navigation 13. Generated TS config changes were restored. Staged whitespace and high-confidence secret-pattern scans PASS. These are local/build gates, not hosted owner acceptance.

Earlier autonomous-milestone runtime commit `df774e42ccf098b0c7c4959a7d144308bbd8cc97` was pushed to the fixed branch. Vercel deployment `dpl_4R3BdHpC9qpcNB1Kpo5YeFnn2Jwg` is READY at that exact SHA, `public=false`, Node 22.x, Hobby, with the branch alias assigned and the required Preview env names in the build environment. An anonymous `/accounts` request returns Vercel's Protected Deployment login; the public bridge health endpoint remains reachable. READY is not owner browser acceptance.

## New master milestone — real owner authentication and foundation OAuth (2026-11-08)

**Scope:** real sign-in/sign-up and email-confirmation recovery, `/login` and `/signup` aliases, secure verified first-workspace onboarding, account/shell honesty, evidence-backed Accounts readiness, foundation-only provider scopes, server-side OAuth start gate, private-storage boundaries, Edge Function v3 and local/deployed verification. Hosted owner acceptance, real email delivery, provider OAuth, authenticated storage upload/cross-workspace denial, Production promotion and cron execution are NOT VERIFIED.

| Check | Actual result |
|---|---|
| Pinned `npm run check` | PASS — format, ESLint `--max-warnings 0`, strict TypeScript, 14 unit files / 87 tests, 1 integration file / 4 tests, 48 Python validator tests, 2 TypeScript security files / 8 tests, strict docs 16 / 155 / 205 / 223 candidates, and a production build with 27/27 static pages and 27 routes |
| Standalone Edge Function type check | PASS — strict TypeScript with reviewed Deno runtime declarations; the Next.js `tsconfig.json` still excludes `supabase/functions/**`. This is a static check, not hosted Deno execution |
| `npm run test:e2e` | PASS — 126, including a clean full rerun on the exact runtime source tree. An initial run found 3 stale expectations; locator strictness and checklist-scope assertions were corrected, then the whole gate passed |
| `npm run test:visual` | PASS — 153. An initial run found 5 Accounts overflow assertions at 320–430px; a scoped `min-width:0`/wrap fix for setup-check copy was rebuilt and rechecked, then the whole gate passed |
| `npm run test:a11y` | PASS — 85 |
| `npm run test:clay` | PASS — 62 |
| `npm run test:navigation:dev` | PASS — 13; generated `tsconfig.json`/`next-env.d.ts` rewrites were restored |
| Hosted migration/RPC inventory | PASS — 11 applied migrations ending `20261110085716 verified_first_workspace`; `auth.users=0`, confirmed users=0, workspaces=0, members=0, owners=0, preferences=0, connections=0, bridge sessions=0, receipts=0, evidence=17; `public_tables_without_rls=0`; bootstrap ACL `[authenticated, postgres]`; RPC definition includes `auth.uid()`, email-confirmation and advisory-lock checks |
| Hosted Auth config | PASS — exact branch Site URL, confirmation required, signup enabled, refresh rotation on, secure email change on, MFA TOTP on; custom SMTP host/user/password remain null and delivery is NOT VERIFIED |
| Edge Function v3 | PASS — updated ACTIVE `verify_jwt=false` with exact provider origin/path, foundation scope, PKCE and secret-parameter checks; hosted source version advanced from 2 to 3. Anonymous health/forged-callback are negative reachability checks only |
| Deployed Preview | PASS / owner acceptance BLOCKED — original runtime commit `e4ba4bf034c49bc882233be99c51b174fc00337a` remains READY as private/SSO Preview `dpl_82xstWVxy92Du9Q5oS8JxqiNEJN7` at its immutable URL `https://autopublisher-3qc2te0kx-auto-uploader.vercel.app`; fresh access-clarification commit `e18cd394a699afa7b339c756edb40c7cba3f3fa35` is READY as private/SSO Preview `dpl_3BksENjHFzsNS9T8eNrT3fyLbCQr` at `https://autopublisher-6r5xnhkzn-auto-uploader.vercel.app`. Both are `public=false`; anonymous fetches reach Vercel SSO. The moving branch alias may advance with a later docs-only Preview. |
| Owner-authenticated browser acceptance | NOT RECORDED — Vercel SSO, custom SMTP, provider apps/reviews and a real confirmed owner session are genuine external gates |

Browser gates used the documented registry-only Chromium fallback with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/tmp/chromium` and `LD_LIBRARY_PATH=/tmp/up17-al2023/lib`. No Playwright screenshot baselines were rewritten. Local reproduction used no hosted session, no real provider secret and no synthetic database user; it proves UI behavior only. Staged whitespace and high-confidence secret-pattern scans were run before the runtime commit and repeated for this UI/test/docs follow-up. See [owner setup](OWNER_SETUP.md), [decisions](DECISIONS.md) and [sprint status](SPRINT_STATUS.md).

### Preview access and owner-browser verification

- Vercel identity/access: PASS — connected user `up17technical-5350` (GitHub `JUBERSALEEM`) is the confirmed `OWNER` of team `team_jEJR74nCGB4nVczqRwF0ljmM`; no invitation is required for that account. Project `prj_uh7RosdHFABdfwRkSRg7JNmu67bK` has `ssoProtection.deploymentType=all_except_custom_domains`; original deployment `dpl_82xstWVxy92Du9Q5oS8JxqiNEJN7` and fresh access-clarification deployment `dpl_3BksENjHFzsNS9T8eNrT3fyLbCQr` are READY and `public=false`. Production `dpl_9QYxyjkKa492tk87F1XZGeo1DPXL` is unchanged. The branch alias is a moving Git alias; check its current target before exact-SHA claims.
- Anonymous hosted requests: EXPECTED BLOCK — `/login`, `/signup`, `/accounts` and `/settings` on the original branch alias/deployment origin, plus all five named routes on the fresh direct origin and the branch alias's `/login` and `/onboarding`, returned Vercel `Protected Deployment` login. No Up17 route was reached. This is Vercel platform protection, not application authentication.
- Connector inventory: PASS — `list_connector_tools` for the enabled Vercel connector exposes `invite_team_member` with `VIEWER` but no Shareable Link creation, deployment-specific external-user grant or alias-assignment tool. `list_connector_tools` for Supabase exposes `update_auth_config` with no SMTP host/user/password fields. No alternate-email invitation was sent; the connected account is already Owner.
- Deployment-specific sharing: no platform-generated Shareable Link or automation-bypass secret was found. A temporary, revocable commit-specific Shareable Link is an owner/admin dashboard action because the connected Vercel toolset cannot create one; exact steps are in the owner setup document. On Hobby, one Shareable Link is permitted per account. No global SSO change, public app, permanent bypass or Up17 auth weakening was made.
- Hosted real-browser acceptance: NOT RECORDED — sandbox Chromium and curl cannot connect to `*.vercel.app`, and no owner Vercel session or temporary Shareable Link was available. A local production-build Chromium 153 browser checked `/login`, `/signup`, `/accounts`, `/onboarding` and `/settings` at 1440×900 desktop, 390×844 mobile and 320×800 narrow: 15/15 HTTP 200, expected heading/alias, no horizontal overflow, preview-access note on `/login` and `/signup`, and `/accounts` safe-preview/real-account controls with no fake handle, publishing disabled and four disabled Connect buttons with exact title/ARIA reasons. Screenshots/log stayed in `/tmp`, not Git. This is a real local browser check, not an owner-authenticated hosted browser session.
- Hosted auth/account data: PASS — fresh read-only query found `auth.users=0`, confirmed users=0, workspaces=0, members=0, owners=0, preferences=0, connections=0, bridge sessions=0, receipts=0, evidence=17, migrations=11, `public_tables_without_rls=0`. `authenticated` EXECUTE on `up17_ensure_first_workspace()` is true; `anon` and `service_role` are false. Supabase Auth has signup enabled, confirmation required, email provider enabled, all external social providers disabled and custom SMTP fields null.
- Accounts readiness: PASS (static/local) — `/accounts` uses `RealAccountsBoard` with server-side `getAccountsState()`; `getViewer()` and `getWorkspaceContext()` gate `canManage`; the old `AccountsBoard` is not imported by the route. The shell hides the sample `@up17longshotyt` handle on account routes. Disabled Connect buttons expose `aria-describedby`, exact blocker text and title reasons. Hosted evidence has three VERIFIED rows, three BLOCKED, four OWNER ACTION REQUIRED and no provider `*-redirect`, `*-review` or `*-account` row marked VERIFIED. Google/YouTube, Instagram and TikTok therefore remain BLOCKED / OWNER ACTION REQUIRED; publishing stays disabled.
- Fresh access-clarification Preview: PASS — commit `e18cd394a699afa7b339c756edb40c7cba3f3fa35` (7 files) built as READY/STAGED `dpl_3BksENjHFzsNS9T8eNrT3fyLbCQr`, `public=false`, exact SHA, immutable URL `https://autopublisher-6r5xnhkzn-auto-uploader.vercel.app`, global SSO/DEMO/Production unchanged. Pinned `npm run check` and all five browser gates were rerun PASS; no new bypass secret, SMTP setting, fake user or publishing change. A later docs-only Git Preview may advance the branch alias; use the immutable URL for exact-SHA checks.
- Owner onboarding flows: STATIC/LOCAL ONLY — sign-in, sign-up, reset, confirmation resend, password update, sign-out, safe `next` redirects, verified-session RPC and owner-role bootstrap were inspected and covered by local unit/E2E gates. No real email, confirmation, session persistence, workspace creation, role assignment, membership/authorization or logout was exercised in a hosted owner session because custom SMTP and owner consent are genuine external gates.


## Core Stability Phase — post-fix local evidence (2026-11-08)

**Scope:** local source/build/browser gates only. Social OAuth and provider evidence work is paused. See [Core Stability report](CORE_STABILITY_REPORT.md) and [validation log](evidence/core-stability-validation.txt).

| Check | Actual result |
|---|---|
| Fresh hosted Auth config read | PASS — owner-configured six-digit `{{ .Token }}` template, OTP length 6, custom SMTP, autoconfirm false, Postgres audit disabled; exact error and delivery NOT TESTED |
| SQL/hosted DB inventory | PASS — one confirmed owner user/workspace/session; zero new users, OTP tokens, connections, credentials or verified provider evidence |
| Exact hosted Auth-log signup error | NOT TESTED — `audit_log_disable_postgres=true`, `auth.audit_log_entries=0`, no authorized log source |
| `npm run check` | PASS — toolchain/format/lint/typecheck, 15 unit files / 96 tests, 1 integration / 4 tests, 48 Python validator tests, 8 TypeScript security tests, strict docs 16/155/218/227, 28-route production build |
| `npm run test:e2e` | PASS — 129/129; includes restored media route and new 320px navigation regression |
| `npm run test:visual` | PASS — 154/154 |
| `npm run test:a11y` | PASS — 86/86 |
| `npm run test:clay` | PASS — 62/62 |
| `npm run test:navigation:dev` | PASS — 13/13; generated TS config changes restored |
| Real signup / six-digit delivery / `verifyOtp` / resend / duplicate / invalid / expired / sign-in / recovery | NOT TESTED — owner inbox and authenticated Preview required |
| New verified account / onboarding / workspace isolation / existing owner browser access | NOT TESTED — no fake user created |
| Exact deployed Preview page switching behind Vercel SSO | NOT TESTED — anonymous request reaches Vercel Protected Deployment login |
| Production / SSO / RLS / private storage / publishing lock | PASS — unchanged |

The earlier link-based / eight-digit OTP / no-SMTP hosted snapshot in this document is superseded by the fresh config read above. A READY deployment or local browser PASS is not hosted acceptance.
