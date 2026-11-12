"use client";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { initialAuthState, type AuthFormState } from "@/lib/auth/schema";
import { resendConfirmation, verifySignupOtp } from "@/lib/auth/actions";
import { AuthErrorReference } from "./auth-error-reference";

const LENGTH = 6;
const RESEND_SECONDS = 60;

export function OtpForm({
  next = "/account",
  expired = false,
  authAvailable = true,
  defaultEmail = "",
}: {
  next?: string;
  expired?: boolean;
  authAvailable?: boolean;
  defaultEmail?: string;
}) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifySignupOtp,
    initialAuthState,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    async (state: AuthFormState, form: FormData): Promise<AuthFormState> => {
      const result = await resendConfirmation(state, form);
      if (result.status === "success") setCooldown(RESEND_SECONDS);
      return result;
    },
    initialAuthState,
  );
  const refs = useRef<Array<HTMLInputElement | null>>(Array(LENGTH).fill(null));
  const token = digits.join("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const focus = (index: number) => refs.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();

  const setDigit = (index: number, value: string) => {
    setDigits((current) => {
      const nextDigits = [...current];
      nextDigits[index] = value;
      return nextDigits;
    });
  };

  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setDigits((current) => {
      const nextDigits = [...current];
      for (let index = 0; index < LENGTH; index += 1) nextDigits[index] = pasted[index] ?? "";
      return nextDigits;
    });
    focus(Math.min(pasted.length, LENGTH - 1));
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      setDigits((current) => {
        const nextDigits = [...current];
        if (nextDigits[index]) nextDigits[index] = "";
        else if (index > 0) {
          nextDigits[index - 1] = "";
          focus(index - 1);
        }
        return nextDigits;
      });
    } else if (event.key === "Delete") {
      event.preventDefault();
      setDigit(index, "");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(index + 1);
    }
  };

  const authReason = !authAvailable
    ? "Authentication is not configured in this local preview. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the deployment to enable real sign-in."
    : null;
  const verifyDisabledReason =
    authReason ??
    (verifyPending
      ? "Verifying the code securely; wait for the result."
      : token.length !== LENGTH
        ? "Enter all six digits of the numeric code from your email."
        : null);
  const resendDisabledReason =
    authReason ??
    (resendPending
      ? "Requesting a fresh code; wait for the result."
      : cooldown > 0
        ? `Wait ${cooldown} second${cooldown === 1 ? "" : "s"} before requesting another code.`
        : null);
  const error =
    verifyState.status === "error"
      ? verifyState.message
      : resendState.status === "error"
        ? resendState.message
        : null;
  const success = resendState.status === "success" ? resendState.message : null;
  const errorReference =
    verifyState.status === "error"
      ? verifyState.reference
      : resendState.status === "error"
        ? resendState.reference
        : undefined;

  return (
    <div className="page auth-page">
      <Link href="/" className="text-link small">
        <ArrowLeft size={16} /> Back to sample-data overview
      </Link>
      <Card className="auth-card otp-card" data-testid="otp-form">
        <ShieldCheck size={30} aria-hidden="true" />
        <p className="eyebrow">Real account · six-digit email code</p>
        <h1>Verify your email</h1>
        <p className="muted">
          Enter the six-digit code Supabase sent to your email. This official one-time code expires,
          can be used once, and creates your confirmed Up17 session.
        </p>
        <p className="field-hint small" data-testid="preview-access-note">
          Preview access: a Vercel Protected Deployment sign-in is a separate security gate for this
          private Preview. This Up17 page is your real email/password account.
        </p>
        {expired ? (
          <p className="validation-summary" role="alert" data-testid="otp-expired">
            That older confirmation link is no longer valid. Signup now uses a numeric code; request
            a fresh six-digit code below.
          </p>
        ) : null}
        {defaultEmail ? (
          <p className="muted small">
            Code sent to <strong className="wrap-anywhere">{defaultEmail}</strong>. Use a different
            address below if this is not correct.
          </p>
        ) : (
          <p className="muted small">
            No pending address was found. Enter the email address you used to sign up.
          </p>
        )}
        {error ? (
          <p className="validation-summary" role="alert" data-testid="otp-error">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="save-notice" role="status" data-testid="otp-success">
            {success}
          </p>
        ) : null}
        <AuthErrorReference reference={errorReference} />
        <form action={verifyAction} className="stack">
          <input type="hidden" name="next" value={next} />
          {defaultEmail ? (
            <input type="hidden" name="email" value={defaultEmail} data-testid="otp-email" />
          ) : (
            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              data-testid="otp-email"
            />
          )}
          <input type="hidden" name="token" value={token} />
          <div
            className="otp-inputs"
            role="group"
            aria-label="Six-digit verification code"
            aria-describedby="otp-hint"
            onPaste={onPaste}
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  refs.current[index] = element;
                }}
                className={`input otp-input ${error ? "input-error" : ""}`}
                data-testid={`otp-digit-${index + 1}`}
                aria-label={`Digit ${index + 1} of ${LENGTH}`}
                aria-invalid={error ? true : undefined}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                disabled={!authAvailable || verifyPending}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(-1);
                  setDigit(index, value);
                  if (value && index < LENGTH - 1) focus(index + 1);
                }}
                onKeyDown={(event) => onKeyDown(index, event)}
              />
            ))}
          </div>
          <p id="otp-hint" className="field-hint small">
            Paste the whole code, or type each digit. Use Backspace and arrow keys to move between
            boxes. Codes are never stored by Up17 and are verified only by Supabase Auth.
          </p>
          <Button
            type="submit"
            variant="primary"
            loading={verifyPending}
            disabled={!authAvailable || verifyPending || token.length !== LENGTH}
            disabledReason={verifyDisabledReason ?? undefined}
            title={
              verifyDisabledReason ??
              "Your code is sent only to the configured Supabase Auth server."
            }
            aria-describedby={verifyDisabledReason ? "otp-verify-reason" : undefined}
          >
            Verify code
          </Button>
          {verifyDisabledReason ? (
            <p id="otp-verify-reason" className="field-hint small">
              {verifyDisabledReason}
            </p>
          ) : null}
        </form>
        <form action={resendAction} className="otp-resend-form">
          <input type="hidden" name="next" value={next} />
          {defaultEmail ? <input type="hidden" name="email" value={defaultEmail} /> : null}
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            loading={resendPending}
            disabled={!authAvailable || resendPending || cooldown > 0}
            disabledReason={resendDisabledReason ?? undefined}
            title={resendDisabledReason ?? "Request a fresh official six-digit code."}
            aria-describedby={resendDisabledReason ? "otp-resend-reason" : undefined}
            data-testid="otp-resend"
          >
            Resend code
          </Button>
          <p
            id="otp-resend-reason"
            className="field-hint small"
            aria-live="polite"
            data-testid="otp-cooldown"
          >
            {cooldown > 0
              ? `Resend available in ${cooldown} second${cooldown === 1 ? "" : "s"}.`
              : "You can request a fresh code now."}
          </p>
        </form>
        <div className="auth-links">
          <Link href="/signup" className="text-link">
            Back to signup
          </Link>
          <Link href="/login" className="text-link">
            Already verified? Sign in
          </Link>
          <Link href="/reset-password" className="text-link">
            Forgot password?
          </Link>
        </div>
        <p className="field-hint small">
          Password recovery stays separate from signup verification. Custom SMTP delivery still
          requires owner verification; no social account is connected and publishing stays disabled.
        </p>
      </Card>
    </div>
  );
}
