# Decisions and owner approvals

**Date format:** UTC. A recommendation is not an approval. “Accepted constraint” means explicitly required by the owner's brief; proposed technical decisions still belong to the Phase 0 approval package.

## Status vocabulary

- **ACCEPTED CONSTRAINT:** explicit owner instruction; cannot be silently relaxed.
- **PROPOSED:** recommendation awaiting owner approval.
- **APPROVED:** owner explicitly approved; record date and scope.
- **DEFERRED:** decision needed at a named gate, not yet necessary.
- **SUPERSEDED:** replaced by a later dated decision, retaining history.

## Explicit constraints already established

| ID | Date | Decision | Source |
|---|---|---|---|
| C-001 | 2026-11-08 | Phase 0 first; no substantial feature work before plan approval | Owner instruction; brief §§0,18 |
| C-002 | 2026-11-08 | No external account/resource creation, connection, provisioning, deployment or paid service without explicit authorization | Brief §2.1; owner infrastructure restriction |
| C-003 | 2026-11-08 | Official APIs/OAuth only; no passwords, scraping bypasses, invented capabilities or demo successes presented as live | Brief §§2.3–2.5 |
| C-004 | 2026-11-08 | Separate product/repository/infrastructure; no reuse of another product's resources or branding | Owner instruction; brief §2.2 |
| C-005 | 2026-11-08 | Mobile-first premium claymorphism, light/dark themes, all ten named product areas | Owner instruction; brief §§6–7 |
| C-006 | 2026-11-08 | Small tested commits, verified pushes, immediate audit and continuously updated traceability | Brief §§4,16; owner instruction |

## Proposed architecture decisions

| ID | Status | Recommendation and rationale | Alternatives / trade-off | Revisit gate |
|---|---|---|---|---|
| ADR-001 | APPROVED (Phase 0) | Keep this repository and `docs/PLAN.md` as the immutable baseline source; add repository-specific docs rather than replace existing work | Renaming/replacing the brief loses provenance | Phase 0 approval |
| ADR-002 | APPROVED (M1.1 tested) | Next.js App Router + React + TypeScript; Tailwind CSS plus semantic CSS tokens; one web codebase, server-only integration boundaries | SPA plus separate API adds operational surface; plain React gives less server-side OAuth support | M1.1 compatibility spike |
| ADR-003 | APPROVED (M1.1 tested; npm variance below) | Pin a tested compatible toolchain, not “latest”: tested Next 16.4.5, React 19.3.1, TS 5.9.3, Tailwind 4.3.5, ESLint 9.39.5, Vitest 4.1.12; exact lockfile after install checks | Registry also exposes TS 7, ESLint 10 and Vitest 5; newer majors are not assumed compatible | M1.1; dependency updates thereafter |
| ADR-004 | PROPOSED | Supabase Auth/Postgres/Storage behind provider interfaces, local development first; hosted project only after explicit approval | Self-hosted Postgres/auth/storage gives control but more operations; no hosted lock-in in domain code | Phase 4 infrastructure authorization |
| ADR-005 | PROPOSED | Separate long-lived TypeScript worker container for FFmpeg/AI orchestration/publishing; durable Postgres-backed queue, pg-boss as candidate | Serverless-only media work is unsuitable; Redis queue adds a service; final queue choice needs local durability/concurrency benchmarks | M3.2 and M5.2 |
| ADR-006 | PROPOSED | Direct resumable object-storage upload using Supabase TUS when authorized; local emulator for development; never proxy large video bytes through a short-lived web handler | Browser-to-platform-only upload cannot support shared multi-platform analysis; ordinary request uploads are fragile | Phase 5 storage authorization |
| ADR-007 | PROPOSED | One shared video/analysis pipeline, immutable account-specific content versions and independent account jobs; no cross-account credential or analytics pooling | A single combined publish job couples failures and permissions | Phase 3 domain review |
| ADR-008 | PROPOSED | AI/research/storage/queue/social providers implement typed ports; deterministic mocks are the default, external calls require explicit mode and authorization | Direct SDK coupling makes testing and provider changes expensive | Each provider selection gate |
| ADR-009 | PROPOSED | PWA caches only public app-shell assets; no offline publishing, sensitive API responses, tokens or signed media URLs in service-worker caches | Offline-first mutations add reconciliation and privacy risks | M1.3 and Phase 12 |
| ADR-010 | IMPLEMENTED (database-tested; live gates blocked) | Server-side OAuth, envelope-encrypted tokens in a service-only table, workspace-scoped RLS on all exposed domain tables, redacted structured logs | Browser token storage or a shared privileged client is unacceptable | Batch D hosted broker fixture; owner live acceptance pending |
| ADR-011 | PROPOSED | YouTube is the first live integration; Instagram then TikTok, each separately authorized and tested; UI and mocks cover all three from the outset | Parallel live integrations multiply review/support blockers | Phase 7 approval |
| ADR-012 | PROPOSED | Research uses approved lawful sources with attribution; do not assume commercial eligibility for TikTok Research Tools or infer keyword volume from search results | Unofficial trend scraping violates the brief; no research provider selected yet | M6.3 source/budget approval |

