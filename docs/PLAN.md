# Up17 AutoPublisher — Master Product & Delivery Plan

**Document type:** Agent operating brief + product requirements + implementation governance  
**Version:** 1.1  
**Prepared:** 9 November 2026  
**Project stage:** Planning first; implementation only after the plan is produced and reviewed  
**Primary brand/workspace:** Up17 Gaming (`@up17longshotyt`)  
**Initial content niche:** BGMI / PUBG Mobile  
**Target experience:** Mobile-first web application / installable PWA  
**Visual direction:** Premium claymorphism-inspired UI

---

# 0. The most important instruction to the agent

You are responsible for turning this brief into a complete, realistic, traceable engineering plan and then implementing that approved plan in small, verifiable stages.

**Do not jump straight into coding. Do not start building screens before producing the plan. Do not silently skip requirements.**

Work in two major stages:

## Stage A — Plan, audit and prepare

1. Inspect the GitHub repository and its current contents.
2. Identify the framework, existing code, configuration, dependencies, scripts, branches and current Git state.
3. Do not overwrite or delete existing work without explaining why.
4. Convert this document into a complete project-specific implementation plan.
5. Identify missing requirements, technical uncertainties, API limitations, security risks, dependencies and decisions that require the owner's approval.
6. Create a requirements traceability matrix so every requirement can be tracked from plan to implementation and tests.
7. Create a phased roadmap with dependencies, acceptance criteria, test strategy and deliverables for every phase.
8. Create and maintain project documentation files listed in Section 3.
9. Present the plan and outstanding decisions to the owner before beginning substantial implementation.

The plan must be specific to the repository after inspection. Do not merely repeat this document.

## Stage B — Implement the approved plan

After the plan is presented and the owner approves proceeding:

1. Implement one small, coherent milestone at a time.
2. Test each milestone before committing.
3. Make a logical Git commit for each completed unit of work.
4. Push the commit to the configured GitHub remote when authentication and remote configuration are available.
5. **After every commit and push, provide the owner with a short audit report** using the exact template in Section 4.
6. Update the roadmap, requirements matrix, test evidence and decision log after each milestone.
7. Do not mark work complete just because code was written. Mark it complete only when the acceptance criteria and required tests pass.
8. Stop and report blockers honestly. Do not conceal failures or mark unfinished work as done.

If push is unavailable because no remote or authentication is configured, do not pretend it was pushed. Report the commit hash, explain the blocker and ask for the required owner action.

---

# 1. Project mission

Build **Up17 AutoPublisher**, an AI-powered creator automation studio that lets a creator upload one original video and manage the content workflow across YouTube, Instagram and TikTok.

The intended workflow:

> Upload once → analyse the footage and audio → research relevant topics → create platform/account-specific content → choose a suitable publishing time for each account → publish automatically where official APIs permit → collect analytics → improve future decisions.

This is intended to become a multi-account creator operations platform, not merely a title/caption generator or a social media calendar.

The initial website should establish the complete product experience and a sound application foundation. Real integrations must be added in later, explicitly planned phases. A polished demo interface must never be misrepresented as a working integration.

# 2. Project boundaries and non-negotiable constraints

## 2.1 No cloud-resource creation without explicit permission

The owner is still planning the project and will create new accounts and cloud resources separately.

**Do not create, connect, provision, deploy, purchase or configure production resources until the owner explicitly authorises that action.**

This includes:
- Supabase organisations or projects, databases, storage buckets or authentication.
- Vercel projects, deployments, domains or paid services.
- Google Cloud projects, OAuth clients, API credentials or consent-screen publication.
- Meta developer apps, Instagram permissions or credentials.
- TikTok developer apps, scopes or credentials.
- Paid AI services, video-processing services, queues, storage or analytics.
- Any other paid or externally hosted infrastructure.

You may prepare local code, configuration examples, architecture documents, mock adapters and setup instructions. Do not connect them to real resources without approval.

## 2.2 Complete separation from ProGlass Automation

This is a completely separate product.

Do not reuse ProGlass repositories, accounts, Supabase organisations, databases, storage, credentials, deployments, customer data, project assets or architecture resources. Do not add ProGlass branding or references.

## 2.3 Credentials and privacy

