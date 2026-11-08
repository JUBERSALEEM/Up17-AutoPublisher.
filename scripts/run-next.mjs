import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { checkToolchain } from "./toolchain.mjs";

const require = createRequire(import.meta.url);

/** Use Node APIs rather than POSIX-only VAR=value script prefixes. */
export function runNext(args) {
  checkToolchain();
  const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), ...args], {
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    shell: false,
  });
  child.on("error", (error) => {
    console.error(`Unable to start Next.js: ${error.message}`);
    process.exitCode = 1;
  });
  child.on("close", (code, signal) => {
    process.exitCode = code ?? 1;
    if (signal) console.error(`Next.js stopped by ${signal}.`);
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => child.kill(signal));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runNext(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
