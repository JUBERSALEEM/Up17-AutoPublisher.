import { spawnSync } from "node:child_process";
import { checkToolchain } from "./toolchain.mjs";

const gates = [
  "toolchain:check",
  "format:check",
  "lint",
  "typecheck",
  "test:unit",
  "test:integration",
  "test:security",
  "build",
];

try {
  checkToolchain();
  const cli = process.env.npm_execpath;
  if (!cli) throw new Error("Run quality gates through the pinned npm CLI; see README.md.");
  for (const gate of gates) {
    console.log(`\n=== ${gate} ===`);
    const result = spawnSync(process.execPath, [cli, "run", gate], {
      stdio: "inherit",
      shell: false,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
