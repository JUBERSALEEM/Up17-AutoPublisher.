import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import integrationConfig from "../../vitest.integration.config";
import unitConfig from "../../vitest.config";

const root = fileURLToPath(new URL("../..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));

describe("reproducible cross-platform toolchain", () => {
  it("pins npm in manifest, engines and lock root without changing dependency pins", () => {
    expect(manifest.packageManager).toBe("npm@11.21.2");
    expect(manifest.engines.npm).toBe("11.21.2");
    expect(lock.packages[""].engines).toEqual(manifest.engines);
    expect(lock.packages[""].dependencies).toEqual(manifest.dependencies);
    expect(lock.packages[""].devDependencies).toEqual(manifest.devDependencies);
    expect(readFileSync(join(root, ".npmrc"), "utf8")).toContain("engine-strict=true");
  });

  it("rejects an older npm before running project commands", () => {
    const result = spawnSync(process.execPath, [join(root, "scripts/toolchain.mjs")], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, npm_config_user_agent: "npm/10.9.8 node/v22.22.3", npm_execpath: "" },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Required toolchain");
  });

  it("uses decoded file URLs for aliases and fails an empty integration directory", () => {
    expect(unitConfig.resolve?.alias).toEqual({ "@": root });
    expect(integrationConfig.resolve?.alias).toEqual({ "@": root });
    expect(integrationConfig.test?.passWithNoTests).toBe(false);
    expect(manifest.scripts["test:integration"]).not.toContain("passWithNoTests");
    const empty = mkdtempSync(join(tmpdir(), "up17 empty integration "));
    try {
      const result = spawnSync(
        process.execPath,
        [
          join(root, "node_modules/vitest/vitest.mjs"),
          "run",
          "--config",
          join(root, "vitest.integration.config.ts"),
          "--dir",
          empty,
        ],
        { cwd: root, encoding: "utf8" },
      );
      expect(result.status).toBe(1);
      expect(result.stdout + result.stderr).toContain("No test files found");
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it("runs the Python and Next wrappers without shell environment prefixes", () => {
    const python = spawnSync(
      process.execPath,
      [join(root, "scripts/run-python.mjs"), "--version"],
      { cwd: root, encoding: "utf8" },
    );
    expect(python.status).toBe(0);
    expect(python.stdout).toMatch(/^Python 3\./);
    const next = spawnSync(process.execPath, [join(root, "scripts/run-next.mjs"), "--version"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, npm_config_user_agent: "npm/11.21.2 node/v22.22.3" },
    });
    expect(next.status).toBe(0);
    expect(next.stdout).toContain("Next.js v16.4.5");
    for (const name of ["dev", "build", "start", "test:security", "docs:check"]) {
      expect(manifest.scripts[name]).not.toMatch(/[A-Z_]+=\S+\s+(next|python)/);
    }
  });
});
