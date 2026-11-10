# Test strategy and acceptance evidence contract

**Current status:** frontend UI Batches 1–6 tested locally with the documented registry-only Chromium fallback. Static/unit/security/build and production browser/axe/viewport gates have executed. Standard Playwright CDN download remains blocked; product/live-provider suites remain PLANNED / NOT RUN. A test name in this document is not evidence that it exists or passed.

## 1. Tooling and command contract

Proposed tools: Vitest for domain/adapter tests, Playwright for browser/E2E and viewport checks, axe-core Playwright plus manual keyboard/screen-reader review, TypeScript strict mode, ESLint/Prettier, local Postgres/storage emulators for policy/queue tests, and provider contract fixtures. M1.1 proves versions and creates these scripts:

```sh
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:security
npm run test:visual
npm run test:navigation:dev
npm run build
```

Targeted runs may use `npm run test:unit -- <path>` or `npm run test:e2e -- --grep <suite-id>`. `npm run test:integration` deliberately exits 1 while `tests/integration/` is empty; it is outside `npm run check` until real approved integration tests exist. Integration tests must not silently substitute mocks when their name says local/live. Live suites are opt-in, require explicit resource/account authorization and refuse to run without an approved test environment. They default to private/test visibility and redact evidence. CI for ordinary PRs never receives production social credentials.

Browser setup on a machine with browser-download access: `npx playwright install chromium`, then `npm run test:e2e`, `npm run test:a11y`, `npm run test:visual`, `npm run test:navigation:dev`. The navigation regression config owns a fresh development server on port 3101 with isolated `.next-e2e-dev` output; production browser gates remain build-first on port 3100. Development assertions require route-specific headings/content and active states, not merely clicks or HTTP 200. The axe scan uses WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags with no disabled rules; manual keyboard/screen-reader review remains separate.

Current portable validation commands:

```sh
npm run docs:check
node scripts/run-python.mjs -B -m unittest discover -s scripts -p test_*.py -v
node scripts/run-python.mjs -B -m py_compile scripts/check_docs.py scripts/test_check_docs.py
git diff --check
git diff --exit-code b16202cc61c12a4ae374bedcca94680882064a9f -- docs/PLAN.md
```

Historical Phase 0 commands used `python3` and `PYTHONPYCACHEPREFIX`; those remain in the historical evidence ledger, while current scripts avoid platform-specific environment prefixes.

## 2. Evidence rules

Every run records date/commit, exact command, environment/mode, result, suite/case counts when available, artifact location and limitations. Use PASS, FAIL or NOT RUN with reason. Store small text summaries/sanitised screenshots under `docs/evidence/` only when useful; keep videos, traces, coverage, databases and node_modules out of Git. Never include tokens, cookies, signed URLs or real personal media in evidence.

Status progression: code without passing applicable checks = `IMPLEMENTED`; all required checks pass = `TESTED`; only owner review grants `ACCEPTED`. A mocked adapter test cannot satisfy a `*-LIVE` case. A documentation-only requirement can be TESTED for its Phase 0 deliverable while ongoing operational compliance remains unfinished.

## 3. Test layers and fixtures

- **Unit:** pure domain rules, validation, state transitions, timezone/scheduling, retries, capability mapping, metric transformations and claim gates.
- **Integration:** adapters against fixtures/local services; OAuth callback; token refresh/encryption; RLS/storage; upload intent/completion; durable queue/outbox/idempotency; worker crash/recovery.
- **E2E:** mobile-first navigation, upload demo/local, detail/timeline, account-specific previews, research brief, calendar, queue controls, theme and notification journeys.
- **Security:** two workspaces and all roles; direct API/DB/storage bypass attempts; OAuth CSRF/replay; secret canaries; upload abuse/rate limits; signed access; redaction.
- **Visual/responsive/accessibility:** 320/360/390/430/768/1440 widths; both themes; keyboard/focus/zoom/reduced motion; no page overflow; contrast and semantic assertions. Screenshot thresholds are established after first approved UI baseline, not blindly updated to hide regressions.
- **Live contract:** separately authorized test apps/accounts; sanitized real response IDs/state; current scope/eligibility/quota checks; no public writes without explicit approval.

Fixtures carry stable IDs, source=`demo`/`fixture`, scenario and requirement references. Include at least three platform identities plus additional accounts, sparse data, unavailable metrics, partial permissions, expired auth, ambiguous publish, transient/permanent errors and mixed job states. Never use real creator analytics without permission. Accuracy evaluation footage must be original/consented and labelled with human-reviewed ground truth/unknowns.

## 4. Catalog — phase and documentation

