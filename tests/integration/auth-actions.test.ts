import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialAuthState } from "@/lib/auth/schema";
import {
  resendConfirmation,
  resetPassword,
  signIn,
  signUp,
  verifySignupOtp,
} from "@/lib/auth/actions";
import { bootstrapFirstWorkspace } from "@/lib/auth/workspace-actions";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getViewer: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mocks.cookieGet, set: mocks.cookieSet }),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock("@/lib/auth/session", () => ({ getViewer: mocks.getViewer }));
vi.mock("@/lib/supabase/config", () => ({
  appOrigin: () => "https://preview.invalid",
  getSupabaseConfig: () => ({
    url: "https://project.supabase.co",
    publishableKey: "sb_publishable_synthetic-test",
  }),
}));

const TEST_EMAIL = "new@up17.invalid";
const TEST_PASSWORD = "synthetic-test-password-123";
const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";
const REDIRECT_MARKER = "NEXT_REDIRECT:";

function signupForm(next?: string): FormData {
  const form = new FormData();
  form.set("displayName", "Synthetic Creator");
  form.set("email", TEST_EMAIL);
  form.set("password", TEST_PASSWORD);
  if (next) form.set("next", next);
  return form;
}

function authClient(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      verifyOtp: vi.fn(),
      resend: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      ...overrides,
    },
    rpc: vi.fn(),
  };
}

function pendingSignupData() {
  return {
    user: {
      identities: [{ id: "email", user_id: "synthetic-user" }],
      confirmation_sent_at: "2026-11-12T00:00:00Z",
    },
    session: null,
  };
}

