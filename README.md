# Up17-AutoPublisher.

AI-powered, multi-platform creator automation studio for YouTube, Instagram and TikTok. Automates gameplay video analysis, metadata generation, smart scheduling, publishing and performance analytics.

## Current status — functional product implementation

The owner has now authorized real Supabase/Vercel deployment and official platform integration work, superseding the earlier frontend-only boundary. The current A–J delivery balance, including a 155-row four-gate per-requirement table, is maintained in [owner requirements balance](docs/OWNER_REQUIREMENTS_BALANCE.md). Batch C delivered the auth/data foundation; Batch D delivered a server-only official OAuth/token broker and its hosted rollback fixture. **Live OAuth remains blocked** by owner SMTP, secrets, provider apps/app review and an accessible callback deployment. See [Batch C report](docs/BATCH_C_AUTH_REPORT.md), [Batch D report](docs/BATCH_D_CONNECTIONS_REPORT.md) and [owner setup](docs/OWNER_SETUP.md). The product is **not yet functionally live**: publishing/Smart AI workflows remain demo/missing.

## Frontend baseline (historical scope)

The owner approved the Phase 0 plan on **2026-11-08** and subsequently authorized a six-batch, **frontend-only** UI implementation. All six frontend UI batches are implemented and locally verified: four token-driven themes, a responsive shell/PWA, and all ten main areas plus Notifications. Core screens include the Overview, Video Studio library, Creator Studio draft editor, Smart Scheduler, Publishing Queue and Accounts; supporting screens add local settings, a labelled demo inbox, research briefs, an explicitly simulated analysis timeline and honest unavailable analytics. This is not a connected publishing product.

The frontend-only batches created no backend. Batch C connected Supabase-backed auth/workspace/preferences/inbox paths and private storage; Batch D added nine reviewed migrations, service-only encrypted token custody and real connection management. No live social account, AI provider or publishing engine is connected. Sample content remains explicitly labelled and no demo action publishes anything.

Real production-build browser checks now run using a documented registry-only Chromium fallback: theme/keyboard/navigation interactions, 80 axe scans including four-theme all-destination coverage, 90 viewport checks including six-width all-destination coverage, and PWA manifest/cache/offline behavior pass. A follow-up local-navigation repair adds development-mode route-content regressions (13 assertions), mobile access to the Design System utility, segment-aware active states and development service-worker cleanup; see the [navigation repair report](docs/NAVIGATION_REPAIR_REPORT.md). The standard Playwright CDN download remains blocked, so a documented registry-only Chromium fallback executes the browser gates. Automated four-theme accessibility and six-width viewport matrices pass; manual screen-reader review, OS install behavior and owner acceptance remain pending. See the [UI delivery report](docs/UI_DELIVERY_REPORT.md), [current sprint](docs/SPRINT_STATUS.md) and [executed evidence](docs/TEST_EVIDENCE.md).

The first configurable workspace is **Up17 Gaming** (`@up17longshotyt`); gaming is a workspace configuration, not a product-wide restriction. The original brief is preserved unchanged at [docs/PLAN.md](docs/PLAN.md).

## Local setup

Use **Node 22.22.3** (`.nvmrc`) and **npm 11.21.2**. The exact npm version is declared in `packageManager`, `engines.npm` and `.npmrc` (`engine-strict=true`). Project scripts also check the executing toolchain. Do not use `--legacy-peer-deps` or casually change dependency pins.

Install the pinned npm once, then use normal npm commands:

```sh
# POSIX shells
npm install --global npm@11.21.2
node --version
npm --version
npm ci
```

```powershell
# Windows PowerShell; npm.cmd avoids PowerShell script-execution-policy issues
npm.cmd install --global npm@11.21.2
node --version
npm.cmd --version
npm.cmd ci
```

If a sandbox cannot update global npm, `npx --yes npm@11.21.2 <command>` is a fallback. The toolchain check reads the executing npm CLI manifest because npx can inherit a stale outer user-agent.

Optional local environment file—the demo baseline requires no secrets:

```sh
cp .env.example .env.local       # POSIX
```

```powershell
Copy-Item .env.example .env.local # Windows
```

Run the local app:

```sh
npm run dev -- --port 3000
```

Open `http://localhost:3000` on your own machine. The server binds to `0.0.0.0` for the Arena live preview and accepts the preview origin. Browser-facing application code uses no localhost service URL. Only `DEMO` mode is supported; an unsupported live mode fails rather than simulating a connection. `lib/foundation.ts` imports `server-only`; a browser-condition bundle regression test proves client import is rejected.

Python 3 is required for documentation/security validation. `scripts/run-python.mjs` detects `python3`, `python` or the Windows `py -3` launcher; set `PYTHON` to override. Next telemetry is disabled through `scripts/run-next.mjs`, not POSIX-only environment prefixes.

### Quality commands

```sh
npm run toolchain:check
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:security
npm run docs:check
npm run build
npm run test:navigation:dev
npm audit
```

