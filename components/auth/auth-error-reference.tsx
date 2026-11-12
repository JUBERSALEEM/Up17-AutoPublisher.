import type { AuthDiagnosticSummary } from "@/lib/auth/schema";

const SAFE_REFERENCE = /^[a-z0-9]{12}$/;
const SAFE_LAYER = /^[a-z-]{1,32}$/;
const SAFE_CATEGORY = /^[a-z-]{1,64}$/;
const SAFE_CODE = /^[a-z0-9_.:-]{1,64}$/i;

function isSafeDiagnostic(value: unknown): value is AuthDiagnosticSummary {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();
  if (keys.join(",") !== "category,code,layer,status") return false;
  const { layer, category, code, status } = candidate;
  const safeStatus =
    status === null ||
    (typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599);
  return (
    typeof layer === "string" &&
    SAFE_LAYER.test(layer) &&
    typeof category === "string" &&
    SAFE_CATEGORY.test(category) &&
    typeof code === "string" &&
    SAFE_CODE.test(code) &&
    safeStatus
  );
}

/**
 * The reference is a short random correlation id, not a token. The diagnostic
 * is a whitelisted layer/category/code/status summary. Together they let the
 * owner locate one structured redacted server log without disclosing an
 * address, OTP, provider message or credential in the browser.
 */
export function AuthErrorReference({
  reference,
  diagnostic,
}: {
  reference?: string;
  diagnostic?: AuthDiagnosticSummary;
}) {
  const safeReference = typeof reference === "string" && SAFE_REFERENCE.test(reference);
  const safeDiagnostic = isSafeDiagnostic(diagnostic) ? diagnostic : null;
  if (!safeReference && !safeDiagnostic) return null;
  return (
    <span className="field-hint small wrap-anywhere" data-testid="auth-error-reference">
      {safeReference ? (
        <>
          Error reference: <code>{reference}</code>
        </>
      ) : null}
      {safeReference && safeDiagnostic ? " · " : null}
      {safeDiagnostic ? (
        <>
          Safe diagnostic: <code>{safeDiagnostic.layer}</code> /{" "}
          <code>{safeDiagnostic.category}</code> / code: <code>{safeDiagnostic.code}</code>
          {safeDiagnostic.status === null ? null : (
            <>
              {" "}
              / status: <code>{safeDiagnostic.status}</code>
            </>
          )}
        </>
      ) : null}
    </span>
  );
}
