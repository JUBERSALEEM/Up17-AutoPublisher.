import type { AuthFormState } from "./schema";

/** Only the safe, documented Supabase Auth code is used to choose a public message. */
export interface AuthFailureLike {
  code?: string;
  status?: number;
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
const INVALID_EMAIL_CODES = ["email_address_invalid", "email_address_not_authorized"];

function result(message: string, action: AuthFormState["action"] = "retry"): AuthFormState {
  return { status: "error", message, action };
}

/**
 * Convert Auth errors into useful, non-enumerating copy. Raw provider/SMTP/token
 * details and stack traces are intentionally never included.
 */
export function authFailure(error: AuthFailureLike | null, fallback: string): AuthFormState {
  const code = error?.code ?? "";
  if (RATE_LIMIT_CODES.some((candidate) => code.includes(candidate)))
    return result("Too many requests. Wait a few minutes before trying again.");
  if (EXPIRED_CODES.some((candidate) => code.includes(candidate)))
    return result("That code is invalid or has expired. Request a fresh six-digit code.", "resend");
  if (code === "email_not_confirmed")
    return result("Enter the six-digit code sent to your email, then sign in.", "verify-code");
  if (DUPLICATE_CODES.includes(code))
    return result(
      "This address may already be registered. Sign in or use password recovery if you have forgotten it.",
      "sign-in",
    );
  if (WEAK_PASSWORD_CODES.includes(code))
    return result(
      "Choose a stronger, different password of 12–128 characters that you have not reused.",
    );
  if (INVALID_CREDENTIAL_CODES.includes(code)) return result("Email or password not recognised.");
  if (SESSION_EXPIRED_CODES.includes(code))
    return result("Your session expired. Sign in again.", "sign-in");
  if (SIGNUP_DISABLED_CODES.includes(code))
    return result("New account creation is unavailable right now. Try again later.");
  if (INVALID_EMAIL_CODES.includes(code))
    return result("Enter a valid email address that can receive the verification code.");
  if (code === "captcha_failed")
    return result("The verification check did not complete. Try again.");
  if (code === "validation_failed") return result("Check the details you entered and try again.");
  return result(fallback);
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
