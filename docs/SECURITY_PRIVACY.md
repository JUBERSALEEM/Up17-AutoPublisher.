# Security, privacy and reliability plan

**Status:** PROPOSED controls; none are represented as implemented. Phase 0 contains no credentials or personal media. External hosting/processing requires separate approval.

## 1. Assets and trust boundaries

Assets: original videos/voice, workspace membership, account identity, OAuth refresh/access tokens, publishing privileges, content versions, analytics, audit history and provider billing/quota. Trust boundaries: browser ↔ web server; web ↔ database/storage; queue ↔ worker; worker ↔ token broker; server ↔ social/AI/research providers; object delivery URL ↔ platform fetcher.

The browser is untrusted even after login. Client validation, hidden buttons, demo banners and workspace IDs in URLs are not authorization. Provider responses and uploaded files are untrusted input. AI output is a suggestion, never an authorization or verified gameplay fact.

## 2. Threat model and mitigations

| Threat | Planned control | Verification gate |
|---|---|---|
| Cross-workspace ID substitution | Composite tenant FKs, RLS, server membership checks, scoped storage paths | Two-workspace/role negative tests in Phase 4 |
| Privilege escalation | Owner/admin/editor/viewer matrix; no self-role update; privileged RPC allowlist | Direct API and DB mutation tests |
| OAuth login CSRF / code injection | Server exchange, cryptographically random single-use short-lived state bound to session/workspace/provider, exact redirect allowlist, PKCE where supported | Replayed/expired/mismatched state and wrong-session tests |
| Token theft through XSS/database/browser | No social tokens in browser/localStorage; strict input escaping/CSP; service-only credential table; envelope encryption | Bundle/log/DB-role leakage tests |
| Confused-deputy publishing | Pin account/content/variant digest; recheck membership, scopes, enablement and consent at execution | Cross-account job substitution and stale-version tests |
| Duplicate post after crash/timeout | Local unique key, durable provider IDs, lease fencing and reconciliation before retry | Crash at every external-write boundary |
| Malicious/oversized upload | Product size/MIME/extension checks, server object verification, ffprobe allowlist, isolated worker, resource limits, scan strategy | Polyglot, corrupt media, decompression/resource and quota tests |
| SSRF via research/media URL | HTTPS and provider/domain allowlists; no arbitrary URL fetch endpoint; block local/link-local/internal addresses and unsafe redirects | URL/parser/redirect negative tests |
| Signed URL leakage | Short TTL, minimum object scope, no logs/analytics query strings, revocation/cleanup | Log scan and expired/cross-object URL tests |
| Queue poisoning/replay | Authenticated enqueue, schema validation, service-only queue, idempotent handlers, attempt fences | Forged payload and duplicate-event tests |
| Prompt injection from footage/research | Treat text as data; structured schema output; claim whitelist/evidence checks; no tool authority from model text | Adversarial transcript/source fixtures |
| Sensitive log/error exposure | Allowlisted structured fields, centralized redaction, generic client errors, correlation IDs | Secret canary tests across logs/errors/audit |
| Account failure cascades | Independent account jobs/limits; permanent failure pauses only affected capability/account | Multi-account failure isolation test |
| Dependency/supply-chain compromise | Lockfile, reviewed updates, npm audit policy, pinned worker/FFmpeg image, least-privilege CI | M1.1 and release dependency review |
| Backup/restore data resurrection | Encrypted backups, deletion ledger reapplied after restore, documented backup expiry | Restore rehearsal before production |

## 3. OAuth and token lifecycle

Never request social passwords. Social connection is separate from app login. The owner explicitly connects each account; multiple accounts on one provider remain distinct app-scoped identities. Request only capabilities selected by the owner and supported by the provider; record **granted**, not merely requested, scopes.

Server callback validates state, session, provider, expiry, single use and redirect URI before code exchange. Store tokens through the token broker only. Refresh single-flight per credential to avoid rotation races; update expiry/scopes and connection state. On revocation/failure mark `NEEDS_AUTHORISATION`, pause affected publishing and notify. Disconnect attempts provider revocation when supported, then removes local ciphertext regardless; record remote revocation failure honestly and provide manual remedy. Reconnect does not silently enable publishing.

