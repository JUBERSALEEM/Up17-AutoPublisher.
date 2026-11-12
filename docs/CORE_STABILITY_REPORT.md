# Core Stability Phase report

**Date:** 2026-11-08 (UTC)
**Branch:** `arena/698e4880-up17-autopublisher`
**Scope:** signup/authentication, every menu route, onboarding/workspace readiness and full local suite. Social OAuth, provider evidence, publishing permissions and new features remain paused. Production, Vercel SSO, RLS, private storage and the publishing lock remain unchanged.

Executed commands and sanitized logs are in the [Core Stability validation log](evidence/core-stability-validation.txt). Exact deployed commit SHA and immutable Preview URL are reported separately in the final delivery record; a document cannot contain its own immutable commit hash.

## What changed

1. **Missing same-origin media route restored.** `app/api/media/access/route.ts` now enforces `sameOrigin()`, JSON content type, `Cache-Control: no-store`, a 403 cross-origin response and a 404 without a demo signed URL when no confirmed workspace/video exists. This fixed the one failing existing E2E case. `lib/media-access.ts` was already present but unreachable.
2. **Signup no longer treats a duplicate-email fake user as success.** Supabase's [signUp reference](https://supabase.com/docs/reference/javascript/auth-signup) documents that an already-registered address can return an obfuscated user when email confirmation is enabled. `lib/auth/errors.ts` now detects empty identities, a missing confirmation timestamp and an unexpected session; `signUp()` returns a safe message instead of redirecting to a code page where no code arrives. Email verification and `mailer_autoconfirm=false` are preserved.
3. **Useful, safe auth errors.** `authFailure()` maps documented Auth codes to non-enumerating messages for rate limits, expired/invalid codes, duplicate addresses, weak passwords, invalid credentials, disabled signup, invalid email, captcha, validation and expired sessions. No raw provider/SMTP/token detail, stack trace or account-existence leak is returned.
4. **320px navigation regression.** `tests/e2e/navigation.spec.ts` adds a 320px viewport test covering all 12 destinations, menu clicks, direct URLs, browser back/forward, refresh and no horizontal overflow. Desktop 1440px and mobile 390px matrices already covered the same behavior across four themes.
6. **Git artifact correction.** The first Core Stability commit was READY on Vercel but its Git tree did **not** contain `app/api/media/access/route.ts`: the broad `media/` rule in `.gitignore` excluded the API source directory, while the local untracked file made the local build look complete. A narrow exception now unignores `app/api/media/`, `app/api/media/access/` and `app/api/media/access/route.ts` only. The full check was rerun and the corrected tree was committed and pushed; that first deployment is superseded and is **not** the final delivery.

5. **Stale hosted-Auth documentation corrected.** The older link-based / eight-digit OTP / no-SMTP snapshot is explicitly superseded by the fresh read: custom six-digit `{{ .Token }}` template, `mailer_otp_length=6`, custom SMTP, `mailer_autoconfirm=false` and Postgres audit logging disabled. The [owner setup](OWNER_SETUP.md) checklist is marked historical/paused.

## Regression comparison

Full history was fetched with `git fetch --unshallow`. Comparing `2e9191d..848308f` shows **no changes** to `lib/navigation.ts`, `proxy.ts`, `public/sw.js`, `components/shell/pwa-provider.tsx`, `next.config.ts` or the navigation E2E suite. `components/shell/app-shell.tsx` changed only account/OTP copy; `app/globals.css` added OTP/provider styling. The earlier `226ae1b` navigation fix (segment-aware active states, mobile More destinations and development service-worker cleanup) remains intact. **No navigation-utility regression was introduced by `848308f`.** A hosted page-switching failure could not be reproduced without owner-authenticated Preview access, so that root cause remains NOT TESTED.

## PASS / FAIL / NOT TESTED

| Case | Result | Evidence |
|---|---|---|
| Fresh hosted Auth config read (owner changed SMTP/template) | PASS | `get_auth_config`: six-digit `{{ .Token }}`, OTP length 6, expiry 3600, custom SMTP, autoconfirm false, Postgres audit disabled |
| Exact hosted signup error from Auth logs | NOT TESTED | `audit_log_disable_postgres=true`; `auth.audit_log_entries=0`; connector exposes no authorized dashboard/Logflare log tool |
| Signup sends six-digit code / `verifyOtp({type:"signup"})` | NOT TESTED | No owner-controlled inbox or owner-authenticated browser session |
| Resend cooldown, duplicate email, invalid code, expired code, sign-in, recovery | NOT TESTED | Hosted flows require a real inbox and authenticated Preview access |
| Useful, safe error mapping (code-level) | PASS | 6 new unit tests; no raw codes, secrets, stack traces or account enumeration |
| Duplicate-email fake-user detection (code-level) | PASS | `signupVerificationState()` unit tests; source fix in `lib/auth/actions.ts` |
| Missing `/api/media/access` route | PASS (fixed) | Before: 1/128 E2E failed with 404. After: 129/129 E2E, targeted media test 1/1 |
| Every menu route, desktop 1440px / mobile 390px / 320px | PASS (local) | 129 E2E incl. 320px regression; 154 visual; 13 dev navigation. Four themes, direct URLs, back/forward, refresh, persistence |
| 320px no horizontal overflow | PASS (local) | New 320px navigation test + 154 visual checks |
| `848308f` navigation regression vs earlier fix | PASS (no regression found) | Full-history diff described above |
| Hosted exact deployed Preview page switching behind Vercel SSO | NOT TESTED | Anonymous fetch reaches Vercel Protected Deployment login; no owner cookies or secure hosted browser |
| Genuinely new verified account / onboarding / workspace creation | NOT TESTED | Would require a real owner-controlled new inbox and authenticated browser |
| Workspace isolation / permissions / existing owner browser access | NOT TESTED | DB inventory shows one owner workspace and 0 connections, but no authenticated browser isolation test |
| Complete existing suite after fixes | PASS | Corrected-tree `npm run check` and `test:e2e` 129; same-source `test:visual` 154, `test:a11y` 86, `test:clay` 62, `test:navigation:dev` 13 |
| Fresh private Preview deployment | See final delivery record | New commit pushed to the fixed branch; Vercel auto-deployment checked separately |
| Production unchanged / SSO / RLS / private storage / publishing lock | PASS | No Production, SSO, RLS, storage or publishing change made |

## Boundaries and owner action

- Local production Chromium, unit/integration/E2E gates, config reads, DB rows, READY deployment status and anonymous SSO redirects are **not** hosted acceptance.
- Keep Production unchanged. Keep Vercel SSO, RLS, private storage and the publishing lock enabled. Do not enable autoconfirm, bypass verification, create fake users, request publishing permissions or enable social OAuth.
- The first READY deployment of `76aef79` is superseded because its Git tree omitted the media API source. Only the later corrected deployment whose exact SHA and immutable URL are in the final delivery record should be used for owner testing.
- **Core Stability Phase is not complete.** The hosted signup, email verification, login, onboarding and every-menu-route acceptance requirement is still NOT TESTED. Do not return to OAuth implementation until the owner completes an authenticated Preview test with a real owner-controlled inbox and reports the six-digit code, verification, onboarding, workspace isolation and existing owner access results.
- See [owner setup](OWNER_SETUP.md), [test evidence](TEST_EVIDENCE.md), [decisions](DECISIONS.md) and [change log](CHANGELOG.md) for the surrounding history. The earlier owner checklist is paused by this phase.
