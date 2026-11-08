# Decisions and owner approvals

**Date format:** UTC. A recommendation is not an approval. “Accepted constraint” means explicitly required by the owner's brief; proposed technical decisions still belong to the Phase 0 approval package.

## Status vocabulary

- **ACCEPTED CONSTRAINT:** explicit owner instruction; cannot be silently relaxed.
- **PROPOSED:** recommendation awaiting owner approval.
- **APPROVED:** owner explicitly approved; record date and scope.
- **DEFERRED:** decision needed at a named gate, not yet necessary.
- **SUPERSEDED:** replaced by a later dated decision, retaining history.

## Explicit constraints already established

| ID | Date | Decision | Source |
|---|---|---|---|
| C-001 | 2026-11-08 | Phase 0 first; no substantial feature work before plan approval | Owner instruction; brief §§0,18 |
| C-002 | 2026-11-08 | No external account/resource creation, connection, provisioning, deployment or paid service without explicit authorization | Brief §2.1; owner infrastructure restriction |
| C-003 | 2026-11-08 | Official APIs/OAuth only; no passwords, scraping bypasses, invented capabilities or demo successes presented as live | Brief §§2.3–2.5 |
| C-004 | 2026-11-08 | Separate product/repository/infrastructure; no reuse of another product's resources or branding | Owner instruction; brief §2.2 |
| C-005 | 2026-11-08 | Mobile-first premium claymorphism, light/dark themes, all ten named product areas | Owner instruction; brief §§6–7 |
| C-006 | 2026-11-08 | Small tested commits, verified pushes, immediate audit and continuously updated traceability | Brief §§4,16; owner instruction |

## Proposed architecture decisions

| ID | Status | Recommendation and rationale | Alternatives / trade-off | Revisit gate |
|---|---|---|---|---|
| ADR-001 | APPROVED (Phase 0) | Keep this repository and `docs/PLAN.md` as the immutable baseline source; add repository-specific docs rather than replace existing work | Renaming/replacing the brief loses provenance | Phase 0 approval |
| ADR-002 | APPROVED (M1.1 tested) | Next.js App Router + React + TypeScript; Tailwind CSS plus semantic CSS tokens; one web codebase, server-only integration boundaries | SPA plus separate API adds operational surface; plain React gives less server-side OAuth support | M1.1 compatibility spike |
| ADR-003 | APPROVED (M1.1 tested; npm variance below) | Pin a tested compatible toolchain, not “latest”: tested Next 16.4.5, React 19.3.1, TS 5.9.3, Tailwind 4.3.5, ESLint 9.39.5, Vitest 4.1.12; exact lockfile after install checks | Registry also exposes TS 7, ESLint 10 and Vitest 5; newer majors are not assumed compatible | M1.1; dependency updates thereafter |
| ADR-004 | PROPOSED | Supabase Auth/Postgres/Storage behind provider interfaces, local development first; hosted project only after explicit approval | Self-hosted Postgres/auth/storage gives control but more operations; no hosted lock-in in domain code | Phase 4 infrastructure authorization |
| ADR-005 | PROPOSED | Separate long-lived TypeScript worker container for FFmpeg/AI orchestration/publishing; durable Postgres-backed queue, pg-boss as candidate | Serverless-only media work is unsuitable; Redis queue adds a service; final queue choice needs local durability/concurrency benchmarks | M3.2 and M5.2 |
| ADR-006 | PROPOSED | Direct resumable object-storage upload using Supabase TUS when authorized; local emulator for development; never proxy large video bytes through a short-lived web handler | Browser-to-platform-only upload cannot support shared multi-platform analysis; ordinary request uploads are fragile | Phase 5 storage authorization |
| ADR-007 | PROPOSED | One shared video/analysis pipeline, immutable account-specific content versions and independent account jobs; no cross-account credential or analytics pooling | A single combined publish job couples failures and permissions | Phase 3 domain review |
| ADR-008 | PROPOSED | AI/research/storage/queue/social providers implement typed ports; deterministic mocks are the default, external calls require explicit mode and authorization | Direct SDK coupling makes testing and provider changes expensive | Each provider selection gate |
| ADR-009 | PROPOSED | PWA caches only public app-shell assets; no offline publishing, sensitive API responses, tokens or signed media URLs in service-worker caches | Offline-first mutations add reconciliation and privacy risks | M1.3 and Phase 12 |
| ADR-010 | PROPOSED | Server-side OAuth, envelope-encrypted tokens in a service-only table, workspace-scoped RLS on all exposed domain tables, redacted structured logs | Browser token storage or a shared privileged client is unacceptable | Phase 4 security review |
| ADR-011 | PROPOSED | YouTube is the first live integration; Instagram then TikTok, each separately authorized and tested; UI and mocks cover all three from the outset | Parallel live integrations multiply review/support blockers | Phase 7 approval |
| ADR-012 | PROPOSED | Research uses approved lawful sources with attribution; do not assume commercial eligibility for TikTok Research Tools or infer keyword volume from search results | Unofficial trend scraping violates the brief; no research provider selected yet | M6.3 source/budget approval |

## Owner decision register — defaults are recommendations, not settings already chosen