Initial encryption design: AES-256-GCM per credential with unique nonce and envelope data key; authenticated context includes credential/account/workspace/key version. A master/wrapping key lives in an approved KMS or server-only secret facility, **never in the database or source**. Limit decrypt permission to the worker broker; define rotation and re-wrapping before storing real tokens. Supabase Vault/managed Postgres encryption alone must not be assumed to make tokens safely readable by application roles. The concrete key host is an infrastructure decision, not provisioned now.

## 4. Sessions, headers and abuse controls

Supabase Auth is proposed only after approval. Use secure/HttpOnly cookies where applicable, SameSite appropriate to the OAuth callback, short sessions and server-side revocation checks. State-changing routes validate origin/session and use CSRF protection where cookie-authenticated. Do not place tokens in URLs. Apply rate limits to login, OAuth initiation/callback, upload intent, AI generation, export and publishing actions; quotas are workspace/account scoped.

Plan CSP compatible with actual framework requirements, frame protections, nosniff, referrer policy and HTTPS. Preview-host allowances are environment-specific and must not disable production origin protections. CORS is not authentication. Service-role and provider keys stay server-only; public browser configuration uses an explicit allowlist.

## 5. Media security and rights

Initial product proposal: MP4 first, 500 MiB and 10 minutes maximum per original; owner approval required. These are product limits, not claims about YouTube/Instagram/TikTok maximums. Validate declared and actual object size/MIME/container/codec; reject executable payloads and mismatched objects. Run FFmpeg in a restricted worker with non-root user, bounded CPU/RAM/time/temp disk, no shell interpolation and controlled egress. Malware scanning provider/strategy needs approval before untrusted multi-tenant uploads; scanning must not be silently marked complete if unavailable.

Require original-content/rights attestation and music usage confirmation where platforms demand it. Do not add watermarks or composite branding into uploaded media without explicit feature consent. Keep originals private; use short-lived signed preview URLs. Platform-required public delivery URLs are scoped, unguessable, temporary frozen objects with access logging and cleanup. TikTok URL-pull domain ownership must be verified; otherwise use supported file upload.

## 6. Privacy and retention

Collect only identity, content and metrics needed for selected features. Before hosted personal data, owner confirms jurisdiction, privacy contact, terms/privacy notice, subprocessors and AI training/data-use settings. Do not infer legal obligations from the user's approximate location. No real creator data is used as demo fixtures.

Proposed defaults (D-008, not approved): originals 90 days, derivatives 30, analytics 13 months, audit/jobs 12 months, backups 35. Explain that removing an original can prevent reprocessing. Provide workspace export with expiring access and owner-confirmed deletion; cancel jobs and revoke tokens first. External posts require separate remote deletion choices. Document processor retention, backup aging and legal holds. OAuth attempts expire in minutes; logs never contain raw media URLs or provider payloads.

## 7. Reliability and operations

Persist state before external side effects; checkpoint long jobs. Use bounded retries and dead-letter, honoring rate limits. Proposed publishing retry ceiling is three retries after the initial attempt; ambiguous writes reconcile first. Pause/resume is account scoped. Back up database and object inventory according to approved RPO/RTO; rehearse restore, outbox replay, token decryption after key rotation and deletion-ledger replay.

Structured logs carry correlation/job/attempt IDs and redacted provider error codes. Alert on queue age, repeated failures, auth expiry, storage growth, processing cost and stale analytics. A release requires security/access-control tests, accessibility checks, mobile performance/upload tests, monitoring, rollback and user instructions. Deployment and public publishing remain separate owner approval gates.

## 8. Security checklist by gate

- **M1.1:** implemented foundation-scope guards: ignore secrets/build/media/cloud artifacts; Git-index/worktree credential/config validator with redaction; `server-only` foundation boundary and client-bundle rejection test; exact npm enforcement; dependency review. These are repository/toolchain controls, not product auth/RLS/token encryption, and do not replace later security gates.
- **Phase 2:** demo network isolation, truthful labels, safe rendering and confirmation dialogs.
- **Phase 4:** RLS/role/storage negatives; OAuth state tests; encrypted credential design; audit and session controls.
- **Phase 5:** resumable-upload authorization, object verification, worker isolation and resource ceilings.
- **Phases 6–8:** provider data terms, prompt-injection/claim tests, immutable versions and per-account consent.
- **Phase 9:** crash/duplicate/retry/rate-limit/reconciliation and test-account-only publication.
- **Phase 12:** restore, secret rotation, revocation, export/deletion, dependency/accessibility/performance review and explicit release approval.