- Never request or store a user's social-media password.
- Use official OAuth authorisation flows.
- Never hard-code secrets, API keys, tokens or private URLs.
- Never commit `.env` files or credentials.
- Keep secrets server-side and encrypt stored OAuth tokens using a deliberate key-management design.
- Redact tokens and sensitive values from logs, error reports and audit output.
- Use least-privilege scopes.
- Provide account disconnect and token revocation handling.
- Separate workspace and account data at the database and service layers.

## 2.4 Platform policy and API honesty

Use official platform APIs and documented capabilities.

- Do not use unofficial scraping or browser automation to bypass platform restrictions.
- Do not promise that every platform account type or media format supports automatic publishing.
- Verify current API capabilities, account eligibility, scopes, app review requirements, quotas and restrictions before implementation.
- Distinguish API-supported actions from UI-only suggestions.
- A failed or unavailable API feature must be shown as unavailable, not simulated as successful.
- Do not claim that the YouTube APIs reproduce all of YouTube Studio.

## 2.5 Product truthfulness

Every integration and data source must have a clear state:
- Not connected.
- Demo mode.
- Connected.
- Syncing.
- Needs authorisation.
- Limited permissions.
- Error.
- Disconnected.

All sample metrics and simulated activity must be visibly labelled **Demo data** or **Simulation**. Never fabricate live analytics, publishing success or API results.

# 3. Required project documentation

Create and maintain these documents in the repository. Adapt names only if the repository already has a sensible equivalent.

| File | Purpose |
|---|---|
| `README.md` | Project overview, local setup, scripts, status and links to docs |
| `docs/MASTER_PLAN.md` | Detailed implementation plan and phased roadmap |
| `docs/REQUIREMENTS_TRACEABILITY.md` | Requirement ID, description, phase, status, implementation and test evidence |
| `docs/ARCHITECTURE.md` | System context, components, data flow, service boundaries and deployment design |
| `docs/DATA_MODEL.md` | Entities, relationships, ownership, retention and security rules |
| `docs/INTEGRATIONS.md` | Platform API capabilities, scopes, limitations, app-review and setup status |
| `docs/SECURITY_PRIVACY.md` | Threat model, OAuth, token storage, access control, privacy and logging |
| `docs/UX_DESIGN_SYSTEM.md` | Claymorphism tokens, components, responsive rules and accessibility |
| `docs/TEST_STRATEGY.md` | Unit, integration, end-to-end, security and acceptance testing |
| `docs/DECISIONS.md` | Dated architectural/product decisions and rationale |
| `docs/CHANGELOG.md` | User-visible changes by milestone |
| `docs/SPRINT_STATUS.md` | Current phase, completed items, remaining work and blockers |

Also maintain:
- A requirements ID scheme, e.g. `UX-001`, `VID-001`, `AI-001`, `SOC-001`, `PUB-001`, `ANA-001`, `SEC-001`, `OPS-001`.
- A status vocabulary: `NOT STARTED`, `PLANNED`, `IN PROGRESS`, `BLOCKED`, `IMPLEMENTED`, `TESTED`, `ACCEPTED`.
- A clear distinction between implemented, tested and owner-accepted.

Do not create empty documents merely to make the repository look complete. Populate them with meaningful project-specific information.

# 4. Mandatory commit, push and audit process

This process is mandatory after **every commit and push**.

## 4.1 Before each commit

- Run relevant formatting/lint checks.
- Run type checks.
- Run relevant unit/integration/end-to-end tests.
- Run a production build for milestones where applicable.
- Inspect `git diff` and `git status`.
- Check that no secrets, tokens, local database files, large media files or generated build artifacts are included.
- Update relevant project documents and traceability statuses.
- Ensure the commit contains one coherent unit of work.

Do not commit failing code unless the commit is explicitly a documented work-in-progress approved by the owner. Prefer fixing the failure first.

## 4.2 Commit and push

- Use a clear conventional commit message, for example `feat(video-studio): add upload library interface`.
- Commit only the intended files.
- Push the branch to the configured remote after a successful commit, if remote/authentication are available.
- Never force-push, rewrite shared history, delete branches or overwrite remote work without explicit permission.
- Never claim a push succeeded without verifying the push result.

## 4.3 Audit report after every commit and push

Immediately after each successful commit and push, send a concise report to the owner. Do not wait until the end of a phase.

Use this format:

### Commit audit — [short commit message]

