import { safeNext } from "./redirects";

/** A GET Route Handler performs the write only after the auth cookies are committed. */
export const WORKSPACE_SETUP_PATH = "/workspace/setup";
export const ONBOARDING_PATH = "/onboarding";

export type WorkspaceSetupFailureReason = "auth" | "rpc" | "unavailable";

/** Safe, whitelisted messages; raw provider/Postgres errors are never put in a URL. */
export const WORKSPACE_SETUP_FAILURE_MESSAGES = {
  auth: "Sign in with a confirmed email before creating a private workspace.",
  rpc: "Workspace setup could not finish. Reload this page to retry; no data was changed.",
  unavailable: "Workspace setup is temporarily unavailable. Reload this page to retry.",
} as const satisfies Record<WorkspaceSetupFailureReason, string>;

/** Route all successful authentication through a request-scoped setup handler. */
export function workspaceSetupPath(next: unknown): string {
  const params = new URLSearchParams({ next: workspaceDestination(next) });
  return `${WORKSPACE_SETUP_PATH}?${params.toString()}`;
}

export function workspaceSetupFailurePath(
  next: unknown,
  reason: WorkspaceSetupFailureReason,
): string {
  const params = new URLSearchParams({
    error: "setup-failed",
    reason,
    next: workspaceDestination(next),
  });
  return `${ONBOARDING_PATH}?${params.toString()}`;
}

/** Setup and onboarding are not valid final destinations; prevent redirect loops. */
export function workspaceDestination(next: unknown, fallback = "/account"): string {
  const safe = safeNext(next, fallback);
  try {
    const url = new URL(safe, "https://up17.invalid");
    if (url.pathname === WORKSPACE_SETUP_PATH || url.pathname === ONBOARDING_PATH) return fallback;
  } catch {
    return fallback;
  }
  return safe;
}

export function workspaceSetupFailureReason(value: unknown): WorkspaceSetupFailureReason {
  return value === "auth" || value === "rpc" ? value : "unavailable";
}
