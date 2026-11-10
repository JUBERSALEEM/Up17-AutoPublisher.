# Batch D — official account connections and token broker

**Date:** 2026-11-10 UTC. **Status:** PARTIAL. The server-only OAuth broker, encrypted token custody, refresh/health/disconnect lifecycle, cron endpoint, real-account UI and hosted database isolation fixture are implemented and tested at their stated boundaries. **Live OAuth is BLOCKED** until the owner configures SMTP, deployment secrets, provider applications and an accessible callback deployment. No provider account was connected, no real token was stored, no publication was attempted and no production promotion occurred. Owner acceptance is NOT RECORDED.

This report is deliberately narrower than the original A–J product promise. Publishing, Smart AI, media processing, analytics and scheduling remain demo/missing. The [owner requirements balance](OWNER_REQUIREMENTS_BALANCE.md) now provides a separate four-gate, 155-row per-requirement status table rather than treating a batch-level “DEMO” label as acceptance evidence.

## What was implemented

- Server-only AES-256-GCM keyring in `lib/connections/crypto.ts`, with a versioned envelope, unique nonce, key rotation, authenticated context (`purpose`, workspace, platform, subject, key id) and tamper rejection. No plaintext token is stored or returned to the browser.
- Reviewed provider adapters in `lib/connections/providers.ts`: Google OAuth web-server flow with `youtube.readonly` + `youtube.upload`; Instagram Business Login with `instagram_business_basic` + `instagram_business_content_publish`; TikTok Login Kit with `user.info.basic` + `video.publish`. Google uses base64url S256 PKCE, Instagram explicitly has no PKCE verifier, TikTok uses the documented hex SHA256 S256 form. Provider origins are allowlisted before browser navigation.
- Server routes for `/api/connections/start`, `/api/connections/callback/[platform]`, `/api/connections/[id]/[action]` and `/api/cron/connections`. Start returns JSON with an authorization URL; the browser validates the provider origin before `window.location.assign`. State and browser-binding values are random, hashed server-side, single-use, short-lived and tied to the actor/workspace/provider/redirect URI. Management actions require same origin plus owner/admin membership. Cron requires a bearer secret.
- `components/accounts/real-accounts-board.tsx` and the signed-in Accounts page show only real `platform_connections`; demo identities remain on the explicit no-session fallback. New connections default `publishing_enabled=false` and `paused=true`. Granted scopes, last verification, connection state and honest remote-revocation failures are shown.
- Nine service-role-only Supabase RPCs/functions with `search_path=''`, private-schema credential storage, explicit actor authorization, single-flight refresh leases, due-token claiming, audit events and no anon/authenticated grants. Browser UPDATE privileges on connections remain closed.
- A daily, production-only Vercel cron declaration at `0 3 * * *` for `/api/cron/connections`. Hobby scheduling precision is hourly; previews do not run crons. See [owner setup](OWNER_SETUP.md).

## Applied hosted migrations — never reapply

Local and hosted canonical SQL (comments/whitespace removed) matched for all nine versions:

| Version | Name | Canonical MD5 |
|---|---|---|
| 20261109112755 | up17_foundation_part1 | `e3f58a01da6ca90204ad11cf408f9fbb` |
| 20261109112851 | up17_foundation_part2 | `21aa7ef905f7ca32992e5f7b03b1b909` |
| 20261109113102 | up17_foundation_part3 | `28c06f0b1355e82690610fa9bbf69046` |
| 20261109113904 | up17_access_hardening | `26382349d2f57888eba567bcb0f70b0c` |
| 20261109122850 | up17_preference_integrity | `51e5557d08abd77f3b8609f02f92c083` |
| 20261109143447 | up17_oauth_broker | `3e840869b00265e491cd66f133b7887f` |
| 20261110041820 | up17_oauth_broker_corrections | `dd7c92e686c17439f57b24fd78473c06` |
| 20261110042107 | up17_connection_upsert_fix | `1c327a2515d8bac16f2573f963641c80` |
| 20261110042815 | up17_connection_disconnect_order_fix | `420156e597a37b64e4b3fd734aadc318` |

