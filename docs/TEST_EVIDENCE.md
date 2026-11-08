# Test evidence ledger

This ledger records executed checks, not aspirational test names. See [TEST_STRATEGY.md](TEST_STRATEGY.md) for the future application catalog.

## Phase 0 final pre-commit gate (historical)

At the Phase 0 gate the documentation run reported **154 requirements: 8 TESTED, 1 IN PROGRESS, 145 PLANNED; 0 ACCEPTED**. The eight TESTED items are Phase 0 documentation deliverables only. Owner approval remains in progress; recurring commit/audit controls are not claimed complete for future milestones. All product requirements remain planned.

The validator's 10 unit tests pass (valid baseline plus nine rejection cases). Python syntax compilation passes. The original brief preservation diff is empty. Staged whitespace, intended-file and credential-pattern checks are recorded below after staging; a push is never inferred from these checks.

## Phase 0 — M0.1

**Date:** 2026-11-08 UTC
**Baseline:** `b16202cc61c12a4ae374bedcca94680882064a9f`
**Environment:** Node 22.22.3, npm 10.9.8, Python 3.11.2, Git 2.39.5; documentation-only worktree.

| Check | Exact command / procedure | Result |
|---|---|---|
| Repository inventory/history | `find`, `git ls-tree`, `git status`, `git branch -avv`, `git ls-remote`, `git fetch --unshallow origin main`, GitHub CLI read queries | PASS — findings in REPOSITORY_AUDIT.md; initial unsupported GitHub JSON-field query corrected |
| Full source read | Read `docs/PLAN.md` lines 1–1022 across overlapping chunks; inspect all section headings | PASS — all 19 numbered sections covered; no separate named attachment found |
| Dependency/framework inventory | File/manifest search and Git tree/history inspection | PASS — none exist; registry metadata read only, no install |
| Documentation validation | `python3 scripts/check_docs.py` | PASS — 154 requirements, 14 required docs, 41 local links; all references/source coverage valid |
| Validator tests | `PYTHONPYCACHEPREFIX=/tmp/up17-pycache python3 -m unittest discover -s scripts -p 'test_*.py' -v` | PASS — 10 tests: valid baseline plus missing doc/broken link/duplicate ID/invalid status/unknown milestone/unknown test/changed brief/missing coverage/premature app artifact |
| Validator syntax | `PYTHONPYCACHEPREFIX=/tmp/up17-pycache python3 -m py_compile scripts/check_docs.py scripts/test_check_docs.py` | PASS |
| Whitespace | `git diff --check` | PASS — rerun on staged diff before commit |
| Source preservation | `git diff --exit-code b16202cc61c12a4ae374bedcca94680882064a9f -- docs/PLAN.md` | PASS — original brief byte-for-byte unchanged |
| Secret/artifact review | Inspect intended file list/diff; search added text for credential patterns; confirm no env/media/db/build artifacts | PASS — 17 intended text files; no high-confidence credential patterns or premature application/cloud/media/build artifacts; manual diff reviewed |
| Staged whitespace | `git diff --cached --check` | PASS — initial check found Markdown hard-break spaces; removed them from new docs only, restaged and reran successfully |
| Application formatting/lint/type/unit/E2E/build | No application/package scripts exist | NOT RUN — not applicable to Phase 0; do not report as PASS |
| Live social/AI/storage tests | No authorization, credentials or connected resources | NOT RUN — documentation research is not integration evidence |
| Commit/push | `git commit`, `git push -u origin arena/698e4880-up17-autopublisher`, `git ls-remote --heads origin refs/heads/arena/698e4880-up17-autopublisher` | PASS — commit `067f569`; remote matched full hash `067f569a569d5299acb30986f0f3e01dbaf5821f`; immediate audit delivered |

