# Up17-AutoPublisher.

AI-powered, multi-platform creator automation studio for YouTube, Instagram and TikTok. Automates gameplay video analysis, metadata generation, smart scheduling, publishing and performance analytics.

## Current status — Phase 0, awaiting owner approval

This repository currently contains planning documentation and a documentation validator, **not a working publishing application**. No website, database, cloud project, social connection or deployment has been created. The first configurable workspace is **Up17 Gaming** (`@up17longshotyt`); gaming is a workspace configuration, not a product-wide restriction.

The original product brief is preserved unchanged at [docs/PLAN.md](docs/PLAN.md). The repository-specific delivery plan is [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md). Implementation begins only after the owner approves Phase 0. Platform capabilities described in the plan are documented possibilities, not tested integrations.

## Read in this order

1. [Repository audit](docs/REPOSITORY_AUDIT.md) — what actually exists and what was verified.
2. [Master implementation plan](docs/MASTER_PLAN.md) — phases, small milestones, dependencies and acceptance gates.
3. [Requirements traceability](docs/REQUIREMENTS_TRACEABILITY.md) — every requirement, its destination and evidence status.
4. [Architecture](docs/ARCHITECTURE.md) and [data model](docs/DATA_MODEL.md).
5. [Integrations](docs/INTEGRATIONS.md), [security/privacy](docs/SECURITY_PRIVACY.md) and [UX system](docs/UX_DESIGN_SYSTEM.md).
6. [Test strategy](docs/TEST_STRATEGY.md), [test evidence](docs/TEST_EVIDENCE.md), [decisions](docs/DECISIONS.md) and [sprint status](docs/SPRINT_STATUS.md).
7. [Changelog](docs/CHANGELOG.md).

## Local development

There is no application to install or run yet. Consequently `dev`, application lint, application type checks, application tests and production builds are **not available in Phase 0**. The proposed stack is Next.js/App Router, React, TypeScript, Tailwind CSS with claymorphism tokens, Supabase services after approval, and a separate durable media/publishing worker. See [ADR-002](docs/DECISIONS.md) and the architecture document.

The only executable repository tooling now is the dependency-free documentation consistency check:

```sh
python3 scripts/check_docs.py
PYTHONPYCACHEPREFIX=/tmp/up17-pycache python3 -m unittest discover -s scripts -p 'test_*.py' -v
git diff --check
git diff --exit-code b16202cc61c12a4ae374bedcca94680882064a9f -- docs/PLAN.md
```

Observed planning environment: Node.js 22.22.3, npm 10.9.8, Python 3.11.2 and Git 2.39.5. These are environment observations, not a committed application dependency lockfile. Application setup and exact scripts will be added in milestone M1.1 after approval.

## Operating rules

- Plan first; no substantial feature implementation before approval.
- No external resource creation, connection, provisioning, deployment or purchase without a separate explicit authorization.
- Official OAuth/API integrations only; never ask for social passwords or bypass platform restrictions.
- Keep secrets, real media, local databases and build artifacts out of Git.
- Label all sample content **Demo data** or **Simulation**; never imply a demo action published anything.
- Use small commits on `arena/698e4880-up17-autopublisher`; verify pushes and send the audit prescribed by the original brief.
- `PLANNED`, `IMPLEMENTED`, `TESTED` and `ACCEPTED` mean different things. Only the owner grants acceptance.

See [SECURITY_PRIVACY.md](docs/SECURITY_PRIVACY.md) for authorization boundaries and [SPRINT_STATUS.md](docs/SPRINT_STATUS.md) for unfinished work and blockers.
