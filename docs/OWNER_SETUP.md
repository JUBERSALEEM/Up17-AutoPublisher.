# Owner setup — remaining external account approvals only

**Audience:** repository/project owner only. **Status:** real sign-in/sign-up, verified-email recovery, secure first-workspace onboarding, evidence-backed Accounts readiness and foundation-only OAuth are implemented and locally tested; live provider OAuth, real email delivery, authenticated storage acceptance and owner acceptance remain BLOCKED. The agent inspected the actual connected Vercel and Supabase projects, applied migration 11, deployed the reviewed public OAuth callback bridge as version 3, preserved global SSO and verified hosted schema/ACL boundaries. No secret value is printed, copied to Git, placed in a URL or returned in this document. Everything the existing integrations could safely configure has been configured; only genuine external provider/account permissions, owner-authenticated browser actions, custom SMTP credentials and separately approved Production changes remain.

**Branch and identity.** Fixed branch `arena/698e4880-up17-autopublisher`. Starting commit `d94418ef124f38e1989afe2049cc4d8158d33e89`. Earlier autonomous-milestone runtime commit `df774e42ccf098b0c7c4959a7d144308bbd8cc97` was deployed as READY private/SSO-protected Preview `dpl_4R3BdHpC9qpcNB1Kpo5YeFnn2Jwg`. Current milestone runtime commit `e4ba4bf034c49bc882233be99c51b174fc00337a` was deployed as READY private/SSO-protected Preview `dpl_82xstWVxy92Du9Q5oS8JxqiNEJN7` at that exact SHA. Vercel project `prj_uh7RosdHFABdfwRkSRg7JNmu67bK`, team `team_jEJR74nCGB4nVczqRwF0ljmM`, team slug `auto-uploader`, project name `autopublisher`, Hobby plan. Supabase project `hxgokimjdormlktxjsbg`, organisation `xjzpxfeqrdhjsyijotvh`, region `ap-northeast-1`, PostgreSQL 17. Exact Preview origin: `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app`. See the [autonomous configuration report](evidence/autonomous-configuration-report.md) and [change-control plan](evidence/autonomous-configuration-plan.md).

## 1. What is already configured and evidence-backed

- Vercel Preview, branch-scoped, has the two public Supabase names, `UP17_APP_MODE=DEMO`, exact `UP17_SITE_URL`, `UP17_OAUTH_CALLBACK_BASE_URL`, `UP17_TOKEN_ACTIVE_KEY_ID`, and Sensitive server-only `SUPABASE_SERVICE_ROLE_KEY`, `UP17_TOKEN_KEYS` and `CRON_SECRET`. Values live only in Vercel's secret manager and are never displayed by the Accounts page. No Production variable was changed.
- Supabase has the exact Preview Site URL, the reviewed email/auth redirect allowlist, the three exact public bridge callback URLs and their query forms, email signup enabled with confirmation required, refresh rotation, secure email change and MFA TOTP. No custom SMTP is configured and email delivery has NOT been verified.
- Migration 10 `20261110072807_up17_oauth_callback_bridge` and migration 11 `20261110085716_verified_first_workspace` are applied. Hosted verification found 11 migrations, every exposed public table with RLS (`public_tables_without_rls=0`), the private `creator-media` bucket with scoped SELECT/INSERT/UPDATE/DELETE policies, five service-only bridge RPCs, `public.deployment_evidence`, and the verified-session first-workspace RPC with EXECUTE limited to `authenticated`/`postgres`. The old raw-signup trigger now creates only a profile; it no longer creates a workspace, owner membership or preferences.
- The public Edge Function `up17-oauth-callback` is deployed as version 3 with `verify_jwt=false` and built-in service credentials. It enforces exact provider origin/path, `response_type=code`, exact foundation scope, no client secret/access token/refresh token in the authorize URL, S256 PKCE for Google/TikTok and no PKCE for Instagram. Anonymous external HTTPS requests returned a healthy JSON response and rejected a forged callback without a bridge cookie. A synthetic one-time receipt was consumed once, replay was rejected, the fixture was deleted, and `anon`/`authenticated` EXECUTE grants on the bridge RPCs were verified absent.
- The protected app accepts only a short-lived one-time `receipt`; direct provider `code`/`state` parameters on the app callback are rejected. Provider URLs are allowlisted, state/PKCE/browser binding are verified, codes are encrypted into private one-time receipts, and access tokens never appear in URLs, logs or browser responses.
- The Accounts checklist now uses exactly `MISSING`, `CONFIGURED`, `VERIFIED`, `OWNER ACTION REQUIRED`, `BLOCKED` or `NOT APPLICABLE`, backed by the service-only evidence table. `VERIFIED` requires timestamped evidence; no variable is marked VERIFIED merely because it exists.

