"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/supabase/config";
import {
  emailSchema,
  signInSchema,
  signUpSchema,
  passwordSchema,
  otpSchema,
  type AuthFormState,
} from "./schema";
import { safeNext } from "./redirects";
import { workspaceSetupPath } from "./workspace-setup";
import { getViewer } from "./session";
import { authFailure, signupVerificationState, type SignupVerificationState } from "./errors";
import {
  authDiagnosticReference,
  recordAuthDiagnostic,
  safeAuthDiagnostic,
  type AuthDiagnosticStage,
} from "./diagnostics";

const PENDING_EMAIL_COOKIE = "up17_pending_email";
const OTP_RESEND_COOKIE = "up17_otp_resend_at";
const OTP_RESEND_SECONDS = 60;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/auth",
  maxAge: 60 * 60,
};
const OTP_COOKIE_OPTIONS = { ...COOKIE_OPTIONS, maxAge: OTP_RESEND_SECONDS };

async function client(reference: string) {
  const supabase = await createSupabaseServerClient(reference);
  if (!supabase) throw new Error("Authentication is not configured.");
  return supabase;
}

const UNAVAILABLE_MESSAGE = "Authentication is temporarily unavailable. Please try again later.";
const SIGNUP_FALLBACK_MESSAGE = "We could not create the account. Check the details and try again.";

const SIGNUP_NO_CODE_MESSAGE =
  "We could not start email verification for this address. If it is already registered, sign in or use password recovery; otherwise wait a minute and try again.";

function unavailable(reference: string): AuthFormState {
  return {
    status: "error",
    message: UNAVAILABLE_MESSAGE,
    action: "retry",
    reference,
    diagnostic: safeAuthDiagnostic(null, "application-error", "application"),
  };
}

function logAuthError(
  stage: AuthDiagnosticStage,
  action: string,
  error: unknown,
  reference: string,
): void {
  recordAuthDiagnostic({ stage, action, outcome: "auth-error", reference, error });
}

function logUnexpected(
  stage: AuthDiagnosticStage,
  action: string,
  error: unknown,
  reference: string,
): void {
  recordAuthDiagnostic({ stage, action, outcome: "unexpected-exception", reference, error });
}

function logVerificationState(
  stage: AuthDiagnosticStage,
  action: string,
  verificationState: SignupVerificationState,
  reference: string,
): void {
  recordAuthDiagnostic({
    stage,
    action,
    outcome: "verification-state",
    reference,
    verificationState,
  });
}

export async function signIn(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const reference = authDiagnosticReference();
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter a valid email address and password.",
      action: "retry",
      reference,
    };
  try {
    const { error } = await (await client(reference)).auth.signInWithPassword(parsed.data);
    if (error) {
      logAuthError("sign-in", "signInWithPassword", error, reference);
      return authFailure(
        error,
        "Email or password not recognised, or sign-in is temporarily unavailable.",
        reference,
      );
    }
  } catch (error) {
    logUnexpected("sign-in", "signInWithPassword", error, reference);
    return unavailable(reference);
  }
  // A new request runs the idempotent setup handler with the committed cookies.
  redirect(workspaceSetupPath(form.get("next")));
}

/**
 * Signup deliberately supplies no redirect target. Supabase sends the numeric OTP
 * through its official Confirm signup email template; no confirmation link is
 * generated for this flow and no custom OTP is stored by Up17.
 */
export async function signUp(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const reference = authDiagnosticReference();
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter your name, a valid email and a password of 12–128 characters.",
      action: "retry",
      reference,
    };
  try {
    const { data, error } = await (
      await client(reference)
    ).auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { display_name: parsed.data.displayName } },
    });
    if (error) {
      logAuthError("sign-up", "signUp", error, reference);
      return authFailure(error, SIGNUP_FALLBACK_MESSAGE, reference);
    }
    const verification = signupVerificationState(data);
    logVerificationState("sign-up", "signUp", verification, reference);
    // Obfuscated duplicates and an absent confirmation response use the same
    // ambiguous message: the UI must not become an account-enumeration oracle.
    if (verification === "duplicate-or-no-code" || verification === "no-code")
      return { status: "error", message: SIGNUP_NO_CODE_MESSAGE, action: "sign-in", reference };
    if (verification !== "ready")
      return {
        status: "error",
        message: "Email verification could not be started. Try again later.",
        action: "retry",
        reference,
      };
  } catch (error) {
    logUnexpected("sign-up", "signUp", error, reference);
    return unavailable(reference);
  }
  const store = await cookies();
  // The address is only in a protected short-lived cookie, never in a URL or log.
  store.set(PENDING_EMAIL_COOKIE, parsed.data.email, COOKIE_OPTIONS);
  store.set(OTP_RESEND_COOKIE, "1", OTP_COOKIE_OPTIONS);
  redirect(`/auth/verify-email?next=${encodeURIComponent(safeNext(form.get("next")))}`);
}