| ID | Planned assertions / manual procedure | Evidence destination |
|---|---|---|
| `T-DOC` | Required files populated; relative links resolve; unique valid requirement IDs/statuses; all original brief sections covered; every matrix milestone/test ID resolves; no forbidden application/cloud artifacts in Phase 0; original source hash unchanged | `docs/evidence/phase-0-validation.txt`; TEST_EVIDENCE.md |
| `T-SCAFFOLD` | Clean lockfile install; exact Node/npm enforcement; Node/peer compatibility; server-only boundary; dev startup and production build; documented commands work from fresh checkout | M1.1/hardening command summary |
| `T-QUALITY` | Format/zero-warning lint/strict type checks and unit smoke; empty integration suite fails; CI template reproduces local gates without secrets/deployment | CI/local summary per milestone |
| `T-SECRET` | Secret canaries absent from client bundle/logs/errors/audit/Git; env examples contain no real values; Git-index/worktree validator rejects credential/cloud artifacts and force-added ignored files; ignore rules exclude media/build/db artifacts | Security summary |

## 5. Catalog — UI and demo

| ID | Assertions |
|---|---|
| `T-UI` | Primitive variants/states; labels/described errors; focus/keyboard menus/dialogs; pressed/loading/disabled behavior; semantic tokens |
| `T-A11Y` | Real axe scan zero violations on tested routes (foundation, shell, populated core/supporting screens and four overview themes PASS with documented fallback; four-theme all-destination and six-width all-destination matrices PASS); manual keyboard/focus/landmark/zoom/screen-reader checks; contrast and reduced motion |
| `T-VIEWPORT` | Required six widths, both themes; no page-level horizontal overflow; 44px targets; primary workflows usable without hover/drag |
| `T-SHELL` | All ten routes reachable; mobile More menu; desktop sidebar; context switching; theme persistence; notifications/profile controls |
| `T-PWA` | Valid manifest/icons/installability where browser supports; public-shell offline fallback/update; authenticated/API/OAuth/media routes never cached; no offline publish |
| `T-DEMO` | Fixture schema/source labels; multiple accounts; deterministic reset; every required scenario represented |
| `T-STATE-UI` | Applicable loading/empty/error/success/unavailable states; retry preserves context; stale account data not displayed after switch |
| `T-OVERVIEW` | Workspace summary, attention, recent media/progress/queue/upcoming/published/highlights; first-run empty vs labelled demo |
| `T-ACCOUNTS` | Multiple identities/platform; scopes/status/sync/strategy/timezone/queue/expiry; simulated connect/reauth/disconnect; publishing opt-in |
| `T-SETTINGS` | All brief settings groups; validation/save feedback; automation rules; theme/accessibility; owner-only export/delete confirmations |
| `T-VIDEO-UI` | Mobile picker/desktop drop; progress; metadata/library search/sort/filter/detail; retry/delete confirmation; honest session-only demo |
| `T-ANALYSIS-UI` | Timestamp navigation; visual/audio categories; confidence/evidence/unknown; correction and clip suggestions; simulation labels |
| `T-CONTENT-UI` | Account-specific packages/previews/counters/edit/regenerate/version history; unsupported fields/claims explained |
| `T-RESEARCH-UI` | Source/date/freshness/relevance; fact vs suggestion; save brief; no unsupported trend/volume claims |
| `T-SCHEDULER-UI` | Day/week/month/mobile agenda; account/platform filters; timezone/reason/confidence; keyboard reschedule; windows/quiet/blackouts |
| `T-QUEUE-UI` | All statuses; filters/detail/attempts; eligible retry/cancel/reschedule; per-account pause/resume; plain errors; Simulation labels |
| `T-ANALYTICS-UI` | Account/post/date comparisons; definitions/axes/legend/tooltip/accessible table; empty/stale/unavailable states; no demo/live mixing |
| `T-LAB-UI` | Experiment variables/sample/date/metrics/limitations; supported comparisons; no unsupported winner/causal claim |
| `T-NOTIFICATIONS` | All ten brief event categories; dedupe/read/action links; accessible announcements; in-app only until provider approved |
| `T-DEMO-E2E` | Phone upload simulation → analysis → distinct packages → research brief → schedule → queue outcome → analytics/lab; no external network calls |
| `T-DEMO-ISOLATION` | Live mode cannot import fixtures or use demo success; demo mode cannot construct real provider client; source labels survive transformations |

UI catalog tests use semantic assertions plus visual baselines after M1.2. Each screen milestone runs its own suite plus T-VIEWPORT/T-A11Y/T-STATE-UI as applicable; M2.6 runs the entire demo journey.

## 6. Catalog — domain, services and data

