# Up17 AutoPublisher — repository-specific implementation plan

**Version:** 1.0 proposed delivery plan
**Prepared:** 2026-11-08 UTC
**Status:** APPROVED 2026-11-08; M1.1 LOCAL TECHNICAL GATES PASSED (INCLUDING FALLBACK-BROWSER PREVIEW); FRONTEND UI BATCHES 1–6 TESTED LOCALLY; LOCAL NAVIGATION REPAIR TESTED LOCALLY; OWNER ACCEPTANCE NOT RECORDED
**Authority:** the unchanged [original master brief](PLAN.md), plus the owner's Phase 0 instruction. This document translates it into repository-specific work; it does not silently replace requirements.

## 1. Audit conclusion and planning decisions

The repository began with only `README.md` and `docs/PLAN.md`, no framework, dependencies, application code, tests, configuration or migrations. The full history contains two commits. Only `main` existed remotely; work is on the fixed session branch `arena/698e4880-up17-autopublisher`. See [REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md) for verified facts and commands.

Reuse the brief and repository, not another product's code or resources. Preserve the source brief byte-for-byte and the README mission wording. Build a Next.js/TypeScript web application with a separate durable worker and provider ports; use Supabase services only after explicit authorization. The exact candidate toolchain and alternatives are in [ARCHITECTURE.md](ARCHITECTURE.md) and [DECISIONS.md](DECISIONS.md). Nothing has been installed or provisioned.

**Planning refinement:** establish typed demo read contracts before screen work in M2.1, then deepen the domain in Phase 3. This avoids the brief's risk of a polished UI tightly coupled to fixtures. Phase numbering is retained; no later integration phase is pulled forward.

## 2. Delivery rules and approval boundaries

1. Owner approves this Phase 0 package before M1.1. Ask the most important unresolved decision at a time; recommendations are not consent.
2. Plan approval permits local Phase 1 work only. Hosted Auth/DB/storage, developer apps, paid AI/research, worker hosting, deployment and public posting each need a separate explicit authorization naming the resource/action.
3. Work one milestone or declared sub-slice at a time. Target a small coherent commit; split a large milestone into named a/b commits before implementation rather than bundling unrelated work.
4. Before every commit: relevant formatting/lint/type/tests/build; inspect diff/status; scan secrets/artifacts; update requirement evidence, sprint status and changelog. Application checks become applicable in M1.1.
5. Commit conventionally, push only the fixed session branch, verify remote hash, then immediately send the exact audit template from brief §4.3. Never force-push or claim an unverified push.
6. `PLANNED` → `IMPLEMENTED` → `TESTED` → owner `ACCEPTED`. Blocked dependencies remain visible. Mock success never counts as live integration success.
7. At every phase exit, report requirement totals, actual evidence, blockers, deviations and the next milestone. Passing a phase gate is not approval to deploy.

## 3. Dependency map and gates

```text
M0.1 → OWNER PLAN APPROVAL → Phase 1 → Phase 2 demo contracts/screens
                                     → Phase 3 domain/ports
                                     → Phase 4 local auth/db/security
                 DATA/STORAGE AUTHORIZATION → hosted Phase 4 resources
                                     → Phase 5 upload/worker foundation
                 AI/RESEARCH APPROVAL + BUDGET → Phase 6 real analysis/research
                 EACH PLATFORM APP/AUTHORIZATION → Phase 7 that platform only
                                     → Phase 8 grounded account content
                                     → Phase 9 scheduler/queue/publishing
                 TEST ACCOUNT + API ELIGIBILITY → private/test publishing
                 EXPLICIT PUBLIC-POST APPROVAL → public automation
                                     → Phase 10 sourced analytics
                                     → Phase 11 experiments/learning
                                     → Phase 12 release candidate
                 EXPLICIT DEPLOYMENT AUTHORIZATION → production release
```

Mocks/contract tests can proceed locally while a provider review is blocked. A blocked Instagram review, for example, must not block YouTube tests or cause a simulated Instagram success. Real AI accuracy, audience-hour recommendations and performance improvements cannot be proven by fixtures.

## 4. Milestone convention

Every milestone below lists a proposed commit scope, dependencies, deliverables, acceptance criteria and test catalog IDs from [TEST_STRATEGY.md](TEST_STRATEGY.md). Commands are **planned application commands**, not existing scripts or passed tests. The current Phase 0 commands alone are documented in [TEST_EVIDENCE.md](TEST_EVIDENCE.md). Exact implementation paths are targets and may be refined without dropping requirements.

## Phase 0 — Audit, plan and traceability

