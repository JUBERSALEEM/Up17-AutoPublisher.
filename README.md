# Up17-AutoPublisher.

AI-powered, multi-platform creator automation studio for YouTube, Instagram and TikTok. Automates gameplay video analysis, metadata generation, smart scheduling, publishing and performance analytics.

## Current status — approved Phase 1, M1.1 foundation

The owner approved the Phase 0 plan and recommended safe defaults on **2026-11-08**. This repository now has a **local Next.js/TypeScript application foundation**, not a working publishing product. The current page is a temporary toolchain check. No product dashboard, database, cloud project, social connection, AI provider or deployment has been created.

The first configurable workspace is **Up17 Gaming** (`@up17longshotyt`); gaming is a workspace configuration, not a product-wide restriction. The original brief is preserved unchanged at [docs/PLAN.md](docs/PLAN.md).

## Local setup

Use **Node 22.22.3** (`.nvmrc`) and **npm 11.21.2**. The sandbox's global npm may still be 10.9.8; the project pins/CI installs 11.21.2 because npm 10 failed dependency-graph resolution. From this directory:

```sh
# If your package manager is older, use npx --yes npm@11.21.2 <command>.
npm ci
cp .env.example .env.local   # optional; DEMO is the default and no secrets are needed
npm run dev -- --port 3000
```

Open `http://localhost:3000` on your own machine. The server binds to `0.0.0.0` for the Arena live preview and accepts the preview origin. Browser-facing application code uses no localhost service URL. Only `DEMO` mode is supported; an unsupported live mode fails rather than simulating a connection.

### Quality commands

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:security
npm run docs:check
npm run build
npm audit
```

`npm run check` combines formatting, lint, types, unit tests, documentation validation and production build. `test:security` currently covers planning integrity and client-source secret boundaries, **not** a complete product security audit.

Playwright/axe configuration is present. Install a browser with `npx playwright install chromium`, then run `npm run test:e2e` or `npm run test:visual`. In this sandbox the browser CDN was blocked, so browser assertions are **NOT RUN**; HTTP/build checks are not a substitute. Product integration tests do not exist yet; the integration script reports no tests and must not be treated as integration coverage.

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
- Plan approval is **not** infrastructure authorization. No hosted resource creation/connection, deployment or purchase without separate explicit permission.
- Official OAuth/API integrations only; never ask for social passwords or bypass platform restrictions.
- Keep populated environment files, credentials, real media, local databases and build artifacts out of Git.
- Label sample content **Demo data** / **Simulation**; never imply a demo action published anything.
- Distinguish planned, implemented, tested and owner-accepted. Unfinished requirements remain visible.

## CI delivery blocker

The GitHub App rejected `.github/workflows/quality.yml` because it lacks workflow permission. The proposed workflow is preserved at [docs/ci/quality.yml.example](docs/ci/quality.yml.example), **not active CI**. Local quality gates run and pass. Once the GitHub connection has workflow permission, an explicitly authorized follow-up can install that template at the workflow path; no remote workflow was created.
