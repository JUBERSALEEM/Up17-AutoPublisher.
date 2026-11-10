# Owner setup — SMTP, SSO, provider apps and live OAuth acceptance

**Audience:** repository/project owner only. **Status:** PARTIAL non-secret configuration; live OAuth remains BLOCKED. The agent did not create, copy, print, commit or deploy a Supabase service key, token keyring, SMTP credential, provider client secret, cron bearer secret or Vercel SSO change. The agent did set the non-secret exact preview `UP17_SITE_URL` and reviewed Supabase auth redirect paths. Live acceptance requires every remaining section below and an owner-authenticated real browser. Technical database fixtures are not a substitute for these gates.

**Current verified state:** branch `arena/698e4880-up17-autopublisher`, runtime commit `d4cfbde4508442c819e7779906f90c494c1fc0b9`, preview deployment `dpl_2igGhiy79jrgxBhPXABMcqnkS1MN` READY at that exact SHA, `public=false`, SSO-protected. The unified Accounts page now always shows the three real provider cards, exact statuses, explicit Demo mode, a name/boolean-only setup checklist and the route to real connections. Vercel Preview has `UP17_APP_MODE=DEMO`, the two public Supabase names and the exact `UP17_SITE_URL`; it still lacks the server key, keyring, provider credentials and `CRON_SECRET`. Supabase has no custom SMTP and zero users, workspaces, connections, credentials, OAuth attempts or audit rows. No provider was authorized and owner acceptance is NOT RECORDED. See [master OAuth visibility report](MASTER_OAUTH_VISIBILITY_REPORT.md) and [executed evidence](evidence/master-oauth-visibility.txt).

The exact deployment origin used for the current preview is `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app`. The owner must confirm the exact URL they opened; connector metadata cannot identify a human-chosen alias. Keep this origin consistent in Vercel, Supabase and every provider console. It has no path, query or fragment. If a different production origin is approved later, replace it everywhere, redeploy and register the new exact callback URLs. Do not use a wildcard in provider OAuth redirect settings.

## 1. Supabase email delivery and URL allowlist