### M0.1 — `docs: complete phase 0 audit and delivery plan`

- **Depends on:** repository/Git inspection and complete source-brief read; no owner question blocks the audit.
- **Deliver:** repository audit; all required populated docs; architecture/data/security/UX proposals; official API research with uncertainties; decision/risk register; full requirements matrix; test/evidence plan; documentation consistency checker and 10 validator tests.
- **Acceptance:** every source section has requirement coverage; all required docs contain project-specific guidance; original brief unchanged; no app/cloud resource created; actual doc checks recorded; approval and infrastructure gates explicit.
- **Tests:** `T-DOC` (documentation validation), source-preservation diff and Git artifact checks. Application lint/type/build: not applicable, no application.
- **Exit:** owner reviews and explicitly approves the proposed plan/defaults or requests changes. Documentation being tested does not mean owner-accepted.

## Phase 1 — Toolchain, clay system and application shell

### M1.1 — `chore(web): establish tested application foundation`

- **Depends on:** M0.1 approval; ADR-002/003 stack approval.
- **Deliver:** minimal Next/React/TS app, lockfile/Node pin, Tailwind, strict types, ESLint/Prettier, Vitest/Playwright setup, ignore rules, environment example with no secrets, quality scripts and local-only CI template (active workflow delivery requires GitHub workflow permission); advance the documentation checker beyond its Phase 0 artifact guard only after approval is recorded.
- **Acceptance:** clean install succeeds; candidate version/engine conflicts resolved and recorded; lint/type/unit smoke/build pass; client bundle contains no server secrets; no cloud/deployment step; README setup matches reality.
- **Tests:** `T-SCAFFOLD`, `T-QUALITY`, `T-SECRET`.
- **Split if needed:** scaffold/tooling, then CI/environment conventions; no product screens yet.

### M1.2 — `feat(ui): add accessible clay design primitives`

- **Depends on:** M1.1; D-001 brand direction.
- **Deliver:** light/dark semantic tokens; card/button/input/badge/dialog/menu/tabs/tooltip/toast/layout primitives; focus/pressed/loading/error states; typography/icons; primitive examples/test route.
- **Acceptance:** required token set present; 20–28px cards, tactile buttons/inset fields; keyboard/focus/labels work; both themes pass contrast checks; reduced motion respected; 44px+ targets; no generic dashboard screen substituted.
- **Tests:** `T-UI`, `T-A11Y`, `T-VIEWPORT`.

### M1.3 — `feat(shell): add responsive workspace navigation and pwa shell`

- **Depends on:** M1.2; D-002 workspace membership recommendation.
- **Deliver:** desktop sidebar/mobile bottom nav + More; all ten route placeholders; workspace/account context; notifications entry placeholder; profile/theme controls; persistent demo indicator; manifest/icons/public-shell worker and update strategy.
- **Acceptance:** all destinations reachable on phone and desktop; theme persists without flash; no horizontal overflow at required widths; safe-area/keyboard behavior; no sensitive API/token/media caching; placeholders honestly unfinished.
- **Tests:** `T-SHELL`, `T-VIEWPORT`, `T-A11Y`, `T-PWA`.
- **Phase exit:** shell/theme/navigation evidence and owner review; not a claim that product workflows work.

## Phase 2 — Complete demo product experience

### M2.1 — `feat(demo): establish typed fixtures and state boundaries`

- **Depends on:** Phase 1; UX screen/state approval.
- **Deliver:** typed presentation contracts; deterministic fixture IDs; one YouTube/Instagram/TikTok account each plus extra accounts; videos, analyses, packages, schedules, jobs, metrics, research, notifications; shared loading/empty/error/unavailable patterns; network-blocking demo guard.
- **Acceptance:** fixtures cover every screen and multi-account failure isolation; all sample data/actions visibly labelled; no real external calls; source/freshness represented; demo reset works; contracts do not depend on SDK types.
- **Tests:** `T-DEMO`, `T-STATE-UI`, `T-SECRET`.

### M2.2 — `feat(demo): add overview accounts and settings workflows`

- **Depends on:** M2.1; D-005/006 proposed defaults clearly marked demo.
- **Deliver:** Overview bento; Accounts platform groups/capability matrix; Settings profile/voice/niche/defaults/automation/notifications/theme/export/security sections; simulated connect/enable/pause/disconnect and preferences interactions.
- **Acceptance:** account/workspace filtering changes all relevant context; new accounts default publishing-disabled in simulation; destructive confirmation; settings validation/save feedback; no real OAuth or fabricated connection; first-run empty distinct from populated demo.
- **Tests:** `T-OVERVIEW`, `T-ACCOUNTS`, `T-SETTINGS`, `T-VIEWPORT`, `T-A11Y`.

