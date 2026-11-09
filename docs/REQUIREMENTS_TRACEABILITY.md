# Requirements traceability matrix

**Baseline:** unchanged `docs/PLAN.md`, version 1.1. **Prepared:** 2026-11-08 UTC. This matrix decomposes the complete brief, including governance, non-functional constraints, every screen, all workflow steps, demo data, testing and phase gates. Closely related fields/actions are grouped only when they share the same implementation and acceptance gate; no source section is intentionally excluded.

## Status and evidence semantics

Allowed statuses: `NOT STARTED`, `PLANNED`, `IN PROGRESS`, `BLOCKED`, `IMPLEMENTED`, `TESTED`, `ACCEPTED`. All product rows start **PLANNED / NOT RUN**. Nine M0.1 documentation deliverables and the expanded M1.1 artifact guard are **TESTED** using the actual checks in [TEST_EVIDENCE.md](TEST_EVIDENCE.md). M1.1 stack hardening is **IN PROGRESS** because browser/axe assertions remain NOT RUN in this sandbox; owner approval is recorded, but M1.1 is not fully verified or owner-accepted. Recurring commit/audit governance remains ongoing. A future destination is a proposed path, not an existing file. Test IDs resolve to [TEST_STRATEGY.md](TEST_STRATEGY.md); milestone acceptance criteria are in [MASTER_PLAN.md](MASTER_PLAN.md).

“Implementation destination” identifies where the requirement will land. “Evidence” distinguishes documentation checks from future executable tests. A Phase 0 plan for security does not implement security controls. Recurring governance is established as a documented process now and must be exercised at every future milestone. Platform-dependent rows remain blocked at their live gate until explicit authorization and actual evidence, even if their mocks pass.

## Complete requirement register