`npm run check` combines the toolchain check, formatting, zero-warning lint, types, unit tests, security/documentation validation and production build. It deliberately does **not** hide the empty integration suite or unavailable browser tests behind a green build.

`npm run test:integration` runs four local SSR-cookie adapter contract tests and passes; do not add placeholder tests or `--passWithNoTests`. Hosted database/RLS and Batch D broker fixtures are separate rollback SQL evidence, not local integration tests.

`test:security` covers planning integrity, Git-index/worktree artifact policy, reviewed placeholder env examples, the exact credential-free `vercel.json` cron/build config, client-source secret boundaries and the server-only bundle boundary. It is a heuristic repository guard, **not** a complete product security audit. It rejects populated environment files, credential/key material and unreviewed cloud configuration/state artifacts. Ignored local files are not Git artifacts; force-added ignored files are still rejected.

### Browser and accessibility setup

On a machine with normal browser-download access:

```sh
npx playwright install chromium
npm run test:e2e
npm run test:a11y
npm run test:visual
```

`test:e2e`, `test:a11y` and `test:visual` build the current application first, then start and stop their own production server on port 3100 (`UP17_TEST_PORT` overrides it). They do not reuse a stale development server. `test:navigation:dev` instead starts a real Turbopack development server on port 3101 (`UP17_DEV_TEST_PORT` overrides it) with the isolated ignored output directory `.next-e2e-dev`, so it can run beside the live preview on port 3000 without sharing Next.js's single-dev-server lock. It asserts route-specific content, active states, refresh/direct entry, back/forward, mobile More, theme persistence and navigation across all four themes. `test:a11y` runs real axe scans with WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags and no disabled rules. Automated scans do not replace manual keyboard/screen-reader review.

The standard Chromium v1254 download still fails with `ECONNRESET` to `cdn.playwright.dev`. Local verification instead uses a separately extracted registry package `@sparticuz/chromium@153.0.0`, Chromium 153.0.8010.0, with its bundled AL2023 NSS/NSPR libraries. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to the executable and `LD_LIBRARY_PATH` to the extracted library directory on Linux. Only safe launch flags are used; the package's insecure default flags are not imported. These temporary tools are outside Git and application dependencies. Exact results and limitations are in [test evidence](docs/TEST_EVIDENCE.md).

### Local navigation troubleshooting

If a long-lived development tab appears stale after pulling changes or editing the shell, first reload the tab. If it still misbehaves, stop the dev server, remove only the generated development cache and restart with the documented command:

```sh
rm -rf .next/dev
npm run dev -- --port 3000
```

On Windows PowerShell use `Remove-Item -Recurse -Force .next/dev`. Development mode also unregisters an inherited production `/sw.js` worker on the same origin so a previous `npm start` cannot cache-first serve stale chunks. Do not delete `.next` while a production server is running.

## Documentation

1. [Repository audit](docs/REPOSITORY_AUDIT.md) — original baseline and verified Git state.
2. [Master implementation plan](docs/MASTER_PLAN.md) — approved phases, 41 milestones and acceptance gates.
3. [Requirements traceability](docs/REQUIREMENTS_TRACEABILITY.md) — 155 requirements and actual evidence status.
4. [Architecture](docs/ARCHITECTURE.md) and [data model](docs/DATA_MODEL.md).
5. [Integrations](docs/INTEGRATIONS.md), [security/privacy](docs/SECURITY_PRIVACY.md) and [UX system](docs/UX_DESIGN_SYSTEM.md).
6. [Test strategy](docs/TEST_STRATEGY.md), [test evidence](docs/TEST_EVIDENCE.md), [decisions](docs/DECISIONS.md) and [sprint status](docs/SPRINT_STATUS.md).
7. [Changelog](docs/CHANGELOG.md).

## Operating rules

- Work in small approved milestones on `arena/698e4880-up17-autopublisher`; verify pushes and send the prescribed audit.
- Supabase, Vercel, deployment and official platform connections are now explicitly authorized. Paid services still require a separate cost proposal and approval; actual creator-account publishing requires final content/action confirmation.
- Official OAuth/API integrations only; never ask for social passwords or bypass platform restrictions.
- Keep populated environment files, credentials, real media, local databases and build artifacts out of Git.
- Label sample content **Demo data** / **Simulation**; never imply a demo action published anything.
- Distinguish planned, implemented, tested and owner-accepted. Unfinished requirements remain visible.

## CI delivery blocker

The GitHub App rejected `.github/workflows/quality.yml` because it lacks workflow permission. The proposed workflow is preserved at [docs/ci/quality.yml.example](docs/ci/quality.yml.example), **not active CI**. It installs the same exact npm version and includes browser gates once activated. Local quality gates run; active CI and Windows CI are not claimed as executed. Once the GitHub connection has workflow permission, an explicitly authorized follow-up can install the template; no remote workflow was created.