### M2.3 — `feat(demo): add video library and analysis timeline`

- **Depends on:** M2.1; D-012 proposed product limits labelled as product choices.
- **Deliver:** Video Studio picker/drop/progress simulation, searchable/sortable library/detail, original/variant lineage, processing states, retry/delete confirmation, timestamped visual/audio timeline, confidence/evidence/correction and clip suggestions.
- **Acceptance:** mobile file-picker path works; demo upload never claims durable storage/model analysis; every required observation category has evidence/unknown representation; search/filter/sort/retry/delete interactions work; no large media committed.
- **Tests:** `T-VIDEO-UI`, `T-ANALYSIS-UI`, `T-VIEWPORT`, `T-A11Y`.

### M2.4 — `feat(demo): add account content previews and research briefs`

- **Depends on:** M2.3; D-007/013 decisions surfaced.
- **Deliver:** AI Content per-account packages/platform previews/counters/regeneration/version history; YouTube/Instagram/TikTok-specific fields; Research Centre source/freshness/relevance cards and saved briefs.
- **Acceptance:** different metadata per account; unsupported claims/pinning marked unavailable; correction invalidates affected content; saved research retains attribution; simulation does not call a model/search provider; factual suggestion distinction clear.
- **Tests:** `T-CONTENT-UI`, `T-RESEARCH-UI`, `T-VIEWPORT`, `T-A11Y`.

### M2.5 — `feat(demo): add scheduling and independent publishing queues`

- **Depends on:** M2.4; D-004/005/006 recommendations.
- **Deliver:** day/week/month + mobile agenda, account/platform filters, recommendation explanation/confidence, reschedule and windows; queue filters/details/attempts/retry/cancel/pause/resume and all required statuses.
- **Acceptance:** keyboard/mobile rescheduling works without drag; timezone explicit; duplicate/conflict and sparse-data warnings; account A failure does not pause B; retry/cancel only on eligible states; every outcome labelled Simulation.
- **Tests:** `T-SCHEDULER-UI`, `T-QUEUE-UI`, `T-VIEWPORT`, `T-A11Y`.

### M2.6 — `feat(demo): complete analytics lab and notification experience`

- **Depends on:** M2.5.
- **Deliver:** Creator Studio account/post/date views and metric limitations; Performance Lab experiment definitions/comparisons; notification center and attention links; final cross-screen demo state/accessibility pass.
- **Acceptance:** all ten screens complete in demo with applicable states; charts have definitions/axes/empty states; stale/unavailable not zero; sample size/confidence/limitations shown; all notification categories represented; no unsupported causal/live claims.
- **Tests:** `T-ANALYTICS-UI`, `T-LAB-UI`, `T-NOTIFICATIONS`, `T-DEMO-E2E`, `T-VIEWPORT`, `T-A11Y`.
- **Phase exit:** complete **demo** experience only; integrations, durable storage and AI remain unfinished.

## Phase 3 — Local domain and application services

### M3.1 — `feat(domain): add validated entities and state machines`

- **Depends on:** Phase 2 contracts; data model review.
- **Deliver:** tenant/account ownership types; Zod schemas; video/connection/job transitions; immutable content/version invariants; capability/error taxonomy; timezone/value objects; traceable fixtures.
- **Acceptance:** illegal transitions/cross-tenant references/material digest changes rejected; all brief entities refined; unknown/unavailable represented distinctly; domain has no UI/provider imports.
- **Tests:** `T-DOMAIN`, `T-STATE`, `T-QUALITY`.

### M3.2 — `feat(services): add ports and deterministic local adapters`

- **Depends on:** M3.1; ADR-005/008 review.
- **Deliver:** storage/queue/token-broker/analysis/research/social/metadata ports; mock/local adapters; retry classifier; scheduling policy interface; local queue candidate durability benchmark and decision update.
- **Acceptance:** UI calls services not fixtures; adapter contract suite passes; bounded retry/Retry-After/permanent/ambiguous classifications tested; queue crash/lease/uniqueness assumptions proven locally or ADR revised; no external service.
- **Tests:** `T-PORTS`, `T-RETRY`, `T-QUEUE-LOCAL`, `T-SCHEDULING`.

### M3.3 — `feat(app): replace fixture coupling with repositories and errors`