## Owner decision register — defaults are recommendations, not settings already chosen

| ID | Decision | Recommended default | Needed by | Current state |
|---|---|---|---|---|
| D-001 | Product name / logo / brand assets | Keep “Up17 AutoPublisher”; create an original wordmark if no asset supplied | M1.2 | Awaiting owner |
| D-002 | Personal-only versus collaborative first release | One owner initially; schema/RLS support owner/admin/editor/viewer from Phase 4 without selling a team product yet | Phase 0 approval | Proposed |
| D-003 | First live platform | YouTube; all three visible in demo | Phase 0 approval | Proposed |
| D-004 | Retry policy | Initial attempt + at most 3 transient retries, nominal 1/5/15 minutes with jitter; obey Retry-After; permanent errors stop; ambiguous publish results reconcile before retry | Phase 0 approval / M9.2 | Proposed |
| D-005 | Account activation | Every new account publishing-disabled; explicit per-account automation opt-in; test/private first | Phase 0 approval | Proposed |
| D-006 | Posting windows / frequency | No invented production schedule. Demo only: 1 post/account/day, max 2, 10:00–20:00 Asia/Dubai, quiet 22:00–08:00; owner must choose real values | M9.1 before live automation | Proposed demo values |
| D-007 | Language / voice | English initially; configurable Hindi/Hinglish later; concise, evidence-led gaming voice, no fabricated achievements | M6.2 / M8.1 | Awaiting owner |
| D-008 | Retention | Propose originals 90 days, derivatives 30, analytics 13 months, audit/job metadata 12 months, backups 35; configurable legal holds; credentials until disconnect | Before real personal data | Proposed, not a legal determination |
| D-009 | AI provider / budget | No provider or spending selected; benchmark an owner-approved multimodal provider on a consented evaluation set; cap frames/minutes/cost per job | Before M6.1 external processing | Awaiting owner |
| D-010 | Queue/worker hosting / operating ceiling | Local worker first; compare one small always-on worker plus managed Postgres/storage against alternatives using measured workloads; no price assumption | Before Phase 5 hosted processing | Awaiting owner |
| D-011 | Essential analytics | YouTube views, watch time, average view duration, subscriber gains/losses where returned; available per-video metrics; other platforms only their supported fields | Phase 0 approval / Phase 10 | Proposed |
| D-012 | Upload limits / initial formats | MP4-first; propose 500 MiB and 10 minutes per original, vertical short-form focus; server validation and lower per-platform variant limits | Phase 5 | Proposed product limits, not API limits |
| D-013 | Research source / budget | Owner-approved official game announcements and licensed/permitted search only; no source connected yet | M6.3 | Awaiting owner |
| D-014 | Legal jurisdiction / privacy terms | Owner to confirm operating jurisdiction, privacy contact and processor agreements; do not infer from approximate chat location | Before hosted personal data | Awaiting owner |
| D-015 | Instagram login path | Use Business Login for Instagram with `instagram_business_basic` and `instagram_business_content_publish`; do not universally require a Facebook Page | M7.3 app-access spike | Adapter implemented; live app/professional-account review pending owner |
| D-016 | Unavoidable platform review | Preserve required TikTok consent/privacy/creator-info UX and other safety interventions even in full automation; confirm acceptable workflow | Phase 0 approval / M7.4 | Preserved in adapter notes and owner setup; live workflow confirmation pending |
| D-017 | Repository license | Owner chooses license before public code distribution beyond this repository; no license invented | Before adding third-party-facing distribution | Awaiting owner |

