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

const SAFE_CODE = /^[a-z0-9_.:-]{1,64}$/i;
const SAFE_ACTION = /^[a-z0-9_.:-]{1,64}$/i;

/** Short, non-secret correlation id for a hosted runtime log and the UI. */
export function authDiagnosticReference(): string {
  // Web Crypto is available in Node.js server actions and the Edge proxy.
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return random.replaceAll("-", "").slice(0, 12);
  // A deterministic fallback is never used for security decisions.
  return Date.now().toString(36).slice(-12).padStart(12, "0");
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

const ERROR_OUTCOMES = new Set<AuthDiagnosticOutcome>([
  "auth-error",
  "unexpected-exception",
  "claims-refresh-failed",
]);

/**
 * Emit one structured, redacted server-side diagnostic. Only a whitelisted Auth
 * code, numeric status, stage and short reference are logged. Emails, passwords,
 * OTPs, SMTP details, tokens, raw provider messages and stack traces never enter
 * the log payload. Expected states use info level so Next.js development does not
 * surface them as browser console errors.
 */
export function recordAuthDiagnostic(input: AuthDiagnosticInput): void {
  const level = ERROR_OUTCOMES.has(input.outcome) ? "error" : "info";
  const event = {
    event: "up17.auth.diagnostic",
    timestamp: new Date().toISOString(),
    level,
    reference: input.reference,
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
