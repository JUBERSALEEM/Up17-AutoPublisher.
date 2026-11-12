# Core Stability Phase — signup-failure root-cause audit

**Date:** 2026-11-12 (UTC)
**Branch:** `arena/698e4880-up17-autopublisher`
**Baseline:** `3971b8dc8221fbd382a7cf4958d6d6fed15d9f1a` → `dpl_CVFWLS3aUZWMErYbzcYmU97W12ZX` → `https://autopublisher-93b3ljg1b-auto-uploader.vercel.app`
**Status:** NOT COMPLETE. The exact upstream Supabase Auth error remains unknown; hosted signup, email delivery, OTP and owner-authenticated navigation are NOT TESTED.

The [Core Stability validation log](evidence/core-stability-validation.txt) holds sanitized commands, counts and before/after evidence. The final commit SHA, fresh deployment ID and immutable URL are in the final delivery record: a document cannot contain its own commit hash. Production, Vercel SSO, RLS, private storage, the publishing lock and social OAuth remain unchanged; provider work stays paused.

## A. Root cause and evidence

**Proven defect fixed:** the baseline app hid the failure. `signUp()` returned one generic fallback for every unmapped GoTrue error, and all server action, cookie and proxy catch blocks swallowed exceptions without a structured diagnostic. With `audit_log_disable_postgres=true` and no accessible Auth/runtime log source, neither the owner nor this investigation could obtain the exact Auth code. The quote “The account could not be created. Check the details and try again.” is **not** current source: full Git history shows it in `848308fd05e1bf93f54fc556e2856057a62d6f92` and its superseded `dpl_Rd85aCKrQ5hAyi3qFm6gR7r3jwUQ`. The exact-SHA baseline `3971b8d` uses “We could not create the account. Check the details and try again.”. A stale older Preview or cached page is therefore a candidate, but no browser evidence proves which URL the owner used.

**Exact upstream cause:** UNKNOWN — no Auth log, Vercel runtime log, browser network response, owner inbox or real OTP was available. Do not claim SMTP rejection, duplicate email, trigger error or invalid env as diagnosed. No fake account or synthetic delivery was created to force a signup.

Evidence gathered without changing hosted configuration:

- Exact-SHA baseline deployment READY/`STAGED`/private; build events show clone of `3971b8d`, 27/27 static pages, `/api/media/access`, `/auth/verify-email`, `/auth/callback`, `/auth/confirm` and 40 s build completion. `list_deployment_files` returned `404 File tree not found`, so a deployed file-by-file diff was unavailable.
- Fresh `get_auth_config`: six-digit `{{ .Token }}` Confirm signup template, `mailer_otp_length=6`, `mailer_otp_exp=3600`, `mailer_autoconfirm=false`, custom SMTP configured, external providers disabled, `rate_limit_email_sent=30`, `audit_log_disable_postgres=true`. Config presence is not delivery or OTP acceptance.
- Nine Preview env names include both `NEXT_PUBLIC_SUPABASE_*` names and `UP17_SITE_URL`; no missing public name was established. Values were deliberately not decrypted or transcribed, so invalid key/URL is not ruled out.
- `auth.audit_log_entries=0`; `auth.one_time_tokens=0`; `auth.flow_state=1` (`email/signup`, 2026-11-11 08:11:11 UTC, historical owner setup); `auth.users=1`, one confirmed user, one `confirmation_sent_at`; profiles/workspaces/memberships/preferences each 1. No current signup row or OTP exists.
- `net._http_response` has 2 historical rows from 2026-11-09 (status 200 and 500), not a current signup. `pg_stat_statements` contains connector/DDL queries and one old synthetic fixture insert, but no current GoTrue signup insert pattern. Postgres/Auth dashboard logs and Logflare are not exposed by the connector; Vercel `get_deployment_events` is build/status output only.
- Supabase auth/db/storage/rest health ACTIVE_HEALTHY; GoTrue v2.197.0. Anonymous `fetch_page` to the immutable `/login` reaches Vercel “Protected Deployment” SSO, not Up17. No owner cookies, secure hosted browser or Shareable Link/SSO-bypass tool exists.
- 11 applied migration versions exactly match 11 local files. Deployed `on_auth_user_created` → `up17_private.new_user()` is profile-only, SECURITY DEFINER, `search_path=''`. Deployed `public.up17_ensure_first_workspace()` requires `auth.uid()` and `email_confirmed_at`, uses an advisory lock and creates workspace/member/preferences only after verification. RLS is enabled on all seven inspected public tables; profile, workspace, membership and preference policies enforce ownership/membership. Private `creator-media` bucket remains `public=false`. No migration drift or trigger exception evidence was found; no DB correction was required.
- Source flow: form validation → `NEXT_PUBLIC_SUPABASE_*` config → `auth.signUp()` without `emailRedirectTo` → GoTrue response gate → official six-digit email template → `verifyOtp({type:"signup"})` → confirmed-session redirect → `bootstrapFirstWorkspace()` RPC. Recovery uses a separate link. No service-role bypass, autoconfirm or verification bypass exists.

