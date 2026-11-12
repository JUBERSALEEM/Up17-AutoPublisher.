import type { AuthFormState } from "@/lib/auth/schema";

const SAFE_REFERENCE = /^[a-z0-9]{12}$/;

/**
 * The reference is a short random correlation id, not a token. It lets the owner
 * locate one structured redacted server log without disclosing an address, OTP,
 * provider message or credential in the browser.
 */
export function AuthErrorReference({ reference }: { reference?: AuthFormState["reference"] }) {
  if (!reference || !SAFE_REFERENCE.test(reference)) return null;
  return (
    <span className="field-hint small wrap-anywhere" data-testid="auth-error-reference">
      Error reference: <code>{reference}</code>
    </span>
  );
}
