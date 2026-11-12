import type { AuthDiagnosticCategory, AuthDiagnosticLayer, AuthDiagnosticSummary } from "./schema";
import type { SignupVerificationState } from "./errors";

export type AuthDiagnosticStage =
  | "sign-up"
  | "sign-in"
  | "verify-signup-otp"
  | "resend-confirmation"
  | "reset-password"
  | "update-password"
  | "bootstrap-workspace"
  | "proxy"
  | "supabase-client";

export type AuthDiagnosticOutcome =
  | "auth-error"
  | "unexpected-exception"
  | "verification-state"
  | "cooldown"
  | "auth-unavailable"
  | "claims-refresh-failed"
  | "client-unconfigured"
  | "cookie-write-deferred";

interface AuthDiagnosticInput {
  stage: AuthDiagnosticStage;
  action: string;
  outcome: AuthDiagnosticOutcome;
  reference: string;
  error?: unknown;
  verificationState?: SignupVerificationState;
}

interface AuthFailureLike {
  code?: unknown;
  status?: unknown;
}

/** Non-secret correlation header sent from a server action to Supabase Auth. */
export const AUTH_DIAGNOSTIC_HEADER = "x-up17-auth-reference";

const SAFE_REFERENCE = /^[a-z0-9]{12}$/;
const SAFE_CODE = /^[a-z0-9_.:-]{1,64}$/i;
const SAFE_ACTION = /^[a-z0-9_.:-]{1,64}$/i;
const SAFE_DEPLOYMENT = /^[a-z0-9_.:-]{1,64}$/i;

/** Codes that could become an account-existence oracle are masked in the UI. */
const SENSITIVE_CATEGORIES = new Set<AuthDiagnosticCategory>([
  "verification-required",
  "duplicate-or-existing",
  "invalid-credentials",
]);

/** Short, non-secret correlation id for a hosted runtime log and the UI. */
export function authDiagnosticReference(): string {
  // Web Crypto is available in Node.js server actions and the Edge proxy.
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return random.replaceAll("-", "").slice(0, 12);
  // A deterministic fallback is never used for security decisions.
  return Date.now().toString(36).slice(-12).padStart(12, "0");
}

export function isAuthDiagnosticReference(value: unknown): value is string {
  return typeof value === "string" && SAFE_REFERENCE.test(value);
}

/** Only a validated, random, non-secret reference is propagated to GoTrue. */
export function authDiagnosticHeaders(reference?: string): Record<string, string> {
  return isAuthDiagnosticReference(reference) ? { [AUTH_DIAGNOSTIC_HEADER]: reference } : {};
}

function safeCode(error: unknown): string {
  const code = (error as AuthFailureLike | null)?.code;
  return typeof code === "string" && SAFE_CODE.test(code) ? code.toLowerCase() : "redacted";
}

function safeStatus(error: unknown): number | null {
  const status = (error as AuthFailureLike | null)?.status;
  return typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599
    ? status
    : null;
}

function safeAction(action: string): string {
  return SAFE_ACTION.test(action) ? action : "redacted";
}

function safeDeployment(): string {
  const value = process.env.VERCEL_DEPLOYMENT_ID;
  if (!value) return "local";
  return SAFE_DEPLOYMENT.test(value) ? value.toLowerCase() : "redacted";
}

/**
 * A whitelisted diagnostic summary for the owner-facing UI. It never contains a
 * raw provider message, address, password, OTP, token or SMTP detail. Codes for
 * existence-revealing states are replaced with `redacted` so the UI cannot
 * become an account-enumeration oracle.
 */
export function safeAuthDiagnostic(
  error: unknown,
  category: AuthDiagnosticCategory,
  layer: AuthDiagnosticLayer = "supabase-auth",
): AuthDiagnosticSummary {
  return {
    layer,
    category,
    code: SENSITIVE_CATEGORIES.has(category) ? "redacted" : safeCode(error),
    status: safeStatus(error),
  };
}

const ERROR_OUTCOMES = new Set<AuthDiagnosticOutcome>([
  "auth-error",
  "unexpected-exception",
  "claims-refresh-failed",
]);

/**
 * Emit one structured, redacted server-side diagnostic. Only a whitelisted Auth
 * code, numeric status, stage, deployment id and short reference are logged.
 * Emails, passwords, OTPs, SMTP details, tokens, raw provider messages and
 * stack traces never enter the log payload. Expected states use info level so
 * Next.js development does not surface them as browser console errors.
 */
export function recordAuthDiagnostic(input: AuthDiagnosticInput): void {
  const level = ERROR_OUTCOMES.has(input.outcome) ? "error" : "info";
  const event = {
    event: "up17.auth.diagnostic",
    timestamp: new Date().toISOString(),
    level,
    reference: input.reference,
    deploymentId: safeDeployment(),
    stage: input.stage,
    action: safeAction(input.action),
    outcome: input.outcome,
    code: safeCode(input.error),
    status: safeStatus(input.error),
    ...(input.verificationState ? { verificationState: input.verificationState } : {}),
  } as const;
  const line = JSON.stringify(event);
  if (level === "error") console.error(line);
  else console.info(line);
}