- **Depends on:** M3.2.
- **Deliver:** local repositories/unit-of-work boundaries, server action/result patterns, query invalidation/loading/error handling, correlation IDs/redaction, migration-ready service composition.
- **Acceptance:** all demo E2E tests still pass through ports; injected failures recover without stale account data; fixtures excluded from live mode; logs pass secret canaries; no hosted dependency required.
- **Tests:** `T-PORTS`, `T-STATE-UI`, `T-DEMO-E2E`, `T-SECRET`.
- **Phase exit:** replaceable services and traceable local tests, not a production database.

## Phase 4 — Auth, workspace, database and storage policies

### M4.1 — `feat(db): add local migrations and workspace isolation`

- **Depends on:** Phase 3; D-002/008 approval; local emulator tooling approved. No hosted project.
- **Deliver:** migrations, keys/indexes/enums, service-only credential/queue design, RLS policies, local generated types and two-workspace fixtures.
- **Acceptance:** local migration/reset repeatability; owner/admin/editor/viewer and cross-workspace read/write/RPC/storage negatives pass; service-only tables inaccessible to browser roles; indexes match access paths.
- **Tests:** `T-DB`, `T-RBAC`, `T-STORAGE-POLICY`, `T-SECRET`.

### M4.2 — `feat(auth): add workspace sessions and OAuth security foundation`

- **Depends on:** M4.1; ADR-010; separate authorization before any hosted Supabase resource.
- **Deliver:** app auth/session adapter, workspace selector/member guards, OAuth attempt/state/PKCE foundation, token-broker envelope encryption/rotation design, refresh/revoke contract mocks, setup instructions.
- **Acceptance:** wrong/expired/replayed state and wrong session rejected; no social passwords/tokens in client; refresh race/revocation tested with mocks; key management documented before real tokens; hosted instructions not executed without permission.
- **Tests:** `T-AUTH`, `T-OAUTH`, `T-TOKENS`, `T-RBAC`, `T-SECRET`.

### M4.3 — `feat(data): add storage lifecycle audit and privacy controls`

- **Depends on:** M4.2; storage/privacy/retention decisions.
- **Deliver:** private object-path policies/signed access, audit writes, notification repository, export/deletion request workflows and retention/backup instructions; local implementation first.
- **Acceptance:** scoped signed access and cross-object denial; connection/settings/deletion/publish audit entries redacted; owner-only export/delete; retention/legal-hold behavior explicit; no cloud bucket created without authorization.
- **Tests:** `T-STORAGE-POLICY`, `T-AUDIT`, `T-PRIVACY`, `T-RBAC`.
- **Phase exit:** security evidence and authorized environment readiness; never count setup instructions as a provisioned service.

## Phase 5 — Resumable upload and durable processing

### M5.1 — `feat(upload): add scoped resumable video intake`

- **Depends on:** Phase 4; D-012 limits; storage authorization for hosted use.
- **Deliver:** direct TUS upload, intent/verification/completion idempotency, real progress/resume, private original asset, mobile picker/drop, metadata persistence.
- **Acceptance:** large file bypasses web handler; interrupted upload resumes; repeated completion creates one video/job; wrong workspace/oversize/MIME/quota rejected; object preserved after browser closes; demo remains isolated.
- **Tests:** `T-UPLOAD`, `T-STORAGE-POLICY`, `T-UPLOAD-E2E`, `T-VIEWPORT`.

### M5.2 — `feat(worker): add durable probe and media variant jobs`

- **Depends on:** M5.1; worker isolation/toolchain approval.
- **Deliver:** separate worker supervisor/heartbeat/leases/outbox, ffprobe metadata, bounded frame/audio extraction, preview/variants and lineage; resource ceilings.
- **Acceptance:** process restart recovers leased work; graceful shutdown/checkpoints; corrupt/unsupported media attention state; derived assets tracked; no arbitrary shell execution/memory-sized whole-video processing.
- **Tests:** `T-WORKER`, `T-MEDIA`, `T-QUEUE-LOCAL`, `T-UPLOAD`.

### M5.3 — `fix(media): prove failure retry and cleanup paths`

- **Depends on:** M5.2.
- **Deliver:** retry/reprocess UX backed by real local jobs, orphan upload cleanup, failure/dead-letter visibility, upload/worker runbook and measured mobile resource behavior.
- **Acceptance:** upload→process→ready/failure→retry paths pass; original preservation and derivative cleanup tested; one failure does not block unrelated jobs; no paid/hosted processing implied.
- **Tests:** `T-UPLOAD-E2E`, `T-WORKER`, `T-RETRY`, `T-PRIVACY`.
- **Phase exit:** durable local/approved-environment media foundation, not AI accuracy or social publishing.