## Approval ledger

| Approval | Date | Scope and evidence |
|---|---|---|
| Phase 0 plan + recommended defaults | 2026-11-08 | Owner selected “Approve — start M1.1” in the approval prompt. Approves the local Next.js/TypeScript direction, YouTube-first live sequence, explicit account enablement, bounded retries and required platform consent. Authorizes **M1.1 local development only**; later milestones follow the approved small-step process. |

The later owner authorization covered the named Supabase project, Vercel preview repair/deployment and official platform-connection work. It did not cover secret creation/copying, SMTP/provider-console configuration, production promotion, paid services or publication to an actual creator account; those remain separate owner gates.

## M1.1 compatibility result — 2026-11-08

- Clean install/build/type/lint/unit evidence: [M1.1 validation](evidence/m1-1-validation.txt).
- **Variance:** npm 10.9.8 failed during optional-peer graph resolution; project and CI now use npm 11.21.2, with a successful strict `npm ci` and no legacy-peer override. Node remains 22.22.3.
- ESLint 10.14 was experimentally tested, but Next's transitive plugins declare ESLint <=9 peers. Retained the approved 9.39.5 rather than suppress peer conflicts; its upstream deprecation warning remains a tracked maintenance risk.
- Pin `minimatch` to 11.0.1 through a reviewed override for GHSA-g3hv-75wg-m249 in lint tooling. All quality gates pass and npm audit reports zero known vulnerabilities at this date; revisit on dependency updates.
- Playwright/axe setup is committed, but browser download from `cdn.playwright.dev` is blocked by sandbox TLS egress. Browser/visual assertions are NOT RUN, not passed. M1.2 cannot exit without resolving browser execution.
- npm 11 reports an unapproved esbuild postinstall warning; strict install and Vitest pass. Review installer policy on future toolchain updates rather than disabling all scripts or claiming the warning absent.

- **CI delivery blocker:** GitHub rejected the active workflow path because the connected GitHub App lacks workflow permission. The unpushed local commit was replaced without rewriting remote/shared history; the workflow is preserved as `docs/ci/quality.yml.example`. Local gates remain executable. Active CI is NOT IMPLEMENTED until the connection permission is fixed and the template is explicitly installed in a later commit.

## M1.1 foundation hardening — 2026-11-08

Owner requested maintenance within M1.1 only. Implemented without changing the approved product architecture or advancing to M1.2:

- Added only `server-only` 0.0.1 as a new runtime dependency; existing stack pins unchanged. Exact npm 11.21.2 is now enforced through `packageManager`, engines, `engine-strict=true` and an executing-CLI check.
- Replaced POSIX-only environment prefixes and URL pathname aliases with portable Node wrappers/`fileURLToPath`. Python 3 detection supports `python3`, `python`, `py -3` and `PYTHON`. Windows runtime execution is still NOT RUN in this Linux sandbox.
- Empty integration suites fail closed. The expected exit-1 result is documented and kept outside the aggregate `check` script until real approved integration tests exist; no placeholder tests were created.
- Expanded the Git artifact/credential validator and ignore policy for the current local-only stage. Future approved local Supabase migrations or other provider code will require an explicit gate update rather than silently weakening this guard.
- Browser/axe/visual assertions remain NOT RUN because Chromium download is blocked. This is a verification blocker, not a reason to claim accessibility success or mark M1.1 owner-accepted.


## Frontend-only UI authorization and Batch 1 variance — 2026-11-08

The owner explicitly requested autonomous implementation of the visible application in six batches: design system, shell, core screens, supporting screens, polish/accessibility, then full verification. This authorizes local frontend/demo work only. It does not authorize backend/publishing work, cloud resources, OAuth, external providers, deployment or spending. No architecture change is made: typed demo presentation data stays separate from future service/provider ports.

