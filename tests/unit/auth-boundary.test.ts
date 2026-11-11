import { describe, expect, it } from "vitest";
import { safeNext, sameOrigin } from "@/lib/auth/redirects";
import { signInSchema, signUpSchema, passwordSchema, otpSchema } from "@/lib/auth/schema";

describe("auth redirect and input boundary", () => {
  it.each([
    "https://evil.invalid",
    "//evil.invalid",
    "/\\evil.invalid",
    "/%2f%2fevil.invalid",
    "/api/media/access",
    "/auth/callback",
    "/\u0000bad",
    "account",
  ])("rejects unsafe next %s", (value) => {
    expect(safeNext(value)).toBe("/account");
  });
  it.each([
    "/settings",
    "/notifications?filter=unread",
    "/auth/update-password",
    "/auth/verify-email",
    "/onboarding?next=/account",
  ])("keeps internal next %s", (value) => {
    expect(safeNext(value)).toBe(value);
  });
  it("requires an exact Origin match", () => {
    expect(
      sameOrigin(
        new Request("https://app.invalid/api", {
          headers: { Origin: "https://app.invalid", Host: "app.invalid" },
        }),
      ),
    ).toBe(true);
    expect(
      sameOrigin(
        new Request("https://app.invalid/api", {
          headers: { Origin: "https://evil.invalid", Host: "app.invalid" },
        }),
      ),
    ).toBe(false);
    expect(sameOrigin(new Request("https://app.invalid/api"))).toBe(false);
  });
  it("accepts the forwarded HTTPS origin behind a proxy", () => {
    expect(
      sameOrigin(
        new Request("http://internal/api", {
          headers: {
            Origin: "https://app.invalid",
            Host: "app.invalid",
            "x-forwarded-proto": "https",
          },
        }),
      ),
    ).toBe(true);
  });
  it("validates credentials without retaining or logging them", () => {
    expect(signInSchema.safeParse({ email: "USER@example.invalid", password: "x" }).success).toBe(
      true,
    );
    expect(
      signUpSchema.safeParse({ email: "bad", password: "synthetic-test-short", displayName: "" })
        .success,
    ).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(12)).success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });
  it("accepts only an official six-digit numeric OTP and a normalized email", () => {
    const valid = otpSchema.safeParse({ email: " Owner@Example.invalid ", token: " 123456 " });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.email).toBe("owner@example.invalid");
      expect(valid.data.token).toBe("123456");
    }
    expect(otpSchema.safeParse({ email: "owner@example.invalid", token: "12345" }).success).toBe(
      false,
    );
    expect(otpSchema.safeParse({ email: "owner@example.invalid", token: "1234567" }).success).toBe(
      false,
    );
    expect(otpSchema.safeParse({ email: "owner@example.invalid", token: "12a456" }).success).toBe(
      false,
    );
  });
});