- **Commit:** `[short hash]`
- **Branch:** `[branch]`
- **Push:** `SUCCESS` / `NOT PUSHED — reason`
- **What changed:** 2–5 concise bullets.
- **Requirements completed:** IDs and short descriptions.
- **Tests:** commands run and pass/fail results.
- **Build:** pass/fail/not applicable.
- **Remaining:** next unfinished requirements or tasks.
- **Known issues / risks:** list them, or write `None known`.
- **Plan variance:** any deviation from the approved plan; explain why.
- **Next step:** one specific next milestone.

The report must be factual and short enough to review quickly. Do not say “everything is complete” when only one slice is done.

## 4.4 Keep the audit trail current

Update `docs/SPRINT_STATUS.md` and `docs/REQUIREMENTS_TRACEABILITY.md` in the same milestone where statuses change. The owner should be able to compare:
- What the plan required.
- What has been implemented.
- What has actually been tested.
- What has been committed and pushed.
- What remains.

At the end of each phase, produce a phase audit with requirement totals by status and a list of blockers.

# 5. Product goals and success criteria

## 5.1 Primary goals

1. Upload one original video from a phone.
2. Analyse gameplay visuals and audio.
3. Research relevant current BGMI/PUBG topics and search terms.
4. Generate different metadata for each platform and account.
5. Support multiple accounts on YouTube, Instagram and TikTok.
6. Automatically publish to eligible, connected and enabled accounts after initial setup.
7. Schedule independently for each account using that account's own performance history.
8. Review available channel, post and video analytics in one Creator Studio.
9. Learn from performance and improve future recommendations.
10. Notify the owner about successful jobs, failures, expired authorisation and actions requiring attention.

## 5.2 Initial creator profile

The first workspace should be configurable for **Up17 Gaming**, handle `@up17longshotyt`.

Initial content niche:
- BGMI / PUBG Mobile.
- AKM, M762/Beryl, M416 and M249.
- Long-range sprays and skill showcases.
- Scope changes, recoil control and verified knock/elimination moments.
- Short-form vertical content.

Do not hard-code the product to gaming. Make niche, brand voice, language, target audience, content categories and publishing rules configurable per workspace.

## 5.3 Success criteria

The product is successful when:
- A creator can upload a video from a phone.
- The system can track its processing state and preserve the original file.
- AI analysis produces evidence-based observations with confidence/uncertainty.
- Separate platform/account content packages can be generated.
- The creator can configure account-level automatic publishing rules.
- Eligible jobs can be scheduled and published through approved official APIs.
- A failure on one account does not stop other accounts.
- Available analytics can be associated with the correct account and post.
- The system can explain why a recommended schedule/content choice was made.
- Every important operation is auditable and recoverable.

# 6. User experience and visual design system

## 6.1 Visual direction: premium claymorphism

Build a tactile, soft, modern creator studio using a **claymorphism-inspired** visual language.

The result should feel premium and playful without appearing childish or like a generic admin template.

Use:
- Soft raised surfaces and inset clay panels.
- Rounded cards and pill-shaped controls.
- Layered soft shadows and subtle highlights.
- Spacious bento-grid layouts.
- Clear typography and generous spacing.
- Restrained gradients.
- Small, purposeful animations for hover, press, loading and state changes.

Avoid:
- Excessive neon.
- Excessive glassmorphism.
- Heavy shadows that harm readability.
- Too many gradients.
- Tiny text or crowded mobile screens.
- Decorative charts with no useful information.

## 6.2 Theme system

Implement light and dark themes with central CSS variables/tokens.

Light theme:
- Warm off-white or very light lavender background.
- Soft white raised surfaces.
- Pale lilac/cool-grey secondary surfaces.
- Violet/indigo primary accent.
- Cyan/teal secondary accent.
- Deep navy/charcoal text.
- Semantic green, amber and coral states.

Dark theme:
- Deep navy/charcoal background.
- Layered dark slate surfaces.
- Violet primary and cyan secondary accents.
- Near-white primary text and cool-grey muted text.

Suggested tokens:
`--background`, `--surface`, `--surface-raised`, `--surface-inset`, `--text`, `--muted`, `--primary`, `--secondary`, `--success`, `--warning`, `--danger`, `--border`, `--shadow-raised`, `--shadow-inset`, `--focus-ring`.

## 6.3 Component design rules

