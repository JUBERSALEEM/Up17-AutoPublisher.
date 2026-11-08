# Architecture proposal

**Status:** PROPOSED — Phase 0; no application or infrastructure exists yet. See [DECISIONS.md](DECISIONS.md) for approval status.

## 1. Context and boundaries

Up17 AutoPublisher is one mobile-first web product with a shared media pipeline and independent account publishing pipelines. The initial workspace profile is Up17 Gaming / `@up17longshotyt`; niche, voice, language and rules are data, not constants in business logic.

```text
Phone / desktop browser
  │ authenticated app requests; small JSON payloads only
  ▼
Next.js web application ── public app-shell PWA assets
  │ server-side authorization + application services
  ├── Auth / Postgres / RLS ── transactional outbox + durable queue
  ├── Object storage ◄──── direct resumable browser upload
  │                         │ completion event / durable job
  │                         ▼
  │                  Separate worker service
  │                  ├── FFmpeg probe / frames / audio / variants
  │                  ├── AI analysis / metadata provider ports
  │                  ├── permitted research provider port
  │                  ├── scheduling / publishing / analytics sync
  │                  └── server-only credential broker
  │                         │ official APIs only
  │                         ├── YouTube Data / Analytics / Reporting
  │                         ├── Instagram Platform
  │                         └── TikTok Login / Content Posting / Display
  └── read models ◄── persisted state, analytics, notifications, audit events
```

The worker is a long-lived process, not a request handler. The web app never processes a full video or waits for a social publication inside a short-lived serverless request. Demo mode uses local deterministic adapters and makes **no external integration calls**.

## 2. Proposed stack and compatibility evidence

There is no existing framework to preserve. Registry metadata was read on 2026-11-08; nothing was installed. These are candidate pins, not a claim that the combination has passed tests.

| Concern | Candidate | Reason / verification needed |
|---|---|---|
| Runtime / package manager | Node 22.22.3, npm 10.9.8 | Observed in sandbox; commit `.nvmrc` and lockfile in M1.1 |
| Web | Next 16.4.5, React/React DOM 19.3.1 | App Router, server/client separation; Next metadata requires Node >=20.9 and compatible React 19 |
| Language | TypeScript 5.9.3 | Conservative compatible pin; registry latest TS 7.0.2 is not adopted without toolchain proof |
| Styling / icons | Tailwind 4.3.5 + CSS variables; Lucide React | Semantic tokens remain usable outside utility classes |
| Validation | Zod 4.6.7 | Shared schemas with server authority; never trust client validation |
| Lint / formatting | ESLint 9.39.5 + eslint-config-next 16.4.5 + Prettier 3.9.10 | Prove flat-config/plugin compatibility in M1.1; do not blindly use ESLint 10 |
| Unit / integration | Vitest 4.1.12 | Candidate rather than newest major; verify Node engine and TypeScript integration on install |
| Browser / accessibility | Playwright 1.65.0 + axe-core Playwright 4.14.0 | Viewport matrix, keyboard flows, semantic assertions and automated accessibility checks |
| Auth/database/storage client | Supabase JS 2.119.0 + SSR 0.12.7 | Only added at Phase 4; SSR peer requires Supabase JS >=2.114 |
| Resumable browser upload | tus-js-client 4.3.1 | Supabase Storage documents TUS support; verify emulator/version behavior in M5.1 [2](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/storage/uploads/resumable-uploads.mdx) |
| Queue | Postgres-backed durable queue; pg-boss candidate | Benchmark leases, uniqueness, delayed jobs, restart recovery and Supabase connection behavior before selection; no Redis service assumed |
| Media | FFmpeg/ffprobe in worker image | Pin version/image digest after local codec and resource tests; never execute arbitrary user shell arguments |

M1.1 acceptance requires clean `npm ci`, lint, type check, unit smoke test and production build. If a candidate combination fails, choose a compatible stable version, record the change in the decision log and rerun all gates. No paid service is needed for that proof.

## 3. Code organization after approval

```text
app/                    routes, layouts, error/loading boundaries; ten product areas
components/ui/          tokens-driven clay primitives; no provider knowledge
components/<feature>/   screen composition and accessible interactions
features/<domain>/      presentation contracts and feature actions
packages/domain/        entities, schemas, state transitions, pure policies
packages/ports/         storage, queue, analysis, research, social, token-broker interfaces
packages/adapters/      demo/local/provider implementations; server-only where required
packages/db/            migrations, generated types, policy tests (Phase 4)
worker/                 job handlers, supervisor, heartbeat, graceful shutdown
 tests/                 unit, integration, e2e, security, fixtures and evidence helpers
```

Exact monorepo tooling will be kept minimal; folders do not require separate published packages. Dependencies point inward: UI → application services → domain/ports; adapters implement ports. Domain code cannot import React, Supabase, SDKs or environment variables. Provider SDK types do not become database entities.

## 4. Modes and truthfulness

| Mode | Persistence/network | Allowed behavior |
|---|---|---|
| Demo | Deterministic fixtures; optional browser-local demo preferences; no external calls | All ten screens, labelled sample accounts/metrics/actions; never report real connection/publication |
| Local development | Local auth/db/storage/worker emulators and filesystem media | Real local state transitions and contract tests; no hosted resources or real social calls |
| Connected/test | Explicitly approved project and test social accounts | Read/publish only supported actions; private/test visibility first; live evidence required |
| Production | Separate explicit deployment and public-publishing approval | Eligible enabled accounts only; policy checks at execution time |

