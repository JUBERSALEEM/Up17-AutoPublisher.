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

## G. Exact error reference 9041bda261f3

The owner supplied a concrete failure reference from the prior exact-SHA private Preview. The [focused audit](evidence/signup-error-9041bda261f3.txt) records the complete correlation attempt.

- `9041bda261f3` and `up17.auth.diagnostic` were **not found** in any log source available to this agent. Vercel `get_deployment_events` is build/status only; its post-build window returned zero events. Vercel Runtime Logs are behind owner SSO and no runtime-log connector exists. Supabase Auth/Postgres logs and Logflare are not exposed; the dashboard fetch was unauthenticated. Exact request timestamp, correlated request/trace id, safe error category and underlying code/status remain UNKNOWN.
- The exact upstream root cause remains UNKNOWN. The UI message proves only that `auth.signUp()` returned an error that reached the unclassified fallback branch. SMTP rejection, database trigger failure, Auth configuration, environment configuration, stale Preview and application exception are **not** proven. No provider/config/database change was made.
- A proven observability defect was fixed: the deployed reference was generated before `auth.signUp()` and logged/displayed, but it was not propagated to the Supabase request. The server client now sends the same validated 12-character reference in a non-secret `x-up17-auth-reference` header. Structured events include a safe deployment id; the UI shows a whitelisted layer/category/code/status summary. Existence-revealing codes are masked as `redacted`; raw provider messages, addresses, passwords, OTPs, tokens and SMTP details remain excluded.
- Local validation after the fix: `npm run check` PASS (105 unit, 16 integration, 48 Python validator, 8 TypeScript security, strict docs, 28-route build); E2E 129/129, visual 154/154, axe 86/86, clay 62/62, dev navigation 13/13. These are local gates, not hosted acceptance.
- Hosted signup, six-digit delivery, OTP, duplicate, recovery, workspace onboarding and owner-authenticated navigation remain NOT TESTED. Core Stability is NOT complete; signup is not genuinely proven; social OAuth and publishing remain paused.
- One controlled owner retry is required on the fresh exact-SHA immutable Preview from the final delivery record. If it fails, report the new Error reference and Safe diagnostic line, then correlate Vercel Runtime Logs and Supabase Auth/Postgres Logs at the same timestamp. Act on SMTP credentials only with a matching 500 `unexpected_failure`, “Error sending confirmation email” and SMTP 535/534 log. Final commit SHA, deployment ID and immutable URL are in the final delivery record, not in a document that would change its own SHA.


## H. Critical signup reference `aa942f791f0f`

The [focused audit](evidence/signup-error-aa942f791f0f.txt) records all evidence. The affected deployment `dpl_CKrQk1mFmKyJss8ovdqS97L4sMMQ` was verified current at 2026-11-12 07:46:46 UTC: local/remote Git HEAD, Vercel `gitSource.sha`, READY, STAGED and `public=false` all match `c7d5d40df55a68b271c15f9d7cbcc9994a62fc3f`.

**A. Root cause.** The owner's safe provider response is HTTP 500, layer `supabase-auth`, category `provider-error`, code `redacted`. The exact SMTP reply, GoTrue internal code, request/trace id and signup timestamp are UNAVAILABLE: Vercel Runtime Logs and Supabase Auth/GoTrue/Postgres/SMTP logs are not exposed by the enabled connectors, and dashboard fetches require owner authentication. Live Auth config shows custom Gmail SMTP on `smtp.gmail.com:587` with a 64-character hexadecimal SMTP credential; Google requires a 16-digit app password for this authentication mode. That is a concrete provider-side configuration defect. GoTrue v2.197.0 maps a refused confirmation-email handover to a 500 inside the signup transaction, which rolls the user back; database state at 07:48:25 UTC shows zero new users, flows, tokens, sessions and audit rows. App config, template, redirect, trigger, RLS and service health checks exclude those as the actionable cause. Earlier fixes only improved correlation/classification and did not replace the hosted credential, so the same provider failure persisted.

**B. Correction.** `lib/auth/errors.ts` now classifies a 500 confirmation-email handover even when GoTrue's error code is omitted; raw provider text remains classification-only and is never returned, logged or shown. `tests/unit/auth-errors.test.ts` adds regression tests for the missing-code and `unexpected_failure` email-send responses, including redaction and reference preservation. No database migration or hosted configuration change was made by the agent. The required configuration correction is owner-controlled: replace the invalid custom SMTP credential in the Supabase dashboard with a fresh 16-digit Google app password (or a separately verified transactional provider), without sharing the credential. The connector has no tool that can safely set that SMTP value.