## 2. Exact public provider redirect URIs

Register these **exact** URLs in each external provider console. They terminate at the public Supabase bridge, not the SSO-protected Vercel app. Do not add wildcard redirect URIs or a Vercel protection-bypass query parameter.

| Provider | Exact redirect URI |
| --- | --- |
| YouTube / Google | `https://hxgokimjdormlktxjsbg.supabase.co/functions/v1/up17-oauth-callback?mode=callback&platform=youtube` |
| Instagram / Meta | `https://hxgokimjdormlktxjsbg.supabase.co/functions/v1/up17-oauth-callback?mode=callback&platform=instagram` |
| TikTok | `https://hxgokimjdormlktxjsbg.supabase.co/functions/v1/up17-oauth-callback?mode=callback&platform=tiktok` |

The main application remains protected by Vercel SSO `all_except_custom_domains`. The bridge only validates provider origin, state, browser binding and one-time receipt handling, then returns the signed-in browser to `/api/connections/callback/{platform}?receipt=...`. No separate public app path or global SSO change is required.

## 3. Genuine remaining owner actions

### A. Supabase custom SMTP and real email delivery

**URL:** `https://supabase.com/dashboard/project/hxgokimjdormlktxjsbg/auth/providers` → **Email** → **SMTP Settings**. The connector can inspect Auth but cannot set `smtp_host`, `smtp_user` or `smtp_pass`, and cannot observe inbox delivery.

Enter the SMTP host, port, sender, username and password directly in the Supabase dashboard; never paste them into chat or Git. Success criteria: send one real signup-confirmation email and one password-recovery email to an inbox you control; the confirmation link establishes a session at `/auth/callback`, the reviewed trigger creates a workspace, owner membership and preferences, and recovery reaches `/auth/update-password`. Report configuration separately from actual delivery. The readiness state remains `OWNER ACTION REQUIRED` until this succeeds.

### B. Google / YouTube application and account authorization

**URL:** `https://console.cloud.google.com/apis/credentials` → select the owner's Google Cloud project → **OAuth consent screen** and **Credentials** → **Create credentials** → **OAuth client ID** → **Web application**. Also enable **YouTube Data API v3** under **APIs & Services → Library**. Required scopes: `https://www.googleapis.com/auth/youtube.readonly` and `https://www.googleapis.com/auth/youtube.upload`. Add the exact YouTube URI from section 2 as an **Authorized redirect URI**. Enter the client ID and client secret directly into Vercel at `https://vercel.com/auto-uploader/autopublisher/settings/environment-variables` as `GOOGLE_CLIENT_ID` (plain) and `GOOGLE_CLIENT_SECRET` (Sensitive, Preview). Complete consent-screen/test-user and any applicable scope verification.

Success criteria: an owner-authenticated browser signs in, starts a real YouTube authorization, consents on `https://accounts.google.com`, returns through the public bridge, and `/accounts` shows a real channel with `Connected`, granted scopes, encrypted credentials persisted server-side, publishing disabled and a successful refresh/health check. A READY deployment or credentials alone is not success. Google/YouTube remains `BLOCKED` until this occurs.