| ID | Brief source | Requirement / acceptance intent | Milestone | Status | Proposed implementation destination | Planned/present evidence |
|---|---|---|---|---|---|---|
| GOV-001 | §0 Stage A | Inspect complete repository/history/config/dependencies and preserve existing work before planning | M0.1 | TESTED | `REPOSITORY_AUDIT.md; original brief unchanged` | `T-DOC` PASS — [evidence](TEST_EVIDENCE.md), 2026-11-08 |
| GOV-002 | §0 Stage A | Produce repository-specific plan, risks, decisions, full traceability and acceptance/test strategy | M0.1 | TESTED | `MASTER_PLAN.md and required supporting docs` | `T-DOC` PASS — [evidence](TEST_EVIDENCE.md), 2026-11-08 |
| GOV-003 | §0,18 | Present Phase 0 for review and wait for approval before substantial implementation | M0.1 | TESTED | `DECISIONS.md approval ledger; SPRINT_STATUS.md` | Owner approval recorded 2026-11-08 — [decision ledger](DECISIONS.md) |
| GOV-004 | §0 Stage B | Implement small coherent milestones; test before commit; do not mark untested work complete | M3.1 | PLANNED | `MASTER_PLAN.md §2; TEST_STRATEGY.md evidence rules` | `T-QUALITY` — NOT RUN |
| GOV-005 | §0,4.2 | Commit logically and push fixed working branch when available; verify result; never force-push/overwrite shared work | M0.1 | PLANNED | `Git workflow; README operating rules` | `T-DOC` — NOT RUN |
| GOV-006 | §4.3 | Immediately after every commit/push provide exact concise audit fields, including failures and variance | M0.1 | PLANNED | `MASTER_PLAN.md §2; SPRINT_STATUS.md audit pointer` | `T-DOC` — NOT RUN |
| GOV-007 | §3,4.4 | Maintain all required populated docs, requirement statuses and phase audits continuously | M0.1 | TESTED | `Required docs; REQUIREMENTS_TRACEABILITY.md; TEST_EVIDENCE.md` | `T-DOC` PASS — [evidence](TEST_EVIDENCE.md), 2026-11-08 |
| GOV-008 | §16 | Definition of done includes code/tests/types/lint/build/responsive/states/security/docs/commit/verified push/audit | M12.1 | PLANNED | `TEST_STRATEGY.md release union; MASTER_PLAN.md §2` | `T-QUALITY` — NOT RUN |
| GOV-009 | §2.1 | No external resource creation/connection/provision/deployment/purchase/configuration without explicit permission | M0.1 | TESTED | `DECISIONS.md C-002 and separate resource gates` | `T-DOC` PASS — [evidence](TEST_EVIDENCE.md), 2026-11-08 |
| GOV-010 | §2.2 | Keep product completely separate from other product repositories/accounts/data/infrastructure/branding | M0.1 | TESTED | `REPOSITORY_AUDIT.md; ARCHITECTURE.md boundaries` | `T-DOC` PASS — [evidence](TEST_EVIDENCE.md), 2026-11-08 |
| GOV-011 | §2.3 | Never request/store social passwords; official OAuth; no hard-coded or committed secrets | M4.2 | PLANNED | `SECURITY_PRIVACY.md OAuth/token design` | `T-OAUTH` — NOT RUN |
| GOV-012 | §2.4 | Official documented APIs only; no scraping/browser bypass; verify capability/eligibility/review/quota before use | M7.1 | PLANNED | `INTEGRATIONS.md; capability gates` | `T-CAPABILITIES` — NOT RUN |
| GOV-013 | §2.4–2.5 | Never invent API results or claim Studio parity; unavailable/failed features stay unavailable | M7.1 | PLANNED | `Account capabilities and truthful error states` | `T-CAPABILITIES` — NOT RUN |
| GOV-014 | §2.5 | Represent all eight connection states and label every sample metric/action Demo data or Simulation | M2.1 | PLANNED | `Domain connection enum; DemoIndicator; fixtures` | `T-DEMO` — NOT RUN |
| GOV-015 | §3,16 | Use stable requirement IDs and distinguish NOT STARTED/PLANNED/IN PROGRESS/BLOCKED/IMPLEMENTED/TESTED/ACCEPTED | M0.1 | TESTED | `Matrix vocabulary and checker` | `T-DOC` PASS — [evidence](TEST_EVIDENCE.md), 2026-11-08 |
| GOV-016 | §4.1 | Inspect diffs and exclude secrets/media/local DB/build artifacts; update docs in same milestone | M1.1 | TESTED | `Ignore rules; Git-index/worktree artifact validator; server-only/secret tests; commit checklist` | `T-SECRET` foundation scope PASS — [hardening evidence](evidence/m1-1-hardening-validation.txt); recurring review required |
| PRD-001 | §1,5.1 | Upload once, analyse, research, create account content, schedule, officially publish, collect analytics and learn | M9.2 | PLANNED | `Shared media pipeline plus independent account services` | `T-UPLOAD-E2E` — NOT RUN |
| PRD-002 | §1,9 | Multi-account operations platform, not only metadata generator/calendar; many accounts per platform | M3.1 | PLANNED | `Tenant/account/content/job model` | `T-DOMAIN` — NOT RUN |
| PRD-003 | §1 | Initial complete product experience may use honest mocks; real integrations in later approved phases | M2.6 | PLANNED | `Ten-screen demo through isolated adapters` | `T-DEMO-E2E` — NOT RUN |
| PRD-004 | §5.2 | Configurable initial Up17 Gaming workspace and @up17longshotyt handle | M2.2 | PLANNED | `Workspace fixture/configuration, not hard-coded domain` | `T-SETTINGS` — NOT RUN |
| PRD-005 | §5.2 | Support BGMI/PUBG, AKM/M762/M416/M249, long-range sprays, scopes/recoil/verified moments and vertical shorts | M6.1 | PLANNED | `Configurable niche taxonomy and evaluation fixtures` | `T-AI-VISUAL` — NOT RUN |
| PRD-006 | §5.2 | Niche/voice/language/audience/categories/rules configurable for other creators | M8.2 | PLANNED | `Workspace/account strategy entities` | `T-STRATEGIES` — NOT RUN |
| PRD-007 | §5.3 | Explain content/schedule choices and associate analytics with correct account/post | M11.2 | PLANNED | `Recommendation versions and sourced read models` | `T-LEARNING` — NOT RUN |
| PRD-008 | §5.3 | Important operations auditable and recoverable; account failure isolated | M9.2 | PLANNED | `Audit/outbox/attempt history and independent queues` | `T-IDEMPOTENCY` — NOT RUN |
| UX-001 | §6.1 | Premium tactile clay surfaces, inset panels, rounded cards/pills, soft layered shadows/highlights | M1.2 | IN PROGRESS | `app/globals.css; components/ui; interactive preview` | `T-UI` / `T-A11Y` — core primitives and four-theme axe PASS; full primitive/state coverage continues in polish batch |
| UX-002 | §6.1 | Spacious bento, clear type/spacing, restrained gradients and purposeful subtle motion; avoid neon/glass/crowding/decorative charts | M2.6 | TESTED | `all populated screens; app/globals.css; rendered review` | `T-VIEWPORT` — desktop/mobile rendered review and six-width all-destination matrix PASS, 2026-11-08; owner visual acceptance separate |
| UX-003 | §6.2 | Central light/dark tokens with specified background/surfaces/text/muted/violet/cyan/semantic/border/shadow/focus roles | M1.2 | TESTED | `app/globals.css; lib/themes.ts; components/theme` | `T-UI` / `T-A11Y` — CSS token/contrast unit tests and four-theme browser/axe PASS, 2026-11-08 |
| UX-004 | §6.3 | Cards 20–28px; tactile pressed-inset buttons; inset labelled inputs with focus/error | M1.2 | IN PROGRESS | `components/ui; app/globals.css` | `T-UI` / `T-A11Y` — tactile preview/dialog keyboard PASS; remaining field/menu states continue |
| UX-005 | §6.3 | Pill/raised navigation, textual semantic badges, readable chart axes/legends/tooltips/empty states | M1.2 | IN PROGRESS | `components/shell; components/ui; app/globals.css` | `T-SHELL` / `T-A11Y` — raised/pill navigation and textual badges PASS; chart primitives pending |
| UX-006 | §6.3 | Short consistent motion respecting reduced motion; never color/shadow-only state | M1.2 | TESTED | `app/globals.css motion tokens; settings motion preference` | `T-A11Y` — four-theme all-destination axe plus local/device reduced-motion browser checks PASS, 2026-11-08 |
| UX-007 | §6.4 | Phone-first 320/360/390/430 plus tablet/desktop; no horizontal overflow; comfortable touch targets | M1.3 | TESTED | `responsive shell/screens; tests/e2e/polish.spec.ts` | `T-VIEWPORT` — 320/360/390/430/768/1440 across all twelve destinations PASS; touch target checks PASS |
| UX-008 | §6.4 | Mobile compact header/bottom nav or menu, stacked cards/full-width actions; tablet two columns; desktop sidebar/bento | M1.3 | TESTED | `components/shell/app-shell.tsx; app/globals.css` | `T-SHELL` / `T-VIEWPORT` — desktop sidebar, mobile bottom nav/More and six-width shell PASS |
| UX-009 | §6.4 | Core upload/preview/account/queue workflows usable on phone | M2.6 | IN PROGRESS | `touch phone journey; core demo screens` | `T-DEMO-E2E` — phone navigation/library/details/local draft PASS; real upload/preview unavailable and queue/account phone journey partial |
| UX-010 | §6.5 | One coherent modern sans family and consistent icon library | M1.2 | TESTED | `@fontsource-variable/inter; lucide-react; app/layout.tsx` | `T-UI` / `T-A11Y` — local font/icons rendered and reviewed; production build PASS |
| UX-011 | §7 | Exactly the ten named main destinations reachable in app navigation | M1.3 | TESTED | `lib/navigation.ts; app/(studio); components/shell` | `T-SHELL` — exactly ten canonical destinations plus Notifications/Design System utilities reachable on desktop and phone More; unit/browser and development-mode route-content regressions PASS |
| UX-012 | §7 | Shell brand/workspace selector/navigation/account context/notifications/theme/profile/mobile navigation | M1.3 | TESTED | `components/shell/app-shell.tsx; theme/profile/workspace controls` | `T-SHELL` / `T-A11Y` — search, workspace details, profile, theme, notifications entry and segment-aware active states PASS |
| UX-013 | §10 | Installable PWA with manifest and safe service-worker strategy | M1.3 | IN PROGRESS | `app/manifest.ts; public/sw.js; public/offline.html; public/icons` | `T-PWA` — manifest/icons/service-worker/public-cache/offline browser PASS; device install prompt NOT RUN |
| UX-014 | §13 Phase 2 | Every screen has applicable loading/empty/error/populated-demo states and working primary interactions | M2.6 | TESTED | `all ten screens + notifications; shared state primitives` | `T-STATE-UI` — demo/empty/unavailable/validation/storage-denial journeys PASS in local frontend scope; live service states pending |
| OVR-001 | §7.1 | Overview welcome/workspace/account summary and available views/posts/followers/engagement | M2.2 | IN PROGRESS | `components/overview/dashboard.tsx` | `T-OVERVIEW` — demo dashboard/empty metric states rendered and axe PASS; sourced live metrics pending |
| OVR-002 | §7.1 | Recent uploads, processing, queue summary, upcoming, recent published, highlights and attention alerts | M2.2 | IN PROGRESS | `components/overview/dashboard.tsx; demo fixtures` | `T-OVERVIEW` — recent/processing/queue/upcoming/attention demo sections PASS; live read models pending |
| OVR-003 | §7.1 | Demo metrics labelled; no implication of real connections | M2.2 | TESTED | `components/overview/dashboard.tsx; components/features/common.tsx` | `T-DEMO-ISOLATION` / `T-A11Y` — explicit demo labels, zero real connections and no invented metrics; browser/axe PASS |
| VID-001 | §7.2 | Desktop drag/drop and mobile file picker upload zone | M5.1 | PLANNED | `Video Studio upload intake` | `T-UPLOAD-E2E` — NOT RUN |
| VID-002 | §7.2 | MP4-first with future formats documented; product size/type validation | M5.1 | PLANNED | `Upload schema/config and UX format guidance` | `T-MEDIA` — NOT RUN |
| VID-003 | §7.2 | Real progress and resumable-upload-ready direct object-storage architecture, not serverless media proxy | M5.1 | PLANNED | `TUS intent/client/server verification` | `T-UPLOAD` — NOT RUN |
| VID-004 | §7.2 | Show title/thumbnail/preview/duration/size/dimensions/aspect/upload date | M5.2 | PLANNED | `Video/asset metadata read model` | `T-MEDIA` — NOT RUN |
| VID-005 | §7.2 | UPLOADED/QUEUED/ANALYSING/READY/NEEDS_ATTENTION/FAILED processing states | M3.1 | PLANNED | `Video state machine and persisted jobs` | `T-STATE` — NOT RUN |
| VID-006 | §7.2 | Library search/sort/filter and video detail | M2.3 | IN PROGRESS | `components/video-studio/video-library.tsx; features/demo` | `T-VIDEO-UI` — demo search/filter/sort/view/selection/detail browser PASS; real service contract pending |
| VID-007 | §7.2 | Retry/reprocess and delete with confirmation | M5.3 | PLANNED | `Guarded job/media lifecycle actions` | `T-UPLOAD-E2E` — NOT RUN |
| VID-008 | §7.2,5.3 | Preserve original and track derived media variants/lineage | M5.2 | PLANNED | `Private video_assets/media_variants` | `T-MEDIA` — NOT RUN |
| AI-001 | §7.3 visuals | Detect game only when supported; identify weapon and scope with confidence | M6.1 | PLANNED | `Structured visual analysis events` | `T-AI-VISUAL` — NOT RUN |
| AI-002 | §7.3 visuals | Map/location only if verifiable; engagement count and knock/elimination only if visually verified | M6.1 | PLANNED | `Evidence-linked observations/unknowns` | `T-AI-CLAIMS` — NOT RUN |
| AI-003 | §7.3 visuals | Visible distance indicator, spray type/continuity and recoil-control observations | M6.1 | PLANNED | `Timestamped visual event schema` | `T-AI-VISUAL` — NOT RUN |
| AI-004 | §7.3 visuals | Key moments/timestamps, hook strength, pacing/dead time and suggested clip boundaries | M6.1 | PLANNED | `Analysis timeline/clip suggestions` | `T-AI-VISUAL` — NOT RUN |
| AI-005 | §7.3 audio | Detect gunfire/game audio, voice/commentary and music when present | M6.2 | PLANNED | `Audio observation adapter` | `T-AI-AUDIO` — NOT RUN |
| AI-006 | §7.3 audio | Clipping/peaking, relative game/music/voice balance and audio improvements | M6.2 | PLANNED | `Audio measurements plus qualified suggestions` | `T-AI-AUDIO` — NOT RUN |
| AI-007 | §7.3 accuracy | Never invent weapon/map/distance/knock/kill/record/achievement; no world record without independent verification | M6.2 | PLANNED | `Verified claim registry and generation deny gate` | `T-AI-CLAIMS` — NOT RUN |
| AI-008 | §7.3 accuracy | Separate verified facts from estimates; confidence/correction; exclude unproven claims from metadata | M6.2 | PLANNED | `analysis_events/corrections and invalidation` | `T-AI-CLAIMS` — NOT RUN |
| AI-009 | §7.3 | Timestamped analysis timeline; illustrative demo clearly labelled | M2.3 | IN PROGRESS | `components/ai-content/ai-content.tsx` | `T-ANALYSIS-UI` — explicitly simulated generic timeline/unknown confidence browser PASS; real evidence events/corrections pending |
| MET-001 | §7.4 | Generate separate content for every selected platform account, including different audiences on same platform | M8.1 | PLANNED | `platform_content/content_versions per account` | `T-METADATA` — NOT RUN |
| MET-002 | §7.4 YouTube | Title/description/hashtags/tags/category/audience where supported | M8.1 | PLANNED | `YouTube package schema/capability validation` | `T-METADATA` — NOT RUN |
| MET-003 | §7.4 YouTube | Thumbnail selection/upload and text suggestions; visibility/publish settings where supported | M8.1 | PLANNED | `Cover assets and YouTube settings schema` | `T-CAPABILITIES` — NOT RUN |
| MET-004 | §7.4 YouTube | Pinned-comment suggestion; automate pinning only if official capability/permission verified | M8.1 | PLANNED | `Suggestion-only capability until evidence` | `T-CAPABILITIES` — NOT RUN |
| MET-005 | §7.4 Instagram | Caption/hashtags, Reel cover guidance and supported publishing settings | M8.1 | PLANNED | `Instagram package schema/preview` | `T-METADATA` — NOT RUN |
| MET-006 | §7.4 TikTok | Caption/hashtags, supported cover/privacy/interaction settings | M8.1 | PLANNED | `TikTok creator-info-driven package` | `T-METADATA` — NOT RUN |
| MET-007 | §7.4 shared | Ground facts in analysis; platform previews; current character/byte limits | M8.1 | PLANNED | `Claim references and versioned validators` | `T-AI-CLAIMS` — NOT RUN |
| MET-008 | §7.4 shared | Regeneration/version history and manual review during setup/testing | M8.2 | PLANNED | `Immutable content versions/review mode` | `T-STRATEGIES` — NOT RUN |
| MET-009 | §7.4 shared | After explicit full automation opt-in remove unnecessary per-video steps except platform/safety interventions | M8.2 | PLANNED | `Account automation policy and required-consent gates` | `T-STRATEGIES` — NOT RUN |
| RES-001 | §7.5 | Current relevant BGMI/PUBG topics, game updates/events and search terms/keywords | M6.3 | PLANNED | `Permitted research adapter/read model` | `T-RESEARCH` — NOT RUN |
| RES-002 | §7.5 | Content questions/audience interests and hashtag/topic relevance | M6.3 | PLANNED | `Relevant suggestions with rationale` | `T-RESEARCH` — NOT RUN |
| RES-003 | §7.5 | Competitor/public patterns only from lawful permitted sources; no copying creators | M6.3 | PLANNED | `Source allowlist/license and attribution` | `T-RESEARCH` — NOT RUN |
| RES-004 | §7.5 | No unrelated popular trends, invented patch/events/weapon changes/announcements | M6.3 | PLANNED | `Relevance/fact validation` | `T-AI-ADVERSARIAL` — NOT RUN |
| RES-005 | §7.5 | Source/date/freshness; verified facts separate from suggestions; save idea to brief | M2.4 | IN PROGRESS | `components/research; features/research` | `T-RESEARCH-UI` — editorial prompts/local brief CRUD and unavailable sources browser PASS; sourced research read model pending |
| SCH-001 | §7.6 | Day/week/month views, platform/account filters and video/account/time/status items | M2.5 | IN PROGRESS | `components/scheduler/smart-scheduler.tsx` | `T-SCHEDULER-UI` — demo day/week/month/agenda, filters and local slot browser PASS; service-backed scheduling pending |
| SCH-002 | §7.6 | Account-specific recommended slots; mobile rescheduling; desktop drag where practical with accessible alternative | M9.1 | PLANNED | `Recommendation/service-backed schedule controls` | `T-SCHEDULER-UI` — NOT RUN |
| SCH-003 | §7.6 | Workspace timezone and account timezone clarity; insufficient-analytics warning | M9.1 | PLANNED | `IANA zone value objects and coverage metadata` | `T-SCHEDULING` — NOT RUN |
| SCH-004 | §7.6 | Learn independently per account from own history/audience activity; never substitute another account | M11.2 | PLANNED | `Account-scoped recommendation inputs` | `T-LEARNING` — NOT RUN |
| SCH-005 | §7.6 | Consider weekday/local audience time/format/platform performance; explain reason/confidence | M9.1 | PLANNED | `Versioned scheduling policy/features` | `T-SCHEDULING` — NOT RUN |
| SCH-006 | §7.6 | Conservative sparse-data recommendations; owner windows/frequency caps/quiet hours/blackouts | M9.1 | PLANNED | `Constrained slot selection and fallback` | `T-SCHEDULING` — NOT RUN |
| SCH-007 | §7.6 | Prevent duplicate schedules and conflicting jobs | M9.1 | PLANNED | `Domain constraints/transactional uniqueness` | `T-IDEMPOTENCY` — NOT RUN |
| PUB-001 | §7.7 | Independent queue per account with all ten specified job statuses | M9.2 | PLANNED | `Account-scoped publishing_jobs/state machine` | `T-PUBLISH-STATE` — NOT RUN |
| PUB-002 | §7.7 | Platform/account/status filters, details and attempt history | M2.5 | IN PROGRESS | `components/queue/publishing-queue.tsx` | `T-QUEUE-UI` — demo status/platform/account filters and attempt detail PASS; durable queue pending |
| PUB-003 | §7.7 | Retry/cancel/reschedule and per-account pause/resume | M9.2 | PLANNED | `Guarded queue actions and pause state` | `T-PUBLISH-STATE` — NOT RUN |
| PUB-004 | §7.7 | Plain-language errors, duplicate prevention/idempotency and account failure isolation | M9.2 | PLANNED | `Error taxonomy/idempotency/reconciliation` | `T-IDEMPOTENCY` — NOT RUN |
| PUB-005 | §7.7 | Proposed initial+3 bounded exponential/jitter retries for transient failures; owner confirmation required | M9.2 | PLANNED | `Retry policy D-004` | `T-RETRY` — NOT RUN |
| PUB-006 | §7.7 | Respect rate limits/Retry-After; no indefinite permanent validation/permission retries | M9.2 | PLANNED | `Provider error classifier/defer/stop` | `T-RETRY` — NOT RUN |
| PUB-007 | §7.7 | Save draft/attention where supported, notify, preserve error/attempt history; no silent materially changed post | M9.2 | PLANNED | `Immutable digest/attention/notification flow` | `T-AUDIT` — NOT RUN |
| PUB-008 | §8 | Persist resumable state at every workflow step; no single long web request | M5.2 | PLANNED | `Durable jobs/outbox/checkpoints` | `T-WORKER` — NOT RUN |
| PUB-009 | §8 | Store platform post IDs/response states; success/failure/reauth/attention notifications | M9.2 | PLANNED | `published_posts/attempts/notifications` | `T-NOTIFICATIONS` — NOT RUN |
| PUB-010 | §8,13 Phase 9 | Publish through official YouTube API with durable upload/post state and private test evidence first | M9.3 | PLANNED | `YouTube publishing state machine` | `T-YOUTUBE-PUBLISH-LIVE` — NOT RUN |
| PUB-011 | §8,13 Phase 9 | Publish eligible Reel through official Instagram container flow with processing/quota/terminal evidence | M9.4 | PLANNED | `Instagram publishing state machine` | `T-INSTAGRAM-PUBLISH-LIVE` — NOT RUN |
| PUB-012 | §8,13 Phase 9 | Publish through official TikTok flow only within audit/consent restrictions and confirm terminal state | M9.5 | PLANNED | `TikTok publishing state machine` | `T-TIKTOK-PUBLISH-LIVE` — NOT RUN |
| STU-001 | §7.8 | Unified connected-channel view using official Data/Analytics/Reporting APIs as appropriate | M10.3 | PLANNED | `Creator Studio sourced read models` | `T-ANALYTICS-UI` — NOT RUN |
| STU-002 | §7.8 | Channel overview/existing videos/views/watch time/average duration where authorized/available | M10.1 | PLANNED | `YouTube report mappings` | `T-YOUTUBE-ANALYTICS-LIVE` — NOT RUN |
| STU-003 | §7.8 | Retention/subscriber gains-losses/traffic sources/impressions/CTR only where actual reports permit | M10.1 | PLANNED | `Capability-specific metrics, no Studio parity claim` | `T-YOUTUBE-ANALYTICS-LIVE` — NOT RUN |
| STU-004 | §7.8 | Per-video performance/date-range comparison; historical import after auth within limits | M10.3 | PLANNED | `Cursor-based snapshots and comparisons` | `T-ANALYTICS` — NOT RUN |
| STU-005 | §7.8 | Delayed/thresholded/unavailable metrics never invented/interpolated as actual; AI understanding separate from YouTube API | M10.3 | IN PROGRESS | `components/performance; components/overview` | `T-ANALYTICS-UI` — unavailable metrics never zero/interpolated in UI browser PASS; sourced availability model pending |
| STU-006 | §7.8 | Document actual Instagram/TikTok analytics by account type; no assumed parity | M10.2 | PLANNED | `Per-platform capability mappings` | `T-INSTAGRAM-ANALYTICS-LIVE` — NOT RUN |
| LAB-001 | §7.9 | Comparisons for weapons/scopes/spray/hook/audio/duration/pacing/cover/title/platform where data supports | M11.1 | PLANNED | `Configurable experiment feature dimensions` | `T-EXPERIMENTS` — NOT RUN |
| LAB-002 | §7.9 | Show definition/variables/sample/date/available metrics/results/confidence/limitations/next experiment | M11.1 | PLANNED | `Experiment workbench/read model` | `T-LAB-UI` — NOT RUN |
| LAB-003 | §7.9 | No causation from small/biased samples; distinguish correlation from effect evidence | M11.1 | PLANNED | `Statistical/coverage guards and language` | `T-EXPERIMENTS` — NOT RUN |
| SOC-001 | §7.10 | Multiple accounts per platform from beginning; each identity/owner/status/scopes/sync visible | M7.1 | IN PROGRESS | `components/accounts/accounts-board.tsx; demo identities` | `T-ACCOUNTS` — multi-identity demo UI/axe PASS; real account entities/auth pending |
| SOC-002 | §7.10 | Publishing enabled/paused, metadata strategy, timezone/schedule, queue and token expiry/reauth state | M7.1 | IN PROGRESS | `components/accounts/accounts-board.tsx` | `T-ACCOUNTS` — demo pause/settings/requirements UI PASS; live strategy/token state pending |
| SOC-003 | §7.10 | Disconnect/revoke, refresh and reauthorisation; architecture supports many accounts even if initially one/platform | M7.1 | PLANNED | `Token broker and independent account lifecycle` | `T-TOKENS` — NOT RUN |
| SOC-004 | §13 Phase 7 | Verified YouTube/Instagram/TikTok connections, capability checks and review dependencies | M7.4 | PLANNED | `Per-platform live gates and INTEGRATIONS.md` | `T-CAPABILITIES` — NOT RUN |
| SOC-005 | §13 Phase 7 | Verify actual YouTube channel OAuth/scopes/refresh/revocation and project eligibility before enabling actions | M7.2 | PLANNED | `YouTube adapter/capability record` | `T-YOUTUBE-LIVE` — NOT RUN |
| SOC-006 | §13 Phase 7 | Verify chosen Instagram login path/professional account/app access before enabling actions | M7.3 | PLANNED | `Instagram adapter/capability record` | `T-INSTAGRAM-LIVE` — NOT RUN |
| SOC-007 | §13 Phase 7 | Verify TikTok connection/audit restrictions and preserve required creator consent before enabling actions | M7.4 | PLANNED | `TikTok adapter/consent/capability record` | `T-TIKTOK-LIVE` — NOT RUN |
| SET-001 | §7.11 | Workspace profile/voice/niche/audience/default language | M2.2 | IN PROGRESS | `components/settings; features/preferences` | `T-SETTINGS` — local profile/voice/niche/audience/language validation and persistence browser PASS; workspace service pending |
| SET-002 | §7.11 | Default accounts/automation/approval/frequency/windows and notification preferences | M8.2 | IN PROGRESS | `components/settings; components/accounts` | `T-STRATEGIES` — local inbox preferences/demo pause UI PASS; real automation strategies pending |
| SET-003 | §7.11 | Theme/accessibility, export/deletion, connected services and security/session settings | M4.3 | IN PROGRESS | `components/settings; lib/local-data.ts` | `T-PRIVACY` — theme/motion/local export/confirmed reset browser PASS; cloud deletion/security services pending |
| DAT-001 | §9 | Refine all proposed entities: workspaces/members/social accounts/credentials/videos/assets/analysis/events/research | M3.1 | PLANNED | `DATA_MODEL.md entity dictionary` | `T-DOMAIN` — NOT RUN |
| DAT-002 | §9 | Refine platform content/versions/variants/strategies/jobs/attempts/posts/analytics/notifications/audit | M3.1 | PLANNED | `DATA_MODEL.md entity dictionary` | `T-DOMAIN` — NOT RUN |
| DAT-003 | §9,11 | Ownership/foreign keys/indexes/retention/RLS design; workspace/account scoped access | M4.1 | PLANNED | `Composite FKs/indexes/policies and service guards` | `T-RBAC` — NOT RUN |
| DAT-004 | §9 | One video may generate many packages; each account has own credentials/permissions/strategy/schedule/queue/analytics | M3.1 | PLANNED | `Account-specific immutable relationships` | `T-DOMAIN` — NOT RUN |
| ARC-001 | §10 | Validate proposed stack after repository audit | M1.1 | TESTED | `package.json; lockfile; server-only boundary; portable scripts; browser evidence` | `T-SCAFFOLD` / `T-QUALITY` / `T-A11Y` — local gates and fallback-browser preview PASS; owner acceptance separate |
| ARC-002 | §10 | Separate durable worker/queue selected by workload/cost; no long video work in short-lived serverless request | M5.2 | PLANNED | `worker supervisor and durable queue benchmark` | `T-QUEUE-LOCAL` — NOT RUN |
| ARC-003 | §10 | Structured logs/job traces/error tracking/audit; PWA and responsive web foundation | M12.2 | PLANNED | `Observability and operational runbooks` | `T-OPS` — NOT RUN |
| ARC-004 | §10,13 Phase 3 | Select queue after local durability/concurrency/workload evaluation; replaceable service adapters | M3.2 | PLANNED | `Queue benchmark; provider ports; ADR-005 evidence` | `T-QUEUE-LOCAL` — NOT RUN |
| ARC-005 | §10 | Provider interfaces allow AI/storage/queue/social replacement without rewriting product logic | M3.2 | PLANNED | `packages/ports and adapter contract suite` | `T-PORTS` — NOT RUN |
| SEC-001 | §11 | Workspace access control/RLS and secure sessions | M4.2 | PLANNED | `Membership guards/policies/session adapter` | `T-RBAC` — NOT RUN |
| SEC-002 | §11 | Server OAuth exchange, CSRF/state validation, least scopes, refresh/revocation | M4.2 | PLANNED | `OAuth attempts/token broker` | `T-OAUTH` — NOT RUN |
| SEC-003 | §2.3,11 | Encrypt stored tokens with deliberate key management; server-only secrets and redacted logs | M4.2 | PLANNED | `Envelope encryption/KMS decision/redaction` | `T-TOKENS` — NOT RUN |
| SEC-004 | §11 | Sensitive endpoint rate limits | M4.2 | PLANNED | `Workspace/account/IP-aware limiters` | `T-AUTH` — NOT RUN |
| SEC-005 | §11 | Upload validation/size/type limits and appropriate malware/content scan strategy | M5.1 | PLANNED | `Server object verification/worker isolation/scan gate` | `T-MEDIA` — NOT RUN |
| SEC-006 | §11 | Signed or short-lived media access; no private URL/token logging | M4.3 | PLANNED | `Scoped object delivery and redaction` | `T-STORAGE-POLICY` — NOT RUN |
| SEC-007 | §11 | Audit account connection/publishing/deletion/settings changes | M4.3 | PLANNED | `Append-only audit_logs` | `T-AUDIT` — NOT RUN |
| SEC-008 | §11 | Idempotent jobs, bounded retries and dead-letter | M9.2 | PLANNED | `Outbox/queue/fences/reconciliation` | `T-IDEMPOTENCY` — NOT RUN |
| SEC-009 | §11 | Backups/recovery, export/deletion and privacy notice/platform handling | M12.2 | PLANNED | `Recovery/privacy workflows and notices` | `T-RECOVERY` — NOT RUN |
| SEC-010 | §11 | Retention policy for originals/derivatives/analytics/logs | M4.3 | PLANNED | `D-008 approved lifecycle/holds/backup aging` | `T-PRIVACY` — NOT RUN |
| NOT-001 | §12 | In-app upload complete, analysis complete and content ready notifications | M2.6 | IN PROGRESS | `components/notifications; features/notifications` | `T-NOTIFICATIONS` — labelled processing/content demo inbox/read/filter browser PASS; event repository pending |
| NOT-002 | §12 | In-app scheduled/published/failed notifications | M9.2 | IN PROGRESS | `components/notifications; features/notifications` | `T-NOTIFICATIONS` — illustrative publishing notice layout browser PASS; job event subscribers pending |
| NOT-003 | §12 | In-app auth expired/permissions changed/sync complete/action required notifications | M10.2 | IN PROGRESS | `components/notifications; features/notifications` | `T-NOTIFICATIONS` — honest account/analytics attention examples browser PASS; real event subscribers pending |
| NOT-004 | §12 | Future email/push only after provider approval; in-app first | M12.2 | PLANNED | `Notification delivery port` | `T-PORTS` — NOT RUN |
| TST-001 | §14 unit | Test domain/metadata/scheduling/state/retry/capability/transformation rules | M3.1 | PLANNED | `Vitest unit catalog` | `T-DOMAIN` — NOT RUN |
| TST-002 | §14 integration | Test adapters/OAuth/tokens/DB isolation/upload jobs/queue idempotency | M4.1 | PLANNED | `Local integration catalog` | `T-PORTS` — NOT RUN |
| TST-003 | §14 E2E | Test navigation/upload/detail/content/accounts/scheduler/queue/theme flows | M2.6 | IN PROGRESS | `tests/e2e/{foundation,shell,core-screens,supporting-screens,polish}.spec.ts` | `T-DEMO-E2E` — 114 production browser assertions and 13 development-mode navigation assertions PASS across navigation/theme/library/drafts/scheduler/queue/accounts/settings/research/notifications; full upload-to-outcome demo journey pending |
| TST-004 | §14 security | Test cross-workspace/roles/OAuth CSRF/secrets/uploads/rate limits/redaction | M12.1 | PLANNED | `Security suite/threat review` | `T-SECURITY` — NOT RUN |
| TST-005 | §14 visual | Required phone widths plus tablet/desktop; record actual commands/results or NOT RUN reason | M1.3 | TESTED | `tests/e2e/{shell,core-screens,supporting-screens,polish}.spec.ts; docs/evidence` | `T-VIEWPORT` — six-width all-destination matrix (90 checks) and touch checks PASS; evidence recorded 2026-11-08 |
| TST-006 | §13 Phase 6 | Hallucination/accuracy tests and failure handling documented before analysis acceptance | M6.2 | PLANNED | `Labelled evaluation/claim safety gates` | `T-AI-CLAIMS` — NOT RUN |
| TST-007 | §13 Phase 9 | Sandbox/test-account scenarios before production publishing | M9.5 | PLANNED | `Private live provider suites` | `T-IDEMPOTENCY` — NOT RUN |
| TST-008 | §13 Phase 12 | E2E/security/accessibility/performance/upload/recovery/monitoring/rollback/user-doc release gates | M12.2 | PLANNED | `Release union and operations rehearsal` | `T-OPS` — NOT RUN |
| DEM-001 | §15 | Complete first website without real accounts/cloud; mock adapters for all product areas | M2.6 | PLANNED | `Deterministic demo composition` | `T-DEMO-E2E` — NOT RUN |
| DEM-002 | §15 | One account each YouTube/Instagram/TikTok plus extra multi-account samples | M2.1 | PLANNED | `Traceable identity fixtures` | `T-DEMO` — NOT RUN |
| DEM-003 | §15 | Several videos/timelines/platform metadata/scheduled/published posts/analytics/lab/notifications/failures | M2.1 | PLANNED | `Scenario fixture catalog` | `T-DEMO` — NOT RUN |
| DEM-004 | §15 | Every demo account/metric labelled; persistent mode indicator; no real network calls or publishing claims | M2.1 | PLANNED | `Network-isolated demo adapters/labels` | `T-DEMO-ISOLATION` — NOT RUN |
| OPS-001 | §13 Phase 1 | Responsive shell/theme/navigation/components/accessibility gate | M1.3 | PLANNED | `Phase 1 acceptance evidence` | `T-SHELL` — NOT RUN |
| OPS-002 | §13 Phase 3 | UI decoupled from demo data; replaceable adapters/test fixtures | M3.3 | PLANNED | `Service composition/ports` | `T-PORTS` — NOT RUN |
| OPS-003 | §13 Phase 4 | Auth/workspace/migrations/RLS/storage/audit setup instructions; security tests before hosted use | M4.3 | PLANNED | `Local-first data foundation and setup docs` | `T-RBAC` — NOT RUN |
| OPS-004 | §13 Phase 5 | Upload/resume/process/failure/retry paths tested | M5.3 | PLANNED | `Media acceptance suite` | `T-UPLOAD-E2E` — NOT RUN |
| OPS-005 | §13 Phase 8 | Accuracy/platform validation and account strategies before generation acceptance | M8.2 | PLANNED | `Grounded content gates` | `T-METADATA` — NOT RUN |
| OPS-006 | §13 Phase 10 | Metrics sourced/timestamped, never stale presented as live | M10.3 | PLANNED | `Snapshot/freshness read models` | `T-ANALYTICS` — NOT RUN |
| OPS-007 | §13 Phase 11 | Auditable recommendations, confidence/sample warnings, no unsupported causal claims | M11.2 | PLANNED | `Experiment/learning gates` | `T-LEARNING` — NOT RUN |
| OPS-008 | §13 Phase 12 | Explicit owner approval for deployment/production credentials; production/rollback plans | M12.3 | PLANNED | `Separate release authorization gate` | `T-PRODUCTION-SMOKE` — NOT RUN |
| OPS-009 | §17 | Surface brand/access/platform/retry/enablement/cadence/language/retention/AI/hosting/analytics decisions without inventing budget | M0.1 | TESTED | `DECISIONS.md owner register` | `T-DOC` PASS — [evidence](TEST_EVIDENCE.md), 2026-11-08 |
| OPS-010 | §4.4,18 | Owner can determine planned/implemented/tested/committed/pushed/remaining/blocked/next from docs and latest audit | M0.1 | TESTED | `SPRINT_STATUS.md; matrix; evidence ledger` | `T-DOC` PASS — [evidence](TEST_EVIDENCE.md); verified M0.1 delivery audit, 2026-11-08 |