/** Verify the official Supabase signup OTP and establish its real session. */
export async function verifySignupOtp(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const reference = authDiagnosticReference();
  const parsed = otpSchema.safeParse({ email: form.get("email"), token: form.get("token") });
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter the six-digit numeric code from your email.",
      action: "retry",
      reference,
    };
  try {
    const supabase = await client(reference);
    const { data, error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: "signup",
    });
    if (error) {
      logAuthError("verify-signup-otp", "verifyOtp", error, reference);
      return authFailure(
        error,
        "That code could not be verified. Request a fresh six-digit code.",
        reference,
      );
    }
    if (!data.session || !data.user?.email_confirmed_at) {
      logVerificationState("verify-signup-otp", "verifyOtp", "no-code", reference);
      return {
        status: "error",
        message: "Verification succeeded but no confirmed session was established. Sign in.",
        action: "sign-in",
        reference,
      };
    }
  } catch (error) {
    logUnexpected("verify-signup-otp", "verifyOtp", error, reference);
    return unavailable(reference);
  }
  const store = await cookies();
  store.set(PENDING_EMAIL_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  store.set(OTP_RESEND_COOKIE, "", { ...OTP_COOKIE_OPTIONS, maxAge: 0 });
  revalidatePath("/", "layout");
  redirect(workspaceSetupPath(form.get("next")));
}

/** Resend the official numeric signup OTP. Supabase enforces expiry and rate limits. */
export async function resendConfirmation(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const reference = authDiagnosticReference();
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter a valid email address.",
      action: "retry",
      reference,
    };
  const store = await cookies();
  if (store.get(OTP_RESEND_COOKIE)) {
    recordAuthDiagnostic({
      stage: "resend-confirmation",
      action: "resend",
      outcome: "cooldown",
      reference,
    });
    return {
      status: "error",
      message: "Wait for the resend cooldown before requesting another code.",
      action: "retry",
      reference,
    };
  }
  try {
    const { error } = await (
      await client(reference)
    ).auth.resend({
      type: "signup",
      email: parsed.data,
    });
    if (error) {
      logAuthError("resend-confirmation", "resend", error, reference);
      return authFailure(
        error,
        "A fresh code could not be requested right now. Wait a moment and try again.",
        reference,
      );
    }
  } catch (error) {
    logUnexpected("resend-confirmation", "resend", error, reference);
    return unavailable(reference);
  }
  store.set(PENDING_EMAIL_COOKIE, parsed.data, COOKIE_OPTIONS);
  store.set(OTP_RESEND_COOKIE, "1", OTP_COOKIE_OPTIONS);
  return {
    status: "success",
    message: "A fresh six-digit code is on its way. It expires and can be used once.",
  };
}

export async function resetPassword(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const reference = authDiagnosticReference();
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success)
    return { status: "error", message: "Enter a valid email address.", action: "retry", reference };
  try {
    const { error } = await (
      await client(reference)
    ).auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${appOrigin()}/auth/callback?next=/auth/update-password`,
    });
    if (error) {
      logAuthError("reset-password", "resetPasswordForEmail", error, reference);
      return authFailure(
        error,
        "A recovery email could not be requested right now. Try again in a moment.",
        reference,
      );
    }
  } catch (error) {
    logUnexpected("reset-password", "resetPasswordForEmail", error, reference);
    return unavailable(reference);
  }
  return {
    status: "success",
    message:
      "If an account exists, a recovery link will be sent. Check your inbox; links expire and can be used once.",
  };
}

export async function updatePassword(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const reference = authDiagnosticReference();
  if (!(await getViewer()))
    return {
      status: "error",
      message: "Open a fresh password recovery link to continue.",
      action: "retry",
      reference,
    };
  const parsed = passwordSchema.safeParse(form.get("password"));
  if (!parsed.success || form.get("password") !== form.get("confirmPassword"))
    return {
      status: "error",
      message: "Passwords must match and contain 12–128 characters.",
      action: "retry",
      reference,
    };
  let otherSessions: "revoked" | "unknown" = "unknown";
  try {
    const supabase = await client(reference);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    if (error) {
      logAuthError("update-password", "updateUser", error, reference);
      return authFailure(
        error,
        "The password could not be updated. Open a fresh recovery link and try again.",
        reference,
      );
    }
    const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
    otherSessions = signOutError ? "unknown" : "revoked";
  } catch (error) {
    logUnexpected("update-password", "updateUser", error, reference);
    return unavailable(reference);
  }
  redirect(workspaceSetupPath(`/account?password=updated&other_sessions=${otherSessions}`));
}

export async function signOut() {
  const supabase = await createSupabaseServerClient(authDiagnosticReference());
  if (supabase) await supabase.auth.signOut();
  const store = await cookies();
  store.set(PENDING_EMAIL_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  store.set(OTP_RESEND_COOKIE, "", { ...OTP_COOKIE_OPTIONS, maxAge: 0 });
  redirect("/login");
}
