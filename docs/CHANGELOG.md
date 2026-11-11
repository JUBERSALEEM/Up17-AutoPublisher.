# Changelog

## Unreleased — numeric email OTP and strict external-evidence gate (2026-11-08)

- Replaced signup confirmation links with the official Supabase six-digit numeric OTP flow: `signUp()` supplies no redirect target, `verifySignupOtp()` uses `verifyOtp({ type: "signup" })` and requires a confirmed session, `resendConfirmation()` uses `auth.resend({ type: "signup" })` with a 60-second HttpOnly cooldown, and `/auth/confirm` rejects legacy signup `token_hash` links. Password recovery remains a separate one-time link.
- Added an accessible six-input OTP form with paste, Backspace/arrow navigation, hidden form token, exact errors, resend cooldown, back-to-signup and no plaintext code storage. Updated auth/shell/verify-email copy and fixed 320px OTP overflow with a scoped grid `min-width: 0` rule.
- Expanded Accounts readiness to 15 owner-visible connection statuses and six evidence-backed setup states. Added deployment checks for numeric OTP template, SMTP, auth redirects, storage RLS, migration parity, callback bridge, state replay, cron and per-platform credential/redirect/review/account evidence. Provider cards open an exact-state review dialog; only “Continue to provider” can start OAuth and it stays disabled until every strict gate passes.
- Removed the owner/admin self-attestation server action, setup form and all UI paths that could write provider `VERIFIED` rows from a checkbox. No code, test, health check, config presence or dashboard attestation can fabricate genuine provider redirect/review/account evidence; `providerConfigurationReady()` and `/api/connections/start` remain strict.
- Updated unit, E2E, visual, accessibility and docs assertions for numeric OTP, 15 statuses, exact disabled reasons, review dialogs, legacy-link rejection and no-self-attestation. Added honest hosted evidence rows for the current Auth/template/SMTP blockers and existing owner session; no provider was marked ready.
- Pinned full gates PASS: `npm run check`, standalone strict Edge Function TypeScript check, E2E 128, visual 154, axe 86, clay 62, development navigation 13 and a separate local production-build Chromium 18/18 route/viewport check. Generated TS config rewrites were restored. These are technical gates, not real email delivery, provider consent, token storage or owner acceptance.
- Hosted Supabase Auth remains link-based with eight-digit OTP length and no SMTP; the connected connector cannot change the Confirm signup template, OTP length or SMTP fields. One confirmed owner user/workspace/session exists, but no real six-digit email, Google consent/callback, social account connection, encrypted token or authenticated storage acceptance was recorded. Expected incremental cost remains $0 on existing free allowances, subject to usage limits and separately approved paid services.

## Unreleased — real owner authentication and foundation OAuth (2026-11-08, historical baseline)