## B. Fix applied

1. `lib/auth/diagnostics.ts` emits one structured, redacted, correlation-tagged event per Auth error or unexpected exception. Only a whitelisted Auth code, numeric status, stage, action, safe reference and verification state are logged. Raw provider messages, addresses, passwords, OTPs, SMTP details, tokens, stack traces and cookie values are never logged. Error outcomes use `console.error`; expected states use `console.info` so Next.js development does not surface them as browser errors.
2. `lib/auth/errors.ts` now classifies GoTrue's generic `unexpected_failure` + “Error sending confirmation/recovery email” and `email_send_failed` / `email_address_not_authorized` as a safe, actionable **verification-email delivery** failure instead of blaming the entered details. Raw codes/messages remain hidden.
3. `lib/auth/actions.ts` logs every Auth error, verification state and unexpected exception; exposes a short redacted `reference` in the form state; uses one ambiguous message for obfuscated duplicates and no-code responses; and never redirects to `/auth/verify-email` unless GoTrue reports a real confirmation-pending user with identities, `confirmation_sent_at` and no session. Six-digit numeric OTP, `verifyOtp({type:"signup"})`, resend cooldown, recovery separation and non-enumerating duplicate behavior are preserved.
4. `lib/auth/workspace-actions.ts`, `lib/supabase/server.ts` and `proxy.ts` no longer silently swallow unexpected RPC, cookie-write or claims-refresh exceptions. `components/auth/auth-form.tsx`, `components/auth/otp-form.tsx` and `components/auth/auth-error-reference.tsx` display only the safe reference. Internal DB details never reach users.
5. No database migration, Auth/SMTP setting, Vercel env value, Production setting, SSO setting, RLS policy, storage policy or publishing lock was changed. A reviewed migration was unnecessary because deployed functions/policies matched the local migration.

## C. Testing — PASS / FAIL / NOT TESTED

| Case | Result | Evidence |
|---|---|---|
| Exact hosted Auth error code / SMTP or trigger log | NOT TESTED | Postgres audit disabled; no authorized Auth/Logflare/runtime-log tool; no browser network capture; no owner inbox/OTP |
| Exact quoted error string source | PASS (identified) | Full-history search: old `848308f` string; current `3971b8d` string differs |
| Baseline generic fallback / swallowed exceptions | FAIL (before) → PASS (fixed) | Source inspection; new redacted diagnostics and unit/integration assertions |
| Structured redaction, safe reference, delivery-failure mapping | PASS (unit) | 6 new unit tests; no raw provider message, credential, stack or status leak |
| Full server-action lifecycle against synthetic GoTrue responses | PASS (integration, not hosted) | 12 new action tests plus 4 existing SSR cookie tests: confirmation gate, duplicate/no-code, sign-in before/after, invalid/valid OTP, resend cooldown, recovery separation, workspace bootstrap, redaction |
| Valid new signup / six-digit email delivered / valid OTP | NOT TESTED (hosted) | No owner-controlled new inbox, real OTP or owner-authenticated Preview |
| Invalid OTP / expired OTP / resend cooldown | PASS (synthetic integration) / NOT TESTED (hosted) | `otp_expired` mapping, server cooldown, `auth.resend` success; no real email |
| Non-enumerating duplicate / sign-in before verification | PASS (synthetic integration) / NOT TESTED (hosted) | Same ambiguous message for duplicate and no-code; `email_not_confirmed` maps to six-digit code |
| Recovery, profile lifecycle, workspace after verification, isolation, existing owner login | NOT TESTED (hosted) | DB function/policy/RLS inspection PASS; no real authenticated browser or second isolated user |
| `npm run check` (format, lint, typecheck, 102 unit, 16 integration, 48 Python, 8 TS security, strict docs, 28-route build) | PASS | `/tmp/up17-signup-check2.log`; `/api/media/access` present |
| Local browser E2E / visual / axe / clay / dev navigation | PASS | 129/129, 154/154, 86/86, 62/62, 13/13; final dev navigation rerun after diagnostic-level fix |
| Every menu destination, desktop, mobile, 320px, direct URLs, refresh, back/forward, no horizontal overflow | PASS (local) | Navigation E2E and visual suites, four themes; NOT TESTED behind hosted SSO |
| Authenticated/unauthenticated hosted behavior and exact Preview UI | NOT TESTED | Anonymous fetch reaches Vercel SSO; no owner browser session |
| Fresh private Preview at exact final SHA | See D / final delivery record | Verified after the final commit is pushed; READY alone is not acceptance |
| Production / SSO / RLS / private storage / publishing lock unchanged | PASS | No change made; deployed DB and bucket inspected read-only |

