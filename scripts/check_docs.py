#!/usr/bin/env python3
"""Validate planning traceability and the approved implementation stage.

This is documentation tooling, not product feature code. It checks structure,
references and local links; it does not prove product/API behavior.
"""

from __future__ import annotations

import hashlib
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "README.md",
    "docs/MASTER_PLAN.md",
    "docs/REQUIREMENTS_TRACEABILITY.md",
    "docs/ARCHITECTURE.md",
    "docs/DATA_MODEL.md",
    "docs/INTEGRATIONS.md",
    "docs/SECURITY_PRIVACY.md",
    "docs/UX_DESIGN_SYSTEM.md",
    "docs/TEST_STRATEGY.md",
    "docs/DECISIONS.md",
    "docs/CHANGELOG.md",
    "docs/SPRINT_STATUS.md",
    "docs/REPOSITORY_AUDIT.md",
    "docs/TEST_EVIDENCE.md",
)
STATUSES = {
    "NOT STARTED", "PLANNED", "IN PROGRESS", "BLOCKED",
    "IMPLEMENTED", "TESTED", "ACCEPTED",
}
BASELINE_PLAN_SHA256 = "504cf651d731a4596285cf9a6d2ee44eae3f99f0bba89b5f4d9fec58e8fc5deb"
ID_PATTERN = re.compile(r"^[A-Z]{2,4}-\d{3}$")


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def local_links(text: str) -> list[str]:
    # Remove fenced/inline code so example paths are not treated as navigation.
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"`[^`\n]*`", "", text)
    targets = re.findall(r"\[[^\]]*\]\(([^)]+)\)", text)
    result = []
    for target in targets:
        target = target.strip().split(maxsplit=1)[0].strip("<>")
        parsed = urlsplit(target)
        if not parsed.scheme and not parsed.netloc and parsed.path:
            result.append(unquote(parsed.path))
    return result


def main() -> int:
    errors: list[str] = []
    for name in REQUIRED:
        path = ROOT / name
        if not path.is_file():
            fail(errors, f"Missing required document: {name}")
        elif len(path.read_text(encoding="utf-8").strip()) < 400:
            fail(errors, f"Document is empty or insufficiently populated: {name}")

    plan = ROOT / "docs/PLAN.md"
    if plan.is_file():
        digest = hashlib.sha256(plan.read_bytes()).hexdigest()
        if digest != BASELINE_PLAN_SHA256:
            fail(errors, "Original docs/PLAN.md differs from the audited baseline")
    else:
        fail(errors, "Original product brief is missing")

    markdown = [ROOT / "README.md", *sorted((ROOT / "docs").rglob("*.md"))]
    link_count = 0
    for path in markdown:
        if not path.is_file():
            continue
        for target in local_links(path.read_text(encoding="utf-8")):
            link_count += 1
            destination = (ROOT / target.lstrip("/")) if target.startswith("/") else (path.parent / target)
            if not destination.exists():
                fail(errors, f"Broken local link: {path.relative_to(ROOT)} -> {target}")

    matrix_path = ROOT / "docs/REQUIREMENTS_TRACEABILITY.md"
    master_path = ROOT / "docs/MASTER_PLAN.md"
    tests_path = ROOT / "docs/TEST_STRATEGY.md"
    if not all(p.is_file() for p in (matrix_path, master_path, tests_path)):
        return report(errors, 0, {}, link_count)

    matrix = matrix_path.read_text(encoding="utf-8")
    master = master_path.read_text(encoding="utf-8")
    tests = tests_path.read_text(encoding="utf-8")
    milestones = set(re.findall(r"^### (M\d+\.\d+)\b", master, re.M))
    test_ids = set(re.findall(r"\|\s*`(T-[A-Z0-9-]+)`\s*\|", tests))
    rows: dict[str, list[str]] = {}
    counts: Counter[str] = Counter()
    for line in matrix.splitlines():
        if not re.match(r"^\| [A-Z]{2,4}-\d{3} \|", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != 7:
            fail(errors, f"Malformed requirement row: {line[:70]}")
            continue
        rid, source, requirement, milestone, status, destination, evidence = cells
        if not ID_PATTERN.fullmatch(rid):
            fail(errors, f"Invalid requirement ID: {rid}")
        if rid in rows:
            fail(errors, f"Duplicate requirement ID: {rid}")
        rows[rid] = cells
        counts[status] += 1
        if not source.startswith("§") or not requirement:
            fail(errors, f"Missing source/requirement: {rid}")
        if status not in STATUSES:
            fail(errors, f"Invalid status for {rid}: {status}")
        if milestone not in milestones:
            fail(errors, f"Unknown milestone for {rid}: {milestone}")
        if not destination.strip("`") or not evidence:
            fail(errors, f"Missing destination/evidence for {rid}")
        for test_id in re.findall(r"`(T-[A-Z0-9-]+)`", evidence):
            if test_id not in test_ids:
                fail(errors, f"Unknown test ID for {rid}: {test_id}")
        if status in {"TESTED", "ACCEPTED"} and "NOT RUN" in evidence:
            fail(errors, f"Tested/accepted requirement cannot have NOT RUN evidence: {rid}")

    if len(rows) < 100:
        fail(errors, f"Unexpectedly small requirement register: {len(rows)}")
    for milestone in sorted(milestones):
        if not any(cells[3] == milestone for cells in rows.values()):
            fail(errors, f"Milestone has no traced requirements: {milestone}")

    manifest = re.search(r"<!-- coverage-manifest\n(.*?)\n-->", matrix, re.S)
    if not manifest:
        fail(errors, "Missing source coverage manifest")
    else:
        covered: dict[str, list[str]] = {}
        for line in manifest.group(1).splitlines():
            section, _, ids = line.partition("=")
            covered[section.strip()] = ids.split(",")
        source_sections = set(re.findall(r"^# (\d+)\.", plan.read_text(encoding="utf-8"), re.M))
        if set(covered) != source_sections:
            fail(errors, f"Source coverage mismatch: expected {sorted(source_sections)}, got {sorted(covered)}")
        for section, ids in covered.items():
            for rid in ids:
                if rid not in rows:
                    fail(errors, f"Coverage manifest references unknown requirement: {section}={rid}")

    # Plan approval permits local application files, not hosted resources or secrets.
    decisions = (ROOT / "docs/DECISIONS.md").read_text(encoding="utf-8")
    approved = "Owner selected “Approve — start M1.1”" in decisions
    local_artifacts = ("package.json", "package-lock.json", "app/page.tsx")
    if not approved:
        for name in local_artifacts:
            if (ROOT / name).exists():
                fail(errors, f"Unexpected pre-approval application artifact: {name}")
    for name in (".env", ".env.local", "vercel.json", "supabase/config.toml"):
        if (ROOT / name).exists():
            fail(errors, f"Secret or externally hosted resource artifact requires a separate gate: {name}")
    return report(errors, len(rows), counts, link_count)


def report(errors: list[str], requirements: int, counts: Counter[str], links: int) -> int:
    print(f"Required documents: {len(REQUIRED)}")
    print(f"Requirements: {requirements}; unique IDs and references checked")
    print(f"Local links checked: {links}")
    print("Status counts: " + (", ".join(f"{k}={v}" for k, v in sorted(counts.items())) or "none"))
    if errors:
        print(f"FAIL: {len(errors)} issue(s)", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("PASS: documentation structure, traceability, links and preserved source brief")
    print("Boundary: no application tests or live integrations are claimed by this check.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