- Separated safe-mode domains: real authentication, verified workspace onboarding and real Accounts/OAuth controls are no longer demo-gated, while video/scheduling/analytics/sample content remain labelled demo and publishing stays disabled. Global `UP17_APP_MODE=DEMO` and the `LIVE` rejection are unchanged.
- Added `/login` and `/signup` aliases, real Supabase Auth sign-in/sign-up/reset/update server actions, a short-lived pending-email cookie, `/auth/verify-email` confirmation recovery and `safeNext()` allowance for it. Private routes now use auth-server-verified `getUser()` and require `email_confirmed_at`.
- Applied hosted migration 11 `20261110085716_verified_first_workspace` with a local mirror. Raw signup now creates only a profile; `up17_ensure_first_workspace()` derives identity from `auth.uid()`, requires confirmation, locks per user and creates only the first owner workspace. Added `/onboarding` with an idempotent retry and explicit `/account` redirects.
- Made the shell account-route/private-workspace aware with contextual badges, exact disabled reasons, profile/workspace copy and a setup CTA. Generic disabled buttons, toggles, inputs and tabs now expose accessible exact explanations.
- Rewrote unified Accounts readiness with 15 connection statuses, six evidence-backed setup states, timestamped `VERIFIED` evidence, provider requirements, exact owner dashboard paths, foundation vs publishing scopes, redirect URIs, journey, deployment checklist and no-simulation copy.
- Split foundation scopes from publishing scopes; Google/YouTube now requests `youtube.readonly` only. Token exchange and refresh reject unexpected extra scopes before storing credentials. The server-side start route now requires owner/admin role, confirmed session, credentials/keyring/bridge and timestamped owner-verified provider evidence.
- Updated the public Edge Function source and deployed version 3 with exact provider origin/path/scope/PKCE/secret-parameter checks. Protected callback still rejects direct provider code/state and accepts only one-time receipts.
- Added unit tests for safe-mode domains, verified-workspace RPC, aliases/recovery, owner provider requirements, readiness precedence, evidence sanitisation and foundation-only scopes. Updated stale auth/Accounts/shell E2E expectations; fixed Accounts setup-check copy overflow at 320–430px with a scoped wrap/min-width rule.
- Final pinned gates PASS: `npm run check` (14 unit files / 87 tests, 1 integration / 4 tests, 48 Python, 8 TypeScript security, strict docs 16 / 155 / 205 / 223, 27/27 static pages and 27 routes), standalone strict Edge Function TypeScript check, E2E 126 including a clean full rerun on the exact runtime source tree, visual 153, axe 85, clay 62, development navigation 13. Generated TS config rewrites were restored.
- Hosted verification: 11 migrations, zero users/workspaces/connections/bridge sessions/receipts, 17 evidence rows, `public_tables_without_rls=0`, bootstrap ACL `[authenticated, postgres]`, Auth confirmation required and custom SMTP absent. Edge Function v3 ACTIVE `verify_jwt=false`. Runtime commit `e4ba4bf034c49bc882233be99c51b174fc00337a` is READY as private/SSO Preview `dpl_82xstWVxy92Du9Q5oS8JxqiNEJN7` at that exact SHA; later Preview commits do not replace those identifiers. Owner-authenticated hosted browser acceptance remains NOT RECORDED.
- Owner access diagnosis: the anonymous Vercel `Protected Deployment` login is Standard Protection SSO, not Up17 `/login`; the connected Vercel account is already a confirmed team OWNER. Added exact owner SSO steps, minimum `VIEWER` role documentation for a different account (Hobby: prefer a deployment-specific external grant or one revocable Shareable Link), temporary revocable Shareable Link preparation, a clear auth-form note distinguishing the two logins, and local production-build Chromium desktop/mobile/narrow checks for `/login`, `/signup`, `/accounts`, `/onboarding` and `/settings` (15/15 PASS). Connector inventories show Vercel `invite_team_member(VIEWER)` but no Shareable Link / alias / deployment-access tool, and Supabase no SMTP host/user/password setter. No invitation, public app, permanent bypass, SSO change, Production change or hosted owner session was created.
- Fresh access-clarification Preview: commit `e18cd394a699afa7b339c756edb40c7cba3f3fa35` (7 files) built as READY/STAGED private/SSO Preview `dpl_3BksENjHFzsNS9T8eNrT3fyLbCQr`, `public=false`, exact SHA, immutable URL `https://autopublisher-6r5xnhkzn-auto-uploader.vercel.app`; global SSO, `UP17_APP_MODE=DEMO`, Production and publishing unchanged. Reran pinned `npm run check` and all five browser gates PASS; anonymous fetches still reach Vercel SSO. The moving branch alias may advance with later docs-only commits; use the immutable URL for exact deployment evidence. Hosted owner-authenticated browser verification remains NOT RECORDED.
- Live provider OAuth, real email delivery, owner-authenticated hosted browser acceptance, authenticated storage upload/cross-workspace denial, Production promotion, cron execution and publishing remain BLOCKED/NOT RECORDED. No provider credentials, custom SMTP, bypass secret, agent-created user or Production change was created in that historical batch. See [owner setup](OWNER_SETUP.md), [test evidence](TEST_EVIDENCE.md), [decisions](DECISIONS.md) and [sprint status](SPRINT_STATUS.md).

## Unreleased — Master OAuth visibility and readiness

- Reproduced the hidden demo Accounts screen and removed the `getWorkspaceContext() === null` early return. `/accounts` now always renders three official provider cards with exact **Connect Google / YouTube**, **Connect Instagram** and **Connect TikTok** buttons and historically ten exact owner-visible statuses (15 in the current implementation).
- Added a `server-only` deployment-readiness model that exposes names and booleans only: public Supabase config, exact `UP17_SITE_URL`, server-key presence, keyring validity, provider credential presence, confirmed viewer, owner/admin workspace and connection state. Explicit Demo mode, a setup checklist, the route to real connections and a publishing-disabled boundary are always visible.
- Replaced legacy demo-card/filter/pause E2E expectations with real-card, exact-status, setup-name and no-simulation assertions. Added readiness unit tests and a client-board/server-only secret-boundary assertion. The shell now reports the real connected count.
- Configured only non-secret hosted prerequisites: branch-scoped Vercel Preview `UP17_SITE_URL` and exact Supabase auth redirect paths/query forms. Vercel SSO, nine applied migrations, token-custody architecture and the publishing lock remain unchanged.
- Runtime commit `d4cfbde4508442c819e7779906f90c494c1fc0b9`; preview `dpl_2igGhiy79jrgxBhPXABMcqnkS1MN` READY at the exact SHA, `public=false`, SSO-protected. Strict gates PASS: 68 unit, 4 integration, 46 Python, 7 TypeScript security, 16 docs/155 requirements/148 links/209 artifacts, 25-route build, 124 E2E, 85 axe, 153 visual, 62 clay and 13 development navigation assertions.
- Live OAuth remains BLOCKED by owner SMTP, server key, keyring, provider apps/secrets/reviews, registered callbacks, official consent and an owner-authenticated browser. No provider was authorized, no real token was stored, nothing was published, production was not promoted and owner acceptance is NOT RECORDED. See [master OAuth visibility report](MASTER_OAUTH_VISIBILITY_REPORT.md) and [owner setup](OWNER_SETUP.md).

