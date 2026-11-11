# Master task — real OAuth visibility, configuration and verification

**Status:** PARTIAL implementation and configuration; live OAuth and owner acceptance are BLOCKED.
**Branch:** `arena/698e4880-up17-autopublisher` (active).
**Starting remote HEAD:** `7b6b6f2eb7fb6e8afdecffd26ec2bf3ca9366464`.
**Runtime commit:** `d4cfbde4508442c819e7779906f90c494c1fc0b9`.
**Runtime preview:** `dpl_2igGhiy79jrgxBhPXABMcqnkS1MN` — READY, exact runtime SHA, `public=false`, Vercel SSO-protected.
**Executed evidence:** [master-oauth-visibility.txt](evidence/master-oauth-visibility.txt).
**Owner actions:** [OWNER_SETUP.md](OWNER_SETUP.md). **Balance:** [OWNER_REQUIREMENTS_BALANCE.md](OWNER_REQUIREMENTS_BALANCE.md).

**Historical report.** This report describes runtime commit `d4cfbde4508442c819e7779906f90c494c1fc0b9` and its zero-user, ten-status state. The current implementation uses numeric signup OTP, 15 owner-visible connection statuses, strict timestamped external evidence, no owner self-attestation and one confirmed owner session/workspace. Hosted Auth template/SMTP and real provider OAuth remain BLOCKED.

A READY build, local unit test, synthetic DB fixture, anonymous SSO login or connected-looking card is **not** OAuth acceptance. No provider was actually authorized, no real token was issued or stored, nothing was published, and owner acceptance is **NOT RECORDED**.

## 1. Why real OAuth was invisible

The owner's experience was reproduced locally with the pinned Next.js production server and inert placeholder public Supabase values. `GET /accounts` returned HTTP 200 with the demo board: one "No real identity is connected", seven "Demo identity" labels, one "Frontend only" badge, one disabled "OAuth unavailable" control and no real provider button. The server-side cause was exact:

- `app/(studio)/accounts/page.tsx` previously returned `<AccountsBoard />` whenever `getWorkspaceContext()` was `null`.
- `getViewer()` requires `email_confirmed_at`; `getWorkspaceContext()` requires a `workspace_members` row plus `preferences`.
- Hosted Supabase had zero auth users, confirmed users, workspaces, members, owner/admin members and preferences. Email was enabled with confirmation required, but custom SMTP was absent.
- Therefore an anonymous, unconfirmed or not-yet-workspace owner necessarily saw the explicitly demo/frontend-only board. The real board was hidden behind a session/workspace condition that the owner could not reach without email confirmation and workspace creation.
- Even if that board were reached, `providerAvailability()` would report every provider unconfigured because no provider credentials were present. `/api/connections/start` checks `providerSecrets(platform)` and `custodyConfigured()` before returning 503; the admin client cannot exist without a server-only service/secret key.
- `UP17_SITE_URL` was absent, so the exact callback origin was not pinned. `appOrigin()` would otherwise fall back to Vercel's branch/deployment host, which is not an owner-registered provider redirect.

The exact URL the owner personally opened is **not confirmed**. Available evidence: the branch alias `autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app` maps to the current runtime preview and returns Vercel's **Protected Deployment** login; production aliases return SSO login or 404 for the stale initial-plan deployment. Connector metadata cannot identify which alias a human used. The owner should supply the exact URL or use an owner-authenticated browser session.

## 2. What changed in code

Runtime commit `d4cfbde4508442c819e7779906f90c494c1fc0b9` removes the demo early return and makes `/accounts` a unified, server-readiness page:

- Three cards are **always** visible with exact buttons **Connect Google / YouTube**, **Connect Instagram** and **Connect TikTok**.
- At that historical runtime each card reported one of ten exact statuses (the current board has 15): `Not configured`, `Authentication required`, `Workspace setup required`, `Provider credentials missing`, `Encryption keyring missing`, `Ready to connect`, `Connected`, `Limited permissions`, `Needs reauthorization`, `Error`. A stored connection's state is shown even when a setup blocker is also present.
- `lib/connections/readiness.ts` is a pure status model; `lib/connections/deployment-readiness.ts` is `server-only` and exposes **names and booleans only**, never values. It checks public Supabase config, exact `UP17_SITE_URL`, server key presence, keyring validity, provider credential presence, confirmed viewer, owner/admin workspace and connection rows.
- The page explicitly identifies `UP17_APP_MODE=DEMO`, explains that other product screens may show sample data, and states that the real cards are live deployment controls with **no simulated authorization**.
- A deployment/owner checklist lists exact Vercel variable names, Supabase dashboard locations, provider consoles, SMTP and app-review gates. A separate journey links `/sign-up` and `/sign-in`, explains confirmed-email/workspace creation, exact callbacks and official consent.
- Disabled buttons are honest blockers, not fake authorization. No demo identity is shown as connected; the sidebar and workspace dialog now report the real connected count.
- Existing real connections, refresh, health, disconnect, publishing-disabled state and the server-only OAuth broker/token-custody architecture are preserved. Nine hosted migrations were **not** reapplied, duplicated or reset.
- Legacy demo Accounts E2E expectations were replaced with real-card, exact-status, setup-name and no-simulation assertions. New unit/security tests cover status precedence, exact labels and the server-only boundary.

