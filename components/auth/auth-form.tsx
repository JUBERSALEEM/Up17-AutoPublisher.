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
}: {
  mode: "sign-in" | "sign-up" | "reset" | "update";
  next?: string;
  expired?: boolean;
}) {
  const [state, submit, pending] = useActionState(actions[mode], initialAuthState);
  const titles = {
    "sign-in": "Welcome back",
    "sign-up": "Create your creator account",
    reset: "Reset your password",
    update: "Choose a new password",
  };
  return (
    <div className="page auth-page">
      <Link href="/" className="text-link small">
        <ArrowLeft size={16} /> Explore the labelled demo
      </Link>
      <Card className="auth-card">
        <ShieldCheck size={30} aria-hidden="true" />
        <p className="eyebrow">Your private creator workspace</p>
        <h1>{titles[mode]}</h1>
        <p className="muted">
          Account and workspace settings use protected cloud storage. Video, analysis and publishing
          screens remain labelled demos.
        </p>
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
            <Button type="submit" variant="primary" loading={pending} disabled={pending}>
              {
                {
                  "sign-in": "Sign in",
                  "sign-up": "Create account",
                  reset: "Send recovery link",
                  update: "Update password",
                }[mode]
              }
            </Button>
          </form>
        ) : null}
        <div className="auth-links">
          {mode === "sign-in" ? (
            <>
              <Link href="/sign-up" className="text-link">
                Create an account
              </Link>
              <Link href="/reset-password" className="text-link">
                Forgot password?
              </Link>
            </>
          ) : (
            <Link href="/sign-in" className="text-link">
              Back to sign in
            </Link>
          )}
        </div>
        <p className="field-hint">
          Email confirmation is required. Production email delivery is still being verified. No
          social account is connected by creating this account.
        </p>
      </Card>
    </div>
  );
}