- Four themes are implemented as centralized CSS semantic surfaces. Clay Light is the product default; an unsaved/system preference follows device appearance in the Clay family. This resolves the default-versus-system requirement without ignoring either.
- The existing product name is used in a simple typographic brand mark. No final logo/license decision is invented on the owner's behalf.
- Added exact local-only UI assets `lucide-react@1.70.0` and `@fontsource-variable/inter@5.3.0`; strict install/build/peer checks pass.
- Standard Playwright browser download remains blocked. A registry-only Chromium fallback executes real production-build tests; it is not added to runtime dependencies or Git. Browser results explicitly identify this environment variance. Development HMR was unreliable with the fallback, so browser gates now own a fresh production server and build first. Loopback development origins are explicitly allowed alongside the Arena preview wildcard.
- Initial real axe failures in light accent/danger badges were fixed, not suppressed. Four-theme preview scans subsequently passed. Full application/viewport/keyboard acceptance remains pending; no owner acceptance is recorded.


## UI Batch 2 shell/PWA decisions — 2026-11-08

- Kept the exact ten main navigation labels from the immutable brief. Notifications remains a shell utility so the requested notification area is visible without inventing an eleventh main destination.
- Replaced the temporary root primitive preview with the Overview route; `/design-system` preserves the review surface. This is the planned transition, not deletion of product work.
- PWA follows ADR-009's proposed safe direction within the authorized frontend scope: public static shell/icons/offline fallback only, network-only navigations, no API/auth/media caching, no offline mutations. Original SVG icons are rasterized reproducibly by `scripts/render-icons.mjs`; required PNG icons are intentional small product assets, not build/media artifacts.
- Real axe runs caught visible-label/name mismatches in workspace/search controls; redundant overriding labels were removed rather than suppressing the rule. Development indicators are disabled for a clean product preview; dialog centering was corrected after rendered review.


## UI Batch 4 supporting-screen boundaries — 2026-11-08

- Workspace profile, inbox preferences, briefs and notification read state are browser-local demo state with validation and session-memory fallback. They do not create backend workspace/settings/event entities or authorize automation.
- Research prompts are explicitly evergreen editorial questions, not trends or verified news. Live updates/sources remain unavailable without a permitted integration.
- AI timeline markers are generic fractions of demo duration, not gameplay detections. Observations/confidence remain unknown; no AI request, cost or result is fabricated.
- Analytics filters are scope previews only. Missing metrics remain unavailable, never zero or interpolated. Local export/reset covers known app keys only; cloud privacy/security services remain later approved work.


## Functional A–J authorization and Batch C decisions — 2026-11-08

The owner authorized the functional A–J delivery sequence, including the named Supabase project, Vercel deployment repair/preview and official platform-connection work. Paid AI/services and publication to an actual creator account still require separate explicit approval; deployment authorization is not production acceptance.

- Used Supabase project `hxgokimjdormlktxjsbg` and Vercel project `prj_uh7RosdHFABdfwRkSRg7JNmu67bK` only after connector identity verification. Preview environment receives only the public Supabase URL/publishable key and explicit DEMO mode; no privileged key is committed or browser-exposed.
- Applied five reviewed migrations rather than reapplying failed monolithic/hardening attempts. Local/remote parity is canonical (comments/whitespace removed), not raw-byte parity.
- Closed direct preference/workspace writes behind the audited revision RPC; added category/platform integrity and a multi-workspace selection cookie with membership fallback.
- Deliberately allowlisted reviewed `supabase/migrations`, `supabase/tests` and `lib/supabase/database.types.ts` in the artifact guard; other cloud/generated artifacts remain rejected.
- Hosted RLS fixture passes and rolls back. SMTP is absent and Vercel preview SSO blocks anonymous hosted browser acceptance. The later challenge-gated Storage-API delete probe passed with a 30-second cached-download limitation; temporary SQL cleanup was blocked by the connector provider's security filter before execution. These remain explicit gates rather than claimed production acceptance. See [Batch C report](BATCH_C_AUTH_REPORT.md), [storage evidence](evidence/batch-c-storage-api.txt) and [owner setup](OWNER_SETUP.md).


