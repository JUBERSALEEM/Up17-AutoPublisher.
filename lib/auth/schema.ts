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
export type AuthFormState = {
  status: "idle" | "error" | "success";
  message: string;
  action?: "sign-in" | "resend" | "retry";
};
export const initialAuthState: AuthFormState = { status: "idle", message: "" };