- Cards: 20–28px corner radius, subtle border/highlight and restrained raised shadow.
- Buttons: tactile raised state; pressed state becomes subtly inset.
- Inputs: inset surface, clear label, visible focus ring and useful error text.
- Navigation: soft pill or raised active state.
- Status: compact semantic badges with text labels, not colour alone.
- Charts: readable axes, legends, tooltips and empty states.
- Motion: short and consistent; respect `prefers-reduced-motion`.
- Avoid relying only on colour or shadow to communicate state.

## 6.4 Responsive requirements

Phone-first is mandatory:
- Test 320px, 360px, 390px and 430px viewport widths.
- Mobile: compact header, bottom navigation or a well-designed collapsible menu, stacked cards and full-width primary actions.
- Tablet: adaptive two-column layouts.
- Desktop: persistent sidebar and wider bento layout.
- No horizontal overflow.
- Touch targets should be comfortable.
- Core upload, preview, account and queue workflows must work on a phone.

## 6.5 Typography and icons

Use one coherent modern sans-serif family such as Geist or Inter. Use a consistent icon library such as Lucide. Avoid mixing icon styles.

# 7. Application navigation and screens

Main navigation:

1. Overview
2. Video Studio
3. AI Content
4. Smart Scheduler
5. Publishing Queue
6. Creator Studio
7. Research Centre
8. Performance Lab
9. Accounts
10. Settings

The app shell should include:
- Brand mark and workspace selector.
- Main navigation.
- Current account/workspace context.
- Notifications.
- Theme switcher.
- User/profile menu.
- Responsive mobile navigation.

## 7.1 Overview dashboard

Show:
- Welcome header and selected workspace.
- Connected account summary by platform.
- Views, posts, subscribers/followers and engagement when data exists.
- Recent uploads.
- Processing activity.
- Publishing queue summary.
- Upcoming scheduled posts.
- Recent published activity.
- Performance highlights.
- Alerts requiring attention.

All demo metrics must be labelled **Demo data**. Do not imply that accounts are connected when they are not.

## 7.2 Video Studio

Features:
- Upload zone with desktop drag/drop and mobile file picker.
- MP4-first initial experience; document future supported formats.
- Upload progress and resumable-upload-ready architecture.
- Video name/title, thumbnail/preview, duration, file size, dimensions, aspect ratio and upload date.
- Processing states: `UPLOADED`, `QUEUED`, `ANALYSING`, `READY`, `NEEDS_ATTENTION`, `FAILED`.
- Library search, sorting and filtering.
- Video details view.
- Retry/reprocess and delete with confirmation.
- Original file preservation and derived media variant tracking.

Large media must not be sent through short-lived serverless request handlers. Future upload design should use direct/resumable upload to object storage and background processing.

## 7.3 AI Gameplay Analysis

Analyse video visuals and audio.

Visual/gameplay observations:
- Game identification, if detectable.
- Weapon identification with confidence.
- Scope identification with confidence.
- Map/location, only if verifiable.
- Engagement count.
- Knock/elimination events, only if visually verifiable.
- Visible distance indicator, if present.
- Spray type and continuity.
- Recoil-control observations.
- Key moments and timestamps.
- Opening hook strength.
- Video pacing and dead time.
- Suggested clip start/end points.

Audio observations:
- Gunfire/game audio.
- Voice/commentary if present.
- Music.
- Clipping/peaking.
- Relative game/music/voice balance.
- Suggested audio improvements.

Accuracy rules:
- Never invent weapon, map, distance, knock, kill, record or achievement claims.
- Separate visually verified facts from AI estimates.
- Show confidence and allow correction.
- If footage does not prove a claim, do not include it in generated metadata.
- Never claim a world record without independent verification.

Provide a timestamped analysis timeline. Demo mode may show illustrative sample analysis, clearly labelled.

## 7.4 AI Content / Metadata Studio

Generate content separately for every selected platform account.

### YouTube content package
- Title.
- Description.
- Hashtags.
- Tags/keywords where supported.
- Category/audience settings where supported.
- Thumbnail selection/upload and thumbnail text suggestions.
- Pinned-comment suggestion; only automate pinning if the official API and account permissions support it.
- Visibility and publishing settings where supported.

### Instagram content package
- Caption.
- Hashtags.
- Reel cover/thumbnail guidance where supported.
- Publishing settings supported by the connected account/API.

### TikTok content package
- Caption.
- Hashtags.
- Cover selection where supported.
- Privacy and interaction settings supported by the API and account.