The correction migration makes non-member service actors fail closed, enforces explicit Instagram null-verifier/`none` key and PKCE-platform verifier/key rules, and lets Instagram long-lived tokens enter the refresh claim. The upsert fix renames colliding PL/pgSQL locals (`v_connection_id`, `v_credential_id`) while preserving the signature, authorization checks and service-only grants. The disconnect fix clears state/token reference before deleting credentials, so the foreign key's `ON DELETE SET NULL` trigger cannot briefly leave a `connected` row without a token reference and violate `platform_connections_check`.

## Hosted rollback fixture

`supabase/tests/oauth_broker.sql` runs as one outer `DO` fixture with synthetic identities and opaque synthetic ciphertext. It exercises fail-closed service-actor role lookup, no anon/authenticated RPC grants, authenticated RPC/private-credential denial, cross-workspace/viewer denial, state/binding mismatch, replay, Instagram null verifier, PKCE null-verifier rejection, connection upsert, publishing-disabled defaults, token broker, refresh lease and stale-lease denial, all-null failure payload, health, Instagram claimability, disconnect, owner read and browser direct-write denial.

Expected hosted result: `P0001: ROLLBACK_BROKER_FIXTURE_COMPLETE` after all inner assertions. The endpoint reports that sentinel as an error because the whole transaction must roll back. A fresh post-run inventory returned `synthetic_users=0`, `synthetic_connections=0`, `credentials=0`, `connection_audit_rows=0`. Two earlier defects were found and fixed by the two corrective migrations above: a 42702 ambiguous `connection_id` and a 23514 check violation during disconnect. No sentinel is a pass; no fixture rows remain.

## Local verification

The strict guard now requires this report and [owner setup](OWNER_SETUP.md), allowlists only reviewed placeholder names/values in `.env.example`, and exact-allowlists the credential-free `vercel.json` cron/build configuration. Its positive/negative Python tests and the hosted-toolchain cron test cover those rules. `tests/unit/connections.test.ts` covers keyring rotation, AAD/tamper/missing-key rejection, random/PKCE encodings, provider URLs/scopes/state handling, empty-200 revoke bodies and Instagram's unsupported remote revoke.

Executed gates: `npm run check` PASS (toolchain, format, zero-warning lint, strict types, 59 unit tests, 4 integration tests, 46 Python validator tests, 6 TypeScript security tests, 16 required docs/155 requirements/143 links/206 artifacts and a 25-route production build); `npm run test:e2e` PASS 123; `npm run test:a11y` PASS 85; `npm run test:visual` PASS 153; `npm run test:clay` PASS 62; `npm run test:navigation:dev` PASS 13 after a fresh-page service-worker test correction; `npm audit` 0 vulnerabilities. Exact commands, the retained first failure and its fix are in [Batch D evidence](evidence/batch-d-connections.txt). A READY preview is not a substitute for these gates.

## Explicit blockers and honest limitations

- **Owner-only secrets:** no Supabase service key, token keyring, provider client IDs/secrets, SMTP credentials or cron bearer secret were created, copied or committed. `.env.example` contains reviewed inert placeholders only. The agent does not populate Vercel secrets.
- **Provider consoles:** official Google/Meta/TikTok apps, consent screens, scopes, app review/audit and exact redirect URIs are not configured by the agent. Instagram professional-account eligibility and TikTok Direct Post audit restrictions remain live gates.
- **Email/session:** Supabase SMTP is absent. Without confirmed email delivery and an owner-authenticated browser, the hosted sign-in/OAuth journey cannot be accepted. Vercel preview SSO also blocks anonymous hosted walkthroughs.
- **Cron:** Vercel Hobby invokes daily cron jobs only on production, within the scheduled hour. The preview deployment does not run the cron. A production cron requires a separate owner release decision and a configured bearer secret.
- **Storage probe leftovers:** the Batch C temporary Edge Function was deleted, but `public.tmp_consume_acceptance_challenge(text)`, `up17_private.acceptance_challenges`, `http` and `pg_net` remain hosted. Cleanup SQL was blocked by the connector provider's security filter before execution; it was never retried or rewritten to bypass that control. Owner-run cleanup instructions and dependency cautions are in [owner setup](OWNER_SETUP.md).
- **No mocks as substitutes:** synthetic ciphertext and rollback fixtures prove database/broker boundaries, not live provider authorization. Demo cards remain explicitly labelled and do not count as real accounts. Publishing/Smart AI workflows are untouched.
- **Owner acceptance:** NOT RECORDED. READY deployment state, local test passes and hosted database fixtures are not owner acceptance or production release approval.