## 3. What the owner now sees

On the SSO-authenticated current preview, `/accounts` shows:

1. The three exact provider buttons and one exact status per provider. In the current hosted configuration the primary status is `Not configured` because the server-only key, keyring and provider credentials are missing; `Authentication required` and `Workspace setup required` are explained in the checklist and journey.
2. An explicit **Demo mode is active** card and a clear route to real connections.
3. A name/boolean-only checklist showing which deployment variables are configured and which owner dashboard steps require verification.
4. Exact callback paths, requested scopes and provider console locations.
5. An empty **Connected real accounts** section until a real official OAuth callback creates a row.
6. Publishing disabled/paused everywhere. Connecting an account never approves publishing.

Anonymous fetches cannot see this hosted UI because Vercel SSO protection remains intact by instruction. The owner must use an authenticated Vercel session.

## 4. Hosted configuration actually performed

Non-secret configuration only:

- Created a branch-scoped Vercel **Preview** plain variable `UP17_SITE_URL` equal to the exact branch-alias HTTPS origin. The runtime deployment's build environment includes this name.
- Updated Supabase **Authentication → URL Configuration** with exact branch-alias `/auth/callback`, `/auth/confirm` and `/auth/update-password` paths plus path-specific query forms and local equivalents, while preserving email confirmation, signup and rotation settings.
- Re-checked `get_auth_config`: SMTP remains null and `mailer_autoconfirm=false`.
- Re-checked hosted inventory: zero users, workspaces, connections, credentials, OAuth attempts and audit rows.
- Kept Vercel SSO protection, `public=false`, preview target, no production promotion and no cron execution.

Still absent: `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`, `UP17_TOKEN_ACTIVE_KEY_ID`, `UP17_TOKEN_KEYS`, all six provider credential variables, `CRON_SECRET`, custom SMTP, provider apps, registered provider redirects, consent-screen/app review, owner email confirmation, owner/admin workspace, provider consent and real callback. No secret value was copied into Git, chat, logs, URLs or browser bundles.

## 5. Exact origin and callback URLs

Canonical preview origin:

```text
https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app
```

Provider redirect URIs that the owner must register exactly (no wildcard, no path/query/fragment drift):

```text
https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app/api/connections/callback/youtube
https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app/api/connections/callback/instagram
https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app/api/connections/callback/tiktok
```

Supabase auth redirect paths for the same origin: `/auth/callback`, `/auth/confirm`, `/auth/update-password`, with their reviewed query forms. See [OWNER_SETUP.md](OWNER_SETUP.md) for exact dashboard navigation.

## 6. Provider acceptance boundaries

