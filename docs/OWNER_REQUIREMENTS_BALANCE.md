# Owner requirements balance

**Updated:** 2026-11-08 UTC. This is the current product-delivery balance, not a count of pages. The original [product brief](PLAN.md) is preserved. The detailed 155-row [requirement register](REQUIREMENTS_TRACEABILITY.md) remains the source-level mapping; this page summarizes the owner's active A–J implementation batches. Historical frontend-only reports describe their original scope, not permission to call the product finished.

## Status meanings

- **COMPLETE:** the requested real workflow is implemented and verified at its required boundary; owner acceptance is recorded separately.
- **PARTIAL:** some real or supporting work exists, but the full acceptance gate has not passed.
- **DEMO:** explicitly labelled sample/simulated behavior; not real processing or publishing.
- **BLOCKED:** a named external credential, approval, service or test access is required.
- **MISSING:** the requested real workflow is not implemented yet.
- **NOT REQUIRED:** the owner explicitly removed the requirement; none have been removed.

## Batch balance

| Batch | Requirement | Status | What exists / what remains |
|---|---|---|---|
| A | Baseline, environments and deployment repair | PARTIAL | Exact Supabase project and Vercel team/project verified. Actual preview failure diagnosed as npm 10.9.9 versus required 11.21.2. Version-controlled hosted commands and compatible-node regression tests added; fresh hosted build/browser verification pending. Production still serves the old docs-only main commit. |
| B | Rich sculptural Clay Light/Dark; flat Bento Light/Dark; all screens and devices | PARTIAL | Four semantic themes and shared primitives exist, with local browser/a11y coverage. Clay depth is currently too restrained for the new brief; richer material/state tokens and a dedicated visual-regression gate remain. |
| C | Real authentication, relational persistence, RLS and private storage | MISSING | Supabase project is healthy, but it has no application migrations. Current profiles, drafts, settings and inbox are browser-local demo data. Auth, schema, policies, storage and multi-user tests remain. |
| D | Official multi-account YouTube/Instagram/TikTok OAuth | MISSING | No provider credentials or real connected accounts. Server-side state/PKCE, encrypted token custody, refresh/revoke/health and provider review documentation remain. |
| E | Upload, private video playback, game/category selection and versioned metadata | DEMO | Library/draft screens work with labelled sample data and browser storage. Real private upload/storage/playback and durable video records remain. BGMI and PUBG Mobile must remain distinct. |
| F | Durable, evidence-based video/audio AI analysis | DEMO | Analysis timeline is explicitly simulated. No media worker, extracted evidence, provider result or paid AI authorization exists. |
| G | Content-grounded, platform-specific metadata intelligence | DEMO | Local editing/suggestions exist; no real content analysis/research grounding or approved AI provider. |
| H | Durable scheduling, retries, reconciliation and confirmed publishing | DEMO | Local schedule/queue interactions never submit a publication. Real state machine, worker, idempotency and platform confirmation remain. |
| I | Real analytics and research provenance | MISSING | Analytics explicitly unavailable; research briefs are local notes/examples. No platform metrics or retrieved research are represented as real. |
| J | Security/browser gates, production launch and live smoke verification | MISSING | Local frontend gates pass; full product security/integration gates and a real-app production release have not run. A READY docs-only deployment is not a live product launch. |

**Totals: 10 batches — COMPLETE 0; PARTIAL 2; DEMO 4; BLOCKED 0; MISSING 4; NOT REQUIRED 0.** Batch statuses are not additive feature percentages. External authorization blockers will be recorded explicitly as implementation reaches them; deployment itself is now authorized.

## What works now

- All 12 destinations, responsive navigation, four themes and local demo interactions. Navigation repair was confirmed by the owner; commit `226ae1bf7612a3378f9281d1ed68be432bfb0218` was push-verified.
- Local production-build gates before Batch A: 114 E2E, 80 axe, 90 viewport, 13 development-navigation assertions; 24 unit and 34 Python security/documentation tests. These are frontend evidence, not backend or publishing evidence.

## What is still demo

Video library, analysis, metadata suggestions, drafts, scheduling, queue, account cards, research briefs, notifications and workspace preferences. Their existing labels must remain until each real replacement passes its acceptance gate. No demo action publishes anything.

## What is connected

- Supabase project `hxgokimjdormlktxjsbg` in organization `xjzpxfeqrdhjsyijotvh`, verified through the connected integration. Control-plane connectivity does **not** mean application authentication/persistence is connected.
- Vercel project `prj_uh7RosdHFABdfwRkSRg7JNmu67bK` in team `team_jEJR74nCGB4nVczqRwF0ljmM`, linked to the correct GitHub repository. Preview environment now has the public Supabase URL/publishable key and explicit DEMO mode; no privileged key is browser-exposed.

## What needs authorization or external setup

- The owner has authorized Supabase, Vercel, deployment and official platform connections. Provider client credentials/app review are still needed for real OAuth; no connected badge will be fabricated.
- Paid AI/services require a separate cost proposal and explicit approval. None has been purchased.
- Publishing to an actual creator account requires final confirmation of the exact content and action. No such publication has occurred.
- Supabase default email delivery is not a production SMTP solution; recovery/confirmation delivery needs verification and likely an approved custom SMTP provider.

## What remains / is it live?

Real auth/database/storage, provider connections, uploads, workers, grounded intelligence, confirmed publishing, real analytics and production acceptance remain. **The functional product is not live yet.** The production alias currently points to the initial documentation commit on `main`; the working application is on the fixed Arena branch. Preview build repair is in progress. See [deployment evidence](evidence/batch-a-deployment.txt) for executed checks and blockers.