1. In Supabase project `hxgokimjdormlktxjsbg`, open **Authentication → Sign In / Providers → Email** and keep email confirmation required. The current hosted config has no custom SMTP, so confirmation/recovery delivery is not production-verified.
2. Choose an SMTP provider and enable custom SMTP under **Project Settings → Authentication** (or the equivalent Auth SMTP settings). Supply the SMTP host, port, user, password, sender address and sender name in the Supabase dashboard, not in Git. Supabase documents the required fields in [Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
3. In **Authentication → URL Configuration**, set **Site URL** to `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app`. The reviewed exact auth paths and path-specific query forms are already present on the hosted project:
   - `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app/auth/callback`
   - `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app/auth/confirm`
   - `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app/auth/update-password`
   - the same three paths with `?*` query forms, plus reviewed `localhost:3000` and `127.0.0.1:3000` equivalents.
   Supabase explains query-string wildcards in [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls). These are Supabase auth allowlist patterns, **not** provider OAuth redirect wildcards. If the owner approves a production origin, add its exact paths and query forms too.
4. Send a real signup confirmation and a password-recovery email to an inbox you control. Confirm the link reaches `/auth/callback`, the session is established, and recovery reaches `/auth/update-password`. Confirm the reviewed trigger creates a workspace, owner membership and preferences. Do not mark hosted email acceptance until both emails and the workspace path pass.

## 2. Vercel environment variables

Use **Project Settings → Environment Variables** in Vercel project `prj_uh7RosdHFABdfwRkSRg7JNmu67bK` (team `team_jEJR74nCGB4nVczqRwF0ljmM`). Vercel applies variable changes only to new deployments, so redeploy after saving. See [Managing environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables) and [Rotating secrets safely](https://vercel.com/docs/environment-variables/rotating-secrets).

| Name | Where the value comes from | Suggested Vercel treatment | Current preview state |
|---|---|---|---|
| `UP17_APP_MODE` | Keep the reviewed `DEMO` value; unsupported values fail closed | plain; Production/Preview/Development as needed | Configured |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | plain; public by design | Configured |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key, not a secret/service key | plain; public by design | Configured |
| `UP17_SITE_URL` | Exact canonical HTTPS origin used for auth and OAuth callbacks | plain; per environment | Configured to the exact branch alias |
| `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | One Supabase service-role/secret key from the owner's secret store | Sensitive; server-only; never `NEXT_PUBLIC_` | Missing |
| `UP17_TOKEN_ACTIVE_KEY_ID` | Current key id in the owner's keyring | plain; per environment | Missing |
| `UP17_TOKEN_KEYS` | JSON object mapping reviewed key ids to base64 32-byte keys | Sensitive; server-only | Missing |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client | first plain, second Sensitive; server-only | Missing |
| `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` | Meta/Instagram app dashboard | first plain, second Sensitive; server-only | Missing |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | TikTok developer app | first plain, second Sensitive; server-only | Missing |
| `CRON_SECRET` | Long random value generated by the owner | Sensitive; Production for cron, Preview for direct tests | Missing |

The Accounts readiness checklist shows only these names and booleans, never values. The server-only broker accepts either `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` and rejects a publishable key.

Generate each 32-byte token-custody key outside the repository and store it only in the owner's secret manager. Keep old keys in the keyring until every encrypted credential using them has been refreshed or disconnected; rotate by adding a new key, changing the active key id, redeploying, refreshing/reconnecting accounts, then retiring the old key. Never place the service key or keyring in a browser-prefixed variable, Git, logs, Supabase Vault as a substitute for encryption, or a support ticket.

## 3. Provider application consoles

Register the exact callback URLs below. The application constructs them from `UP17_SITE_URL`; a mismatch will fail state/redirect validation. Do not use demo accounts to claim live success.

### YouTube / Google

1. In Google Cloud, create/select the owner's project, enable **YouTube Data API v3**, configure the OAuth consent screen and add the app's test users. Request only `https://www.googleapis.com/auth/youtube.readonly` and `https://www.googleapis.com/auth/youtube.upload`. External-user publishing requires the applicable OAuth verification and API compliance review; see [Using OAuth 2.0 for Web Server Applications](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps) and [YouTube Data API scopes](https://developers.google.com/youtube/v3/guides/auth/installed-apps).
2. Create an **OAuth client ID → Web application**. Add `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app/api/connections/callback/youtube` as an Authorized redirect URI. Copy the client ID and client secret into the Vercel Sensitive/plain variables above; never commit them.
3. Check the approved project's actual quota and verification state. Do not assume public upload eligibility or hard-code a historical quota number.

### Instagram / Meta

1. Create/select a Meta Business app with **Instagram API with Instagram Login / Business Login for Instagram**. Use an Instagram professional (Business or Creator) account owned or managed by the app user. The implemented path does not universally require a linked Facebook Page. Official references: [Instagram Platform overview](https://developers.facebook.com/docs/instagram-platform/overview/), [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/), [Access Token](https://developers.facebook.com/docs/instagram-platform/reference/access_token/) and [Refresh Access Token](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/).
2. Configure Business Login redirect URI `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app/api/connections/callback/instagram`. Request `instagram_business_basic` and `instagram_business_content_publish`; complete Advanced Access/app review before public use. Copy the Instagram app ID and app secret into Vercel.
3. The adapter exchanges the short-lived code token for a long-lived token server-side and refreshes long-lived tokens at least 24 hours old. Remote revocation is not claimed: the UI reports the provider setting where the owner can remove app access.

### TikTok

1. In the TikTok developer console, add **Login Kit** and **Content Posting API**, configure Direct Post/audit requirements and request `user.info.basic` plus `video.publish`. Unaudited clients are restricted to private/self-test posts until the audit is complete; see [Login Kit for Desktop](https://developers.tiktok.com/doc/login-kit-desktop/) and [Direct Post prerequisites](https://developers.tiktok.com/docs/en/content-posting-api-get-started).
2. Register `https://autopublisher-git-arena-698e4880-up17-auto-f7679a-auto-uploader.vercel.app/api/connections/callback/tiktok` as the redirect URI. Copy the client key and client secret into Vercel.
3. Preserve required creator consent, privacy and content-status UX. Do not bypass an unaudited-client restriction or claim publishing capability from a connection token alone.

## 4. Deployment, SSO and cron

1. The master-task runtime commit `d4cfbde4508442c819e7779906f90c494c1fc0b9` was pushed to the fixed branch and Vercel created deployment `dpl_2igGhiy79jrgxBhPXABMcqnkS1MN` from that exact SHA. Connector verification returned READY, `public=false`, Node 22.x, pinned npm 11.21.2 install/build commands, successful TypeScript and production build, the reviewed cron declaration and `UP17_SITE_URL` in the build environment. An anonymous fetch to the branch alias returns Vercel's **Protected Deployment** login. A READY build alone is not browser or owner acceptance. The earlier Batch D deployment `dpl_F5tKbh3PJXB8yjbHVQZk33hK5gW9` and docs-only preview `dpl_3YhnNmsQca3mYSEeNdJYJrEUQ1PZ` remain historical evidence.
2. Vercel preview SSO currently blocks anonymous hosted UI/auth walkthroughs. Use an owner-authenticated browser session, or change preview protection explicitly in Vercel project settings for the acceptance window. Do not describe an anonymous 401/SSO redirect as a product failure or as a successful walkthrough. The agent kept SSO protection intact.
3. `UP17_SITE_URL` is already set to the exact preview branch alias for this branch. Register that origin's three exact provider callbacks and redeploy after any later environment-variable change. If a production origin is approved, set its own exact value and register its own callbacks; do not reuse the preview origin in production.
4. `vercel.json` declares one daily cron: `0 3 * * *` to `/api/cron/connections`. Vercel Hobby cron jobs run at most daily and only on production deployments, with hourly scheduling precision; previews do not run them. See [Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs) and [Cron quickstart](https://vercel.com/docs/cron-jobs/quickstart). Configure `CRON_SECRET` as a Sensitive variable and redeploy. For a direct test, send a GET with `Authorization: Bearer $CRON_SECRET` to the deployed `/api/cron/connections`; an unauthenticated call must return 401.
5. Production promotion, a production cron and any public publishing remain separate owner approvals. No production alias was promoted by the agent.

## 5. Live OAuth acceptance checklist

Execute each step with a real owner-approved test account and record the result:

- Confirm the exact URL opened. Sign up/sign in with confirmed email; confirm the workspace context and owner/admin role. Check that Accounts no longer shows demo identities and that each card reports one exact status from `Not configured`, `Authentication required`, `Workspace setup required`, `Provider credentials missing`, `Encryption keyring missing`, `Ready to connect`, `Connected`, `Limited permissions`, `Needs reauthorization` or `Error`.
- For each provider whose status is `Ready to connect`, press the exact button (**Connect Google / YouTube**, **Connect Instagram**, **Connect TikTok**), verify the official provider origin in the address bar, complete consent, and return to `/accounts?connection=authorized`.
- Verify the real account card shows the actual identity, granted scopes, last-verified time, `Connected` or `Limited permissions`, and publishing disabled/paused. A missing publish scope must not be shown as connected-with-full-capability.
- Exercise **Refresh** and **Health**; verify audit/connection state changes. Exercise **Disconnect**; verify local credentials are deleted and the UI honestly reports when remote revocation was not confirmed.
- Reject a stale/replayed authorization link and confirm no new connection appears. Confirm a viewer/editor cannot start or manage a connection.
- Re-run the hosted rollback broker fixture and confirm zero synthetic rows remaining; do not replace its rollback sentinel with a commit.
- Record owner acceptance separately. Do not claim live OAuth success from local unit tests, synthetic fixtures or a READY deployment.

## 6. Owner-run cleanup of Batch C probe leftovers

The temporary Storage acceptance Edge Function was deleted. The connector provider's security filter blocked the cleanup SQL before execution; it was never retried or rewritten to bypass that control. Hosted inspection found `public.tmp_consume_acceptance_challenge(p_digest text)`, `up17_private.acceptance_challenges`, and extensions `http` and `pg_net` still present. The `auth.mfa_challenges` and `auth.webauthn_challenges` tables are Supabase Auth internals and must not be dropped.

If no other hosted function/webhook depends on these objects, the owner may run the following in the Supabase SQL Editor. Check dependencies first; keep and document the extensions if they are needed by other project features.

```sql
drop function if exists public.tmp_consume_acceptance_challenge(p_digest text);
drop table if exists up17_private.acceptance_challenges;
drop extension if exists http;
drop extension if exists pg_net;
```

This is a manual owner action, not an instruction to bypass a connector security control. After cleanup, record the resulting inventory and decide whether immediate signed-URL revocation needs a separate storage design; the earlier Storage-API delete probe observed a cached authenticated download during its 30-second poll window and did not claim cryptographic revocation of already-issued signed URLs.

## 7. Security boundaries

- No social password is requested; official OAuth only.
- Server-only secrets never enter `NEXT_PUBLIC_` variables, client bundles, URLs, logs or Git.
- Tokens are ciphertext at rest in the private schema; service RPCs re-check actor membership explicitly.
- Every new connection starts publishing-disabled and paused.
- Provider app review, quota, account eligibility, consent and audit restrictions are live gates, not documentation claims.
- Paid AI/services, production release and actual creator-account publication require separate explicit owner approval.
