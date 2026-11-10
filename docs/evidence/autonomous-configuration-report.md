# Autonomous Vercel + Supabase configuration and live OAuth readiness

**Status:** implementation and hosted verification complete; live provider authorization, real email delivery and owner acceptance remain BLOCKED. This report is the final delivery record. It contains no secret values, service keys, keyrings, SMTP passwords, provider client secrets, bypass secrets or access tokens. See the [change-control plan](autonomous-configuration-plan.md), [owner setup](../OWNER_SETUP.md) and [test evidence](../TEST_EVIDENCE.md).

## 1. Starting and final Git SHAs

- Starting remote/local HEAD: `d94418ef124f38e1989afe2049cc4d8158d33e89`.
- Final runtime commit: `df774e42ccf098b0c7c4959a7d144308bbd8cc97` (exact SHA deployed and verified).
- Final documentation/evidence commit: recorded in the final chat delivery; a commit cannot contain its own hash. This report is a docs-only update after the runtime deployment.
- Fixed branch: `arena/698e4880-up17-autopublisher`; no other branch was used.

## 2. Exact Vercel project and deployment IDs

- Team: `team_jEJR74nCGB4nVczqRwF0ljmM` (`auto-uploader`, Hobby, owner `vTSWM9q6zvUweTzNR9pMx0X1`).
- Project: `prj_uh7RosdHFABdfwRkSRg7JNmu67bK` (`autopublisher`, Next.js, root `null`, pinned `npm@11.21.2 ci` / `run build`, Node `26.x` project setting).
- Starting READY Preview: `dpl_HtVsEubouySThbBci1LTctTSwAE8` at the starting SHA, `public=false`, SSO-protected.
- Final READY Preview: `dpl_4R3BdHpC9qpcNB1Kpo5YeFnn2Jwg` at `df774e42ccf098b0c7c4959a7d144308bbd8cc97`, `public=false`, SSO-protected, runtime Node 22.x, branch alias assigned. Connector verification returned exact Git SHA, `readySubstate=STAGED`, plan Hobby and the required Preview env names in the build environment. A later docs-only commit may create another Git Preview; this explicit runtime deployment remains the exact-SHA delivery.
- Production remains `dpl_9QYxyjkKa492tk87F1XZGeo1DPXL` at `b16202cc61c12a4ae374bedcca94680882064a9f` on `main`; no Production change or promotion occurred.

## 3. Supabase non-secret identity

- Project ref: `hxgokimjdormlktxjsbg`; organisation: `xjzpxfeqrdhjsyijotvh`; region: `ap-northeast-1`; PostgreSQL `17.11.0.018`; ACTIVE_HEALTHY.
- Public Edge Function: `up17-oauth-callback`, id `9e5d4060-09ab-4855-9a30-17f224360c76`, slug `up17-oauth-callback`, `verify_jwt=false`, status ACTIVE, version 2 (formatted source parity update).
- Public origin: `https://hxgokimjdormlktxjsbg.supabase.co`; exact provider callback URLs end at `/functions/v1/up17-oauth-callback?mode=callback&platform={youtube|instagram|tiktok}`.

## 4. Vercel changes

Inspected Preview and Production separately. The four original branch-scoped plain Preview variables were preserved: `UP17_APP_MODE=DEMO`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `UP17_SITE_URL` (id `rDTNyvIR6oedwvoi`). Added branch-scoped Preview-only variables required by the code: Sensitive `SUPABASE_SERVICE_ROLE_KEY` (id `ktKE7LqCbqV2GQUh`), plain `UP17_TOKEN_ACTIVE_KEY_ID` (id `7Z2nBRKZzNvt9cZi`), Sensitive `UP17_TOKEN_KEYS` (id `hG8qc8RRtQi1YIa8`), Sensitive `CRON_SECRET` (id `zaR6RIhGIN9x6ER1`) and plain `UP17_OAUTH_CALLBACK_BASE_URL` (id `rGTPEcnY2oP08fdI`). All generated values were stored server-side through the integration and are never printed or committed. A locally generated automation-bypass candidate was not recognised by Vercel and was immediately deleted (id `0XnuwCDEm85EzPMw`); no platform bypass secret or Deployment Protection Exception exists. No Production variable, `UP17_APP_MODE`, public Supabase value or `UP17_SITE_URL` was changed. SSO remains `all_except_custom_domains`. No paid plan or add-on was activated.

