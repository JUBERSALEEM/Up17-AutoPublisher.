"""Negative/positive tests for the planning-stage documentation validator.

Each case runs in a temporary copy; repository documents are never mutated.
Run: python3 -m unittest discover -s scripts -p 'test_*.py' -v
"""

from __future__ import annotations

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
            shutil.copytree(ROOT / "docs", copy / "docs")
            shutil.copytree(ROOT / "scripts", copy / "scripts")
            shutil.copy2(ROOT / "README.md", copy / "README.md")
            if change is not None:
                change(copy)
            return subprocess.run(
                [sys.executable, str(copy / "scripts/check_docs.py")],
                cwd=copy, capture_output=True, text=True, check=False,
            )

    def assert_rejected(self, change, message: str) -> None:
        result = self.run_copy(change)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn(message, result.stderr)

    @staticmethod
    def edit_matrix(root: Path, old: str, new: str) -> None:
        path = root / "docs/REQUIREMENTS_TRACEABILITY.md"
        text = path.read_text(encoding="utf-8")
        if old not in text:
            raise AssertionError(f"Test fixture text not found: {old}")
        path.write_text(text.replace(old, new, 1), encoding="utf-8")

    def test_valid_baseline_passes(self):
        result = self.run_copy()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("PASS:", result.stdout)

    def test_missing_required_document_is_rejected(self):
        self.assert_rejected(
            lambda root: (root / "docs/CHANGELOG.md").unlink(),
            "Missing required document",
        )

    def test_broken_local_link_is_rejected(self):
        self.assert_rejected(
            lambda root: (root / "README.md").write_text(
                (root / "README.md").read_text() + "\n[broken](missing-phase0-file.md)\n"
            ),
            "Broken local link",
        )

    def test_duplicate_requirement_is_rejected(self):
        def change(root):
            path = root / "docs/REQUIREMENTS_TRACEABILITY.md"
            text = path.read_text()
            row = next(line for line in text.splitlines() if line.startswith("| GOV-001 |"))
            self.edit_matrix(root, row, row + "\n" + row)
        self.assert_rejected(change, "Duplicate requirement ID")

    def test_invalid_status_is_rejected(self):
        self.assert_rejected(
            lambda root: self.edit_matrix(root, "| M0.1 | PLANNED |", "| M0.1 | DONE |"),
            "Invalid status",
        )

    def test_unknown_milestone_is_rejected(self):
        self.assert_rejected(
            lambda root: self.edit_matrix(root, "| M0.1 | PLANNED |", "| M99.9 | PLANNED |"),
            "Unknown milestone",
        )

    def test_unknown_test_is_rejected(self):
        self.assert_rejected(
            lambda root: self.edit_matrix(root, "`T-DOC` — NOT RUN |", "`T-MISSING` — NOT RUN |"),
            "Unknown test ID",
        )

    def test_changed_source_brief_is_rejected(self):
        self.assert_rejected(
            lambda root: (root / "docs/PLAN.md").write_text("changed baseline"),
            "differs from the audited baseline",
        )

    def test_missing_source_coverage_is_rejected(self):
        def change(root):
            path = root / "docs/REQUIREMENTS_TRACEABILITY.md"
            text = path.read_text()
            path.write_text("\n".join(line for line in text.splitlines() if not line.startswith("18=")) + "\n")
        self.assert_rejected(change, "Source coverage mismatch")

    @staticmethod
    def remove_approval_and_add_app(root: Path) -> None:
        decisions = root / "docs/DECISIONS.md"
        decisions.write_text(decisions.read_text().replace("Owner selected “Approve — start M1.1”", "Approval pending"))
        (root / "package.json").write_text("{}")

    def test_premature_application_artifact_is_rejected(self):
        self.assert_rejected(
            lambda root: self.remove_approval_and_add_app(root),
            "Unexpected pre-approval application artifact",
        )


if __name__ == "__main__":
    unittest.main()
