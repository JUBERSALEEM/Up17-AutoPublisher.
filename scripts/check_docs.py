#!/usr/bin/env python3
"""Validate traceability and the local-only Git artifact boundary.

This is documentation/repository tooling, not a product security audit. It scans
Git-index content and non-ignored worktree files, never prints matched secrets,
and does not prove application/API behavior. Run inside the Git checkout.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "README.md", "docs/MASTER_PLAN.md", "docs/REQUIREMENTS_TRACEABILITY.md",
    "docs/ARCHITECTURE.md", "docs/DATA_MODEL.md", "docs/INTEGRATIONS.md",
    "docs/SECURITY_PRIVACY.md", "docs/UX_DESIGN_SYSTEM.md", "docs/TEST_STRATEGY.md",
    "docs/DECISIONS.md", "docs/CHANGELOG.md", "docs/SPRINT_STATUS.md",
    "docs/REPOSITORY_AUDIT.md", "docs/TEST_EVIDENCE.md",
)
STATUSES = {
    "NOT STARTED", "PLANNED", "IN PROGRESS", "BLOCKED",
    "IMPLEMENTED", "TESTED", "ACCEPTED",
}
BASELINE_PLAN_SHA256 = "504cf651d731a4596285cf9a6d2ee44eae3f99f0bba89b5f4d9fec58e8fc5deb"
ID_PATTERN = re.compile(r"^[A-Z]{2,4}-\d{3}$")
ALLOWED_ENV_EXAMPLES = {".env.example"}
MAX_SCAN_BYTES = 2_000_000
GENERATED_DIRS = {
    "node_modules", ".next", "out", "dist", "build", "coverage", "test-results",
    "playwright-report", "blob-report", ".turbo", ".cache", "__pycache__",
    ".pytest_cache", ".venv", ".parcel-cache", ".output",
}
CLOUD_DIRS = {".supabase", ".vercel", ".netlify", ".wrangler", ".terraform", "cdk.out", ".aws", ".azure"}
CLOUD_FILES = {
    "vercel.json", "vercel.jsonc", ".vercelrc", ".vercelignore", "netlify.toml",
    "wrangler.toml", "wrangler.json", "wrangler.jsonc", "firebase.json", ".firebaserc",
    "fly.toml", "render.yaml", "railway.json", "railway.toml", "amplify.yml",
    "apphosting.yaml", "cloudbuild.yaml", "serverless.yml", "serverless.yaml",
    "samconfig.toml", "terraform.tfvars", ".yarnrc", ".yarnrc.yml", ".pypirc",
    ".netrc", "_netrc", ".git-credentials", ".dockercfg", "auth.json", "storage-state.json",
}
GENERATED_TYPES = {"database.types.ts", "supabase.types.ts", "storage.types.ts"}
KEY_SUFFIXES = (".pem", ".key", ".p12", ".pfx", ".jks", ".keystore", ".ppk")
KEY_NAMES = {"id_rsa", "id_ed25519", "id_ecdsa", "id_dsa"}
MEDIA_SUFFIXES = (".mp4", ".mov", ".webm", ".avi", ".mkv", ".mp3", ".wav", ".m4a")
DB_SUFFIXES = (".sqlite", ".sqlite3", ".db")
CREDENTIAL_JSON = re.compile(r"^(?:client[_-]?secret|service[_-]?account|credentials?|oauth|secrets?|tokens?|session)(?:[._-].*)?\.(?:json|ya?ml|toml)$")
TEXT_SUFFIXES = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".jsonc", ".yaml", ".yml",
    ".toml", ".ini", ".cfg", ".conf", ".txt", ".md", ".py", ".css", ".html", ".xml",
    ".sql", ".sh", ".ps1", ".bat", ".cmd", ".example", ".env", ".local", ".production",
}
# High-confidence formats are checked everywhere, including documentation/tests.
SECRET_FORMATS = (
    ("GitHub token", re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b")),
    ("OpenAI-style secret key", re.compile(r"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b")),
    ("Google API key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("Google OAuth client secret", re.compile(r"\bGOCSPX-[A-Za-z0-9_-]{20,}\b")),
    ("AWS access key ID", re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("Slack token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{20,}\b")),
    ("npm token", re.compile(r"\bnpm_[A-Za-z0-9]{36}\b")),
    ("Supabase secret key", re.compile(r"\bsb_secret_[A-Za-z0-9_-]{20,}\b")),
    ("private key", re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----\s*[A-Za-z0-9+/=]{64,}[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----")),
)
JWT = re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")
CREDENTIAL_ASSIGNMENT = re.compile(
    r"""(?im)(?:^|[,{;\s])["']?(client_secret|clientSecret|refresh_token|refreshToken|access_token|accessToken|api_key|apiKey|secret_access_key|secretAccessKey|service_role_key|serviceRoleKey|auth_token|authToken|password|passwd|VERCEL_TOKEN|SUPABASE_SERVICE_ROLE_KEY|GOOGLE_CLIENT_SECRET|INSTAGRAM_CLIENT_SECRET|TIKTOK_CLIENT_SECRET|OPENAI_API_KEY)["']?\s*[:=]\s*["']?([^\s"',;#}]+)"""
)
PLACEHOLDER_PREFIXES = (
    "<", "$", "process.", "import.meta", "os.environ", "z.", "your-", "your_",
    "example", "dummy", "placeholder", "redacted", "changeme", "synthetic-test",
)
PLACEHOLDER_VALUES = {"string", "number", "boolean", "undefined", "null", "true", "false", "test", "testing", "fixture", "xxx", "****"}


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def local_links(text: str) -> list[str]:
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"`[^`\n]*`", "", text)
    result = []
    for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", text):
        target = target.strip().split(maxsplit=1)[0].strip("<>")
        parsed = urlsplit(target)
        if not parsed.scheme and not parsed.netloc and parsed.path:
            result.append(unquote(parsed.path))
    return result


def git_bytes(root: Path, *args: str) -> bytes:
    env = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull}
    result = subprocess.run(
        ["git", "-C", str(root), *args], capture_output=True, check=False, env=env,
    )
    if result.returncode:
        # Do not echo Git input/output: it may contain sensitive material.
        raise RuntimeError(f"git {args[0]} failed with exit {result.returncode}")
    return result.stdout