The final validator output is recorded in `docs/evidence/phase-0-validation.txt`. The first structural run found five milestones without direct requirement rows; explicit queue/platform/publishing requirements were added (147 → 154), then all checks passed. A later evidence-status edit temporarily produced eight-column rows; the validator and its negative tests caught it, the seven affected rows were repaired, and both suites passed again. These failures and corrections are retained in the audit trail. Owner acceptance remains separate.

## M1.1 — local application foundation

**Date:** 2026-11-08 UTC. **Scope:** toolchain and truthful temporary foundation page only; no product workflows/integrations.

See [m1-1-validation.txt](evidence/m1-1-validation.txt) for exact commands, results and compatibility notes. Clean npm 11.21.2 install, format, lint, strict typecheck, 3 unit tests, foundation security checks, production build and dependency audit pass. Local HTTP/preview-host smoke returns 200 with honest demo/no-connection content.

Playwright browser assertions are **NOT RUN**: browser download failed with TLS ECONNRESET and the executable is absent; the attempted visual command failed before assertions. HTTP smoke does not replace browser/accessibility evidence. Product integration and live-provider suites are also NOT RUN because those features/authorizations do not exist. The browser blocker must be resolved before M1.2 acceptance.

### M1.1 delivery blocker

The initial local commit `85a10ef` could not be pushed: GitHub refused a workflow update without workflow permission. Remote remained `ddded10`. The CI file was preserved as an inactive example and the unpushed commit replaced locally; no force-push or shared-history rewrite. The replacement commit's push must be independently verified. Active CI and browser assertions remain NOT RUN.

The replacement M1.1 commit `34246d3` was pushed successfully; `git ls-remote` matched `34246d3c3a4ea77a3b7ca0240195668cd8679877`, and the immediate audit was delivered. Active CI remains blocked/not run.

## M1.1 — foundation hardening (2026-11-08)

**Starting commit:** `d9250a619801149ada8ed86aee281ea6f635535e`, verified present locally and on the fixed remote branch before edits. **Scope:** maintenance only; no M1.2, publishing, cloud resource, OAuth setup or simulated success.

See [m1-1-hardening-validation.txt](evidence/m1-1-hardening-validation.txt) for exact commands, exit statuses and limitations.

| Check | Actual result |
|---|---|
| Wrong npm enforcement | PASS — global npm 10.9.8 `npm ci --dry-run` exits 1 with EBADENGINE under `engine-strict=true` |
| Clean pinned install | PASS — npm 11.21.2 `npm ci`; only new dependency is `server-only` 0.0.1 |
| Toolchain / lock consistency | PASS — exact npm declaration, executing-CLI check and lock-root manifest assertion |
| Formatting / zero-warning lint / strict types | PASS |
| Unit tests | PASS — 4 files, 8 tests, including real browser-condition bundle rejection of the foundation module |
| Integration empty suite | EXPECTED FAIL — `npm run test:integration` exits 1, “No test files found”; no fake tests added |
| Documentation/security validator | PASS — 34 Python tests + 2 TypeScript security tests; Git-index/worktree artifact policy checked |
| Production build / dependency audit | PASS — Next.js build succeeds; `npm audit` reports 0 known vulnerabilities |
| Browser install | FAIL SETUP — Chromium v1254 download from `cdn.playwright.dev` fails with TLS ECONNRESET |
| E2E / axe accessibility / visual | NOT RUN — commands exit 1 at browser launch because the executable is absent; no page/axe/viewport assertion executed |
| Local HTTP / preview-host smoke | PASS — 200 and unchanged honest DEMO/no-connection/disabled-publishing content; not browser evidence |
| Active CI / Windows runtime / live providers | NOT RUN — workflow permission missing; sandbox is Linux; no provider authorization/resources |

The real `@axe-core/playwright` scan is implemented with WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags and no disabled rules, but it has **not** executed. No genuine accessibility violation result is available yet. M1.1 hardening is implemented, not fully verified or owner-accepted, until browser/axe evidence is obtained. The final commit hash and verified push are reported in the immediate post-push audit rather than invented inside the commit.