## Phase 6 — Evidence-based analysis and lawful research

### M6.1 — `feat(analysis): integrate approved multimodal analysis port`

- **Depends on:** Phase 5; D-009 provider/data terms/budget and evaluation footage authorization.
- **Deliver:** bounded visual analysis adapter, structured timestamp/evidence/confidence outputs, model/input versions, cost/time limits and evaluation harness.
- **Acceptance:** approved evaluation set reports errors/unknowns, not just successful examples; weapon/scope/map/distance/engagement/knock/spray/recoil/hook/pacing/clip categories handled conservatively; timeout/schema failure recoverable; no claim beyond evidence.
- **Tests:** `T-AI-VISUAL`, `T-AI-ADVERSARIAL`, `T-WORKER`, `T-COST`.

### M6.2 — `feat(analysis): add audio findings corrections and claim gates`

- **Depends on:** M6.1.
- **Deliver:** gunfire/voice/music/clipping/balance/improvement observations; event correction workflow; verified-fact registry and invalidation of dependent content; record/world-achievement prohibition.
- **Acceptance:** all audio categories represented with uncertainty; corrections append audit and invalidate claims; unverified facts excluded from metadata; no fabricated record; analysis timeline navigable on phone.
- **Tests:** `T-AI-AUDIO`, `T-AI-CLAIMS`, `T-ANALYSIS-UI`, `T-AUDIT`.

### M6.3 — `feat(research): integrate permitted attributed research sources`

- **Depends on:** D-013 source/license/budget authorization; may run alongside M6.2 after its own gate.
- **Deliver:** approved research adapter, current topic/keyword/question/event/relevance results, source/date/freshness, fact/suggestion separation and saved briefs.
- **Acceptance:** no unrelated trend padding, invented patch/event, copied creator content or assumed search volume; unavailable source shown honestly; source attribution survives brief saving; no TikTok commercial Research API assumption.
- **Tests:** `T-RESEARCH`, `T-AI-ADVERSARIAL`, `T-RESEARCH-UI`, `T-SECRET`.
- **Phase exit:** measured accuracy/limitations and lawful attribution; model output is never proof of a real-world claim.

## Phase 7 — Official social OAuth connections, one platform at a time

### M7.1 — `feat(accounts): add capability-driven oauth connection framework`

- **Depends on:** Phase 4 OAuth security; provider-neutral mocks.
- **Deliver:** connect/select multiple identities, partial-grant capability mapping, encrypted token lifecycle, reconnect/disconnect/revoke UI and per-account isolation.
- **Acceptance:** two mocked identities/platform remain distinct; no auto-enable; missing scopes limit only affected actions; refresh/revoke/reauth paths tested; default mode makes no external call.
- **Tests:** `T-OAUTH`, `T-TOKENS`, `T-CAPABILITIES`, `T-ACCOUNTS`, `T-RBAC`.

### M7.2 — `feat(youtube): verify authorized channel connection`

- **Depends on:** M7.1; explicit Google project/credentials authorization; current policy/quota recheck.
- **Deliver:** YouTube OAuth/channel selection, narrow scopes, read capability probe, refresh/revoke and sanitized live test evidence.
- **Acceptance:** actual authorized test channel connects; granted scopes/capabilities match documentation; unverified/public eligibility uncertainty resolved for that project; no public publishing in this milestone.
- **Tests:** `T-YOUTUBE-LIVE`, `T-OAUTH`, `T-TOKENS`, `T-CAPABILITIES`.

### M7.3 — `feat(instagram): verify professional account connection`

- **Depends on:** M7.1; explicit Meta app/account authorization; D-015 login-path choice.
- **Deliver:** chosen official login path, professional account identity, scopes/access-level capability checks, token refresh/revoke and review-dependency record.
- **Acceptance:** actual eligible test account works; consumer/ineligible/review-limited states honest; no universal Facebook-Page assumption; no publishing claim from login alone.
- **Tests:** `T-INSTAGRAM-LIVE`, `T-OAUTH`, `T-TOKENS`, `T-CAPABILITIES`.

### M7.4 — `feat(tiktok): verify creator connection and required consent`

- **Depends on:** M7.1; explicit TikTok app/account authorization; D-016 consent workflow approval.
- **Deliver:** TikTok OAuth, partial scopes, current creator-info capability surface, audit/private restriction state, refresh/revoke and consent UX contract.
- **Acceptance:** private authorized test creator works within actual audit restrictions; no claim of public automation; manual privacy/consent requirements preserved; direct-page guidelines rechecked because Phase 0 fetch was limited.
- **Tests:** `T-TIKTOK-LIVE`, `T-OAUTH`, `T-TOKENS`, `T-CAPABILITIES`, `T-A11Y`.
- **Phase exit:** each platform reports its own verified capabilities/blockers; connection does not mean auto-publishing is tested.