| ID | Assertions |
|---|---|
| `T-DOMAIN` | Schema rejects invalid ownership/FKs/enums/counts/timestamps; unknown/unavailable distinct; immutable version/digest rules |
| `T-STATE` | Every allowed/illegal video/connection/job transition; cancel after dispatch; retry eligibility; material edit invalidation |
| `T-PORTS` | Demo/local/provider adapters satisfy same contract; injected errors; no SDK leakage into domain/UI |
| `T-RETRY` | Initial+3 ceiling, jitter bounds, Retry-After, permanent stop, daily-cap deferral, dead-letter and ambiguous-write reconciliation |
| `T-QUEUE-LOCAL` | Transactional outbox, unique enqueue, concurrent lease, heartbeat/expiry/fence, restart, delayed job and dead-letter recovery on actual local queue |
| `T-SCHEDULING` | Account-only inputs, windows/frequency/quiet/blackouts, conflicts/duplicates, timezone/DST, sparse fallback, reason/confidence and model version |
| `T-DB` | Repeat migration/reset; composite tenant FKs; natural uniqueness; index/query plan smoke; generated types match schema |
| `T-RBAC` | Owner/admin/editor/viewer positives and negatives across two workspaces; direct table/RPC/realtime/storage bypass attempts; no role self-elevation |
| `T-AUTH` | Session expiry/revocation; workspace membership guards; origin/CSRF checks; sensitive endpoint rate limits |
| `T-OAUTH` | State/session/provider binding, single use/expiry/replay, redirect allowlist, PKCE where supported, partial grants and code-exchange failures |
| `T-TOKENS` | Envelope encryption/context/nonce; service-only access; rotation; concurrent refresh; revoke/disconnect/reauth; no plaintext leakage |
| `T-CONNECTIONS` | AES-256-GCM keyring/AAD/tamper/rotation, random/PKCE encodings, provider URL origins/scopes/state, empty-200 revoke and Instagram remote-revoke honesty |
| `T-MIGRATION-PARITY` | Applied hosted migration statements equal reviewed local SQL after comment/whitespace canonicalization; no repeated application |
| `T-CAPABILITIES` | Granted scopes + app review + account eligibility map to actions; unsupported/unknown never enabled by optimism |
| `T-STORAGE-POLICY` | Workspace/object-scoped upload/read/list/delete; signed URL expiry; cross-object denial; platform delivery object cleanup |
| `T-AUDIT` | Connect/publish/delete/settings events; append-only; actor/correlation/reason; redacted before/after summaries |
| `T-PRIVACY` | Export scope/expiry; deletion ordering/holds; token revoke; backup aging/deletion ledger; external-post deletion is separate |

## 7. Catalog — media, AI and publishing

| ID | Assertions |
|---|---|
| `T-UPLOAD` | Direct/resumable bytes bypass web; real progress; interruption/resume; intent expiry; size/MIME/quota/hash; repeated completion idempotency |
| `T-UPLOAD-E2E` | Phone picker → interrupted upload → resume → server-verified object → durable process → ready/failure/retry; original preserved |
| `T-WORKER` | Outbox-to-lease, heartbeat/fence, graceful stop, crash checkpoint, bounded resources, dead-letter and unrelated-job isolation |
| `T-MEDIA` | ffprobe metadata; codec/container allowlist; corrupt/polyglot/resource abuse; frame/audio/variant lineage; platform-specific validation |
| `T-AI-VISUAL` | Human-labelled evaluation for game/weapon/scope/map/distance/engagement/knock/spray/recoil/hook/pacing/clips; confidence/unknown/error reporting |
| `T-AI-AUDIO` | Gunfire/voice/music/clipping/relative balance/improvements; silence/overlap/uncertainty cases; no fabricated transcription/claims |
| `T-AI-CLAIMS` | Verified vs estimated facts; unverified exclusion; correction invalidation; no invented record/world achievement; byte/character platform limits |
| `T-AI-ADVERSARIAL` | Prompt injection in transcript/source cannot change permissions, reveal secrets or create unsupported facts; malformed model output rejected |
| `T-COST` | Frame/minute/token/cost ceilings; timeout/cancel; no paid call in demo/ordinary CI; usage attribution and alerts |
| `T-RESEARCH` | Approved source attribution/date/freshness/relevance; fact/suggestion split; no fabricated patch/event/volume; saved brief lineage; source failure |
| `T-METADATA` | Per-platform/account schemas; distinct variants; grounded claims; supported fields; regeneration/version pinning; current validation rules |
| `T-STRATEGIES` | Voice/audience/language; approval/full-automation modes; explicit account opt-in; required interventions; material-change revalidation |
| `T-PUBLISH-STATE` | Request acceptance not success; provider checkpoints; terminal confirmation; pause/cancel/reschedule; account failure isolation |
| `T-IDEMPOTENCY` | Crash before/after every external write; duplicate events/retries; persisted session/container/post ID; reconcile ambiguous result before retry |
| `T-ANALYTICS` | Natural-key idempotency; metric units/formulas; missing/stale/estimated values; no summing non-additive metrics; same-account association |
| `T-EXPERIMENTS` | Definition/variables/population/window/sample/exclusions; zero/small/biased sample warnings; correlation not causation |
| `T-LEARNING` | Same-account data only; versioned input/output/reason/confidence; sparse fallback; auditable supersession/rollback; no guaranteed growth |