Shared requirements:
- Do not copy one generic caption to every platform.
- Allow account-specific variations for different audiences.
- Ground factual claims in video analysis.
- Provide platform previews.
- Show character counts and validate current platform limits.
- Provide regeneration and version history.
- Allow manual review during setup/testing.
- After the owner enables full automation, do not require per-video manual title, caption, hashtag, schedule or approval steps unless a platform or safety rule requires intervention.

## 7.5 Research Centre

Research relevant content opportunities:
- Current BGMI/PUBG Mobile topics.
- Relevant game updates and events.
- Relevant search terms and keywords.
- Content questions and audience interests.
- Hashtag/topic relevance.
- Competitor/public content patterns only where collected lawfully and through permitted sources.

Rules:
- Do not recommend unrelated trends just because they are popular.
- Display source, date and freshness where research uses external information.
- Separate verified facts from suggestions.
- Do not invent patch notes, events, weapon changes or game announcements.
- Do not copy other creators' content.
- Allow the user to save research ideas to a content brief.

## 7.6 Smart Scheduler

Provide:
- Day, week and month calendar views.
- Filters by platform and account.
- Video, platform, account, scheduled time and status on each item.
- Account-specific recommended time slots.
- Mobile-friendly rescheduling.
- Desktop drag-and-drop where practical.
- Workspace time zone and account time-zone clarity.
- Warnings when insufficient analytics exist.

Scheduling engine:
- Learn independently for every account.
- Use that account's historical performance and audience activity where available.
- Consider day of week, local audience time, content format and platform-specific performance.
- Do not treat another account's data as a substitute.
- Explain the reason for a recommendation and show confidence.
- Start with conservative recommendations when data is sparse.
- Let the owner set posting windows, frequency caps, quiet hours and blackout periods.
- Prevent duplicate schedules and conflicting jobs.

## 7.7 Publishing Queue

Each account has an independent queue.

Statuses:
- Draft.
- Ready.
- Scheduled.
- Waiting for authorisation.
- Publishing.
- Published.
- Failed.
- Retry scheduled.
- Needs attention.
- Cancelled.

Features:
- Filter by platform/account/status.
- Job details and attempt history.
- Retry controls.
- Cancel/reschedule.
- Error explanation in plain language.
- Per-account pause/resume.
- Duplicate prevention/idempotency.
- One account's failure must not block jobs for other accounts.

Failure policy requires owner confirmation during planning. Recommended default:
1. Retry transient failures with bounded exponential backoff.
2. Respect platform rate limits and `Retry-After`.
3. Do not retry permanent validation/permission failures indefinitely.
4. Save a draft or mark `NEEDS_ATTENTION` where supported.
5. Notify the owner.
6. Preserve error and attempt history.

Do not silently publish a materially changed post after a failure.

## 7.8 Creator Studio

Provide a unified view of connected channels and available analytics.

For YouTube, investigate and use the official:
- YouTube Data API v3 for supported channel/video metadata and publishing operations.
- YouTube Analytics API for supported reports and metrics.
- YouTube Reporting API where bulk reporting is appropriate.

Potential views, subject to API availability and permission:
- Channel overview.
- Existing published videos.
- Views.
- Watch time.
- Average view duration.
- Audience retention where available.
- Subscribers gained/lost where available.
- Traffic sources where available.
- Impressions/click-through metrics where available.
- Per-video performance.
- Date-range comparison.

Important:
- Public APIs do not expose every feature in YouTube Studio.
- Some analytics are delayed, thresholded, unavailable or subject to API reporting rules.
- Do not invent or interpolate unavailable analytics and present them as actual values.
- AI video understanding is a separate video-processing capability, not a YouTube API feature.
- Historical video analytics may be imported after account authorisation and within API limits.

For Instagram and TikTok, document actual official API analytics available for the connected account type. Do not assume parity with YouTube.

## 7.9 Performance Lab

Focus on evidence-based content experiments.

Potential comparisons:
- AKM vs M762 vs M416 vs M249.
- Scope types.
- Continuous spray vs multiple engagements.
- Hook type and first few seconds.
- Audio mix.
- Video duration and pacing.
- Thumbnail/cover styles.
- Title/caption styles.
- Platform-specific performance.

Show:
- Experiment definition.
- Variables being compared.
- Sample size and date range.
- Metrics actually available.
- Results and confidence/limitations.
- Practical next experiment.

Do not imply causation from small or biased samples. Distinguish correlation from evidence of an effect.

## 7.10 Accounts

