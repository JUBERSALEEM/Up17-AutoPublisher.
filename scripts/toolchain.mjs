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

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value ?? "");
  return match ? match.slice(1).map(Number) : null;
}

/**
 * Hosted builders (Vercel) provision their own patch release inside the engines
 * range (">=22.22.3 <23"). Accept the same major at or above the pinned minimum
 * there, while local development keeps the exact .nvmrc pin. npm stays exactly
 * pinned everywhere; Vercel runs it via `npx --yes npm@11.21.2`.
 */
function satisfiesHostedNode(node) {
  const actual = parseVersion(node);
  const minimum = parseVersion(requiredNode);
  if (!actual || !minimum || actual[0] !== minimum[0]) return false;
  for (let index = 0; index < 3; index += 1) {
    if (actual[index] > minimum[index]) return true;
    if (actual[index] < minimum[index]) return false;
  }
  return true;
}

/** Fail before project scripts silently run under a different toolchain. */
export function checkToolchain({
  node = process.versions.node,
  userAgent = process.env.npm_config_user_agent,
  execPath = process.env.npm_execpath,
  hosted = process.env.VERCEL === "1",
} = {}) {
  // npx can leave the outer npm's user-agent in the environment; prefer the
  // manifest of the npm CLI actually executing this script when available.
  const npm = executingNpmVersion(execPath) ?? /^npm\/(\S+)/.exec(userAgent ?? "")?.[1];
  const nodeOk = hosted ? satisfiesHostedNode(node) : node === requiredNode;
  if (!nodeOk || npm !== requiredNpm) {
    const requirement = hosted
      ? `Node >=${requiredNode} <${Number(requiredNode.split(".")[0]) + 1} (Vercel hosted build), npm ${requiredNpm}`
      : `Node ${requiredNode}, npm ${requiredNpm}`;
    throw new Error(
      `Required toolchain: ${requirement}; received Node ${node}, npm ${npm ?? "unknown"}. ` +
        `Install the pinned Node/npm versions, then run npm ci. See README.md.`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    checkToolchain();
    console.log(`Toolchain verified: Node ${process.versions.node}; npm ${requiredNpm}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