AI accuracy thresholds must be approved against the labelled evaluation set before M6.1 runs; do not invent a universal accuracy percentage. Critical claim safety has a stricter gate: no unsupported factual achievement claims in the acceptance corpus, and unknown is preferable to a guess.

## 8. Catalog — explicitly authorized live suites

| ID | Required real evidence and safety boundary |
|---|---|
| `T-YOUTUBE-LIVE` | Authorized test channel identity/scopes/refresh/revoke; actual project quota/eligibility recorded; no public write |
| `T-INSTAGRAM-LIVE` | Chosen login path, eligible professional test account, granted permissions/access level/refresh/revoke |
| `T-TIKTOK-LIVE` | Authorized private test creator, partial scopes/audit state/current creator info/refresh/revoke |
| `T-YOUTUBE-PUBLISH-LIVE` | Private upload/session resume/metadata preservation/confirmed state and video ID; ambiguous retry safety |
| `T-INSTAGRAM-PUBLISH-LIVE` | Valid Reel variant/container processing/actual quota/confirmed post ID/error-expiry/cleanup |
| `T-TIKTOK-PUBLISH-LIVE` | Required consent/privacy/disclosure; private SELF_ONLY within audit limits; transfer/status/terminal post evidence |
| `T-YOUTUBE-ANALYTICS-LIVE` | Authorized supported targeted/bulk reports with timestamps; unavailable metrics remain unavailable |
| `T-INSTAGRAM-ANALYTICS-LIVE` | Actual current endpoint/login-path fields and eligibility; no assumed audience hours/parity |
| `T-TIKTOK-ANALYTICS-LIVE` | Actual granted profile/video fields; no assumed audience demographics/hours |
| `T-PRODUCTION-SMOKE` | Only after deployment approval: exact environment/artifact, auth/callback/read checks and explicitly approved test actions |

Each live suite has a preflight checklist: owner authorization, current docs, app review state, test account, least scopes, visibility, quota/cost cap, redaction and cleanup. A failed/blocked preflight is NOT RUN/FAIL with reason, never replaced by a mock PASS.

## 9. Release and operations

| ID | Assertions |
|---|---|
| `T-SECURITY` | Aggregate cross-tenant/OAuth/upload/rate-limit/secret/dependency gates; threat-model review; unresolved critical/high issue blocks release |
| `T-LOAD` | Agreed reference mobile/network; concurrent upload/worker load; queue age/memory/temp disk/egress/cost; no unbounded retries |
| `T-RECOVERY` | Actual backup restore meets approved RPO/RTO; migration compatibility; key rotation; outbox/job reconciliation; deletion ledger replay |
| `T-OPS` | Alerts fire/recover; dashboards/logs redacted; runbooks/rollback executed; release notes list limitations; user guide matches product |

Release acceptance is the union of applicable requirement gates, not a green build alone. Missing live authorization, unresolved duplicate-publish risk, unsupported causal claims or inaccessible core mobile flows block the relevant release scope.


## Batch D executed evidence — 2026-11-10

- `T-CONNECTIONS`: `tests/unit/connections.test.ts` covers the keyring, encryption context and provider adapters without live network calls.
- `T-MIGRATION-PARITY`: nine applied hosted migrations matched local canonical MD5 values in [Batch D evidence](evidence/batch-d-connections.txt).
- `T-OAUTH` / `T-TOKENS` / `T-RBAC` / `T-AUDIT`: `supabase/tests/oauth_broker.sql` reached `ROLLBACK_BROKER_FIXTURE_COMPLETE` after all assertions and rolled back; post-run synthetic inventory was zero.
- `T-QUALITY` / `T-SECRET`: strict env-example, Vercel cron config, Git artifact and credential guards are covered by `scripts/test_check_docs.py` and `tests/unit/hosted-toolchain.test.ts`.
- Live provider authorization, app review, SMTP delivery, owner browser acceptance and production cron remain NOT RUN/BLOCKED. A READY deployment is not a test result.