function duplicateSignupData() {
  return { user: { identities: [], confirmation_sent_at: null }, session: null };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookieGet.mockReturnValue(undefined);
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`${REDIRECT_MARKER}${url}`);
  });
  mocks.getViewer.mockResolvedValue(null);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe("server auth actions against synthetic Auth responses (not hosted delivery)", () => {
  it("classifies a confirmation-email send failure and emits one redacted log", async () => {
    const client = authClient();
    client.auth.signUp.mockResolvedValue({
      data: null,
      error: {
        code: "unexpected_failure",
        status: 500,
        message: "Error sending confirmation email: 535 synthetic smtp refusal",
      },
    });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const result = await signUp(initialAuthState, signupForm());
    expect(result.status).toBe("error");
    expect(result.action).toBe("retry");
    expect(result.reference).toMatch(/^[a-z0-9]{12}$/);
    // The same reference is handed to the Supabase client for request-log correlation.
    expect(mocks.createSupabaseServerClient).toHaveBeenCalledWith(result.reference);
    expect(result.diagnostic).toMatchObject({
      layer: "supabase-auth",
      category: "verification-email",
      code: "unexpected_failure",
      status: 500,
    });
    expect(result.message).toContain("verification email");
    expect(result.message).toContain("not caused by the details");
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
    const diagnostic = JSON.parse(
      String(vi.mocked(console.error).mock.calls[0]?.[0] ?? "{}"),
    ) as Record<string, unknown>;
    expect(diagnostic).toMatchObject({
      event: "up17.auth.diagnostic",
      stage: "sign-up",
      action: "signUp",
      outcome: "auth-error",
      code: "unexpected_failure",
      status: 500,
      reference: result.reference,
    });
    const rendered = JSON.stringify(diagnostic) + JSON.stringify(result);
    for (const forbidden of ["535", "smtp", "confirmation email:", TEST_EMAIL, TEST_PASSWORD]) {
      expect(rendered.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("logs an unexpected exception without leaking its raw message", async () => {
    const client = authClient();
    client.auth.signUp.mockRejectedValue(
      new Error("provider failure for redacted sender; token=synthetic-test-token"),
    );
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const result = await signUp(initialAuthState, signupForm());
    expect(result.message).toContain("temporarily unavailable");
    expect(result.reference).toMatch(/^[a-z0-9]{12}$/);
    expect(mocks.redirect).not.toHaveBeenCalled();
    const diagnostic = String(vi.mocked(console.error).mock.calls[0]?.[0] ?? "");
    expect(diagnostic).toContain('"outcome":"unexpected-exception"');
    expect(diagnostic).toContain('"code":"redacted"');
    expect(diagnostic).not.toContain("provider failure");
    expect(diagnostic).not.toContain("synthetic-test-token");
  });

  it("redirects only when GoTrue reports a confirmation-pending signup", async () => {
    const client = authClient();
    client.auth.signUp.mockResolvedValue({ data: pendingSignupData(), error: null });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    await expect(signUp(initialAuthState, signupForm())).rejects.toThrow(
      `${REDIRECT_MARKER}/auth/verify-email?next=%2Faccount`,
    );
    expect(client.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: TEST_EMAIL,
        options: { data: { display_name: "Synthetic Creator" } },
      }),
    );
    expect(client.auth.signUp.mock.calls[0]?.[0]).toHaveProperty("password", TEST_PASSWORD);
    expect(mocks.cookieSet).toHaveBeenCalledTimes(2);
    expect(mocks.cookieSet.mock.calls.map(([name]) => name)).toEqual([
      "up17_pending_email",
      "up17_otp_resend_at",
    ]);
    expect(JSON.stringify(client.auth.signUp.mock.calls)).not.toContain("emailRedirectTo");
  });

  it("uses one ambiguous message for obfuscated duplicates and no-code responses", async () => {
    const client = authClient();
    client.auth.signUp
      .mockResolvedValueOnce({ data: duplicateSignupData(), error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const duplicate = await signUp(initialAuthState, signupForm());
    const noCode = await signUp(initialAuthState, signupForm());
    expect(duplicate.status).toBe("error");
    expect(noCode.status).toBe("error");
    expect(duplicate.message).toBe(noCode.message);
    expect(duplicate.message).toContain("If it is already registered");
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("keeps sign-in before verification at the six-digit code and never redirects", async () => {
    const client = authClient();
    client.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "email_not_confirmed", status: 400 },
    });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const form = new FormData();
    form.set("email", TEST_EMAIL);
    form.set("password", TEST_PASSWORD);
    const result = await signIn(initialAuthState, form);
    expect(result).toMatchObject({ action: "verify-code", status: "error" });
    expect(result.message).toContain("six-digit code");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects a verified sign-in to a safe internal destination", async () => {
    const client = authClient();
    client.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const form = new FormData();
    form.set("email", TEST_EMAIL);
    form.set("password", TEST_PASSWORD);
    form.set("next", "/settings");
    await expect(signIn(initialAuthState, form)).rejects.toThrow(
      `${REDIRECT_MARKER}/workspace/setup?next=%2Fsettings`,
    );
  });

  it("maps an expired or invalid official OTP to a resend action", async () => {
    const client = authClient();
    client.auth.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "otp_expired", status: 403 },
    });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const form = new FormData();
    form.set("email", TEST_EMAIL);
    form.set("token", "123456");
    const result = await verifySignupOtp(initialAuthState, form);
    expect(result).toMatchObject({ status: "error", action: "resend" });
    expect(result.message).toContain("invalid or has expired");
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      email: TEST_EMAIL,
      token: "123456",
      type: "signup",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("establishes a confirmed session with a valid OTP before redirecting", async () => {
    const client = authClient();
    client.auth.verifyOtp.mockResolvedValue({
      data: {
        user: { email_confirmed_at: "2026-11-12T00:00:00Z" },
        session: { marker: "synthetic-confirmed-session" },
      },
      error: null,
    });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const form = new FormData();
    form.set("email", TEST_EMAIL);
    form.set("token", "123456");
    form.set("next", "/settings");
    await expect(verifySignupOtp(initialAuthState, form)).rejects.toThrow(
      `${REDIRECT_MARKER}/workspace/setup?next=%2Fsettings`,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mocks.cookieSet.mock.calls.map(([name]) => name)).toEqual([
      "up17_pending_email",
      "up17_otp_resend_at",
    ]);
  });

  it("enforces the server resend cooldown and refreshes it after a successful resend", async () => {
    const client = authClient();
    client.auth.resend.mockResolvedValue({ data: {}, error: null });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const form = new FormData();
    form.set("email", TEST_EMAIL);
    mocks.cookieGet.mockReturnValueOnce({ value: "1" });
    const blocked = await resendConfirmation(initialAuthState, form);
    expect(blocked.status).toBe("error");
    expect(blocked.message).toContain("cooldown");
    expect(client.auth.resend).not.toHaveBeenCalled();
    const accepted = await resendConfirmation(initialAuthState, form);
    expect(accepted).toMatchObject({ status: "success" });
    expect(client.auth.resend).toHaveBeenCalledWith({ type: "signup", email: TEST_EMAIL });
    expect(mocks.cookieSet).toHaveBeenCalledTimes(2);
  });

  it("keeps password recovery separate from the numeric signup flow", async () => {
    const client = authClient();
    client.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const form = new FormData();
    form.set("email", TEST_EMAIL);
    const result = await resetPassword(initialAuthState, form);
    expect(result).toMatchObject({ status: "success" });
    expect(result.message).toContain("If an account exists");
    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith(TEST_EMAIL, {
      redirectTo: "https://preview.invalid/auth/callback?next=/auth/update-password",
    });
    expect(client.auth.verifyOtp).not.toHaveBeenCalled();
    expect(client.auth.signUp).not.toHaveBeenCalled();
  });

  it("refuses workspace bootstrap without a confirmed viewer", async () => {
    const client = authClient();
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const result = await bootstrapFirstWorkspace();
    expect(result).toMatchObject({ ok: false, reason: "auth" });
    expect(result.message).toContain("confirmed email");
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("reproduces why a committed RPC used to display the first-load setup error", async () => {
    const client = authClient();
    client.rpc.mockResolvedValue({ data: WORKSPACE_ID, error: null });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    mocks.getViewer.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      email: TEST_EMAIL,
      confirmed: true,
    });
    // The exact Next.js 16 render-phase invariant from the old /onboarding call.
    mocks.revalidatePath.mockImplementationOnce(() => {
      throw new Error('revalidatePath("/") can\'t be called during render');
    });
    const result = await bootstrapFirstWorkspace();
    expect(client.rpc).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ ok: false, reason: "unavailable" });
    expect(result.message).toBe(
      "Workspace setup is temporarily unavailable. Reload this page to retry.",
    );
  });

  it("creates only the confirmed viewer's first workspace through the RPC", async () => {
    const client = authClient();
    client.rpc.mockResolvedValue({ data: WORKSPACE_ID, error: null });
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    mocks.getViewer.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      email: TEST_EMAIL,
      confirmed: true,
    });
    const result = await bootstrapFirstWorkspace();
    expect(result).toMatchObject({ ok: true, workspaceId: WORKSPACE_ID });
    expect(result.reason).toBeUndefined();
    expect(client.rpc).toHaveBeenCalledWith("up17_ensure_first_workspace", {});
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