### C. Instagram and TikTok — assess only after Google is verified

**Instagram URL:** `https://developers.facebook.com/apps/` → owner app → **Instagram API with Instagram Login / Business Login for Instagram** → **Business Login settings**. Register the exact Instagram URI from section 2. Request `instagram_business_basic` and `instagram_business_content_publish`; use a professional account and complete Advanced Access/app review. Store `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET` directly in Vercel.

**TikTok URL:** `https://developers.tiktok.com/app/` → owner app → **Login Kit** and **Content Posting API** → **Redirect URIs**. Register the exact TikTok URI from section 2. Request `user.info.basic` and `video.publish`; complete Direct Post/audit gates. Store `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` directly in Vercel.

Success criteria for each: real owner authorization, callback validation, external identity, encrypted token persistence, publishing disabled, and refresh/health/disconnect evidence. Both remain `BLOCKED`; no app review, audit or account authorization can be performed by the connected integrations.

### D. Owner-authenticated hosted acceptance

Use an owner-authenticated browser at `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app/accounts`. Vercel SSO intentionally blocks anonymous fetches; this is not a product defect. Confirm the exact URL, sign in with a confirmed email, verify workspace owner/admin role, check all six readiness states and their non-secret evidence, and exercise the complete connection lifecycle including rejection of a stale/replayed link and denial for viewer/editor roles. Record owner acceptance separately; it is NOT RECORDED.

### E. Production, cron and paid services — separate approvals

No Production deployment was promoted or changed. `vercel.json` declares one daily production-only cron, but Vercel Hobby cron does not run on Preview; the Accounts checklist correctly marks `CRON_SECRET` as `NOT APPLICABLE` in Preview. A Production promotion, Production environment variables, a live scheduled cron execution, custom domains, paid add-ons, SMTP purchase, provider app review fees and any publishing enablement require separate explicit owner approval. The $0-first policy remains in force; no paid plan, storage add-on, AI service or third-party subscription was activated.

## 4. Security boundaries

- Global Vercel SSO stays intact. The public surface is limited to the reviewed Edge Function, which never returns an access token, provider code, service credential or keyring value.
- Server-only secrets never enter `NEXT_PUBLIC_` variables, client bundles, URLs, logs or Git. The Accounts board displays names, states, dashboard locations and non-secret evidence only.
- Tokens are ciphertext at rest with workspace/platform/subject-bound AES-256-GCM AAD. Service RPCs re-check actor membership, state, binding, expiry and one-time consumption.
- Every new connection starts publishing-disabled and paused. Smart AI, video analysis and publishing workflows were not modified.
- Provider app review, quota, account eligibility, consent and audit restrictions are live gates, not documentation claims. No social password is requested; official OAuth only.

## 5. Known leftovers requiring separate approval

The historical Batch C probe leftovers (`public.tmp_consume_acceptance_challenge`, `up17_private.acceptance_challenges`, and extensions `http`/`pg_net`) remain. The connector's security filter blocked the original cleanup SQL; it was never rewritten to bypass that control. `acceptance_challenges` still lacks RLS but is not exposed through app RPCs and is revoked from `anon`/`authenticated`; it contains seven historical rows. Removing these objects is a destructive operation and was NOT performed. `auth.mfa_challenges` and `auth.webauthn_challenges` are Supabase Auth internals and must not be dropped. Any cleanup requires a separately reviewed reversible migration and explicit owner approval.

## 6. New master milestone — exact owner acceptance path (A–G)

`UP17_APP_MODE=DEMO` remains the global deployment safety switch, but authentication, verified workspace onboarding and Accounts/OAuth controls are deliberately **not** demo-gated. Video, scheduling, analytics and sample content remain labelled demo workflows; publishing stays disabled. No agent-created user, workspace, connection, SMTP setting, provider app, bypass secret or Production promotion exists.