## Source-section coverage checklist

This reverse map complements the precise section references above. It is a coverage aid, not a substitute for reviewing requirement wording. “Covered” means planned and traceable, not implemented.

| Original section | Requirement families / IDs | Planning destination |
|---|---|---|
| §0 Planning/approval governance | GOV-001–004 | MASTER_PLAN §§1–4; DECISIONS |
| §1 Mission | PRD-001–003 | ARCHITECTURE; MASTER_PLAN |
| §2 Boundaries/truthfulness | GOV-009–014; SEC-003 | SECURITY_PRIVACY; INTEGRATIONS |
| §3 Required docs/status vocabulary | GOV-007,015 | All required docs; this matrix |
| §4 Commit/push/audit | GOV-005–007,016 | README; SPRINT_STATUS; TEST_EVIDENCE |
| §5 Goals/initial profile/success | PRD-001–008 | MASTER_PLAN; UX; DATA_MODEL |
| §6 Visual/theme/components/responsive/type | UX-001–010 | UX_DESIGN_SYSTEM |
| §7 Shell and all ten screens | UX-011–014; OVR/VID/AI/MET/RES/SCH/PUB/STU/LAB/SOC/SET families | UX screen inventory; phased milestones |
| §8 End-to-end workflow/persistence | PUB-008–009; PRD-001; media/content/schedule/account families | ARCHITECTURE flows; M5–M10 |
| §9 Multi-account/entity model | DAT-001–004; PRD-002 | DATA_MODEL |
| §10 Technical direction/PWA/providers | ARC-001–003; UX-013 | ARCHITECTURE; candidate toolchain |
| §11 Security/privacy/reliability | SEC-001–010 | SECURITY_PRIVACY; DATA_MODEL |
| §12 Notifications | NOT-001–004 | Notification events and M2.6/M9/M10 |
| §13 Every suggested phase/exit gate | OPS-001–008; TST-006–008; SOC-004; all feature families | MASTER_PLAN Phases 0–12 |
| §14 Required test layers/evidence | TST-001–005 | TEST_STRATEGY catalog |
| §15 Complete honest demo | DEM-001–004 | M2.1–M2.6; demo isolation |
| §16 Definition of done | GOV-008,015–016 | TEST_STRATEGY; commit workflow |
| §17 Owner decisions | OPS-009 | DECISIONS D-001–D-017 |
| §18 First instruction/progress visibility | GOV-003; OPS-010 | SPRINT_STATUS; approval ledger |