Support multiple accounts on each platform from the beginning.

For each connected account show:
- Platform and account identity.
- Workspace owner.
- Connection status.
- Granted scopes/permissions.
- Last successful sync.
- Publishing enabled/paused.
- Account-specific metadata strategy.
- Time zone and schedule settings.
- Queue status.
- Token expiry/reauthorisation state.
- Disconnect/revoke option.

The architecture must allow many accounts even if the first workspace connects only one account per platform.

## 7.11 Settings

Include:
- Workspace profile and brand voice.
- Content niche and audience.
- Default language.
- Default platform/account selection.
- Automation rules.
- Publishing frequency and time windows.
- Approval mode.
- Notification preferences.
- Theme and accessibility.
- Data export/deletion controls.
- Connected services.
- Security/session settings.

# 8. Core automation workflow

The intended end-to-end workflow:

1. Creator uploads an original video from a phone.
2. System stores the original safely and creates a processing job.
3. Background worker extracts media metadata, frames and audio.
4. AI analysis identifies only evidence-supported gameplay and audio details.
5. Research service gathers relevant current topic/keyword context.
6. Content engine creates distinct metadata packages for each enabled account.
7. Validation checks factual claims, required fields, platform limits and account capabilities.
8. Scheduler calculates a recommended time independently for each account.
9. Publishing jobs are created for eligible accounts.
10. Worker publishes through the relevant official platform API.
11. Platform post IDs and response states are stored.
12. Analytics sync collects supported metrics.
13. Performance service updates account-specific insights and future recommendations.
14. Notifications report success, failure, reauthorisation and attention-needed events.

At each step, persist state so work can resume after a crash or deployment. Do not rely on one long-running web request.

# 9. Multi-account architecture

Use one shared media/analysis pipeline and independent account-level publishing pipelines.

Conceptual model:
- One workspace can contain many social accounts.
- One uploaded video can generate many platform/account content packages.
- Every account has its own credentials, permissions, strategy, schedule, queue and analytics.
- A job failure for one account must not affect other accounts.
- All data access must be scoped to the authorised workspace/account.

Proposed domain entities:
- `workspaces`
- `workspace_members`
- `social_accounts`
- `account_credentials`
- `videos`
- `video_assets`
- `video_analysis`
- `analysis_events`
- `research_items`
- `platform_content`
- `content_versions`
- `media_variants`
- `account_strategies`
- `publishing_jobs`
- `publishing_attempts`
- `published_posts`
- `analytics_snapshots`
- `notifications`
- `audit_logs`

The agent must refine this model during planning. Do not create a production database before approval. Include ownership, foreign keys, indexes, retention and row-level security design in the data model document.

# 10. Technical architecture — proposed, subject to repository audit

The agent must inspect the repository and validate the stack before choosing final versions.

Likely direction:
- Frontend: Next.js + TypeScript.
- Styling: Tailwind CSS plus design tokens and reusable claymorphism components.
- PWA: installable web app with appropriate manifest and service-worker strategy.
- Hosting: Vercel, once authorised.
- Database/auth/storage: Supabase PostgreSQL, Supabase Auth and Supabase Storage, once authorised.
- Background processing: separate durable worker/service for long-running video processing and publishing tasks.
- Queue: durable job system selected after workload and cost analysis.
- Social integrations: official YouTube, Meta/Instagram and TikTok APIs.
- AI: modular video/audio analysis and language-model services.
- Research: compliant search/data sources with source attribution.
- Observability: structured logs, job traces, error tracking and audit events.

Do not run long video processing inside a short-lived Vercel serverless request. Use a job-based architecture and workers with suitable compute, timeouts and storage.

Use provider interfaces so AI, storage, queues and social APIs can be changed without rewriting the whole product.

# 11. Security, privacy and reliability requirements

The planning phase must produce a threat model and security checklist.

Requirements:
- Workspace-level access control.
- Row-level security design for user-owned records.
- Server-side OAuth code exchange.
- Encrypted OAuth token storage.
- Least-privilege API scopes.
- Token refresh and revocation handling.
- CSRF/state validation for OAuth.
- Secure session handling.
- Rate limiting for sensitive endpoints.
- Upload validation and file-size/type limits.
- Malware/content scanning strategy where appropriate.
- Signed or short-lived media access URLs.
- Secret redaction in logs.
- Audit logs for account connection, publishing, deletion and settings changes.
- Idempotent publishing jobs.
- Bounded retries and dead-letter handling.
- Backups and recovery strategy.
- Data export and deletion strategy.
- Privacy notice and platform-specific data handling.
- Retention policy for original video, derived assets, analytics and logs.