## Batch D connection-broker decisions — 2026-11-10

- Applied nine reviewed migrations rather than reapplying earlier failed or already-applied versions; canonical local/remote MD5 parity is the audit method. Two corrective migrations were added after the hosted fixture exposed a 42702 ambiguous PL/pgSQL variable and a 23514 disconnect-order check violation.
- Instagram Business Login uses an explicit null PKCE verifier and `none` key id; Google and TikTok require encrypted verifiers. TikTok uses hex SHA256 S256, Google base64url S256. These are deliberate provider-specific contracts, not inferred NULL semantics.
- `up17_private.service_actor_role` fails closed to `viewer`; service-role calls still re-check owner/admin membership explicitly. Browser roles receive no service RPC or private-credential grants.
- The daily `/api/cron/connections` cron is declared in the exact reviewed `vercel.json`; no secret is in Git. Vercel Hobby runs cron daily and only on production.
- No provider app, SMTP credential, service key, token keyring, cron bearer secret or SSO change was created by the agent. `.env.example` contains reviewed placeholders only. Live OAuth remains BLOCKED and owner acceptance is NOT RECORDED. See [Batch D report](BATCH_D_CONNECTIONS_REPORT.md) and [owner setup](OWNER_SETUP.md).
- The Batch D runtime commit `74a6c53c805af349a46f34e20fbb76700e914fb1` was committed and pushed to the fixed branch, then preview-verified as Vercel deployment `dpl_F5tKbh3PJXB8yjbHVQZk33hK5gW9` (READY, exact SHA, `public=false`, SSO-protected). Build logs show pinned npm 11.21.2, Node 22.x, 0 npm vulnerabilities, successful TypeScript and production build, and the reviewed daily cron declaration. Vercel Hobby cron runs daily only on production; the preview does not execute it. READY is not hosted browser or owner acceptance.


## Master OAuth visibility decisions — current session

- Reproduced the owner's demo Accounts experience with an HTTP 200 local production render before changing code. The real board was hidden by `getWorkspaceContext() === null`, which is inevitable with zero confirmed users/workspaces; the demo early return was removed rather than adding another conditional reveal.
- `/accounts` now always renders a unified, server-readiness board with the three exact provider buttons and ten exact statuses. Demo mode is explicitly labelled and separated from real connection controls; no demo identity or disabled "OAuth unavailable" control is presented as a connection.
- `lib/connections/deployment-readiness.ts` is `server-only`; the client receives names and booleans only. Provider secrets, service keys, keyring values, SMTP credentials and cron bearer secrets remain outside Git, chat, URLs, logs and browser bundles.
- Configured only non-secret hosted prerequisites: branch-scoped Vercel Preview `UP17_SITE_URL` and exact Supabase auth redirect paths/query forms. Vercel SSO protection, `public=false`, preview target, nine applied migrations, token-custody architecture and the publishing lock were preserved.
- Obsolete demo Accounts E2E expectations were intentionally replaced; they described the hidden demo screen, not the unified real-connection UX. New readiness unit tests and browser assertions cover exact labels, statuses, setup names and the absence of simulated authorization.
- Runtime commit `d4cfbde4508442c819e7779906f90c494c1fc0b9` and preview `dpl_2igGhiy79jrgxBhPXABMcqnkS1MN` are READY evidence, not live OAuth or owner acceptance. Provider apps, SMTP, service key, keyring, `CRON_SECRET`, owner-authenticated browser, official consent and callback remain owner dependencies. Owner acceptance is NOT RECORDED. See [master OAuth visibility report](MASTER_OAUTH_VISIBILITY_REPORT.md) and [owner setup](OWNER_SETUP.md).

## Autonomous configuration decisions — active session

