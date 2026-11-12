import { describe, expect, it } from "vitest";
import { authFailure, signupVerificationState } from "@/lib/auth/errors";

describe("safe authentication failures", () => {
  it("maps documented Auth codes to useful, non-secret messages", () => {
    expect(authFailure({ code: "over_email_send_rate_limit" }, "fallback")).toMatchObject({
      status: "error",
      message: expect.stringContaining("Too many requests"),
      action: "retry",
    });
    expect(authFailure({ code: "otp_expired" }, "fallback")).toMatchObject({
      message: expect.stringContaining("invalid or has expired"),
      action: "resend",
    });
    expect(authFailure({ code: "email_not_confirmed" }, "fallback")).toMatchObject({
      message: expect.stringContaining("six-digit code"),
      action: "verify-code",
    });
    expect(authFailure({ code: "user_already_exists" }, "fallback")).toMatchObject({
      message: expect.stringContaining("already be registered"),
      action: "sign-in",
    });
    expect(authFailure({ code: "invalid_credentials" }, "fallback")).toMatchObject({
      message: "Email or password not recognised.",
    });
    expect(authFailure({ code: "weak_password" }, "fallback")).toMatchObject({
      message: expect.stringContaining("stronger"),
    });
    expect(authFailure({ code: "signup_disabled" }, "fallback")).toMatchObject({
      message: expect.stringContaining("unavailable"),
    });
    expect(authFailure({ code: "session_expired" }, "fallback")).toMatchObject({
      action: "sign-in",
    });
    expect(authFailure({ code: "unexpected_failure" }, "A safe fallback.")).toMatchObject({
      message: "A safe fallback.",
    });
  });

  it("keeps raw provider messages and secrets out of the UI state", () => {
    const state = authFailure(
      {
        code: "unexpected_failure",
        status: 500,
        message: "535 smtp refusal; token=synthetic-test-token; password=synthetic-test-password",
      },
      "A safe fallback.",
    );
    expect(state.message).toBe("A safe fallback.");
    expect(state.message).not.toContain("unexpected_failure");
    // The whitelisted code/status are deliberately exposed for owner diagnosis.
    expect(state.diagnostic).toMatchObject({
      layer: "supabase-auth",
      category: "provider-error",
      code: "unexpected_failure",
      status: 500,
    });
    const rendered = JSON.stringify(state).toLowerCase();
    for (const value of ["535", "smtp", "synthetic-test-token", "synthetic-test-password"]) {
      expect(rendered).not.toContain(value.toLowerCase());
    }
    expect(rendered).toContain("a safe fallback.");
  });

  it("redacts existence-revealing codes from the owner-facing diagnostic", () => {
    expect(
      authFailure({ code: "user_already_exists", status: 422 }, "fallback").diagnostic,
    ).toMatchObject({
      category: "duplicate-or-existing",
      code: "redacted",
      status: 422,
    });
    expect(
      authFailure({ code: "invalid_credentials", status: 400 }, "fallback").diagnostic?.code,
    ).toBe("redacted");
    expect(
      authFailure({ code: "email_not_confirmed", status: 400 }, "fallback").diagnostic?.code,
    ).toBe("redacted");
  });

  it("does not distinguish a missing account from wrong credentials", () => {
    expect(authFailure({ code: "user_not_found" }, "fallback").message).toBe(
      authFailure({ code: "invalid_credentials" }, "fallback").message,
    );
  });
});

describe("signup verification state", () => {
  it("accepts a real confirmation-pending signup", () => {
    expect(
      signupVerificationState({
        user: {
          identities: [{ id: "email", user_id: "real" }],
          confirmation_sent_at: "2026-11-12T00:00:00Z",
        },
        session: null,
      }),
    ).toBe("ready");
  });

  it("detects GoTrue's obfuscated duplicate-email user before redirecting to the OTP page", () => {
    expect(
      signupVerificationState({
        user: { identities: [], confirmation_sent_at: null },
        session: null,
      }),
    ).toBe("duplicate-or-no-code");
  });

  it("rejects autoconfirm and missing-user responses instead of bypassing verification", () => {
    expect(
      signupVerificationState({
        user: { identities: [{ id: "email" }], confirmation_sent_at: null },
        session: { marker: true },
      }),
    ).toBe("unexpected-session");
    expect(signupVerificationState({ user: null, session: null })).toBe("no-code");
    expect(signupVerificationState(null)).toBe("no-code");
  });
});