- **YouTube / Google:** Google OAuth 2.0 web-server flow, exact Authorized redirect URI, single-use `state`, S256 PKCE, `access_type=offline`, `include_granted_scopes=true`, `youtube.readonly` and `youtube.upload`, provider identity and granted-scope checks, refresh-token handling. Consent-screen/OAuth verification and YouTube API compliance remain live gates. Official references: [server-side web apps](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps), [installed-app scopes](https://developers.google.com/youtube/v3/guides/auth/installed-apps).
- **Instagram / Meta:** Business Login for Instagram, a professional account, exact Business Login redirect URI, `instagram_business_basic` and `instagram_business_content_publish`, identity and permission checks, short-to-long-lived token exchange and refresh only after 24 hours. Advanced Access/app review is required before public use. Official references: [platform overview](https://developers.facebook.com/docs/instagram-platform/overview/), [access token](https://developers.facebook.com/docs/instagram-platform/reference/access_token/), [refresh token](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/), [content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/).
- **TikTok:** Login Kit for Web, exact callback, hex SHA256 S256 PKCE, `user.info.basic` and `video.publish`, `open_id` identity and audit checks. Unaudited clients remain private/self-test only; Direct Post approval and creator consent are separate. Official references: [Login Kit desktop](https://developers.tiktok.com/doc/login-kit-desktop/), [Content Posting API](https://developers.tiktok.com/docs/en/content-posting-api-get-started).

A connection token is not publishing approval. Publishing remains disabled and paused; no real content was published during OAuth work.

## 7. Executed gates

Strict local gates after staging the runtime diff:

| Gate | Result |
|---|---|
| Toolchain | PASS — Node 22.22.3, npm 11.21.2 |
| Format / zero-warning lint / strict types | PASS |
| Unit | PASS — 12 files, 68 tests |
| Integration | PASS — 1 file, 4 tests |
| Python docs/artifact validator | PASS — 46 tests |
| TypeScript security | PASS — 2 files, 7 tests |
| Strict docs | PASS — 16 docs, 155 requirements, 148 links, 209 artifact candidates |
| Production build | PASS — compiled, 25/25 static pages, 25 routes |
| Browser E2E | PASS — 124 |
| Axe | PASS — 85 |
| Visual / viewport | PASS — 153 |
| Clay material contract | PASS — 62 |
| Development navigation | PASS — 13 on clean rerun |
| Staged diff secret scan / `git diff --check` | PASS |
| Live OAuth / SMTP / provider consent / owner browser | BLOCKED / NOT RUN |

One development-only service-worker test initially timed out during a long aggregate run; an isolated rerun passed and a full clean `test:navigation:dev` rerun passed 13/13. Generated `tsconfig.json` and `next-env.d.ts` changes from the dev server were restored. These gates do not substitute for the real owner/provider journey.

## 8. Separate completion statuses

| Area | Status | Evidence-bound reason |
|---|---|---|
| OAuth code | COMPLETE | Reviewed adapters, state/PKCE/binding, callback, broker, custody and lifecycle routes exist unchanged; local security/unit gates pass. |
| UI | COMPLETE (historical) | Three exact cards, historically ten exact statuses (15 currently), demo explanation, checklist and journey are always visible; browser/axe/visual gates pass. |
| Authentication | BLOCKED | Vercel SSO, no custom SMTP, zero confirmed users/workspaces; no owner-authenticated hosted session. |
| Configuration | PARTIAL | Public Supabase names, DEMO mode and exact preview `UP17_SITE_URL` are present; server key, keyring, provider credentials and `CRON_SECRET` are missing. |
| Provider apps / redirects / reviews | MISSING | No Google, Meta or TikTok app, registered redirect, consent screen, Advanced Access or Direct Post audit was created. |
| YouTube | BLOCKED | No app credentials, registered callback, official consent, identity, scopes, refresh token or real callback. |
| Instagram | BLOCKED | No Business Login app credentials, professional-account verification, callback, permissions, identity or long-lived token. |
| TikTok | BLOCKED | No Login Kit app credentials, callback, `open_id`, scopes, audit or public/private restriction verification. |
| Token custody | BLOCKED | No keyring, server key, live encrypted credential or rotation evidence. |
| Lifecycle | BLOCKED | No real connection exists for refresh, health or disconnect; preview cron does not run. |
| Security | PARTIAL | Server-only boundaries, state/replay/PKCE/workspace-isolation tests and local gates pass; hosted role/isolation and real callback were not revalidated in this task. |
| Owner acceptance | BLOCKED | NOT RECORDED; no owner-authenticated browser or provider authorization was performed. |

No provider is marked COMPLETE merely because code exists.

## 9. Exact owner actions still required

1. Supply the exact URL opened and use an owner-authenticated Vercel session. Keep SSO protection or explicitly authorize a controlled alternative.
2. In Supabase `hxgokimjdormlktxjsbg`: configure custom SMTP under **Authentication / SMTP Settings**; send and open a real confirmation and recovery email; verify `/auth/callback`, `/auth/confirm` and `/auth/update-password` with the exact origin.
3. Sign up, confirm email, sign in and verify the trigger-created workspace, owner role and preferences. Viewer/editor roles must not manage connections.
4. In Vercel project settings, add one server-only `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`, `UP17_TOKEN_ACTIVE_KEY_ID`, `UP17_TOKEN_KEYS`, all six provider credential variables and `CRON_SECRET` as Sensitive values; redeploy.
5. In Google Cloud Console, Meta for Developers and TikTok Developer Portal, register the three exact callback URLs above, configure consent screens, scopes, test users, professional accounts, Advanced Access and Direct Post audit as applicable.
6. Return to `/accounts`, confirm the status becomes `Ready to connect`, press the exact provider button, verify the official provider origin, consent, return through the real callback, and check identity/scopes/state.
7. Exercise refresh, health and disconnect; verify encrypted credentials are deleted and remote revocation is honestly reported. Reject stale/replayed/expired links, missing scopes and revoked credentials.
8. Record owner acceptance separately. Only after this milestone is accepted may the next creator-product phase begin. Smart AI, paid AI, real publishing, the next creator phase and production promotion are out of scope now.

## Superseding active-task record

This report describes the earlier OAuth-visibility milestone. A later active task independently configured all permitted Preview/development prerequisites, applied the tenth migration, deployed the public callback bridge, stored server-side secrets through the integrations and made readiness evidence-backed. Its authoritative delivery record is [autonomous configuration report](evidence/autonomous-configuration-report.md); the current owner actions are in [owner setup](OWNER_SETUP.md). Historical statuses above should not be read as the current hosted configuration.