Mode is a server-controlled allowlist, not a user-editable “live” flag. Fixtures cannot enter live repositories. Each data response carries source/mode/freshness; each capability carries supported/unsupported/requires-review/unknown reason. UI banners cannot be the only protection: demo adapters must lack real network clients.

## 5. Important flows

### Upload and analysis

1. Authorized user creates an upload intent with workspace, checksum, declared size/MIME and filename.
2. Server validates membership, quota and product limits; returns a narrowly scoped storage destination/upload capability.
3. Browser uploads directly and resumably to object storage; progress reflects bytes acknowledged by storage.
4. Completion is verified server-side (size/hash/probe), then a video and durable processing job are recorded atomically with an outbox event.
5. Worker leases job, probes media, extracts bounded frames/audio and produces derivatives. Intermediate state/checkpoints survive restarts.
6. Analysis returns timestamped evidence references, confidence and unknowns. Corrections are append-only and trigger invalidated-content warnings.
7. Shared analysis fans out to separate account content jobs only for selected, eligible accounts.

A browser disappearing after step 3 must not lose the object. An uncommitted intent expires and is garbage-collected. Repeated completion callbacks cannot create duplicate processing jobs.

### Publishing

1. Freeze an immutable account/content/media version and compute its digest.
2. Validate rights, facts, platform schema, current capabilities/scopes, account enablement, schedule rules and required consent.
3. Persist one job per account with a unique idempotency key; independently queue it.
4. Worker atomically leases due work, rechecks pause/authorization/version, obtains short-lived credentials and executes the provider state machine.
5. Persist provider upload/session/container/post IDs at each durable step. “Request accepted” is not “published.”
6. On ambiguous timeout, reconcile by stored provider ID/session or account-scoped lookup before another write. Never blind-retry a potentially successful publish.
7. Confirm supported terminal state, save post association and notification; schedule analytics sync separately.

No provider is assumed to offer a universal idempotency header. Local uniqueness plus persisted provider state and reconciliation provide the product guarantee; an unresolved external ambiguity becomes `NEEDS_ATTENTION`, not a fabricated success or duplicate.

### Analytics and recommendations

Sync jobs store raw supported metrics with account/post, metric definition, interval, source, retrieval time and freshness. Derived rates have formulas and missing-value rules. Account-specific models use only that account's history. Sparse data produces conservative, explicitly low-confidence suggestions. Performance experiments are observational unless a valid controlled design exists.

## 6. Queue, retries and recovery

- Transactional outbox bridges domain changes and queue enqueue; consumers are idempotent.
- Candidate queue: Postgres/pg-boss in a service-only schema. Validate transactional enqueue, visibility timeout/heartbeat, delayed retry, dead-letter, concurrency and connection-pool behavior locally before ADR-005 is approved.
- Separate queues/concurrency limits for probe, analysis, publish and analytics. One account's permission failure does not pause another account.
- Proposed publish policy: initial attempt plus 3 transient retries at nominal 1/5/15 minutes with jitter; `Retry-After` overrides earlier timing. Permanent validation/permission failures stop. Daily/platform caps defer to an eligible time or require attention.
- Leases have fencing/attempt identifiers; graceful shutdown stops claiming and checkpoints work. Expired leases are recoverable, but external writes enter reconciliation first.
- Job payload contains IDs/digests, not tokens or large media. Credentials are resolved just in time server-side.
- Store redacted attempt history, next action and plain-language error. Dead-letter is visible and manually recoverable with permission/version checks.

## 7. Storage and platform media delivery

Originals are private and immutable. Derivatives are separate assets with codec/dimension/duration/checksum lineage. Short-lived signed URLs serve previews. Platform ingestion may require a publicly reachable HTTPS URL: use an unguessable, short-lived delivery object limited to the frozen variant, not a permanently public bucket. Meta documents that it fetches media from a public server [5](https://developers.facebook.com/docs/instagram-platform/content-publishing/). TikTok URL-pull requires approved/verified ownership; file upload remains an alternative. Exact URL lifetime, verification and cleanup must pass provider tests before use.

## 8. Deployment design — documentation only

- Local: web + worker + local database/storage emulators; deterministic fixtures need no services.
- Future web hosting: Vercel only after explicit authorization.
- Future managed data/auth/storage: a new Supabase project only after explicit authorization.
- Future worker: separate container host chosen after measured CPU/RAM/egress and budget approval. It needs durable outbound network, controlled egress, persistent temporary disk and graceful restarts.
- Environments have separate credentials, buckets, redirect URIs, data and queues. No production resource names or keys are invented now.
- Database migrations precede compatible app/worker rollout; expand/contract changes and feature flags support rollback. Already accepted external posts cannot be “rolled back” by a deployment; reconciliation/remediation is explicit.

Observability includes request/job correlation IDs, workspace/account IDs where permitted, queue age, lease expiry, provider error class, sync freshness and cost counters. Logs never include tokens, signed URLs or raw OAuth responses. Backup/restore and worker crash tests are release gates, not future promises hidden behind a dashboard.

## 9. PWA and performance

Install manifest, original icons and offline app shell are planned. Service worker caches versioned public static assets only; authenticated JSON, OAuth routes, analytics, secrets and signed media are network-only. No offline publish queue. Update UX avoids stale shells; upload state is recovered from server/storage, not service-worker memory. Respect reduced motion and constrained devices. Measure mobile JS, image sizes, upload memory and long-task behavior on the required viewport matrix.
