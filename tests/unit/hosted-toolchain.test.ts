import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkToolchain, requiredNpm } from "../../scripts/toolchain.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const local = {
  node: "22.22.3",
  userAgent: `npm/${requiredNpm} node/v22.22.3`,
  execPath: "",
  hosted: false,
};

describe("hosted deployment toolchain", () => {
  it("keeps exact local pins and reproducible hosted commands", () => {
    expect(manifest.engines).toEqual({ node: ">=22.22.3 <23", npm: requiredNpm });
    expect(config).toEqual({
      $schema: "https://openapi.vercel.sh/vercel.json",
      framework: "nextjs",
      installCommand: `npx --yes npm@${requiredNpm} ci`,
      buildCommand: `npx --yes npm@${requiredNpm} run build`,
      crons: [{ path: "/api/cron/connections", schedule: "0 3 * * *" }],
    });
    expect(() => checkToolchain(local)).not.toThrow();
  });

  it("accepts Vercel's compatible Node patch without accepting another npm", () => {
    expect(() =>
      checkToolchain({
        ...local,
        hosted: true,
        node: "22.23.4",
        userAgent: "npm/10.9.9 node/v22.23.4",
      }),
    ).toThrow(/npm 11\.21\.2/);
    expect(() => checkToolchain({ ...local, hosted: true, node: "22.23.4" })).not.toThrow();
    expect(() => checkToolchain({ ...local, node: "22.23.4" })).toThrow(/Required toolchain/);
  });

  it.each(["22.22.2", "21.9.0", "23.0.0", "26.0.0", "invalid"])(
    "rejects incompatible hosted Node %s",
    (node) => {
      expect(() => checkToolchain({ ...local, hosted: true, node })).toThrow(/Required toolchain/);
    },
  );

  it("does not treat an arbitrary CI environment as permission to change Node", () => {
    const result = spawnSync(process.execPath, [join(root, "scripts/toolchain.mjs")], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "true",
        VERCEL: "0",
        npm_config_user_agent: "npm/10.9.9 node/v22.22.3",
        npm_execpath: "",
      },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Required toolchain");
  });

  it("runs the real Next wrapper in hosted mode with the pinned npm", () => {
    const result = spawnSync(process.execPath, [join(root, "scripts/run-next.mjs"), "--version"], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        VERCEL: "1",
        npm_config_user_agent: `npm/${requiredNpm} node/v${process.versions.node}`,
        npm_execpath: "",
      },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Next.js v16.4.5");
  });
});
