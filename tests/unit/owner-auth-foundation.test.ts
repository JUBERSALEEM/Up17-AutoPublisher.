import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertSafeMode,
  domainModes,
  isAccountsOAuthDemoGated,
  isAuthenticationDemoGated,
  isDemoDomain,
  isSafeDemoMode,
} from "@/lib/app-mode";
import { providerRequirements } from "@/lib/connections/provider-requirements";
import {
  foundationScopesOnly,
  providerScopes,
  publishingScopes,
} from "@/lib/connections/providers";

afterEach(() => vi.unstubAllEnvs());

const read = (path: string) => readFileSync(path, "utf8");

describe("owner authentication domain separation", () => {
  it("keeps auth, onboarding and Accounts outside DEMO while preserving safe workflows", () => {
    expect(isSafeDemoMode()).toBe(true);
    expect(isAuthenticationDemoGated()).toBe(false);
    expect(isAccountsOAuthDemoGated()).toBe(false);
    expect(domainModes.authentication).toBe("REAL_AUTH");
    expect(domainModes.workspaceOnboarding).toBe("REAL_AUTH");
    expect(domainModes.accountsOAuth).toBe("REAL_FOUNDATION");
    expect(domainModes.video).toBe("LABELLED_DEMO");
    expect(domainModes.scheduling).toBe("LABELLED_DEMO");
    expect(domainModes.publishing).toBe("DISABLED");
    expect(domainModes.analytics).toBe("LABELLED_DEMO");
    expect(domainModes.sampleContent).toBe("LABELLED_DEMO");
    expect(isDemoDomain("video")).toBe(true);
    expect(isDemoDomain("authentication")).toBe(false);
  });

  it("still rejects a global LIVE switch", () => {
    vi.stubEnv("UP17_APP_MODE", "LIVE");
    expect(isSafeDemoMode()).toBe(false);
    expect(() => assertSafeMode()).toThrow("Only DEMO mode");
  });

  it("routes the requested /login and /signup aliases to real auth pages", () => {
    const config = read("next.config.ts");
    expect(config).toContain('source: "/login", destination: "/sign-in"');
    expect(config).toContain('source: "/signup", destination: "/sign-up"');
  });

  it("uses a verified, server-side first-workspace RPC with no client user id", () => {
    const migration = read("supabase/migrations/20261110085716_verified_first_workspace.sql");
    expect(migration).toContain("email_confirmation_required");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("security definer");
    expect(migration).toContain(
      "grant execute on function public.up17_ensure_first_workspace() to authenticated",
    );
    expect(migration).toContain("service_role");
    expect(migration).not.toContain("p_user");
    expect(migration).not.toContain("p_actor");
    const onboarding = read("app/(studio)/onboarding/page.tsx");
    const setupRoute = read("app/workspace/setup/route.ts");
    // Bootstrap is a manual Server Action only; the automatic first-load path is
    // a fresh GET Route Handler after the auth cookies have been committed.
    expect(onboarding.match(/bootstrapFirstWorkspace\(/g)).toHaveLength(1);
    expect(onboarding).toContain('"use server"');
    expect(onboarding).toContain("workspaceSetupPath(next)");
    expect(setupRoute).toContain("getAccountSession");
    expect(setupRoute).toContain("bootstrapFirstWorkspace");
    expect(setupRoute).toContain("getWorkspaceContext");
    expect(read("app/(studio)/account/page.tsx")).toContain("/auth/verify-email");
    expect(read("app/(studio)/account/page.tsx")).toContain('workspaceSetupPath("/account")');
  });

  it("requires owner-verified provider configuration before a server-side OAuth start", () => {
    const start = read("app/api/connections/start/route.ts");
    expect(start).toContain("providerConfigurationReady");
    expect(start).toContain('workspace.role !== "owner"');
    expect(start).toContain("Provider configuration incomplete");
    expect(providerScopes.youtube).toEqual(["https://www.googleapis.com/auth/youtube.readonly"]);
    expect(publishingScopes.youtube).toEqual(["https://www.googleapis.com/auth/youtube.upload"]);
    expect(providerScopes.youtube).not.toContain(publishingScopes.youtube[0]);
    expect(foundationScopesOnly("youtube", providerScopes.youtube)).toBe(true);
    expect(
      foundationScopesOnly("youtube", [...providerScopes.youtube, ...publishingScopes.youtube]),
    ).toBe(false);
    expect(read("lib/connections/broker.ts")).toContain("No credential was stored");
    const bridge = read("supabase/functions/up17-oauth-callback/index.ts");
    expect(bridge).toContain("hasExactFoundationScope");
    expect(bridge).toContain("providerPaths");
    expect(bridge).toContain("youtube.readonly");
    expect(bridge).not.toContain("youtube.upload");
  });

  it("publishes exact owner dashboard requirements for all three providers", () => {
    for (const platform of ["youtube", "instagram", "tiktok"] as const) {
      const requirement = providerRequirements[platform];
      expect(requirement.dashboardUrl).toMatch(/^https:\/\//);
      expect(requirement.navigation.length).toBeGreaterThan(1);
      expect(requirement.fields.join(" ").toLowerCase()).toContain("redirect");
      expect(requirement.expectedResult).toContain("real");
      expect(requirement.restrictions.join(" ")).toContain("Publishing");
      expect(requirement.publishingScopes.length).toBeGreaterThan(0);
    }
  });

  it("uses official numeric signup OTP and keeps recovery links separate", () => {
    const form = read("components/auth/auth-form.tsx");
    const actions = read("lib/auth/actions.ts");
    const otp = read("components/auth/otp-form.tsx");
    expect(form).toContain("Custom SMTP delivery still requires owner verification");
    expect(form).toContain("six-digit numeric email code");
    expect(form).not.toContain("Resend confirmation email");
    expect(form).not.toContain("Production email delivery is still being verified");
    expect(read("app/auth/verify-email/page.tsx")).toContain("up17_pending_email");
    expect(read("app/auth/verify-email/page.tsx")).toContain("OtpForm");
    expect(actions).toContain("verifyOtp");
    expect(actions).toContain('type: "signup"');
    expect(actions).toContain("auth.resend");
    expect(actions).toContain("resendConfirmation");
    expect(actions).toContain("up17_otp_resend_at");
    expect(actions).toContain("/auth/verify-email");
    expect(actions).not.toMatch(/auth\.signUp\(\{[\s\S]*?emailRedirectTo/);
    expect(actions).toContain("resetPasswordForEmail");
    expect(read("app/auth/confirm/route.ts")).not.toContain('"signup"');
    expect(otp).toContain("data-testid={`otp-digit-${index + 1}`}");
    expect(otp).toContain("onPaste");
    expect(otp).toContain("ArrowLeft");
    expect(otp).toContain("Backspace");
    expect(otp).toContain("Resend code");
    expect(otp).toContain("Back to signup");
    expect(otp).not.toContain("localStorage.setItem");
  });

  it("keeps provider VERIFIED evidence external and never fabricates it from a checkbox", () => {
    const start = read("app/api/connections/start/route.ts");
    const readiness = read("lib/connections/deployment-readiness.ts");
    const board = read("components/accounts/real-accounts-board.tsx");
    expect(start).toContain("providerConfigurationReady");
    expect(start).toContain('workspace.role !== "owner"');
    expect(start).toContain("providerSecrets(platform)");
    expect(readiness).toContain("otp-template");
    expect(readiness).toContain("{{ .Token }}");
    expect(readiness).toContain("providerConfigurationVerified");
    expect(readiness).not.toContain("await headers()");
    expect(board).not.toContain("setup-actions");
    expect(board).not.toContain("owner-attested");
    expect(board).not.toContain("deployment_evidence");
  });

  it("shows exact owner-visible connection states and never hides disabled reasons", () => {
    const board = read("components/accounts/real-accounts-board.tsx");
    const readiness = read("lib/connections/readiness.ts");
    for (const state of [
      "Sign in required",
      "Email confirmation required",
      "Workspace setup required",
      "Owner authorization required",
      "Credentials missing",
      "Provider configuration incomplete",
      "Ready to connect",
      "Connecting",
      "Connected",
      "Connection failed",
      "Reauthorization required",
    ]) {
      expect(readiness).toContain(state);
    }
    expect(board).toContain("Open provider dashboard");
    expect(board).toContain("Exact provider redirect URI");
    expect(board).toContain("disabled={!selectedCard?.canStart || pending}");
    expect(board).toContain("data-testid={`connect-${card.platform}`}");
  });
});
