import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authFailure } from "@/lib/auth/errors";
import { authDiagnosticReference, recordAuthDiagnostic } from "@/lib/auth/diagnostics";
import { AuthErrorReference } from "@/components/auth/auth-error-reference";

afterEach(() => vi.restoreAllMocks());

describe("safe signup failure classification", () => {
  it("recognises a refused confirmation-email handover without echoing provider details", () => {
    const result = authFailure(
      {
        code: "unexpected_failure",
        status: 500,
        message: "Error sending confirmation email: 535 synthetic smtp refusal",
      },
      "We could not create the account. Check the details and try again.",
      "abc123def456",
    );
    expect(result).toMatchObject({
      status: "error",
      action: "retry",
      reference: "abc123def456",
    });
    expect(result.message).toContain("verification email");
    expect(result.message).toContain("not caused by the details");
    const rendered = JSON.stringify(result);
    for (const forbidden of ["535", "smtp", "unexpected_failure", "Check the details"]) {
      expect(rendered.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("gives the same non-enumerating message for a sender/recipient refusal", () => {
    expect(authFailure({ code: "email_address_not_authorized" }, "fallback").message).toBe(
      authFailure(
        { code: "unexpected_failure", message: "Error sending recovery email" },
        "fallback",
      ).message,
    );
  });

  it("keeps existing mapped codes distinct and safe", () => {
    expect(authFailure({ code: "email_not_confirmed" }, "fallback").action).toBe("verify-code");
    expect(authFailure({ code: "user_already_exists" }, "fallback").action).toBe("sign-in");
    expect(authFailure({ code: "otp_expired" }, "fallback").action).toBe("resend");
    expect(authFailure({ code: "weak_password" }, "fallback").message).toContain("stronger");
    expect(authFailure({ code: "validation_failed" }, "fallback").message).toContain("Check");
  });
});

describe("structured redacted server diagnostics", () => {
  it("logs only whitelisted fields and never raw messages, credentials or codes", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    recordAuthDiagnostic({
      stage: "sign-up",
      action: "signUp",
      outcome: "auth-error",
      reference: "abc123def456",
      error: {
        code: "unexpected_failure; password=synthetic-test-credential",
        status: "not-a-number",
        message: "535 sender refused for redacted sender; token=synthetic-test-token",
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const line = String(spy.mock.calls[0]?.[0] ?? "");
    const event = JSON.parse(line) as Record<string, unknown>;
    expect(Object.keys(event).sort()).toEqual(
      [
        "action",
        "code",
        "event",
        "level",
        "outcome",
        "reference",
        "stage",
        "status",
        "timestamp",
      ].sort(),
    );
    expect(event).toMatchObject({
      event: "up17.auth.diagnostic",
      level: "error",
      stage: "sign-up",
      action: "signUp",
      outcome: "auth-error",
      reference: "abc123def456",
      code: "redacted",
      status: null,
    });
    for (const forbidden of [
      "synthetic-test-credential",
      "synthetic-test-token",
      "535",
      "sender refused",
      "not-a-number",
      "stack",
      "email",
    ]) {
      expect(line.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("logs a valid Auth code/status and verification state without raw response data", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    recordAuthDiagnostic({
      stage: "sign-up",
      action: "signUp",
      outcome: "verification-state",
      reference: "abc123def456",
      verificationState: "duplicate-or-no-code",
      error: { code: "user_already_exists", status: 422 },
    });
    const event = JSON.parse(String(spy.mock.calls[0]?.[0] ?? "")) as Record<string, unknown>;
    expect(event).toMatchObject({
      level: "info",
      code: "user_already_exists",
      status: 422,
      verificationState: "duplicate-or-no-code",
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("produces short, safe correlation ids and rejects unsafe UI references", () => {
    const reference = authDiagnosticReference();
    expect(reference).toMatch(/^[a-z0-9]{12}$/);
    const element = AuthErrorReference({ reference }) as ReactElement | null;
    expect(element).not.toBeNull();
    expect(element?.type).toBe("span");
    expect(JSON.stringify(element?.props)).toContain(reference);
    expect(JSON.stringify(element?.props)).toContain("Error reference");
    expect(AuthErrorReference({ reference: "<script>" })).toBeNull();
    expect(AuthErrorReference({ reference: undefined })).toBeNull();
  });
});
