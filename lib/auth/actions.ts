"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/supabase/config";
import {
  emailSchema,
  signInSchema,
  signUpSchema,
  passwordSchema,
  type AuthFormState,
} from "./schema";
import { safeNext } from "./redirects";
import { getViewer } from "./session";

const PENDING_EMAIL_COOKIE = "up17_pending_email";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/auth",
  maxAge: 60 * 60,
};

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

interface AuthFailure {
  code?: string;
  status?: number;
}

function failure(error: AuthFailure | null, fallback: string): AuthFormState {
  const code = error?.code ?? "";
  if (code.includes("over_email_send_rate_limit") || code.includes("over_request_rate_limit"))
    return {
      status: "error",
      message: "Too many email requests. Wait a few minutes before trying again.",
      action: "retry",
    };
  if (code === "email_not_confirmed")
    return {
      status: "error",
      message: "Confirm your email before signing in. Need a new confirmation link?",
      action: "resend",
    };
  if (code === "user_already_registered")
    return {
      status: "error",
      message:
        "This address may already be registered. Sign in or request a fresh confirmation link.",
      action: "sign-in",
    };
  if (code === "weak_password" || code === "password_too_short")
    return {
      status: "error",
      message: "Choose a stronger password of 12–128 characters that you have not reused.",
      action: "retry",
    };
  if (code === "validation_failed")
    return {
      status: "error",
      message: "Check the email address and password, then try again.",
      action: "retry",
    };
  return { status: "error", message: fallback, action: "retry" };
}

function confirmationRedirect(next: unknown): string {
  return `${appOrigin()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
}

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
      return failure(
        error,
        "Email or password not recognised, or sign-in is temporarily unavailable.",
      );
  } catch {
    return unavailable;
  }
  redirect(safeNext(form.get("next")));
}

export async function signUp(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter your name, a valid email and a password of 12–128 characters.",
      action: "retry",
    };
  try {
    const { error } = await (
      await client()
    ).auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: confirmationRedirect(form.get("next")),
      },
    });
    if (error)
      return failure(error, "The account could not be created. Check the details and try again.");
  } catch {
    return unavailable;
  }
  // The address is only in a protected short-lived cookie, never in a URL or log.
  (await cookies()).set(PENDING_EMAIL_COOKIE, parsed.data.email, COOKIE_OPTIONS);
  redirect(`/auth/verify-email?next=${encodeURIComponent(safeNext(form.get("next")))}`);
}

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
  try {
    const { error } = await (
      await client()
    ).auth.resend({
      type: "signup",
      email: parsed.data,
      options: { emailRedirectTo: confirmationRedirect(form.get("next")) },
    });
    if (error) return failure(error, "A new confirmation email could not be requested right now.");
  } catch {
    return unavailable;
  }
  (await cookies()).set(PENDING_EMAIL_COOKIE, parsed.data, COOKIE_OPTIONS);
  return {
    status: "success",
    message:
      "If this address can be confirmed, a fresh email is on its way. Open the link in this browser, then sign in.",
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
    if (error) return failure(error, "A recovery email could not be requested right now.");
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
      return failure(error, "The password could not be updated. Open a fresh recovery link.");
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
  (await cookies()).set(PENDING_EMAIL_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  redirect("/login");
}
