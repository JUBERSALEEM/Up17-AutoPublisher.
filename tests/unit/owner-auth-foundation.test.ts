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
    expect(read("app/(studio)/onboarding/page.tsx")).toContain("bootstrapFirstWorkspace");
    expect(read("app/(studio)/account/page.tsx")).toContain("/auth/verify-email");
    expect(read("app/(studio)/account/page.tsx")).toContain("/onboarding");
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

  it("replaces misleading demo auth copy and exposes interrupted-confirmation recovery", () => {
    const form = read("components/auth/auth-form.tsx");
    expect(form).toContain("Custom SMTP delivery is owner-verified");
    expect(form).toContain("Resend confirmation email");
    expect(form).not.toContain("Production email delivery is still being verified");
    expect(read("app/auth/verify-email/page.tsx")).toContain("up17_pending_email");
    expect(read("lib/auth/actions.ts")).toContain("resendConfirmation");
    expect(read("lib/auth/actions.ts")).toContain("/auth/verify-email");
  });
});