def artifact_reason(relative: str) -> str | None:
    path = PurePosixPath(relative.replace("\\", "/"))
    parts = tuple(part.lower() for part in path.parts)
    name = parts[-1]
    if name == ".env" or name.startswith(".env."):
        if relative in ALLOWED_ENV_EXAMPLES:
            return None
        return "environment file is not an explicitly permitted example"
    if any(part in GENERATED_DIRS for part in parts):
        return "generated/build/dependency artifact"
    if any(part in CLOUD_DIRS for part in parts) or parts[0] in {"supabase", "vercel"}:
        return "cloud configuration/generated artifact requires a separate approval gate"
    if ".config" in parts and "gcloud" in parts:
        return "cloud credential/configuration artifact"
    if ".auth" in parts or ".docker" in parts:
        return "credential/session configuration artifact"
    if name in CLOUD_FILES or name in GENERATED_TYPES or CREDENTIAL_JSON.fullmatch(name):
        return "credential or cloud configuration artifact requires a separate approval gate"
    if name == "application_default_credentials.json":
        return "application default cloud credentials"
    if name.endswith((".tfstate", ".tfplan", ".tfvars")) or ".tfstate." in name:
        return "infrastructure state/variable artifact"
    if name.endswith(KEY_SUFFIXES) or name in KEY_NAMES:
        return "private key/certificate keystore artifact"
    if name.endswith(MEDIA_SUFFIXES) or name.endswith(DB_SUFFIXES):
        return "local media/database artifact"
    if name.endswith((".log", ".pyc", ".tsbuildinfo")) or name == ".ds_store":
        return "local generated artifact"
    return None


def is_placeholder(value: str) -> bool:
    lowered = value.lower().strip("\"'`()")
    return len(lowered) < 4 or lowered in PLACEHOLDER_VALUES or lowered.startswith(PLACEHOLDER_PREFIXES)


def privileged_jwt(text: str) -> bool:
    for match in JWT.finditer(text):
        try:
            payload = match.group(0).split(".")[1]
            decoded = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
            claims = json.loads(decoded)
            if isinstance(claims, dict) and claims.get("role") == "service_role":
                return True
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
            continue
    return False