## Unreleased — Batch D official connections broker (2026-11-10)

- Added server-side OAuth state/PKCE/binding handling, AES-256-GCM encrypted token custody, reviewed YouTube/Instagram/TikTok adapters, refresh/health/disconnect lifecycle, a bearer-protected cron endpoint and a real-account board that never enables publishing automatically.
- Applied nine reviewed hosted migrations; verified local=remote canonical MD5 parity and a rollback hosted broker isolation fixture with zero synthetic rows afterwards. Two corrective migrations fixed an ambiguous PL/pgSQL variable and disconnect ordering against the connection-state check.
- Added strict reviewed env-example/Vercel cron guards, their positive/negative tests, connection crypto/provider unit tests and a 155-row four-gate owner balance. Live OAuth remains blocked by owner SMTP, secrets, provider apps/app review and accessible callback deployment. See [Batch D report](BATCH_D_CONNECTIONS_REPORT.md) and [owner setup](OWNER_SETUP.md).
- Recorded the later Batch C Storage-API delete acceptance and corrected its evidence: temporary Edge Function cleanup succeeded, but temporary SQL objects/extensions remain because cleanup SQL was blocked before execution. No bypass was attempted.
- Corrected the development service-worker cleanup regression to assert on a genuinely fresh page after registration removal; all 13 development navigation assertions pass after the retained first failure.
- Committed and pushed runtime commit `74a6c53c805af349a46f34e20fbb76700e914fb1` to the fixed branch; Vercel deployment `dpl_F5tKbh3PJXB8yjbHVQZk33hK5gW9` is READY at the exact SHA, SSO-protected and `public=false`, with the reviewed cron declaration but no preview cron execution. Build logs report pinned npm 11.21.2, Node 22.x, 0 vulnerabilities and a successful production build. This is deployment evidence, not hosted browser or owner acceptance.


## Unreleased — Batch C auth/data foundation (2026-11-08)

- Added Supabase SSR authentication, protected workspace/preferences/inbox paths, five applied hosted migrations, private media bucket policies and a rollback multi-user RLS fixture.
- Closed direct preference/workspace writes behind a revision-checked audited RPC; added category/platform integrity and multi-workspace selection fallback.
- Local aggregate/browser/accessibility/viewport/clay/navigation gates and hosted DB isolation fixture pass; hosted email delivery and SSO-protected browser acceptance remain blocked. The later challenge-gated Storage-API delete probe passed with a 30-second cached-download limitation; temporary SQL cleanup remains an owner action. See [Batch C report](BATCH_C_AUTH_REPORT.md), [storage evidence](evidence/batch-c-storage-api.txt) and [owner setup](OWNER_SETUP.md).

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

## Unreleased — autonomous Preview/development configuration (2026-11-10)

- Added the tenth hosted migration for evidence-backed readiness, a private OAuth callback bridge, service-only RPCs and a workspace-scoped storage UPDATE policy; verified hosted/local parity.
- Added and deployed the public `up17-oauth-callback` Edge Function with provider-origin allowlisting, HttpOnly bridge cookies, AES-256-GCM encrypted one-time code receipts and safe `.vercel.app` return origins. Global Vercel SSO remains intact.
- Added branch-scoped Preview server key, generated keyring, cron bearer secret and callback base through the integrations; no secret values or Production variables were changed.
- Reworked `/api/connections/start` and `/api/connections/callback/[platform]` to use the bridge and one-time receipts, rejecting direct provider codes on the protected app callback.
- Replaced presence-only readiness with six evidence-backed states, a service-only evidence table and non-secret evidence summaries; the Accounts board now shows exact states and exact external provider redirect URIs.
- Added bridge URL, keyring JSON-string, crypto-context, readiness-state, evidence-sanitisation and secret-boundary regression tests; updated `.env.example` and the strict docs/artifact validator for the callback base and reviewed Edge Function source.
- Updated Supabase Auth Site URL/redirect allowlist with the three exact public bridge callback URLs and query forms. No custom SMTP, provider app, live consent, real upload/cross-workspace test, Production promotion, paid plan, publishing or Smart AI change.

Earlier autonomous-milestone runtime commit `df774e42ccf098b0c7c4959a7d144308bbd8cc97` was pushed and verified as Vercel Preview `dpl_4R3BdHpC9qpcNB1Kpo5YeFnn2Jwg` (READY, exact SHA, `public=false`, SSO-protected, Node 22.x). A subsequent docs-only commit records the exact deployment ID and final evidence; runtime code is unchanged. A later docs-only Git Preview, if created, does not replace this explicit exact-SHA runtime deployment.
