# Test evidence ledger

This ledger records executed checks, not aspirational test names. See [TEST_STRATEGY.md](TEST_STRATEGY.md) for the future application catalog.

## Final pre-commit gate

The final documentation run reports **154 requirements: 8 TESTED, 1 IN PROGRESS, 145 PLANNED; 0 ACCEPTED**. The eight TESTED items are Phase 0 documentation deliverables only. Owner approval remains in progress; recurring commit/audit controls are not claimed complete for future milestones. All product requirements remain planned.

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
