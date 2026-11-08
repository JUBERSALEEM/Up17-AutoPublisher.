import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const requiredNpm = "11.21.2";
const requiredNode = readFileSync(new URL("../.nvmrc", import.meta.url), "utf8").trim();

function executingNpmVersion(execPath) {
  if (!execPath) return undefined;
  try {
    const manifest = JSON.parse(readFileSync(resolve(execPath, "../../package.json"), "utf8"));
    return manifest.name === "npm" ? manifest.version : undefined;
  } catch {
    return undefined;
  }
}

/** Fail before project scripts silently run under a different toolchain. */
export function checkToolchain({
  node = process.versions.node,
  userAgent = process.env.npm_config_user_agent,
  execPath = process.env.npm_execpath,
} = {}) {
  // npx can leave the outer npm's user-agent in the environment; prefer the
  // manifest of the npm CLI actually executing this script when available.
  const npm = executingNpmVersion(execPath) ?? /^npm\/(\S+)/.exec(userAgent ?? "")?.[1];
  if (node !== requiredNode || npm !== requiredNpm) {
    throw new Error(
      `Required toolchain: Node ${requiredNode}, npm ${requiredNpm}; received Node ${node}, npm ${npm ?? "unknown"}. ` +
        `Install the pinned Node/npm versions, then run npm ci. See README.md.`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    checkToolchain();
    console.log(`Toolchain verified: Node ${requiredNode}; npm ${requiredNpm}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