## Update contract

At each milestone update the affected row status, actual implementation path and command/result evidence together. Split a row if implementation/testing diverges; do not silently mark a grouped requirement complete when one part is missing. Keep prior evidence dates and superseded decisions. At phase exit publish counts by status and blockers. Owner acceptance is recorded separately from test success.

<!-- coverage-manifest
0=GOV-001,GOV-002,GOV-003,GOV-004
1=PRD-001,PRD-002,PRD-003
2=GOV-009,GOV-010,GOV-011,GOV-012,GOV-013,GOV-014
3=GOV-007,GOV-015
4=GOV-005,GOV-006,GOV-007,GOV-016
5=PRD-004,PRD-005,PRD-006,PRD-007,PRD-008
6=UX-001,UX-002,UX-003,UX-004,UX-005,UX-006,UX-007,UX-008,UX-009,UX-010
7=UX-011,UX-012,UX-014,OVR-001,VID-001,AI-001,MET-001,RES-001,SCH-001,PUB-001,STU-001,LAB-001,SOC-001,SET-001
8=PUB-008,PUB-009,PRD-001
9=DAT-001,DAT-002,DAT-003,DAT-004
10=ARC-001,ARC-002,ARC-003,ARC-004,ARC-005,UX-013
11=SEC-001,SEC-002,SEC-003,SEC-004,SEC-005,SEC-006,SEC-007,SEC-008,SEC-009,SEC-010
12=NOT-001,NOT-002,NOT-003,NOT-004
13=OPS-001,OPS-002,OPS-003,OPS-004,OPS-005,OPS-006,OPS-007,OPS-008,TST-006,TST-007,TST-008,SOC-004,SOC-005,SOC-006,SOC-007,ARC-004,PUB-010,PUB-011,PUB-012
14=TST-001,TST-002,TST-003,TST-004,TST-005
15=DEM-001,DEM-002,DEM-003,DEM-004
16=GOV-008,GOV-015,GOV-016
17=OPS-009
18=GOV-003,OPS-010
-->