## 5. Supabase changes

Applied exactly one new migration: `20261110072807_up17_oauth_callback_bridge`. It created `public.deployment_evidence`, private `oauth_bridge_sessions` and `oauth_callback_receipts`, five service-only RPCs and the scoped `media_editor_update` policy. All nine earlier confirmed migrations were preserved and not reapplied. Hosted verification found every exposed public table with RLS, the private `creator-media` bucket with scoped SELECT/INSERT/UPDATE/DELETE policies, and `anon`/`authenticated` EXECUTE grants absent on bridge RPCs. Stored only `UP17_TOKEN_ACTIVE_KEY_ID` and `UP17_TOKEN_KEYS` as Edge Function secrets; built-in service credentials were reused. Updated Auth Site URL/redirect allowlist to include the three exact public bridge callback URLs and their query forms while preserving all existing same-origin/localhost paths. Email signup, confirmation requirement, refresh rotation, secure email change and MFA TOTP were preserved. No custom SMTP host/user/password could be set by the connector. No user/app data was deleted or modified.

## 6. Migrations applied and parity

Ten applied migrations with canonical whitespace-stripped MD5 parity. The new tenth hash is `28b7b7f16504c56c3ad5289668abde5d`; the nine earlier hashes are recorded in the [master OAuth visibility report](../MASTER_OAUTH_VISIBILITY_REPORT.md). Hosted `list_migrations`, hosted schema/RPC/policy inspection and local file MD5 all matched. No migration was reapplied, reset or duplicated.

## 7. Auth and storage verification

Auth configuration was inspected before and after; Site URL and redirect allowlist are exact, email confirmation is required, refresh rotation is on, custom SMTP is absent, and no signup/confirmation/recovery/session test was possible anonymously. Storage: private bucket `creator-media`, `public=false`, 500 MiB limit, reviewed video/image/audio MIME allowlist, zero objects, and four scoped policies including the new UPDATE policy. All public app tables have RLS. Authenticated upload/list/download/delete and explicit cross-workspace denial remain `CONFIGURED`, not `VERIFIED`, because no confirmed owner workspace exists. A synthetic service-RPC fixture proved one-time receipt consumption and replay rejection, then was deleted; it is not a real user/session test.

## 8. OAuth callback external reachability

Anonymous external HTTPS requests to the public Edge Function returned `{"ok":true,"service":"up17-oauth-callback"}` and rejected a forged callback without a valid bridge cookie. A locally generated Vercel bypass parameter still reached the Vercel SSO login, confirming the app remains protected; the candidate was deleted. The bridge validates provider origin, state hash, platform, browser cookie, expiry and one-time consumption; it encrypts the provider code into a private receipt and redirects to the protected app with only a random receipt token. No access token, provider code, service credential or keyring value appears in a URL, log or browser-visible response. Provider redirect registration and a real provider callback remain external owner actions.

## 9. Google / YouTube actual status

`BLOCKED`. No Google Cloud project/client ID/client secret, consent screen, test user, YouTube Data API verification, real account consent, callback validation, identity fetch or encrypted token persistence exists. Exact required dashboard path, redirect URI, scopes and success criteria are in [owner setup](../OWNER_SETUP.md). The code, deployed bridge and local tests are not Google/YouTube COMPLETE.

## 10. Instagram and TikTok actual status

Both `BLOCKED`. No Meta/TikTok app credentials, professional-account/Advanced Access review, Direct Post audit, real consent, callback validation or secure token persistence exists. They were assessed separately after Google and remain blocked; neither is COMPLETE. Exact required console paths and redirect URIs are in [owner setup](../OWNER_SETUP.md).

## 11. Full test results

`npm run check` PASS with pinned Node 22.22.3 / npm 11.21.2: Prettier format check, ESLint `--max-warnings 0`, strict TypeScript, 13 unit files / 78 tests, 1 integration file / 4 tests, 48 Python validator tests, 2 TypeScript security files / 8 tests, strict docs 16 required documents / 155 requirements / 191 local links / 217 artifact candidates (BLOCKED=4, IN PROGRESS=38, PLANNED=91, TESTED=22), and a production build with 25/25 static pages and 25 routes. Staged diff whitespace check PASS; staged high-confidence secret-pattern scan reported `NO_POPULATED_SECRET_PATTERNS_IN_DIFF`.