**C. Validation.** Local gates PASS after the change: `npm run format`; `npm run check` `check_exit=0`; 16 unit files/107 tests, 2 integration files/16 tests, 2 TypeScript security files/8 tests, 48 Python validator tests, strict docs, 27/27 static pages and 28 routes; E2E 129/129, visual 154/154, axe 86/86, clay 62/62, dev navigation 13/13. Hosted signup is **FAIL** with `aa942f791f0f`; confirmation email, six-digit OTP, invalid/expired OTP, resend cooldown, duplicate, sign-in before/after verification, recovery, profile/workspace creation, isolation, existing owner access and owner-authenticated navigation are **NOT TESTED**. Local browser navigation and 320px mobile checks PASS but are not hosted acceptance.

**D. Deployment.** The affected deployment is `c7d5d40df55a68b271c15f9d7cbcc9994a62fc3f` / `dpl_CKrQk1mFmKyJss8ovdqS97L4sMMQ` / `https://autopublisher-n3i2ud9vl-auto-uploader.vercel.app`. The final correction commit SHA, fresh deployment ID, immutable URL and exact-SHA verification are in the [final delivery record](evidence/final-delivery-aa942f791f0f.txt) and the final user-facing report. A committed document cannot contain its own SHA.

**E. Security.** RLS, private storage, Vercel SSO, private Preview, six-digit email OTP, `verifyOtp({type:"signup"})`, email confirmation, `mailer_autoconfirm=false`, resend cooldown, recovery separation, duplicate non-enumeration, verified-user workspace lifecycle, Production isolation and the publishing lock remain intact. No SMTP/Auth/env/database/SSO/Production/OAuth/publishing setting was changed by the agent; no fake user, fake OTP, verification bypass, service-role bypass, bearer URL or secret exposure was used.

**F. Remaining blockers.** Exact Gmail SMTP reply, GoTrue error code, request/trace id and attempt timestamp are unavailable. The owner must replace the SMTP credential, then perform one real owner-controlled signup at `/sign-up` on the final immutable Preview after Vercel SSO and provide the new Error reference/Safe diagnostic plus same-timestamp Vercel Runtime Logs, Supabase Auth/Postgres logs, delivered six-digit email and the complete hosted acceptance sequence. Core Stability is NOT complete; signup is not genuinely proven; social OAuth and publishing remain paused.


## I. First-load workspace initialization correction (2026-11-12 UTC)

The [focused audit](evidence/workspace-first-load-698e4880.txt) records the exact root-cause reproduction, six-area review and local regression evidence.

- **Root cause:** `/onboarding` called `bootstrapFirstWorkspace()` during Server Component render. Its `revalidatePath("/", "layout")` call threw the Next.js 16 render-phase invariant *after* `up17_ensure_first_workspace()` had committed workspace, membership and preferences rows. The catch displayed `"Workspace setup is temporarily unavailable. Reload this page to retry."`; a refresh then found the committed rows. Live DB lifecycle timestamps and a temporary local Next render/Route Handler probe reproduce this behavior.
- **Correction:** successful sign-in/OTP/authenticated handoffs now redirect to a fresh `/workspace/setup` GET Route Handler after auth cookies are committed. That handler validates a confirmed session, runs the idempotent RPC in legal request context, revalidates, reads RLS-visible workspace context and redirects without a page refresh. `/onboarding` no longer writes during render; it displays explicit safe failures and a manual Server Action retry. No DB migration, RLS/Auth/SMTP config change, Production change, SSO change, publishing change, fake account or automatic browser refresh was added.
- **Local validation:** pinned `format`/`check` PASS; 17 unit files / 112 tests, 3 integration files / 23 tests, 48 Python, 8 TypeScript security, strict docs, 27/27 static pages and 29 routes including `/workspace/setup`. Local production-browser gates PASS: E2E 129/129, visual 154/154, axe 86/86, clay 62/62, dev navigation 13/13. Regression tests reproduce the old render-phase false failure and enforce the confirmed-session-before-RPC and bootstrap-before-context-read boundaries.
- **Hosted acceptance:** fresh signup and existing-account first-load checks on the final exact-SHA Preview remain **NOT TESTED** without an owner-authenticated browser; Vercel SSO and connector limits are unchanged. Exact owner steps are in the focused audit. Core Stability is **NOT complete**; social OAuth/publishing remain paused.
