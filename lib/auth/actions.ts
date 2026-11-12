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
import { getViewer } from "./session";
import { authFailure, signupVerificationState } from "./errors";

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

async function client() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Authentication is not configured.");
  return supabase;
}

const unavailable: AuthFormState = {
  status: "error",
  message: "Authentication is temporarily unavailable. Please try again later.",
  action: "retry",
};

const SIGNUP_NO_CODE_MESSAGE =
  "We could not start email verification for this address. If it is already registered, sign in or use password recovery; otherwise wait a minute and try again.";

export async function signIn(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter a valid email address and password.",
      action: "retry",
    };
  try {
    const { error } = await (await client()).auth.signInWithPassword(parsed.data);
    if (error)
      return authFailure(
        error,
        "Email or password not recognised, or sign-in is temporarily unavailable.",
      );
  } catch {
    return unavailable;
  }
  redirect(safeNext(form.get("next")));
}

/**
 * Signup deliberately supplies no redirect target. Supabase sends the numeric OTP
 * through its official Confirm signup email template; no confirmation link is
 * generated for this flow and no custom OTP is stored by Up17.
 */
export async function signUp(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter your name, a valid email and a password of 12–128 characters.",
      action: "retry",
    };
  try {
    const { data, error } = await (
      await client()
    ).auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { display_name: parsed.data.displayName } },
    });
    if (error)
      return authFailure(
        error,
        "We could not create the account. Check the details and try again.",
      );
    const verification = signupVerificationState(data);
    if (verification === "duplicate-or-no-code")
      return { status: "error", message: SIGNUP_NO_CODE_MESSAGE, action: "sign-in" };
    if (verification !== "ready")
      return {
        status: "error",
        message: "Email verification could not be started. Try again later.",
        action: "retry",
      };
  } catch {
    return unavailable;
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
  const parsed = otpSchema.safeParse({ email: form.get("email"), token: form.get("token") });
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter the six-digit numeric code from your email.",
      action: "retry",
    };
  try {
    const supabase = await client();
    const { data, error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: "signup",
    });
    if (error)
      return authFailure(error, "That code could not be verified. Request a fresh six-digit code.");
    if (!data.session || !data.user?.email_confirmed_at)
      return {
        status: "error",
        message: "Verification succeeded but no confirmed session was established. Sign in.",
        action: "sign-in",
      };
  } catch {
    return unavailable;
  }
  const store = await cookies();
  store.set(PENDING_EMAIL_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  store.set(OTP_RESEND_COOKIE, "", { ...OTP_COOKIE_OPTIONS, maxAge: 0 });
  revalidatePath("/", "layout");
  redirect(safeNext(form.get("next")));
}

/** Resend the official numeric signup OTP. Supabase enforces expiry and rate limits. */
export async function resendConfirmation(
  _state: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter a valid email address.",
      action: "retry",
    };
  const store = await cookies();
  if (store.get(OTP_RESEND_COOKIE))
    return {
      status: "error",
      message: "Wait for the resend cooldown before requesting another code.",
      action: "retry",
    };
  try {
    const { error } = await (
      await client()
    ).auth.resend({
      type: "signup",
      email: parsed.data,
    });
    if (error)
      return authFailure(
        error,
        "A fresh code could not be requested right now. Wait a moment and try again.",
      );
  } catch {
    return unavailable;
  }
  store.set(PENDING_EMAIL_COOKIE, parsed.data, COOKIE_OPTIONS);
  store.set(OTP_RESEND_COOKIE, "1", OTP_COOKIE_OPTIONS);
  return {
    status: "success",
    message: "A fresh six-digit code is on its way. It expires and can be used once.",
  };
}

export async function resetPassword(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success)
    return { status: "error", message: "Enter a valid email address.", action: "retry" };
  try {
    const { error } = await (
      await client()
    ).auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${appOrigin()}/auth/callback?next=/auth/update-password`,
    });
    if (error)
      return authFailure(
        error,
        "A recovery email could not be requested right now. Try again in a moment.",
      );
  } catch {
    return unavailable;
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
  if (!(await getViewer()))
    return {
      status: "error",
      message: "Open a fresh password recovery link to continue.",
      action: "retry",
    };
  const parsed = passwordSchema.safeParse(form.get("password"));
  if (!parsed.success || form.get("password") !== form.get("confirmPassword"))
    return {
      status: "error",
      message: "Passwords must match and contain 12–128 characters.",
      action: "retry",
    };
  let otherSessions: "revoked" | "unknown" = "unknown";
  try {
    const supabase = await client();
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    if (error)
      return authFailure(
        error,
        "The password could not be updated. Open a fresh recovery link and try again.",
      );
    const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
    otherSessions = signOutError ? "unknown" : "revoked";
  } catch {
    return unavailable;
  }
  redirect(`/account?password=updated&other_sessions=${otherSessions}`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  const store = await cookies();
  store.set(PENDING_EMAIL_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  store.set(OTP_RESEND_COOKIE, "", { ...OTP_COOKIE_OPTIONS, maxAge: 0 });
  redirect("/login");
}
