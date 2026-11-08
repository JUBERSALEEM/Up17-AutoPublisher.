# Data model and ownership proposal

**Status:** PROPOSED; no migration, database or bucket has been created. IDs are opaque UUIDs except external platform identifiers, which remain strings. Timestamps are UTC instants; scheduling additionally stores an IANA time zone. Money/cost values use integer minor units or exact decimals, never binary floating point.

## 1. Ownership and common invariants

`workspaces` is the tenant root. Every tenant-owned record carries a non-null `workspace_id`. Parent tables expose a unique `(workspace_id, id)` key; child foreign keys include `workspace_id` so a child cannot reference another tenant's parent. Account-owned records additionally carry `social_account_id` with a composite account/workspace foreign key. Database constraints and RLS, not only service filters, enforce isolation.

Common fields: `id`, `workspace_id`, `created_at`, `updated_at`, where appropriate `created_by`, `version` and `deleted_at`. State changes use expected-version checks/transactions. External IDs are unique per provider/app/account namespace, not globally assumed unique. JSON is reserved for provider-specific validated payloads and evidence; searchable ownership/state/time fields are columns.

## 2. Entity dictionary

| Entity | Purpose and important fields | Relationships / indexes | Access and retention proposal |
|---|---|---|---|
| `workspaces` | Configurable name, handle, niche, audience, voice, language, timezone, upload quota, automation defaults | Root; member join | Members read; owner edits; explicit deletion workflow |
| `workspace_members` | User membership and role: owner/admin/editor/viewer | Unique `(workspace_id,user_id)`; user index | No self-elevation; at least one owner; membership audit |
| `social_accounts` | Provider, app namespace, external account/channel ID, identity, connection state, publishing enabled, last sync, timezone | Unique provider/app/external ID within workspace; many per provider/workspace | Members read redacted fields; authorized connection managers mutate |
| `account_credentials` | Ciphertext, nonce/auth tag, wrapped key reference/key version, granted scopes, expiry/refresh metadata | One/current or versioned row per account; unique active credential | **No browser table grants**; token-broker service only; delete on disconnect |
| `account_capabilities` | Action, supported/unsupported/review-required/unknown, evidence/source, checked_at, constraints | Account + action unique | Server writes; members read; recheck on auth/sync |
| `oauth_attempts` | Hashed single-use state, PKCE verifier protected server-side, workspace/user/provider, redirect allowlist, expiry, consumed_at | Short TTL; state hash unique | Initiating user/server only; expire within minutes; no raw tokens |
| `videos` | Original filename/title, upload/process state, owner, duration/size/dimensions/aspect, checksum, rights attestation, error | Workspace/state/created index; many packages | Owner/editor manage; viewer read; original retention D-008 |
| `video_assets` | Storage object key, kind original/cover/derivative, MIME, bytes/checksum, upload session state | Unique workspace/object key; video index | Private storage policies; no public list; signed reads |
| `media_variants` | Frozen account-ready derivative, lineage, codec/profile, dimensions, duration, audio specs, validation result | Variant → original asset; digest index | Immutable once referenced by job; shorter cleanup unless held |
| `processing_jobs` | Probe/extract/analyze/research job state, lease/fence, attempts, checkpoint, next_run_at | Video index; unique job kind/input digest; status/next_run | Worker/service only; 12-month metadata proposal |
| `video_analysis` | Provider/model version, input digest, summary, confidence, limitations, verified/estimated counts | Unique video/input/model run; many runs retained | Member read; append new run on reprocess |
| `analysis_events` | Start/end, kind, observed value, confidence, evidence frame/audio reference, verification status | Analysis/time index; event constraints end > start | Member read; corrections do not rewrite evidence |
| `analysis_corrections` | Original event, corrected value/unknown, actor, reason, timestamp | Event index; append-only | Editor/owner; audit; invalidate dependent drafts |
| `research_items` | Topic/keyword/question, source URL/title/publisher, published/retrieved time, freshness, verified fact vs suggestion, relevance | Workspace/topic; source digest index | Member read; provider writes; retain source attribution |
| `content_briefs` | Saved research ideas, chosen sources, audience/angle, rights/claim constraints | Brief ↔ research join | Editor manage; viewer read |
| `platform_content` | Account-specific package, platform schema version, current version, validation state | Unique `(video_id,social_account_id)` draft family | Account/workspace scoped; no cross-account credentials |
| `content_versions` | Immutable metadata payload/digest, generator/model/prompt version, evidence references, parent version, approval/consent record | Content/version unique; digest index | Append-only; jobs pin exact version |
| `account_strategies` | Voice/audience/language, content defaults, automation/approval mode, posting windows/frequency/quiet/blackouts, model version | One active strategy/account; version history | Owner/admin edit; audit material changes |
| `schedule_recommendations` | Candidate instant, account timezone, reasons, confidence, input coverage/model version, expiry | Account/time index | Only same-account observations; read-only explanation |
| `publishing_jobs` | Account/content version/variant, digest, scheduled_at, status, idempotency key, provider session/container/publish IDs, lease/fence, next action | Unique idempotency key; partial unique active video/account/version intent; due-job/account/status indexes | Worker + authorized account actions; one failure isolated |
| `publishing_attempts` | Attempt number, provider step, start/end, redacted result/error class, external IDs, reconcile outcome | Job/attempt unique; append-only | No token/request URL leakage; 12-month proposal |
| `published_posts` | Provider post ID/URL, account, pinned content version/variant, published/confirmed time, visibility | Unique provider/app/account/post; video/account index | Read scoped; external deletion tracked separately |
| `analytics_sync_cursors` | Provider report/job type, covered interval, cursor/checkpoint, last success/error, retry state | Account/report unique | Worker only; no credentials in cursor |
| `analytics_snapshots` | Metric key/version, value or unavailable reason, interval/grain, dimensions, source, observed_at/retrieved_at, estimated flag | Account/post/metric/interval/grain index; unique natural observation key | Read scoped; no invented zeros; 13-month proposal |
| `experiments` | Hypothesis, population/account, variables, inclusion criteria, start/end, primary metric, analysis plan/version | Workspace/account index | Editor define; viewer read; no automatic causal claims |
| `experiment_observations` | Pinned post/content features, sample eligibility, metric window/value, exclusions | Experiment/post unique; sample count derived | Same-account analysis; provenance required |
| `recommendation_versions` | Account model/policy version, inputs/coverage, explanation, confidence, output, evaluation period | Account/created index | Append-only; superseded, never silently rewritten |
| `notifications` | Event type, subject IDs, severity, read/dismissed time, delivery state, dedupe key | Recipient/workspace/read/created index; unique dedupe key | Recipient only; in-app first |
| `audit_logs` | Actor/service, action, target, before/after redacted summary, reason, correlation ID, time | Workspace/time/action index | Append-only; owner/security access; no secrets |
| `outbox_events` | Aggregate/version, event kind, payload IDs, created/published time | Unpublished index; aggregate/event unique | Service only; short cleanup after confirmed enqueue |
| `export_requests` / `deletion_requests` | Requester, scope, status, approvals, artifact expiry, legal holds, completion evidence | Workspace/requester index | Owner only; explicit workflow; backup expiry documented |