def content_reasons(relative: str, data: bytes) -> list[str]:
    path = PurePosixPath(relative)
    if relative == ".env.example":
        assignments = []
        for line in data.decode("utf-8", errors="replace").splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                assignments.append(stripped)
        if assignments != ["UP17_APP_MODE=DEMO"]:
            return ["permitted environment example contains unapproved or populated settings"]
        return []
    if path.name == ".npmrc":
        settings = []
        for line in data.decode("utf-8", errors="replace").splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith(("#", ";")):
                settings.append(stripped)
        if set(settings) != {"engine-strict=true", "save-exact=true"} or len(settings) != 2:
            return ["npm configuration is outside the approved credential-free project policy"]
        return []
    if b"\x00" in data:
        return []
    text = data.decode("utf-8", errors="replace")
    reasons = [label for label, pattern in SECRET_FORMATS if pattern.search(text)]
    if privileged_jwt(text):
        reasons.append("privileged service-role JWT")
    detector_source = relative in {"scripts/check_docs.py", "scripts/test_check_docs.py"}
    if not detector_source:
        if any(match and not is_placeholder(match.group(2)) for match in CREDENTIAL_ASSIGNMENT.finditer(text)):
            reasons.append("populated credential assignment")
    return list(dict.fromkeys(reasons))


def validate_artifacts(root: Path, errors: list[str]) -> int:
    try:
        candidates = sorted(set(git_bytes(root, "ls-files", "--cached", "--others", "--exclude-standard", "-z").decode("utf-8").split("\0")) - {""})
        tracked = set(git_bytes(root, "ls-files", "--cached", "-z").decode("utf-8").split("\0")) - {""}
    except (OSError, RuntimeError, UnicodeDecodeError) as error:
        fail(errors, f"Git artifact inventory unavailable; refusing a partial security pass: {error}")
        return 0
    for relative in candidates:
        reason = artifact_reason(relative)
        if reason:
            fail(errors, f"Forbidden Git/worktree artifact: {relative!r} ({reason})")
        path = root / relative
        versions: list[tuple[str, bytes]] = []
        try:
            if path.is_symlink():
                fail(errors, f"Symlink requires explicit artifact review: {relative!r}")
                continue
            if path.is_file():
                if path.stat().st_size > MAX_SCAN_BYTES and (path.suffix.lower() in TEXT_SUFFIXES or path.name.startswith(".env")):
                    fail(errors, f"Oversized text/config artifact cannot be fully scanned: {relative!r}")
                    continue
                versions.append(("worktree", path.read_bytes()))
            if relative in tracked:
                versions.append(("index", git_bytes(root, "show", f":{relative}")))
        except (OSError, RuntimeError) as error:
            fail(errors, f"Cannot inspect artifact {relative!r}: {error}")
            continue
        seen: set[bytes] = set()
        for source, data in versions:
            if data in seen:
                continue
            seen.add(data)
            for reason in content_reasons(relative, data):
                fail(errors, f"Credential/config policy violation in {source}: {relative!r} ({reason}); value redacted")
    return len(candidates)


def main() -> int:
    errors: list[str] = []
    artifact_count = validate_artifacts(ROOT, errors)
    for name in REQUIRED:
        path = ROOT / name
        if not path.is_file():
            fail(errors, f"Missing required document: {name}")
        elif len(path.read_text(encoding="utf-8").strip()) < 400:
            fail(errors, f"Document is empty or insufficiently populated: {name}")

    plan = ROOT / "docs/PLAN.md"
    if plan.is_file():
        if hashlib.sha256(plan.read_bytes()).hexdigest() != BASELINE_PLAN_SHA256:
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
        return report(errors, 0, {}, link_count, artifact_count)

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

    decisions_path = ROOT / "docs/DECISIONS.md"
    decisions = decisions_path.read_text(encoding="utf-8") if decisions_path.is_file() else ""
    approved = "Owner selected “Approve — start M1.1”" in decisions
    if not approved:
        for name in ("package.json", "package-lock.json", "app/page.tsx"):
            if (ROOT / name).exists():
                fail(errors, f"Unexpected pre-approval application artifact: {name}")
    return report(errors, len(rows), counts, link_count, artifact_count)


def report(errors: list[str], requirements: int, counts: Counter[str], links: int, artifacts: int) -> int:
    print(f"Required documents: {len(REQUIRED)}")
    print(f"Requirements: {requirements}; unique IDs and references checked")
    print(f"Local links checked: {links}")
    print(f"Git-index/worktree artifact candidates checked: {artifacts}")
    print("Status counts: " + (", ".join(f"{k}={v}" for k, v in sorted(counts.items())) or "none"))
    if errors:
        print(f"FAIL: {len(errors)} issue(s)", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("PASS: documentation structure, traceability, links, preserved brief and Git artifact policy")
    print("Boundary: heuristic artifact/credential check, not a complete security audit or live integration test.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