## Phase 8 — Grounded account-specific content and strategies

### M8.1 — `feat(content): generate grounded platform account packages`

- **Depends on:** Phases 6–7 capabilities; D-007 voice/languages; language-provider approval.
- **Deliver:** separate YouTube/Instagram/TikTok schemas and account variants; supported fields/counters/byte limits/previews; thumbnail/cover/pinned-comment suggestion capabilities; immutable generation lineage.
- **Acceptance:** each selected account receives distinct grounded metadata; only verified claims included; unsupported settings disabled/explained; current limits come from versioned capability rules; no generic caption copied unchanged to every destination.
- **Tests:** `T-METADATA`, `T-AI-CLAIMS`, `T-CONTENT-UI`, `T-CAPABILITIES`, `T-COST`.

### M8.2 — `feat(strategies): add versioned review and automation policies`

- **Depends on:** M8.1; D-005/016 policy approval.
- **Deliver:** account voice/audience strategy, regeneration/version comparison, manual setup mode and explicit full-automation opt-in; revalidation on material changes; platform-required interventions.
- **Acceptance:** after opt-in no unnecessary per-video approval except documented safety/platform rules; changed evidence/claims/privacy require appropriate review; pinned jobs cannot silently change version; TikTok consent not bypassed.
- **Tests:** `T-STRATEGIES`, `T-METADATA`, `T-STATE`, `T-AUDIT`, `T-CONTENT-UI`.
- **Phase exit:** grounded content validation, not a publishing success claim.

## Phase 9 — Independent scheduling and durable official publishing

### M9.1 — `feat(scheduling): add account-specific constrained recommendations`

- **Depends on:** account strategies; analytics port may initially be sparse; D-006 real windows/frequency.
- **Deliver:** timezone/DST-aware slots, posting windows/caps/quiet/blackouts, conflict/duplicate prevention, account-only history/audience inputs, conservative fallback and explanation/version persistence.
- **Acceptance:** no cross-account data substitution; sparse data warning; local-time/DST cases tested; recommendation reason/confidence visible; reschedule updates only intended account job; no invented audience activity.
- **Tests:** `T-SCHEDULING`, `T-SCHEDULER-UI`, `T-DOMAIN`, `T-AUDIT`.

### M9.2 — `feat(publishing): add durable idempotent account workers`

- **Depends on:** M8.2/M9.1; queue decision; provider contract mocks.
- **Deliver:** independent queues, fenced attempts, pause/resume/cancel/retry, provider state checkpoints, error explanations, dead-letter, notifications and reconciliation-before-retry.
- **Acceptance:** crash at every write boundary creates no local duplicate; ambiguous external outcome requires reconciliation; bounded backoff/Retry-After/permanent failures respected; one account failure isolated; material edits cannot publish silently.
- **Tests:** `T-PUBLISH-STATE`, `T-QUEUE-LOCAL`, `T-RETRY`, `T-IDEMPOTENCY`, `T-NOTIFICATIONS`.

### M9.3 — `feat(youtube): verify private resumable publishing`

- **Depends on:** M7.2/M9.2; test-channel authorization; current upload compliance/quota verification.
- **Deliver:** private official upload, metadata/schedule where supported, session resume/reconciliation, thumbnail/comment capability gates and real post association.
- **Acceptance:** confirmed private test video/post ID and actual state recorded; interrupted/ambiguous transfers do not duplicate; omitted update fields preserved; unsupported pinning/custom-thumbnail behavior honest; no public posting without separate approval.
- **Tests:** `T-YOUTUBE-PUBLISH-LIVE`, `T-IDEMPOTENCY`, `T-RETRY`, `T-METADATA`.

### M9.4 — `feat(instagram): verify eligible reel publishing`

- **Depends on:** M7.3/M9.2; eligible professional test account/app access; media delivery approval.
- **Deliver:** Reel variant validation, container/resumable path, processing polling, quota lookup, publish confirmation, cover/supporting settings and cleanup.
- **Acceptance:** real test post ID confirmed; expired/error containers handled; actual quota respected despite documentation conflict; fetchable URL/private-storage design tested; no unsupported music/interaction promise.
- **Tests:** `T-INSTAGRAM-PUBLISH-LIVE`, `T-MEDIA`, `T-IDEMPOTENCY`, `T-RETRY`.

