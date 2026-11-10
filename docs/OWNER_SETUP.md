# Owner setup — remaining external account approvals only

**Audience:** repository/project owner only. **Status:** independent Preview/development configuration is complete; live OAuth, real email delivery and owner acceptance remain BLOCKED. The agent inspected the actual connected Vercel and Supabase projects, applied one reviewed migration, deployed a public OAuth callback bridge, stored server-side secrets through the integrations, preserved global SSO, and verified the hosted schema and quality gates. No secret value is printed, copied to Git, placed in a URL or returned in this document. Everything the existing integrations could safely configure has been configured; only genuine external provider/account permissions, owner-authenticated browser actions, custom SMTP credentials and separately approved Production changes remain.

**Branch and identity.** Fixed branch `arena/698e4880-up17-autopublisher`. Starting commit `d94418ef124f38e1989afe2049cc4d8158d33e89`. Vercel project `prj_uh7RosdHFABdfwRkSRg7JNmu67bK`, team `team_jEJR74nCGB4nVczqRwF0ljmM`, team slug `auto-uploader`, project name `autopublisher`, Hobby plan. Supabase project `hxgokimjdormlktxjsbg`, organisation `xjzpxfeqrdhjsyijotvh`, region `ap-northeast-1`, PostgreSQL 17. Exact Preview origin: `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app`. See the [autonomous configuration report](evidence/autonomous-configuration-report.md) and [change-control plan](evidence/autonomous-configuration-plan.md).

## 1. What is already configured and evidence-backed

- Vercel Preview, branch-scoped, has the two public Supabase names, `UP17_APP_MODE=DEMO`, exact `UP17_SITE_URL`, `UP17_OAUTH_CALLBACK_BASE_URL`, `UP17_TOKEN_ACTIVE_KEY_ID`, and Sensitive server-only `SUPABASE_SERVICE_ROLE_KEY`, `UP17_TOKEN_KEYS` and `CRON_SECRET`. Values live only in Vercel's secret manager and are never displayed by the Accounts page. No Production variable was changed.
- Supabase has the exact Preview Site URL, the reviewed email/auth redirect allowlist, the three exact public bridge callback URLs and their query forms, email signup enabled with confirmation required, refresh rotation, secure email change and MFA TOTP. No custom SMTP is configured and email delivery has NOT been verified.
- The tenth migration `20261110072807_up17_oauth_callback_bridge` is applied. Hosted verification found every exposed public table with RLS, the private `creator-media` bucket with scoped SELECT/INSERT/UPDATE/DELETE policies, five new service-only bridge RPCs and `public.deployment_evidence`. The local and hosted migration names and canonical SQL MD5 values match.
- The public Edge Function `up17-oauth-callback` is deployed with `verify_jwt=false` and built-in service credentials. Anonymous external HTTPS requests returned a healthy JSON response and rejected a forged callback without a bridge cookie. A synthetic one-time receipt was consumed once, replay was rejected, the fixture was deleted, and `anon`/`authenticated` EXECUTE grants on the bridge RPCs were verified absent.
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