# 12. Notifications

Provide in-app notifications for:
- Upload complete.
- Analysis complete.
- Content package ready.
- Post scheduled.
- Post published.
- Publishing failed.
- Account authorisation expired.
- Platform permission changed.
- Analytics sync complete.
- Action required.

Future delivery channels may include email or push notifications, but do not configure external providers without approval.

# 13. Suggested delivery phases

The agent must refine the phases after inspecting the repository. Do not skip dependencies simply to make progress appear faster.

## Phase 0 — Repository and requirements audit
Deliver:
- Repository audit.
- Framework/dependency inventory.
- Current Git status and branch report.
- Product-specific master plan.
- Requirements traceability matrix.
- Architecture proposal.
- Risk/decision list.
- Acceptance criteria and test strategy.

Exit gate: owner reviews and approves the plan.

## Phase 1 — Design system and application shell
Deliver:
- Responsive app shell.
- Claymorphism light/dark themes.
- Navigation and workspace context.
- Reusable cards, buttons, fields, badges, dialogs, menus and layout primitives.
- Responsive behaviour and accessibility foundations.

Exit gate: all key viewport sizes tested; theme and navigation work.

## Phase 2 — Main product screens with demo data
Deliver:
- Overview.
- Video Studio.
- AI Content.
- Smart Scheduler.
- Publishing Queue.
- Creator Studio.
- Research Centre.
- Performance Lab.
- Accounts.
- Settings.

Exit gate: every screen has loading, empty, error and populated/demo states where appropriate; navigation and primary interactions work.

## Phase 3 — Local domain model and application services
Deliver:
- Typed domain models.
- Validation schemas.
- Service interfaces.
- Mock adapters.
- State management and error-handling patterns.
- Traceable test fixtures.

Exit gate: UI is not tightly coupled to demo data; adapters can later be replaced by real services.

## Phase 4 — Authentication, workspace and database (only after owner approval)
Deliver:
- Supabase project setup instructions and configuration.
- Authentication.
- Workspace/member model.
- Database migrations.
- Row-level security.
- Storage design.
- Audit logging.

Exit gate: access-control and security tests pass.

## Phase 5 — Video upload and processing foundation
Deliver:
- Secure direct/resumable upload.
- Asset metadata.
- Durable processing jobs.
- Worker lifecycle and retry handling.
- Video preview and derived media tracking.

Exit gate: upload, resume, process, failure and retry paths tested.

## Phase 6 — AI analysis and research
Deliver:
- Video/audio extraction pipeline.
- Analysis adapter.
- Timestamped events and confidence.
- User correction workflow.
- Research integration and source tracking.
- Grounded metadata generation.

Exit gate: hallucination/accuracy tests and failure handling documented.

## Phase 7 — Social account OAuth integrations
Deliver:
- YouTube connection.
- Instagram/Meta connection.
- TikTok connection.
- Scope and capability checks.
- Token refresh/revocation.
- Multiple accounts per platform.
- Disconnect and reauthorisation flows.

Exit gate: only verified supported capabilities are enabled; app-review dependencies documented.

## Phase 8 — Content generation and account strategies
Deliver:
- Per-platform content schemas.
- Per-account variants.
- Preview and version history.
- Validation against video facts and platform rules.
- Brand voice and account strategies.

Exit gate: generated metadata passes accuracy and platform validation tests.

## Phase 9 — Scheduling and publishing
Deliver:
- Independent account queues.
- Account-specific schedule recommendations.
- Durable publishing workers.
- Idempotency and duplicate protection.
- Rate-limit handling.
- Retry/dead-letter policy.
- Pause/resume and failure notifications.

Exit gate: sandbox/test-account scenarios pass before production publishing is enabled.

## Phase 10 — Creator Studio and analytics
Deliver:
- Historical channel/video sync where supported.
- Analytics snapshots.
- Date-range and per-post views.
- Platform capability limitations.
- Account-specific performance summaries.

Exit gate: metrics are sourced, timestamped and never presented as live when stale.

## Phase 11 — Performance Lab and learning loop
Deliver:
- Experiment definitions.
- Performance comparisons.
- Account-specific recommendation updates.
- Confidence and sample-size warnings.
- Explanation of recommendations.