### M9.5 — `feat(tiktok): verify audited-state direct posting`

- **Depends on:** M7.4/M9.2; private test creator/approved products; D-016 consent.
- **Deliver:** creator-info-driven consent/privacy/disclosure, file or verified URL transfer, status reconciliation, audit restriction handling and terminal post record.
- **Acceptance:** private `SELF_ONLY` test within actual client restrictions; success only on terminal confirmation; no default privacy/bypassed consent; public automation stays blocked until audit and explicit owner approval.
- **Tests:** `T-TIKTOK-PUBLISH-LIVE`, `T-IDEMPOTENCY`, `T-RETRY`, `T-A11Y`.
- **Phase exit:** supported test-account scenarios pass. Public automation requires a further explicit gate; unavailable platform features remain visible.

## Phase 10 — Sourced Creator Studio analytics

### M10.1 — `feat(analytics): sync youtube channel and video reports`

- **Depends on:** verified YouTube account/post association; analytics scope approval.
- **Deliver:** historical sync within limits, targeted Analytics and justified Reporting jobs, cursors/snapshots, metric definitions and freshness/error states.
- **Acceptance:** real authorized reports saved with account/post/interval/source/time; no invented/interpolated unavailable values; impressions/CTR/retention only where actual report supports them; repeated sync idempotent.
- **Tests:** `T-YOUTUBE-ANALYTICS-LIVE`, `T-ANALYTICS`, `T-RETRY`, `T-RBAC`.

### M10.2 — `feat(analytics): sync supported instagram and tiktok metrics`

- **Depends on:** each verified account; current endpoint/scope verification.
- **Deliver:** per-platform metric mappings, sync cursors, capability limitations, supported profile/post fields and stale/missing states.
- **Acceptance:** no assumed parity or audience-hour availability; estimated/in-development metrics labelled; unavailable permissions not shown as zero; account-specific evidence recorded.
- **Tests:** `T-INSTAGRAM-ANALYTICS-LIVE`, `T-TIKTOK-ANALYTICS-LIVE`, `T-ANALYTICS`, `T-CAPABILITIES`.

### M10.3 — `feat(studio): replace demo analytics with sourced read models`

- **Depends on:** M10.1/10.2 for connected platforms; may show unavailable for blocked ones.
- **Deliver:** account/channel/post/date-range comparisons, sourced charts/tables, freshness/definition tooltips, historical sync status and mixed demo/live prevention.
- **Acceptance:** values trace to snapshots; no cross-account aggregation presented as account performance; missing/stale/thresholded values explained; mobile charts accessible; demo never appears in live views.
- **Tests:** `T-ANALYTICS-UI`, `T-ANALYTICS`, `T-DEMO-ISOLATION`, `T-VIEWPORT`, `T-A11Y`.
- **Phase exit:** sourced/timestamped analytics, not claims of complete YouTube Studio parity.

## Phase 11 — Performance Lab and learning loop

### M11.1 — `feat(experiments): add evidence-limited performance comparisons`

- **Depends on:** sufficient real same-account observations; otherwise remain sparse-data state.
- **Deliver:** experiment hypothesis/variables/population/window/primary metric, supported weapon/scope/spray/hook/audio/duration/cover/title comparisons, sample size/exclusions and uncertainty.
- **Acceptance:** definitions and available metrics traceable; no causal claim from biased/small samples; zero-sample cannot rank winners; practical next experiment explains limitations.
- **Tests:** `T-EXPERIMENTS`, `T-LAB-UI`, `T-ANALYTICS`, `T-A11Y`.

### M11.2 — `feat(learning): version account recommendation updates`

- **Depends on:** M11.1; scheduler/content policies.
- **Deliver:** scheduled account-specific evaluation, input coverage/model version, recommendation explanations/confidence, supersession history and feedback into future schedules/content experiments.
- **Acceptance:** only same-account data used; sparse fallback persists; recommendation changes auditable/reversible; no promise of improved performance without evidence; owner can inspect why changed.
- **Tests:** `T-LEARNING`, `T-SCHEDULING`, `T-STRATEGIES`, `T-AUDIT`.
- **Phase exit:** auditable recommendations with limitations, not guaranteed growth.

## Phase 12 — Hardening, release candidate and operations

### M12.1 — `test(release): complete security accessibility and load gates`

