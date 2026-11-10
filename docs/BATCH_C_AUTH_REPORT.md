# Batch C — authentication, relational persistence, RLS and private storage

**Date:** 2026-11-08 UTC (sandbox clock crossed into 2026-11-09 during execution).
**Status:** PARTIAL. Real Supabase-backed account/workspace/settings/inbox paths, hosted database isolation and Storage-API delete acceptance pass at the tested boundaries. Hosted email delivery, hosted browser acceptance and temporary SQL cleanup remain unverified/blocked. This is not a production launch and does not make demo creator workflows real.

## Implemented

- Supabase SSR auth with protected cookie options, server-side user verification, sign-up/sign-in/recovery/update-password/sign-out paths, exact redirect allowlists and same-origin media JSON checks.
- Relational workspace/member/profile/preference/notification/video/draft/audit schema in five applied hosted migrations. All 22 exposed public tables have RLS; private credential/OAuth tables are not exposed to browser roles.
- Owner/admin/editor/viewer membership policies, composite tenant foreign keys, draft versioning, category/platform consistency, per-user notification isolation and append-only settings audit through a revision-checked RPC.
- Private `creator-media` bucket with workspace-prefix upload/read/delete policies, size/MIME limits and a short-lived signed-URL server route. No public bucket URL is used.
- Cloud-backed workspace preferences and inbox when signed in; the public local demo remains explicitly labelled. Multi-workspace selection is cookie-backed and falls back to a still-valid membership if a selected workspace is removed.
- Deliberate artifact-guard allowlist for reviewed `supabase/migrations`, `supabase/tests` and `lib/supabase/database.types.ts`; other cloud/generated artifacts remain rejected.

## Applied hosted migrations

Project `hxgokimjdormlktxjsbg`. Local files match remote migration history after removing SQL line comments and whitespace (MD5):

| Version | Name | Canonical MD5 |
|---|---|---|
| `20261109112755` | `up17_foundation_part1` | `e3f58a01da6ca90204ad11cf408f9fbb` |
| `20261109112851` | `up17_foundation_part2` | `21aa7ef905f7ca32992e5f7b03b1b909` |
| `20261109113102` | `up17_foundation_part3` | `28c06f0b1355e82690610fa9bbf69046` |
| `20261109113904` | `up17_access_hardening` | `26382349d2f57888eba567bcb0f70b0c` |
| `20261109122850` | `up17_preference_integrity` | `51e5557d08abd77f3b8609f02f92c083` |

Raw byte-for-byte MD5 parity is not claimed: the migration endpoint stores normalized statement text. The canonical comparison above is the verified parity method.

## Executed verification

| Gate | Result |
|---|---|
| Hosted `supabase/tests/rls.sql` | PASS — expected sentinel `P0001: ROLLBACK_FIXTURE_COMPLETE` after all inner assertions; post-run counts were 0 users/workspaces/videos/notifications/storage objects/audit rows/categories |
| Hosted structural inspection | PASS — 22/22 public tables RLS-enabled; private bucket/limits; no anon/authenticated grants on private schema; preference/workspace direct writes closed |
| `npm run check` | PASS — toolchain, format, zero-warning lint, types, 51 unit, 4 integration, 42 Python + 6 TS security, 23-route production build |
| `npm run test:e2e` | PASS — 123 assertions |
| `npm run test:a11y` | PASS — 85 axe scans |
| `npm run test:visual` | PASS — 153 viewport checks |
| `npm run test:clay` | PASS — 62 material/baseline checks |
| `npm run test:navigation:dev` | PASS — 13 development-mode assertions |
| `npm audit` | PASS — 0 known vulnerabilities |
| Later Storage-API probe | PASS with limitation — upload/download/signed URL/remove and one-object delete/list verified; authenticated download stayed readable during a 30-second cache/consistency poll — [evidence](evidence/batch-c-storage-api.txt) |

The hosted RLS fixture covers signup bootstrap, owner/editor/viewer and cross-workspace isolation, notification per-user isolation, draft version/skip denial, storage upload/read and cross-tenant denial, preference RPC revision/stale/malformed-type denial, direct preference/workspace write denial, role-elevation/protected-column/audit-forgery/private-schema denial and anon grant denial. A later challenge-gated probe exercised the real Storage API through a temporary Edge Function; its final run is recorded separately.

## Explicit limitations

- **Email delivery/recovery:** Supabase SMTP is absent; default email rate is 2/hour. Confirmation is required, but real inbox delivery and recovery completion are NOT VERIFIED.
- **Hosted browser acceptance:** Vercel previews are SSO-protected. Anonymous hosted UI/auth walkthrough is BLOCKED; READY deployment state is not browser acceptance.
- **Storage delete:** direct SQL `DELETE` on `storage.objects` is blocked by Supabase's `storage.protect_delete()` guard. The later challenge-gated Storage-API probe verified delete/list behavior, but an already-issued authenticated download stayed readable during a 30-second poll; immediate signed-URL revocation is NOT CLAIMED.
- **Temporary cleanup:** the probe Edge Function was deleted, but the temporary SQL function/table and extensions `http`/`pg_net` remain. Cleanup SQL was blocked by the connector provider security filter before execution and was not retried or rewritten to bypass it. See [owner setup](OWNER_SETUP.md).
- **Auth hardening still pending:** Supabase password minimum is 6 while the app requires 12; HIBP/captcha are disabled; no app-level distributed rate limiter beyond Supabase defaults exists.
- **Privacy controls:** cloud export/account deletion/retention workflows remain unimplemented. Local demo reset/export must not be represented as cloud deletion/export.
- **Creator workflows:** video upload/processing, AI analysis, metadata intelligence, scheduling/publishing and analytics remain demo/missing until their own gates pass. Batch D implemented the OAuth broker foundation, but live provider authorization remains blocked by owner setup.

## Reproduce the hosted RLS fixture

For the later Storage-API acceptance, see [batch-c-storage-api.txt](evidence/batch-c-storage-api.txt); its final probe run is `0a8352c8-162b-4a37-83dd-7f56886ad0d3`. Temporary SQL cleanup is an owner action documented in [owner setup](OWNER_SETUP.md).

Run `supabase/tests/rls.sql` as the migration role through the authorized Supabase SQL endpoint. It is a single outer `DO` fixture that creates synthetic users/workspaces, exercises role/tenant assertions, then raises `ROLLBACK_FIXTURE_COMPLETE` so the entire fixture rolls back. The expected endpoint result is the sentinel error, not a silent success. Verify afterwards that synthetic row counts are zero. Do not replace the sentinel with a commit, and do not run it against production data.
