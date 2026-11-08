import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { checkToolchain } from "./toolchain.mjs";

/** Run a project script with the npm CLI that launched this process. */
export function runNpm(args) {
  checkToolchain();
  const cli = process.env.npm_execpath;
  if (!cli) throw new Error("Run this wrapper through the pinned npm CLI; see README.md.");
  const child = spawn(process.execPath, [cli, "run", ...args], { stdio: "inherit", shell: false });
  child.on("error", (error) => {
    console.error(`Unable to start npm: ${error.message}`);
    process.exitCode = 1;
  });
  child.on("close", (code, signal) => {
    process.exitCode = code ?? 1;
    if (signal) console.error(`npm stopped by ${signal}.`);
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => child.kill(signal));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runNpm(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