- **Depends on:** implemented feature set; unresolved integrations explicitly excluded, not faked.
- **Deliver:** cross-workspace/OAuth/upload/secret/rate-limit tests; full mobile E2E/accessibility/performance; dependency review; large/interrupted upload and worker-load evidence.
- **Acceptance:** required test layers pass or release is blocked; target budgets measured on agreed reference device/network; no critical/high unmitigated security issue; all required viewports pass.
- **Tests:** `T-SECURITY`, `T-A11Y`, `T-VIEWPORT`, `T-LOAD`, `T-DEMO-E2E`, applicable live suites.

### M12.2 — `docs(operations): rehearse recovery and release readiness`

- **Depends on:** M12.1; approved operational environment for realistic restore tests.
- **Deliver:** backup/restore, key rotation, token revocation, export/delete/backup aging, monitoring/alerts, rollback/runbooks, user guide, privacy notice and release checklist.
- **Acceptance:** measured restore meets owner-approved RPO/RTO; deletion ledger survives restore; alerts fire in rehearsal; compatible migration rollback demonstrated; release notes accurately list unavailable features.
- **Tests:** `T-RECOVERY`, `T-PRIVACY`, `T-OPS`, `T-QUALITY`.

### M12.3 — `chore(release): deploy approved release candidate`

- **Depends on:** explicit deployment/production credential authorization, M12.2 acceptance and separate public-publishing decision.
- **Deliver:** authorized deployment, environment/domain/callback verification, post-deploy smoke/monitoring and rollback evidence; no new paid service beyond authorization.
- **Acceptance:** owner-approved artifact/environment deployed; production secrets correctly scoped; approved test smoke passes; public automation only for eligible explicitly enabled accounts; audit identifies exact release.
- **Tests:** authorized `T-PRODUCTION-SMOKE`, applicable live suites, `T-OPS`.
- **Exit:** owner accepts release. Until authorization this milestone remains PLANNED/BLOCKED, not silently executed.

## 5. Risks, missing requirements and blocker policy

| Risk / gap | Impact | Mitigation / decision gate |
|---|---|---|
| Empty repository / unproven modern dependency combination | Early rework | M1.1 clean-install compatibility gate; conservative pins |
| YouTube approval/quota and thumbnail documentation conflicts | Public publishing/feature eligibility | Current official recheck + actual project/test evidence; private first |
| Meta login paths and 50/100 quota conflict | Wrong OAuth or scheduler assumptions | D-015 app spike; live quota endpoint; no hard-coded guarantee |
| TikTok audit and per-post consent rules | Full automation may be unacceptable/unavailable | D-016; preserve required UX; no bypass; independent blocker |
| Gameplay inference accuracy / hallucinated achievements | Creator trust and factual safety | Consent-based evaluation set, evidence/unknowns, corrections and claim gate |
| Audio rights / voice privacy / AI data terms | Legal/privacy exposure | Rights attestation, provider terms and retention approval before real processing |
| Sparse/biased analytics and unavailable audience activity | Misleading best-time/lab claims | Same-account only, conservative fallback, freshness/coverage/uncertainty |
| Research access and lawful source availability | No current topics/keywords | D-013; attributed approved sources; unavailable state, no scraping |
| Ambiguous publish timeout | Duplicate public posts | Durable provider IDs and reconciliation before retry; attention state |
| Upload/FFmpeg/AI/egress cost and worker capacity | Unbounded spend or failed jobs | Product/job caps, measured benchmark, D-009/010/012 before paid processing |
| Token key hosting and multi-tenant storage | High-impact security failure | ADR-010, service-only broker, RLS/storage negatives, approved KMS design |
| Retention/jurisdiction/license unspecified | Privacy/distribution uncertainty | D-008/014/017 before real data/public distribution |
| PWA cache leaks / mobile memory pressure | Privacy and upload failures | Public-shell-only cache, direct resumable upload, device tests |
| External reviews have no guaranteed timeline | Phase delays | Parallel local work, per-platform gates, honest sprint blockers |

Missing inputs are not silently invented: real brand assets, account eligibility, research license, AI/worker budgets, posting cadence, retention/jurisdiction and essential metrics remain owner decisions. See [DECISIONS.md](DECISIONS.md).

## 6. Review and approval request

The first approval should cover the repository-specific plan, proposed local stack, personal-first/multi-account architecture, YouTube-first live sequence and safe defaults (explicit account enablement, bounded retries, required platform consent). It does **not** authorize cloud resources or public posting. Unresolved brand/budget/retention choices can remain deferred to their listed gates, but must be resolved before affected real-data work.

After approval, begin **M1.1 only**, prove the toolchain, update evidence/traceability, commit/push/verify and send the mandatory audit. Do not jump directly to all screens or real integrations.
