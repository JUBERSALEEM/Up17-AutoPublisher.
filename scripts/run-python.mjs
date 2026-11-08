import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Resolve Python 3 on Linux/macOS/Windows without shell-specific syntax. */
export function findPython() {
  const configured = process.env.PYTHON;
  const candidates = configured
    ? [[configured, []]]
    : [
        ["python3", []],
        ["python", []],
        ["py", ["-3"]],
      ];
  for (const [command, prefix] of candidates) {
    const probe = spawnSync(command, [...prefix, "--version"], { encoding: "utf8", shell: false });
    if (!probe.error && probe.status === 0 && /^Python 3\./.test(probe.stdout.trim())) {
      return { command, prefix };
    }
  }
  throw new Error(
    "Python 3 is required. Install it or set PYTHON to its executable; see README.md.",
  );
}

export function runPython(args) {
  const { command, prefix } = findPython();
  const child = spawn(command, [...prefix, ...args], { stdio: "inherit", shell: false });
  child.on("error", (error) => {
    console.error(`Unable to start Python: ${error.message}`);
    process.exitCode = 1;
  });
  child.on("close", (code, signal) => {
    process.exitCode = code ?? 1;
    if (signal) console.error(`Python stopped by ${signal}.`);
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => child.kill(signal));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runPython(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