Local production Chromium, synthetic HTTP doubles, unit/integration tests, config/env name reads, DB rows, migration lists, build logs and READY deployments are **not** hosted acceptance. A successful build is not proof that signup works.

## D. Deployment

The baseline exact-SHA private Preview is `3971b8d` / `dpl_CVFWLS3aUZWMErYbzcYmU97W12ZX` / `https://autopublisher-93b3ljg1b-auto-uploader.vercel.app`. Superseded `76aef79` and `848308f` Previews are not acceptance targets; the moving branch alias is not immutable.

After this final commit is pushed to the fixed branch, a fresh private Preview must be checked with `get_deployment`: exact SHA equals the final commit, state READY, `public=false`, immutable URL and deployment ID recorded in the final delivery record. Build events must show the required routes including `/api/media/access`, `/auth/verify-email`, `/auth/callback`, `/auth/confirm` and `/api/cron/connections`. Production remains untouched. This document deliberately omits its own commit hash and the resulting deployment ID/URL; use the final delivery record, not an older Preview.

## E. Remaining issues and exact owner action

**Signup is not genuinely proven.** All nine Core Stability completion criteria are not yet satisfied. Do not declare the phase complete and do not resume social OAuth, provider evidence, publishing permissions or new features.

Owner action, only on the fresh exact-SHA immutable URL from the final delivery record:

1. Sign in through Vercel SSO, then use `/signup` with a real owner-controlled new address and a 12–128 character password. Use the new URL, not an older immutable URL or the moving branch alias.
2. If it fails, copy the short **Error reference** shown under the message (no email, OTP, password or token). In Vercel Project → Functions/Runtime Logs, filter `up17.auth.diagnostic` and that reference; in Supabase Auth Logs check the same timestamp. These are the missing evidence sources, not a repeat configuration checklist.
3. Only if the log shows a 500 `unexpected_failure` with “Error sending confirmation email” and an SMTP authentication reply (for example 535): replace the Supabase SMTP password with a fresh 16-character Gmail app password generated with 2-Step Verification, keep host/port/sender unchanged, and verify the sender is authorized. If the log instead shows `email_address_not_authorized`, check sender/recipient authorization; if it shows a rate-limit code, wait. Do not change `mailer_autoconfirm`, email confirmation, Vercel SSO, RLS or URI settings without a matching log.
4. Report whether the six-digit email arrived, valid/invalid/expired OTP behavior, resend cooldown, sign-in before/after verification, recovery, onboarding/workspace, isolation, existing owner login and every menu route on desktop/mobile. Mark unavailable cases NOT TESTED.

## F. Security audit

- Six-digit numeric OTP, `verifyOtp({type:"signup"})`, `mailer_autoconfirm=false`, email confirmation, resend cooldown, invalid/expired-code handling, recovery separation, duplicate protections and the no-redirect-without-confirmation gate are unchanged.
- No fake owner/social account, autoconfirm, verification bypass, service-role bypass, manual DB mutation, SMTP purchase, paid service, publishing, social OAuth enablement, Production change/promotion, Vercel SSO disablement, RLS disablement or private-storage change was made.
- No secret, SMTP credential, complete address, password, OTP, access/refresh token, bearer URL or privileged JWT is recorded in this report, the validation log, Git, structured diagnostics or user-facing messages. Connector reads can expose values; no values were transcribed, committed, logged or used.
- Structured diagnostics log only whitelisted fields; error references are 12 lowercase alphanumeric characters and cannot carry a token. `providerConfigurationReady()` remains strict.
- RLS, policies, 11 applied migrations, private bucket, publishing lock, private schema grants and existing one-owner data remain intact. No reviewed migration was needed.
- Until hosted acceptance passes, Core Stability remains incomplete and OAuth/publishing work remains paused.