Browser gates used the documented registry-only Chromium 153 fallback because the default Playwright CDN executable was absent; the first browser invocation failed on that environment prerequisite, then all five gates passed on the clean rerun: E2E 124, visual/viewport 153, axe 85, clay 62 and development navigation 13. Generated `tsconfig.json`/`next-env.d.ts` changes from the development gate were restored. Hosted checks: migration parity, RLS/inventory, Edge Function health/forged-callback, service-only grants, synthetic receipt one-time/replay and evidence-row state counts all PASS. Final Preview `dpl_4R3BdHpC9qpcNB1Kpo5YeFnn2Jwg` is READY at runtime SHA `df774e42ccf098b0c7c4959a7d144308bbd8cc97`, `public=false`, Node 22.x, with branch alias assigned; an anonymous request to `/accounts` still returns Vercel's Protected Deployment login. No test claims live OAuth, email delivery, owner acceptance, authenticated storage upload or production cron execution.

## 12. Free-tier usage / cost assessment

Vercel Hobby and Supabase Free/existing project resources only: Next.js Preview, one Supabase Edge Function, existing Auth/Postgres/Storage, one private bucket and one daily production-only cron declaration. No paid plan, add-on, SMTP purchase, third-party subscription, AI service, background worker or unexpected recurring charge was activated. Preview cron is `NOT APPLICABLE`; Production cron execution is not run. Expected incremental cost of this work is $0 on existing free allowances. If free quotas are exhausted, the affected operation must stop gracefully and report; no paid recommendation is made because no free capability is insufficient for the remaining external-account blockers.

## 13. Remaining owner actions

1. Enter custom SMTP host/user/password directly in Supabase and verify one real signup-confirmation and one password-recovery email.
2. Create/approve the Google/YouTube OAuth client, consent screen, test users, YouTube Data API v3 and applicable scope verification; enter the client ID/secret directly into Vercel and register the exact public bridge redirect URI.
3. After Google succeeds, create/approve Instagram and TikTok apps, reviews/audits, exact redirect URIs and credentials directly in the provider/Vercel dashboards.
4. Use an owner-authenticated browser to verify signup, workspace ownership, all six readiness states, real connection lifecycle, replay rejection and viewer/editor denial; record owner acceptance.
5. Separately approve any Production promotion, Production environment variables, live cron, custom domain or publishing enablement.

These are genuine external account permissions/approvals: the Vercel connector cannot create an owner-authenticated browser session or platform bypass secret, the Supabase connector cannot set SMTP credentials, and no connected integration can create Google/Meta/TikTok app credentials, pass provider app review or consent as the owner. Never expose passwords, service keys or OAuth secrets in chat; use the provider dashboards/secret managers.

## 14. Known limitations and outstanding defects

- No owner-authenticated hosted app page, real signup/session/workspace, email delivery, provider OAuth, token refresh/health/disconnect or owner acceptance; all remain BLOCKED/NOT RECORDED.
- Vercel SSO intentionally blocks anonymous app fetches; no platform-generated bypass secret is available through the connector.
- Storage resumable/upsert compatibility and cross-workspace access denial are not VERIFIED without an authenticated workspace-role test.
- `UP17_APP_MODE` remains `DEMO`; `lib/foundation.ts` still rejects `LIVE`. Switching modes requires separate code/test work and owner approval.
- Historical Batch C leftovers (`public.tmp_consume_acceptance_challenge`, `up17_private.acceptance_challenges` without RLS, `http`, `pg_net`) remain. Their cleanup is destructive, previously blocked by the connector security filter and requires a separately reviewed reversible migration.
- `public.deployment_evidence` contains 17 non-secret states: 3 VERIFIED, 3 BLOCKED, 4 OWNER ACTION REQUIRED, 1 NOT APPLICABLE and 6 CONFIGURED. No row contains a secret value.
- No Smart AI, video analysis, publishing workflow, Production promotion, paid plan or security-boundary weakening was performed.
