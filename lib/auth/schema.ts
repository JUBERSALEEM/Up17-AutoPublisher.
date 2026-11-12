import { z } from "zod";
export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
export const passwordSchema = z.string().min(12, "Use at least 12 characters.").max(128);
export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(80),
});
/** Up17 requires six digits; the owner must set Supabase's official OTP length to 6. */
export const otpSchema = z.object({
  email: emailSchema,
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the six-digit code."),
});

export type AuthDiagnosticLayer = "supabase-auth" | "application" | "configuration";
export type AuthDiagnosticCategory =
  | "rate-limit"
  | "expired-code"
  | "verification-required"
  | "duplicate-or-existing"
  | "weak-password"
  | "invalid-credentials"
  | "session-expired"
  | "signup-disabled"
  | "invalid-email"
  | "captcha"
  | "validation"
  | "verification-email"
  | "provider-error"
  | "application-error"
  | "configuration";

/** Whitelisted, non-secret diagnostic fields that may be shown beside an error reference. */
export type AuthDiagnosticSummary = {
  layer: AuthDiagnosticLayer;
  category: AuthDiagnosticCategory;
  code: string;
  status: number | null;
};

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message: string;
  action?: "sign-in" | "resend" | "verify-code" | "retry";
  /** Short redacted server-log correlation id; never an email, OTP or token. */
  reference?: string;
  /** Safe provider code/status/category only; never a raw provider message. */
  diagnostic?: AuthDiagnosticSummary;
};
export const initialAuthState: AuthFormState = { status: "idle", message: "" };