The original brief's proposed entities are all retained or refined above. Additional capability, OAuth-attempt, correction, outbox, cursor, experiment and deletion entities close security/recovery gaps rather than hiding these concepts in unstructured JSON.

## 3. State machines

### Video

`UPLOADED → QUEUED → ANALYSING → READY`; any active stage may enter `NEEDS_ATTENTION` or `FAILED`. Retry creates a new auditable attempt and returns to `QUEUED`; input or policy changes invalidate dependent content. Upload intent/session states are separate from the video's processing state. Delete is a guarded lifecycle operation, not an Analysis state.

### Connection

`NOT_CONNECTED`, `DEMO_MODE`, `CONNECTED`, `SYNCING`, `NEEDS_AUTHORISATION`, `LIMITED_PERMISSIONS`, `ERROR`, `DISCONNECTED`. UI labels use title case; stored enums are stable. A connected token with missing publish scope is limited, not “ready to publish.” Demo is a mode/source, never a real OAuth success.

### Publishing job

`DRAFT → READY → SCHEDULED → PUBLISHING → PUBLISHED`.
Alternative states: `WAITING_FOR_AUTHORISATION`, `FAILED`, `RETRY_SCHEDULED`, `NEEDS_ATTENTION`, `CANCELLED`.

Only declared transitions are legal. Cancel after an external write begins is a reconciliation/remediation request, not a promise to undo a post. Retry cannot change content digest, account or visibility silently. Material edits create a new version and require renewed policy/consent checks. Provider acceptance/processing is persisted as attempt step detail until terminal confirmation; it is not mapped prematurely to `PUBLISHED`.

## 4. RLS and service design

- Enable RLS on every externally exposed tenant table; no policy means deny. Tests run as authenticated roles, not only a superuser.
- Membership helper is security-definer with fixed search path, locked-down execution grants and tests against recursion/escalation. Policies compare membership and role to the row's workspace.
- Viewers read permitted content; editors manage videos/content/schedules; admins manage accounts/strategies; owners manage membership, export and deletion. Publishing enablement and OAuth require explicit account-management permission.
- Storage objects use workspace/account path prefixes and matching object-table policies. Upload capability is scoped to a specific prefix/object and size; signed download does not grant listing or neighboring objects.
- Credentials, OAuth attempts, queue internals, outbox and worker checkpoints have no authenticated browser policies. A narrowly scoped server service accesses them after its own membership/authorization checks. Supabase service keys bypass RLS and are never shipped to the browser.
- Audit inserts are service-only; no update/delete API. Notifications address a member, not an entire workspace by implication.
- Test direct reads, inserts, updates, deletes, RPCs, storage objects and realtime subscriptions where enabled across two workspaces and all roles.

## 5. Indexes, deletion and retention

Start with the foreign-key and access-path indexes listed above; add partial due-job and unread-notification indexes. Paginate large libraries/snapshots with stable cursors. Do not index ciphertext or raw provider payloads. Partition analytics only when measured volume justifies it.

Proposed retention requires owner approval: originals 90 days; unreferenced derivatives 30; analytics 13 months; job/audit metadata 12 months; backup expiry 35 days. A referenced variant is retained while needed for an active publish/audit hold; its original can be deleted only after explicit preservation trade-offs are shown. Disconnect revokes/deletes tokens immediately, independently of media retention.

Deletion orders: cancel eligible jobs → revoke credentials → remove private objects/derivatives → delete tenant rows through audited workflows → expire exports/signed access → record backup aging. External published posts are not silently deleted when local media is deleted; remote deletion requires supported capability and explicit owner action. Legal holds, processor deletion and restore procedures must be documented before real data.
