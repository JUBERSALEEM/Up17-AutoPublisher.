# Test evidence ledger

This ledger records executed checks, not aspirational test names. See [TEST_STRATEGY.md](TEST_STRATEGY.md) for the future application catalog.


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

Final local execution with pinned Node 22.22.3 / npm 11.21.2: `npm run check` PASS (13 unit files / 78 tests, 1 integration / 4 tests, 48 Python validator tests, 2 TypeScript security files / 8 tests, strict docs 16 / 155 / 191 / 217, 25/25 static pages and 25 routes). Browser gates used the documented registry-only Chromium 153 fallback because the default Playwright CDN executable was absent; the first invocation failed on that environment prerequisite, then clean reruns passed: E2E 124, visual 153, axe 85, clay 62 and development navigation 13. Generated TS config changes were restored. Staged whitespace and high-confidence secret-pattern scans PASS. These are local/build gates, not hosted owner acceptance.
