"""Positive/negative tests for documentation and Git artifact validation.

Each case runs in an isolated temporary Git checkout. Synthetic canaries are
constructed at runtime and never written into the real repository or index.
Run: python3 -B -m unittest discover -s scripts -p 'test_*.py' -v
"""

from __future__ import annotations

import base64
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class DocumentationValidatorTests(unittest.TestCase):
    def run_copy(self, change=None) -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory(prefix="up17-doc-check-") as temporary:
            copy = Path(temporary)
            tracked = subprocess.run(
                ["git", "-C", str(ROOT), "ls-files", "-z"],
                capture_output=True, check=True,
            ).stdout.decode("utf-8").split("\0")
            for relative in filter(None, tracked):
                source = ROOT / relative
                if source.is_file():
                    destination = copy / relative
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(source, destination)
            # Include untracked intended source files while respecting ignore rules.
            untracked = subprocess.run(
                ["git", "-C", str(ROOT), "ls-files", "--others", "--exclude-standard", "-z"],
                capture_output=True, check=True,
            ).stdout.decode("utf-8").split("\0")
            for relative in filter(None, untracked):
                source = ROOT / relative
                if source.is_file():
                    destination = copy / relative
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(source, destination)
            subprocess.run(["git", "init", "-q"], cwd=copy, check=True, capture_output=True)
            subprocess.run(["git", "add", "."], cwd=copy, check=True, capture_output=True)
            if change is not None:
                change(copy)
            return subprocess.run(
                [sys.executable, "-B", str(copy / "scripts/check_docs.py")],
                cwd=copy, capture_output=True, text=True, check=False,
            )

    def assert_rejected(self, change, message: str) -> None:
        result = self.run_copy(change)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn(message, result.stderr)

    def assert_accepted(self, change=None) -> None:
        result = self.run_copy(change)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("PASS:", result.stdout)

    @staticmethod
    def write(root: Path, relative: str, text: str) -> None:
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    @staticmethod
    def git(root: Path, *args: str) -> None:
        subprocess.run(["git", *args], cwd=root, check=True, capture_output=True)

    def force_add(self, root: Path, relative: str, text: str) -> None:
        self.write(root, relative, text)
        self.git(root, "add", "-f", "--", relative)

    @staticmethod
    def edit_matrix(root: Path, old: str, new: str) -> None:
        path = root / "docs/REQUIREMENTS_TRACEABILITY.md"
        text = path.read_text(encoding="utf-8")
        if old not in text:
            raise AssertionError(f"Test fixture text not found: {old}")
        path.write_text(text.replace(old, new, 1), encoding="utf-8")

    def test_valid_baseline_passes(self):
        self.assert_accepted()

    def test_missing_required_document_is_rejected(self):
        self.assert_rejected(lambda root: (root / "docs/CHANGELOG.md").unlink(), "Missing required document")

    def test_broken_local_link_is_rejected(self):
        self.assert_rejected(
            lambda root: self.write(root, "README.md", (root / "README.md").read_text() + "\n[broken](missing-phase0-file.md)\n"),
            "Broken local link",
        )

    def test_duplicate_requirement_is_rejected(self):
        def change(root):
            text = (root / "docs/REQUIREMENTS_TRACEABILITY.md").read_text()
            row = next(line for line in text.splitlines() if line.startswith("| GOV-001 |"))
            self.edit_matrix(root, row, row + "\n" + row)
        self.assert_rejected(change, "Duplicate requirement ID")

    def test_invalid_status_is_rejected(self):
        self.assert_rejected(lambda root: self.edit_matrix(root, "| M0.1 | PLANNED |", "| M0.1 | DONE |"), "Invalid status")

    def test_unknown_milestone_is_rejected(self):
        self.assert_rejected(lambda root: self.edit_matrix(root, "| M0.1 | PLANNED |", "| M99.9 | PLANNED |"), "Unknown milestone")

    def test_unknown_test_is_rejected(self):
        self.assert_rejected(lambda root: self.edit_matrix(root, "`T-DOC` — NOT RUN |", "`T-MISSING` — NOT RUN |"), "Unknown test ID")

    def test_changed_source_brief_is_rejected(self):
        self.assert_rejected(lambda root: self.write(root, "docs/PLAN.md", "changed baseline"), "differs from the audited baseline")

    def test_missing_source_coverage_is_rejected(self):
        def change(root):
            path = root / "docs/REQUIREMENTS_TRACEABILITY.md"
            path.write_text("\n".join(line for line in path.read_text().splitlines() if not line.startswith("18=")) + "\n")
        self.assert_rejected(change, "Source coverage mismatch")

    def test_premature_application_artifact_is_rejected(self):
        def change(root):
            path = root / "docs/DECISIONS.md"
            path.write_text(path.read_text().replace("Owner selected “Approve — start M1.1”", "Approval pending"))
        self.assert_rejected(change, "Unexpected pre-approval application artifact")

    def test_tracked_env_is_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, ".env", "UP17_APP_MODE=DEMO\n"), "environment file")

    def test_tracked_env_variant_is_rejected_even_when_ignored(self):
        self.assert_rejected(lambda root: self.force_add(root, ".env.production", "UP17_APP_MODE=DEMO\n"), "environment file")

    def test_nested_env_example_is_not_implicitly_approved(self):
        self.assert_rejected(lambda root: self.force_add(root, "config/.env.example", "UP17_APP_MODE=DEMO\n"), "environment file")

    def test_ignored_local_env_is_not_a_git_artifact(self):
        self.assert_accepted(lambda root: self.write(root, ".env.local", "UP17_APP_MODE=DEMO\n"))

    def test_root_example_is_allowed(self):
        self.assert_accepted(lambda root: self.write(root, ".env.example", "# safe comment\nUP17_APP_MODE=DEMO\n"))

    def test_reviewed_placeholder_env_names_are_allowed(self):
        self.assert_accepted(
            lambda root: self.write(
                root,
                ".env.example",
                "# owner setup\nUP17_APP_MODE=DEMO\nGOOGLE_CLIENT_SECRET=your-google-oauth-client-secret\nCRON_SECRET=your-random-cron-secret\n",
            )
        )

    def test_unreviewed_env_name_is_rejected_even_with_placeholder(self):
        self.assert_rejected(
            lambda root: self.write(root, ".env.example", "UP17_APP_MODE=DEMO\nUNREVIEWED_KEY=your-placeholder\n"),
            "permitted environment example",
        )

    def test_populated_root_example_is_rejected(self):
        self.assert_rejected(
            lambda root: self.write(root, ".env.example", "UP17_APP_MODE=DEMO\nGOOGLE_CLIENT_SECRET=populated-secret-value\n"),
            "permitted environment example",
        )

    def test_oauth_download_is_rejected(self):
        payload = json.dumps({"installed": {"client_id": "example", "client_secret": "synthetic-test-secret"}})
        self.assert_rejected(lambda root: self.force_add(root, "client_secret_example.json", payload), "credential or cloud configuration")

    def test_private_key_is_rejected_without_printing_it(self):
        canary = "SYNTHETIC-NOT-A-REAL-KEY"
        encoded = base64.b64encode((canary + "-padding" * 10).encode()).decode()
        key = "-----BEGIN PRIVATE KEY-----\n" + encoded + "\n-----END PRIVATE KEY-----\n"
        result = self.run_copy(lambda root: self.force_add(root, "notes.txt", key))
        self.assertEqual(result.returncode, 1)
        self.assertIn("private key", result.stderr)
        self.assertNotIn(canary, result.stdout + result.stderr)
        self.assertNotIn(encoded, result.stdout + result.stderr)

    def test_supabase_config_is_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, "supabase/config.toml", 'project_id = "example"\n'), "cloud configuration")

    def test_supabase_generated_client_is_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, "lib/database.types.ts", "export type Json = string;\n"), "reviewed schema-change gate")

    def test_supabase_temp_artifact_is_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, ".supabase/temp/project-ref", "example\n"), "cloud configuration")

    def test_reviewed_vercel_build_config_is_allowed(self):
        config = json.dumps({"$schema": "https://openapi.vercel.sh/vercel.json", "framework": "nextjs", "installCommand": "npx --yes npm@11.21.2 ci", "buildCommand": "npx --yes npm@11.21.2 run build", "crons": [{"path": "/api/cron/connections", "schedule": "0 3 * * *"}]})
        self.assert_accepted(lambda root: self.write(root, "vercel.json", config))

    def test_unreviewed_cron_path_is_rejected(self):
        config = json.dumps({"$schema": "https://openapi.vercel.sh/vercel.json", "framework": "nextjs", "installCommand": "npx --yes npm@11.21.2 ci", "buildCommand": "npx --yes npm@11.21.2 run build", "crons": [{"path": "/api/cron/other", "schedule": "0 3 * * *"}]})
        self.assert_rejected(lambda root: self.write(root, "vercel.json", config), "reviewed credential-free policy")

    def test_unreviewed_vercel_config_is_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, "vercel.json", '{"framework":"nextjs"}\n'), "reviewed credential-free policy")

    def test_vercel_config_cannot_smuggle_credentials(self):
        self.assert_rejected(lambda root: self.force_add(root, "vercel.json", '{"framework":"nextjs","env":{"API_TOKEN":"synthetic-test-token"}}\n'), "reviewed credential-free policy")

    def test_vercel_generated_artifact_is_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, ".vercel/project.json", '{"projectId":"example"}\n'), "cloud configuration")

    def test_other_cloud_state_is_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, "terraform.tfstate", '{"version":4}\n'), "infrastructure state")

    def test_npmrc_token_is_rejected(self):
        self.assert_rejected(
            lambda root: self.write(root, ".npmrc", "engine-strict=true\nsave-exact=true\n//registry.npmjs.org/:_authToken=synthetic-test-token\n"),
            "npm configuration",
        )

    def test_safe_npmrc_is_allowed(self):
        self.assert_accepted(lambda root: self.write(root, ".npmrc", "# local policy\nengine-strict=true\nsave-exact=true\n"))

    def test_populated_credential_assignment_is_rejected(self):
        self.assert_rejected(lambda root: self.write(root, "config.json", '{"client_secret":"populated-oauth-secret"}\n'), "populated credential assignment")

    def test_placeholder_credential_assignment_is_allowed(self):
        self.assert_accepted(lambda root: self.write(root, "config.json", '{"client_secret":"<oauth-client-secret>"}\n'))

    def test_typed_provider_adapter_expressions_are_allowed(self):
        self.assert_accepted(
            lambda root: self.write(
                root,
                "lib/provider-adapter.ts",
                'const form = { client_secret: secrets.clientSecret, refresh_token: current.refreshToken };\nconst value = decryptSecret(row.access_ciphertext);\n',
            )
        )

    def test_safe_documentation_mention_is_allowed(self):
        self.assert_accepted(lambda root: self.write(root, "docs/SECURITY_PRIVACY.md", (root / "docs/SECURITY_PRIVACY.md").read_text() + "\nNever commit `client_secret` or a private key header such as -----BEGIN PRIVATE KEY-----.\n"))

    def test_high_confidence_token_in_documentation_is_rejected(self):
        canary = "ghp_" + "A" * 36
        self.assert_rejected(lambda root: self.write(root, "docs/CHANGELOG.md", (root / "docs/CHANGELOG.md").read_text() + "\n" + canary + "\n"), "GitHub token")

    def test_service_role_jwt_is_rejected(self):
        payload = base64.urlsafe_b64encode(json.dumps({"role": "service_role"}).encode()).decode().rstrip("=")
        canary = "eyJhbGciOiJIUzI1NiJ9." + payload + ".synthetic_signature_not_real"
        self.assert_rejected(lambda root: self.write(root, "config.json", '{"token":"' + canary + '"}\n'), "privileged service-role JWT")

    def test_staged_secret_is_rejected_even_if_worktree_was_cleaned(self):
        def change(root):
            self.write(root, "config.json", '{"client_secret":"staged-secret-value"}\n')
            self.git(root, "add", "--", "config.json")
            self.write(root, "config.json", '{"client_secret":"<oauth-client-secret>"}\n')
        self.assert_rejected(change, "index")

    def test_untracked_non_ignored_credential_file_is_rejected(self):
        self.assert_rejected(lambda root: self.write(root, "session.json", '{"cookie":"example"}\n'), "credential or cloud configuration")

    def test_force_added_build_artifact_is_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, ".next/static/chunk.js", "export {};\n"), "generated/build/dependency artifact")

    def test_reviewed_supabase_migration_is_allowed(self):
        self.assert_accepted(lambda root: self.write(root, "supabase/migrations/20261109120000_reviewed_schema.sql", "create table public.example (id uuid primary key);\n"))

    def test_supabase_migration_path_traversal_is_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, "supabase/migrations/20261109120000_bad.toml", 'project_id="example"\n'), "cloud configuration")

    def test_supabase_arbitrary_sql_is_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, "supabase/seed.sql", "select 1;\n"), "cloud configuration")

    def test_reviewed_edge_function_source_is_allowed(self):
        self.assert_accepted(
            lambda root: self.write(
                root,
                "supabase/functions/up17-oauth-callback/index.ts",
                "Deno.serve(() => new Response('ok'));\n",
            )
        )

    def test_edge_function_nested_cloud_config_is_rejected(self):
        self.assert_rejected(
            lambda root: self.force_add(root, "supabase/functions/up17-oauth-callback/config.toml", "project_id=\"example\"\n"),
            "cloud configuration",
        )

    def test_reviewed_database_types_are_allowed(self):
        self.assert_accepted(lambda root: self.write(root, "lib/supabase/database.types.ts", "export type Json = string;\n"))

    def test_unreviewed_database_types_are_rejected(self):
        self.assert_rejected(lambda root: self.force_add(root, "lib/generated/database.types.ts", "export type Json = string;\n"), "reviewed schema-change gate")

    def test_supabase_migration_credential_is_still_rejected(self):
        self.assert_rejected(lambda root: self.write(root, "supabase/migrations/20261109120000_bad.sql", "select 'ghp_" + "A" * 36 + "';\n"), "GitHub token")


if __name__ == "__main__":
    unittest.main()