- Inspected the actual Vercel and Supabase projects before any change. Preserved the four existing Preview variables, `UP17_APP_MODE=DEMO`, global Vercel SSO `all_except_custom_domains`, Production `main`, nine applied migrations, the publishing lock and Smart AI/video/publishing workflows.
- Added one reviewed tenth migration for a service-only evidence table, private bridge sessions/receipts, five service-only RPCs and a workspace-scoped `storage.objects` UPDATE policy. Hosted/local canonical SQL parity was verified; no migration was reapplied or reset.
- Deployed a dedicated public Supabase Edge Function with `verify_jwt=false` rather than disabling app SSO or adding a protection-bypass secret to a provider redirect URI. A locally generated bypass candidate was not recognised by Vercel and was deleted; the connector cannot create a platform-generated bypass secret.
- Stored the required server key, generated AES-256-GCM keyring, generated cron bearer secret and non-secret callback base in branch-scoped Vercel Preview variables. Stored only the keyring metadata in Supabase Edge Function secrets and reused built-in service credentials. No existing credential was rotated; no secret value was printed, committed or included in a URL/report.
- Made the bridge the only hosted provider callback path. Direct provider `code`/`state` parameters on the protected app callback are rejected; the app accepts only a one-time receipt plus the original HttpOnly binding cookie. Provider origin, state, PKCE, actor/workspace ownership, expiry and replay are rechecked by service RPCs.
- Replaced presence-only readiness and hard-coded owner checks with six exact states backed by timestamped `deployment_evidence`. `CONFIGURED` never becomes `VERIFIED` without hosted evidence; SMTP configuration, bucket policies, OAuth client credentials and redirect registration are explicitly distinguished from delivery, authorised upload and account consent.
- Owner actions are limited to external provider/account permissions, direct SMTP credential entry, owner-authenticated browser acceptance and separately approved Production changes. All independent integration work was performed first. See the [autonomous configuration report](evidence/autonomous-configuration-report.md) and [owner setup](OWNER_SETUP.md).

Earlier autonomous-milestone runtime commit `df774e42ccf098b0c7c4959a7d144308bbd8cc97` is deployed as `dpl_4R3BdHpC9qpcNB1Kpo5YeFnn2Jwg` (READY, exact SHA, `public=false`, Node 22.x, SSO-protected). This is deployment evidence, not live OAuth, SMTP delivery, authenticated storage or owner acceptance.

Documentation commit `aee1016809f5a81edcc4df1451d86ae8288b721c` was verified as READY private/SSO Preview `dpl_8tkq9nSn8BY2bUtvqJ5g3Ww4c9Fa`; runtime source is unchanged from `dpl_4R3BdHpC9qpcNB1Kpo5YeFnn2Jwg`. Both deployment types remain distinct from owner acceptance.

## Unreleased — real owner authentication and foundation OAuth (2026-11-08)

**Implementation decisions (not owner acceptance).** These decisions implement the active master milestone without weakening the accepted publishing, SSO, Production or credential boundaries.

