import { safeAuthDiagnostic } from "./diagnostics";
import type { AuthDiagnosticCategory, AuthFormState } from "./schema";

/** Only safe, documented Supabase Auth metadata is used to choose a public message. */
export interface AuthFailureLike {
  code?: string;
  status?: number;
  /** Classification only; never returned, logged or shown to the user. */
  message?: string;
}

/** Minimal shape of `auth.signUp()` data needed to detect an email that was not sent. */
export interface SignupDataLike {
  user?: {
    identities?: unknown[] | null;
    confirmation_sent_at?: string | null;
  } | null;
  session?: unknown | null;
}

export type SignupVerificationState =
  "ready" | "duplicate-or-no-code" | "unexpected-session" | "no-code";

const RATE_LIMIT_CODES = [
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "over_otp_rate_limit",
  "over_sms_send_rate_limit",
];
const EXPIRED_CODES = ["otp_expired", "invalid_token", "bad_otp", "token_expired", "otp_disabled"];
const DUPLICATE_CODES = ["email_exists", "user_already_exists", "user_already_registered"];
const WEAK_PASSWORD_CODES = ["weak_password", "password_too_short", "same_password"];
const INVALID_CREDENTIAL_CODES = ["invalid_credentials", "user_not_found"];
const SESSION_EXPIRED_CODES = [
  "session_expired",
  "refresh_token_not_found",
  "flow_state_expired",
  "flow_state_not_found",
];
const SIGNUP_DISABLED_CODES = ["signup_disabled", "email_provider_disabled"];
const INVALID_EMAIL_CODES = ["email_address_invalid"];
const EMAIL_DELIVERY_CODES = ["email_send_failed", "email_address_not_authorized"];
const EMAIL_DELIVERY_MESSAGE =
  "We could not send the verification email. This is not caused by the details you entered. Please try again in a few minutes; if it continues, contact support.";

/** GoTrue returns a generic 500 for a refused confirmation-email handover. */
function isEmailDeliveryFailure(error: AuthFailureLike | null): boolean {
  const code = error?.code ?? "";
  if (EMAIL_DELIVERY_CODES.includes(code)) return true;
  return (
    code === "unexpected_failure" &&
    typeof error?.message === "string" &&
    /sending (confirmation|verification|recovery|magic link|invite) email/i.test(error.message)
  );
}

interface FailureClassification {
  message: string;
  action: NonNullable<AuthFormState["action"]>;
  category: AuthDiagnosticCategory;
}

/** Convert an Auth error into a safe message and a whitelisted diagnostic category. */
function classify(error: AuthFailureLike | null, fallback: string): FailureClassification {
  const code = error?.code ?? "";
  if (RATE_LIMIT_CODES.some((candidate) => code.includes(candidate)))
    return {
      message: "Too many requests. Wait a few minutes before trying again.",
      action: "retry",
      category: "rate-limit",
    };
  if (EXPIRED_CODES.some((candidate) => code.includes(candidate)))
    return {
      message: "That code is invalid or has expired. Request a fresh six-digit code.",
      action: "resend",
      category: "expired-code",
    };
  if (code === "email_not_confirmed")
    return {
      message: "Enter the six-digit code sent to your email, then sign in.",
      action: "verify-code",
      category: "verification-required",
    };
  if (DUPLICATE_CODES.includes(code))
    return {
      message:
        "This address may already be registered. Sign in or use password recovery if you have forgotten it.",
      action: "sign-in",
      category: "duplicate-or-existing",
    };
  if (WEAK_PASSWORD_CODES.includes(code))
    return {
      message:
        "Choose a stronger, different password of 12–128 characters that you have not reused.",
      action: "retry",
      category: "weak-password",
    };
  if (INVALID_CREDENTIAL_CODES.includes(code))
    return {
      message: "Email or password not recognised.",
      action: "retry",
      category: "invalid-credentials",
    };
  if (SESSION_EXPIRED_CODES.some((candidate) => code.includes(candidate)))
    return {
      message: "Your session expired. Sign in again.",
      action: "sign-in",
      category: "session-expired",
    };
  if (SIGNUP_DISABLED_CODES.includes(code))
    return {
      message: "New account creation is unavailable right now. Try again later.",
      action: "retry",
      category: "signup-disabled",
    };
  if (INVALID_EMAIL_CODES.includes(code))
    return {
      message: "Enter a valid email address that can receive the verification code.",
      action: "retry",
      category: "invalid-email",
    };
  if (code === "captcha_failed")
    return {
      message: "The verification check did not complete. Try again.",
      action: "retry",
      category: "captcha",
    };
  if (code === "validation_failed")
    return {
      message: "Check the details you entered and try again.",
      action: "retry",
      category: "validation",
    };
  if (isEmailDeliveryFailure(error))
    return {
      message: EMAIL_DELIVERY_MESSAGE,
      action: "retry",
      category: "verification-email",
    };
  return { message: fallback, action: "retry", category: "provider-error" };
}

/**
 * Convert Auth errors into useful, non-enumerating copy plus a whitelisted safe
 * diagnostic summary. Raw provider/SMTP/token details and stack traces are
 * intentionally never included.
 */
export function authFailure(
  error: AuthFailureLike | null,
  fallback: string,
  reference?: string,
): AuthFormState {
  const failure = classify(error, fallback);
  return {
    status: "error",
    message: failure.message,
    action: failure.action,
    ...(reference ? { reference } : {}),
    diagnostic: safeAuthDiagnostic(error, failure.category),
  };
}

/**
 * With Confirm email enabled, GoTrue returns an obfuscated user with empty
 * identities for an already-registered address instead of an error. A real new
 * signup returns an identity and a confirmation timestamp, and no session.
 * Autoconfirm (a hosted misconfiguration) must never silently bypass the OTP.
 */
export function signupVerificationState(
  data: SignupDataLike | null | undefined,
): SignupVerificationState {
  if (!data?.user) return "no-code";
  if (data.session) return "unexpected-session";
  const identities = data.user.identities;
  if (Array.isArray(identities) && identities.length === 0) return "duplicate-or-no-code";
  if (!data.user.confirmation_sent_at) return "no-code";
  return "ready";
}
