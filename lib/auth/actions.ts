"use server";
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

async function client() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Authentication is not configured.");
  return supabase;
}
const unavailable: AuthFormState = {
  status: "error",
  message: "Authentication is temporarily unavailable. Please try again later.",
};

export async function signIn(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { status: "error", message: "Enter a valid email address and password." };
  try {
    const { error } = await (await client()).auth.signInWithPassword(parsed.data);
    if (error)
      return {
        status: "error",
        message:
          error.code === "email_not_confirmed"
            ? "Confirm your email address before signing in."
            : "Email or password not recognised, or sign-in is temporarily unavailable.",
      };
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
    };
  try {
    const { error } = await (
      await client()
    ).auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: `${appOrigin()}/auth/callback?next=/account`,
      },
    });
    if (error) return unavailable;
  } catch {
    return unavailable;
  }
  return {
    status: "success",
    message:
      "If this address can register, a confirmation email will arrive. Confirm your email before signing in. Delivery is not yet production-verified.",
  };
}

export async function resetPassword(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) return { status: "error", message: "Enter a valid email address." };
  try {
    const { error } = await (
      await client()
    ).auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${appOrigin()}/auth/callback?next=/auth/update-password`,
    });
    if (error) return unavailable;
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
    return { status: "error", message: "Open a fresh password recovery link to continue." };
  const parsed = passwordSchema.safeParse(form.get("password"));
  if (!parsed.success || form.get("password") !== form.get("confirmPassword"))
    return { status: "error", message: "Passwords must match and contain 12–128 characters." };
  try {
    const supabase = await client();
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    if (error) return unavailable;
    await supabase.auth.signOut({ scope: "others" });
  } catch {
    return unavailable;
  }
  redirect("/account?password=updated");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/sign-in");
}