- `UP17_APP_MODE=DEMO` remains the global safety switch and `assertSafeMode()` still rejects global `LIVE`. `lib/app-mode.ts` now separates domains: authentication and workspace onboarding are `REAL_AUTH`; Accounts/OAuth is `REAL_FOUNDATION`; video, scheduling, analytics and sample content are `LABELLED_DEMO`; publishing is `DISABLED`. The auth and Accounts demo-gate helpers return false because those surfaces must be real.
- `/login` and `/signup` are temporary non-permanent redirects to canonical `/sign-in` and `/sign-up` so owner-facing links work. Auth pages use server-verified `getUser()`, not `getSession()` alone, and every private route requires `email_confirmed_at`.
- Signup stores only a short-lived HttpOnly pending-email cookie for `/auth/verify-email`; no email is placed in a URL. Confirmation/recovery/resend actions use same-app `safeNext()` targets. Password update requires a confirmed viewer and revokes other sessions where supported.
- Hosted migration 11 replaces the raw-signup trigger: it now inserts only a profile. `public.up17_ensure_first_workspace()` is SECURITY DEFINER, derives identity from `auth.uid()`, requires confirmation, locks per user, never promotes an existing member, and is executable only by `authenticated`/`postgres`. The client supplies no user id, workspace id or role.
- `/account` and `/onboarding` redirect unconfirmed/no-session/no-workspace users to explicit recovery steps. The shell uses `Private workspace`, `Real account controls`, `Demo mode` and `Safe preview` badges contextually; disabled install/workspace actions have exact reasons and a setup CTA. Generic `Button`, `Toggle`, `Input` and `Tabs` disabled states now carry accessible exact explanations.
- Unified Accounts readiness has 13 owner-visible connection statuses and exactly six evidence-backed setup states. `VERIFIED` requires timestamped evidence; variable presence is only `CONFIGURED`. Provider cards show foundation scopes, separate publishing scopes, exact redirect URI, dashboard path, owner actions, next steps and a deployment checklist. No UI state, code health check or synthetic test marks a provider `COMPLETE`.
- Google/YouTube is the first foundation target. Minimum scopes are `youtube.readonly`, `instagram_business_basic` and `user.info.basic`. Publishing scopes are declared separately but never requested. Token exchange and refresh reject any unexpected extra scope before storing a credential. The OAuth start route requires owner/admin role, confirmed session, credentials, keyring/bridge setup and timestamped `VERIFIED`/`NOT APPLICABLE` evidence for each provider's redirect/review/account checks.
- Edge Function v3 enforces exact provider origin and path, exact foundation scope, `response_type=code`, no secret parameters in the authorize URL, S256 PKCE for Google/TikTok and no PKCE for Instagram. The protected app still accepts only a one-time random receipt, never a direct provider `code`/`state`.
- Private storage remains `CONFIGURED`, not `VERIFIED`. The labelled demo upload UI stays disabled with an exact reason; no authenticated upload, playback or cross-workspace denial test was invented. Server-side signed media access still requires a confirmed workspace and workspace-prefixed `videos` row.
- Kept: global Vercel SSO, `UP17_APP_MODE=DEMO`, Production on `main`, service-only keyring, publishing lock, Smart AI/analytics/video workflows unchanged. No provider app, custom SMTP, bypass secret, real user, owner-authenticated browser session or Production promotion was created. See [test evidence](TEST_EVIDENCE.md), [owner setup](OWNER_SETUP.md) and [sprint status](SPRINT_STATUS.md).

The current milestone runtime source commit `e4ba4bf034c49bc882233be99c51b174fc00337a` is READY as private/SSO Preview `dpl_82xstWVxy92Du9Q5oS8JxqiNEJN7` at that exact SHA and remains directly addressable at its immutable deployment URL; later Preview commits do not replace those identifiers, and the branch alias may advance. Anonymous app fetches reach Vercel SSO. This is deployment evidence, not live OAuth, SMTP delivery, authenticated storage or owner acceptance.

**Preview-access decision.** The owner access blocker is Vercel Standard Protection (`all_except_custom_domains`) on a `public=false` Preview, not Up17 authentication. Keep global SSO and Production unchanged. Use the already-confirmed Vercel team OWNER account for SSO, or a temporary revocable deployment Shareable Link / minimum `VIEWER` invitation for a different collaborator; on Hobby prefer a deployment-specific external grant or one revocable link over broad team privileges. Do not create a permanent public bypass, custom-domain SSO exception, automation-bypass secret, fake user, autoconfirm shortcut, or Up17 auth relaxation. Add an owner-facing distinction between the Vercel Protected Deployment login and the real Up17 `/login` page.

**Fresh Preview and connector inventory decision (2026-11-08).** Because the access clarification changed UI, tests and docs, commit `e18cd394a699afa7b339c756edb40c7cba3f3fa35` was deployed as READY/STAGED private/SSO Preview `dpl_3BksENjHFzsNS9T8eNrT3fyLbCQr` at immutable URL `https://autopublisher-6r5xnhkzn-auto-uploader.vercel.app`. Do not call the moving branch alias the exact runtime Preview. `list_connector_tools` shows Vercel `invite_team_member` (`VIEWER`) but no Shareable Link creation, deployment-specific access grant or alias assignment; Supabase has no SMTP setter. No invitation was sent (no alternate email, connected account already OWNER), no Shareable Link or bypass secret was created, and no SMTP purchase or fake user exists. Local production-build Chromium desktop/mobile/narrow checks PASS; hosted owner-authenticated browser acceptance remains NOT RECORDED until the owner completes Vercel SSO or supplies a revocable link through a secure channel. Global SSO, Production, DEMO, RLS and publishing remain unchanged.
