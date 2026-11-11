"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { initialAuthState } from "@/lib/auth/schema";
import { signIn, signUp, resetPassword, updatePassword } from "@/lib/auth/actions";

const actions = {
  "sign-in": signIn,
  "sign-up": signUp,
  reset: resetPassword,
  update: updatePassword,
};

export function AuthForm({
  mode,
  next = "/account",
  expired = false,
  authAvailable = true,
}: {
  mode: "sign-in" | "sign-up" | "reset" | "update";
  next?: string;
  expired?: boolean;
  authAvailable?: boolean;
}) {
  const [state, submit, pending] = useActionState(actions[mode], initialAuthState);
  const titles = {
    "sign-in": "Welcome back",
    "sign-up": "Create your creator account",
    reset: "Reset your password",
    update: "Choose a new password",
  };
  const descriptions = {
    "sign-in":
      "Sign in to your private workspace. Video, AI, scheduling, analytics and publishing screens remain labelled sample workflows.",
    "sign-up":
      "Create a real account with email and password. A six-digit email code confirms the address before your verified workspace is created.",
    reset:
      "Request a one-time recovery link. For security, the result is the same whether or not the address has an account.",
    update:
      "Choose a new password for your confirmed account. Other sessions are revoked where supported.",
  };
  const submitLabels = {
    "sign-in": "Sign in",
    "sign-up": "Create account",
    reset: "Send recovery link",
    update: "Update password",
  };
  const submitDisabled = pending || !authAvailable;
  const submitReason = !authAvailable
    ? "Authentication is not configured in this local preview. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the deployment to enable real sign-in."
    : pending
      ? "Submitting securely; wait for the result before trying again."
      : "Your credentials are sent only to the configured Supabase Auth server; no social password is requested.";
  return (
    <div className="page auth-page">
      <Link href="/" className="text-link small">
        <ArrowLeft size={16} /> Back to sample-data overview
      </Link>
      <Card className="auth-card">
        <ShieldCheck size={30} aria-hidden="true" />
        <p className="eyebrow">Real account · verified workspace</p>
        <h1>{titles[mode]}</h1>
        <p className="muted">{descriptions[mode]}</p>
        {mode === "sign-in" || mode === "sign-up" ? (
          <p className="field-hint small wrap-anywhere" data-testid="preview-access-note">
            Preview access: a Vercel Protected Deployment sign-in is a separate security gate for
            this private Preview. This Up17 page is your real email/password account.
          </p>
        ) : null}
        {expired ? (
          <p className="validation-summary" role="alert">
            This link is invalid or expired. Request a fresh email.
          </p>
        ) : null}
        {state.message ? (
          <p
            className={state.status === "error" ? "validation-summary" : "save-notice"}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
            {state.action === "verify-code" ? (
              <>
                {" "}
                <Link href="/auth/verify-email" className="text-link">
                  Enter verification code
                </Link>
              </>
            ) : null}
            {state.action === "resend" ? (
              <>
                {" "}
                <Link href="/auth/verify-email" className="text-link">
                  Request a fresh code
                </Link>
              </>
            ) : null}
            {state.action === "sign-in" ? (
              <>
                {" "}
                <Link href="/login" className="text-link">
                  Sign in
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
        {state.status !== "success" ? (
          <form action={submit} className="stack">
            <input type="hidden" name="next" value={next} />
            {mode === "sign-up" ? (
              <Input
                label="Your name"
                name="displayName"
                autoComplete="name"
                maxLength={80}
                required
              />
            ) : null}
            {mode !== "update" ? (
              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            ) : null}
            {mode !== "reset" ? (
              <Input
                label={mode === "update" ? "New password" : "Password"}
                name="password"
                type="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                minLength={mode === "sign-in" ? 1 : 12}
                maxLength={128}
                required
                hint={
                  mode === "sign-in"
                    ? undefined
                    : "Use 12–128 characters. Never reuse a social-media password."
                }
              />
            ) : null}
            {mode === "update" ? (
              <Input
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            ) : null}
            <Button
              type="submit"
              variant="primary"
              loading={pending}
              disabled={submitDisabled}
              aria-describedby="auth-submit-reason"
              title={submitReason}
            >
              {submitLabels[mode]}
            </Button>
            <p id="auth-submit-reason" className="field-hint">
              {submitReason}
            </p>
          </form>
        ) : null}
        <div className="auth-links">
          {mode === "sign-in" ? (
            <>
              <Link href="/signup" className="text-link">
                Create an account
              </Link>
              <Link href="/auth/verify-email" className="text-link">
                Enter verification code
              </Link>
              <Link href="/reset-password" className="text-link">
                Forgot password?
              </Link>
            </>
          ) : (
            <Link href="/login" className="text-link">
              Back to sign in
            </Link>
          )}
        </div>
        <p className="field-hint">
          Signup uses a six-digit numeric email code. Password recovery stays a separate one-time
          link. Custom SMTP delivery still requires owner verification; creating this account does
          not connect a social account or enable publishing.
        </p>
      </Card>
    </div>
  );
}