Exit gate: no unsupported causal claims; recommendations are auditable.

## Phase 12 — Hardening, release and operations
Deliver:
- End-to-end testing.
- Security review.
- Accessibility review.
- Performance and upload tests.
- Backup/recovery procedures.
- Monitoring and alerting.
- Production deployment plan.
- Rollback plan.
- User documentation.

Exit gate: owner explicitly approves deployment and production credentials.

# 14. Testing strategy

The agent must define exact tools after repository inspection.

Required test layers:

## Unit tests
- Domain rules.
- Metadata validation.
- Account-specific scheduling logic.
- Job state transitions.
- Retry policy.
- Permission/capability mapping.
- Data transformation.

## Integration tests
- Service adapters with mocked external APIs.
- OAuth callback validation.
- Token refresh behaviour.
- Database access and workspace isolation.
- Upload metadata and processing job creation.
- Queue idempotency and retry behaviour.

## End-to-end tests
- Responsive navigation.
- Upload flow in mock mode.
- Video detail and analysis display.
- Platform-specific content preview.
- Account filters.
- Scheduler interactions.
- Queue retry/pause/reschedule flows.
- Theme persistence where implemented.

## Security tests
- Cross-workspace access denial.
- Role/permission checks.
- OAuth state/CSRF protection.
- Secret leakage checks.
- Upload validation.
- Rate limits.
- Token redaction.

## Visual/responsive checks
At minimum:
- 320px.
- 360px.
- 390px.
- 430px.
- Tablet width.
- Desktop width.

A test is not passed unless the command/result is recorded. If a test cannot run, mark it `NOT RUN` with a reason.

# 15. Demo mode and mock data

The first website should be visually complete without real social accounts or cloud services.

Use mock/demo adapters and sample data for:
- One YouTube account.
- One Instagram account.
- One TikTok account.
- Additional sample accounts to demonstrate multi-account architecture.
- Several gameplay videos.
- Analysis timelines.
- Platform-specific metadata.
- Scheduled and published posts.
- Analytics and performance comparisons.
- Notifications and job failures.

Every demo account and metric must be clearly identified as demo content. Provide a clear demo-mode banner or environment indicator. Demo actions must not make real network calls or claim real publishing.

# 16. Definition of done

A task is complete only when all applicable criteria are met:

1. Requirement ID is identified.
2. Implementation exists in the repository.
3. Relevant tests exist and pass.
4. Type-check/lint/build checks pass as applicable.
5. Responsive behaviour is verified where UI is involved.
6. Loading, empty, error and success states are handled.
7. Security/privacy implications are considered.
8. Documentation and traceability matrix are updated.
9. Changes are committed.
10. Push is verified or its blocker is reported.
11. Commit audit is sent to the owner.

Do not use `DONE` as a status for code that has not been tested. Use `IMPLEMENTED` until tests pass.

# 17. Initial owner decisions to surface during planning

Do not block the repository audit on these questions. First inspect the repository and prepare recommendations. Then ask the owner only the most important unresolved question at a time.

Decisions to validate:
- Final product name and brand assets.
- Whether the first workspace is personal-only or multi-user from the first release.
- Which platform integration should be implemented first.
- Exact failure policy and maximum retry count.
- Whether all connected accounts are enabled by default or each account must be explicitly enabled.
- Default posting frequency and quiet hours.
- Which languages and creator voice styles are required.
- Original video retention and deletion policy.
- AI provider and processing budget.
- Queue/worker hosting and operating cost.
- Which analytics are essential for the first release.

Do not invent a budget, purchase services or enable paid resources.

# 18. First instruction to the agent

**Start with Phase 0 only.**

1. Inspect the repository and Git state.
2. Report what already exists.
3. Create the project-specific master plan and supporting documentation.
4. Build the requirements traceability matrix.
5. Identify API and architecture uncertainties.
6. Present the plan, phase sequence, acceptance criteria, risks and owner decisions.
7. Wait for the owner's approval before substantial feature implementation.

After approval, begin Phase 1 in small milestones. After every commit and push, send the mandatory commit audit described in Section 4.

**The owner must always be able to answer these questions from the repository and the agent's latest audit:**
- What did we plan?
- What has been implemented?
- What has been tested?
- What has been committed and pushed?
- What remains incomplete?
- What is blocked, and why?
- What will the agent do next?