**Deployed Preview reference (not acceptance).** Runtime source commit `e4ba4bf034c49bc882233be99c51b174fc00337a` is READY as private/SSO Preview `dpl_82xstWVxy92Du9Q5oS8JxqiNEJN7` at that exact SHA, with the branch alias assigned and `public=false`. Anonymous `/login`, `/signup`, `/accounts` and `/settings` fetches reach Vercel SSO; no owner-authenticated app session exists. A subsequent docs-only commit records these identifiers and does not replace the exact runtime source SHA.

**A. Confirm email delivery.** In Supabase → Authentication → Sign In / Providers → Email / SMTP Settings, set your own custom SMTP host/user/password. Send one real signup-confirmation email and one password-recovery email. The Supabase connector cannot set these values. Confirmation is required (`mailer_autoconfirm=false`); `/auth/verify-email` can resend a link.

**B. Sign up and sign in as the owner.** In an SSO-authenticated browser on the exact Preview origin, open `/login` or `/signup` (canonical `/sign-in` and `/sign-up` also work). Create an email/password account, open the confirmation link in the same browser, then sign in. Do not use an invented session or autoconfirm bypass.

**C. Finish verified onboarding.** On `/onboarding`, the server-side `up17_ensure_first_workspace()` RPC derives identity from `auth.uid()`, requires `email_confirmed_at`, takes a per-user advisory lock, and creates one `'My creator workspace'`, one owner membership and one preferences row. Existing members are never promoted. `/account` redirects unconfirmed sessions to `/auth/verify-email` and users without a workspace to `/onboarding`.

**D. Verify private storage with a real session.** Upload one small MP4 through a separately reviewed authenticated storage path, list/read/delete it, and verify that a second workspace cannot read it. The private bucket and four scoped policies are `CONFIGURED`; the real upload and cross-workspace denial are not `VERIFIED` until you own a confirmed session. The labelled demo video library does not read or store files.

**E. Complete Google / YouTube first.** In Google Cloud Console → APIs & Services → Library, enable YouTube Data API v3. Configure OAuth consent screen Audience/Branding/Data Access, then create a Web application OAuth client at APIs & Services → Credentials. Register the exact YouTube bridge callback from section 2, with no wildcards or Vercel bypass parameter. Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` only in Vercel Preview Sensitive environment variables. Foundation scope is exactly `https://www.googleapis.com/auth/youtube.readonly`; `youtube.upload` and publishing are excluded. Published branding, test users, data-access verification and a real owner consent are owner-only decisions. Record timestamped `VERIFIED` evidence for `youtube-redirect`, `youtube-review` and `youtube-account` before the server-side start gate will allow OAuth.

**F. Add Instagram and TikTok only after Google succeeds.** Meta for Developers requires a Business app with Instagram API with Instagram Login, a professional account, `instagram_business_basic`, exact redirect URI, permission access level and App Review/Advanced Access where applicable. TikTok Developer Portal requires Login Kit for Web, `user.info.basic`, exact redirect URI, eligible creator account and app review; Direct Post/`video.publish` and the Content Posting API audit are a later publishing milestone, not this foundation. Store `INSTAGRAM_CLIENT_ID`/`INSTAGRAM_CLIENT_SECRET` and `TIKTOK_CLIENT_KEY`/`TIKTOK_CLIENT_SECRET` only in Vercel. Record timestamped evidence for each provider's redirect/review/account checks.

**G. Record owner acceptance separately.** In an authenticated browser verify signup, confirmation, sign-in, workspace ownership, Accounts readiness states, one real provider authorization/callback, encrypted connection identity, refresh/health/disconnect, replay rejection, viewer/editor denial and private storage isolation. Keep SSO enabled. Production promotion, Production variables, live cron, custom domains, publishing scopes and Smart AI each require a separate explicit approval. A READY Preview, local browser gate, negative unauthenticated RPC rejection, bridge health check or synthetic fixture is not owner acceptance.