| ID | Decision | Recommended default | Needed by | Current state |
|---|---|---|---|---|
| D-001 | Product name / logo / brand assets | Keep “Up17 AutoPublisher”; create an original wordmark if no asset supplied | M1.2 | Awaiting owner |
| D-002 | Personal-only versus collaborative first release | One owner initially; schema/RLS support owner/admin/editor/viewer from Phase 4 without selling a team product yet | Phase 0 approval | Proposed |
| D-003 | First live platform | YouTube; all three visible in demo | Phase 0 approval | Proposed |
| D-004 | Retry policy | Initial attempt + at most 3 transient retries, nominal 1/5/15 minutes with jitter; obey Retry-After; permanent errors stop; ambiguous publish results reconcile before retry | Phase 0 approval / M9.2 | Proposed |
| D-005 | Account activation | Every new account publishing-disabled; explicit per-account automation opt-in; test/private first | Phase 0 approval | Proposed |
| D-006 | Posting windows / frequency | No invented production schedule. Demo only: 1 post/account/day, max 2, 10:00–20:00 Asia/Dubai, quiet 22:00–08:00; owner must choose real values | M9.1 before live automation | Proposed demo values |
| D-007 | Language / voice | English initially; configurable Hindi/Hinglish later; concise, evidence-led gaming voice, no fabricated achievements | M6.2 / M8.1 | Awaiting owner |
| D-008 | Retention | Propose originals 90 days, derivatives 30, analytics 13 months, audit/job metadata 12 months, backups 35; configurable legal holds; credentials until disconnect | Before real personal data | Proposed, not a legal determination |
| D-009 | AI provider / budget | No provider or spending selected; benchmark an owner-approved multimodal provider on a consented evaluation set; cap frames/minutes/cost per job | Before M6.1 external processing | Awaiting owner |
| D-010 | Queue/worker hosting / operating ceiling | Local worker first; compare one small always-on worker plus managed Postgres/storage against alternatives using measured workloads; no price assumption | Before Phase 5 hosted processing | Awaiting owner |
| D-011 | Essential analytics | YouTube views, watch time, average view duration, subscriber gains/losses where returned; available per-video metrics; other platforms only their supported fields | Phase 0 approval / Phase 10 | Proposed |
| D-012 | Upload limits / initial formats | MP4-first; propose 500 MiB and 10 minutes per original, vertical short-form focus; server validation and lower per-platform variant limits | Phase 5 | Proposed product limits, not API limits |
| D-013 | Research source / budget | Owner-approved official game announcements and licensed/permitted search only; no source connected yet | M6.3 | Awaiting owner |
| D-014 | Legal jurisdiction / privacy terms | Owner to confirm operating jurisdiction, privacy contact and processor agreements; do not infer from approximate chat location | Before hosted personal data | Awaiting owner |
| D-015 | Instagram login path | Evaluate currently documented Unified Login versus Instagram Login for the owner's professional accounts; do not universally require a Facebook Page | M7.3 app-access spike | Deferred pending approved app |
| D-016 | Unavoidable platform review | Preserve required TikTok consent/privacy/creator-info UX and other safety interventions even in full automation; confirm acceptable workflow | Phase 0 approval / M7.4 | Proposed |
| D-017 | Repository license | Owner chooses license before public code distribution beyond this repository; no license invented | Before adding third-party-facing distribution | Awaiting owner |

## Approval ledger

| Approval | Date | Scope and evidence |
|---|---|---|
| Phase 0 plan + recommended defaults | 2026-11-08 | Owner selected “Approve — start M1.1” in the approval prompt. Approves the local Next.js/TypeScript direction, YouTube-first live sequence, explicit account enablement, bounded retries and required platform consent. Authorizes **M1.1 local development only**; later milestones follow the approved small-step process. |

No infrastructure authorization has been given. Supabase and Vercel being available as conversation connectors does not authorize their use. Approval of the plan alone does not authorize cloud resources, credentials, public posting or deployment; those require named, separate gates.

## M1.1 compatibility result — 2026-11-08

- Clean install/build/type/lint/unit evidence: [M1.1 validation](evidence/m1-1-validation.txt).
- **Variance:** npm 10.9.8 failed during optional-peer graph resolution; project and CI now use npm 11.21.2, with a successful strict `npm ci` and no legacy-peer override. Node remains 22.22.3.
- ESLint 10.14 was experimentally tested, but Next's transitive plugins declare ESLint <=9 peers. Retained the approved 9.39.5 rather than suppress peer conflicts; its upstream deprecation warning remains a tracked maintenance risk.
- Pin `minimatch` to 11.0.1 through a reviewed override for GHSA-g3hv-75wg-m249 in lint tooling. All quality gates pass and npm audit reports zero known vulnerabilities at this date; revisit on dependency updates.
- Playwright/axe setup is committed, but browser download from `cdn.playwright.dev` is blocked by sandbox TLS egress. Browser/visual assertions are NOT RUN, not passed. M1.2 cannot exit without resolving browser execution.
- npm 11 reports an unapproved esbuild postinstall warning; strict install and Vitest pass. Review installer policy on future toolchain updates rather than disabling all scripts or claiming the warning absent.

- **CI delivery blocker:** GitHub rejected the active workflow path because the connected GitHub App lacks workflow permission. The unpushed local commit was replaced without rewriting remote/shared history; the workflow is preserved as `docs/ci/quality.yml.example`. Local gates remain executable. Active CI is NOT IMPLEMENTED until the connection permission is fixed and the template is explicitly installed in a later commit.
