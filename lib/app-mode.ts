/**
 * Safe-mode contract. `UP17_APP_MODE=DEMO` is a deployment safety switch for
 * creator workflows and sample content; it is deliberately NOT a gate for
 * Supabase Auth, verified workspace onboarding or real Accounts/OAuth controls.
 *
 * No secret is exposed here. The server-only environment variable is read on
 * the server; a browser bundle sees the conservative DEMO default.
 */
export type AppMode = "DEMO" | "LIVE";
export type ProductDomain =
  | "authentication"
  | "workspaceOnboarding"
  | "accountsOAuth"
  | "video"
  | "scheduling"
  | "publishing"
  | "analytics"
  | "sampleContent";

export const domainModes: Record<
  ProductDomain,
  "REAL_AUTH" | "REAL_FOUNDATION" | "LABELLED_DEMO" | "DISABLED"
> = {
  authentication: "REAL_AUTH",
  workspaceOnboarding: "REAL_AUTH",
  accountsOAuth: "REAL_FOUNDATION",
  video: "LABELLED_DEMO",
  scheduling: "LABELLED_DEMO",
  publishing: "DISABLED",
  analytics: "LABELLED_DEMO",
  sampleContent: "LABELLED_DEMO",
};

export function appMode(): AppMode {
  return process.env.UP17_APP_MODE === "LIVE" ? "LIVE" : "DEMO";
}

export function isSafeDemoMode(): boolean {
  return appMode() === "DEMO";
}

/** Keep the original publishing/integration safety check; never switch LIVE globally. */
export function assertSafeMode(): void {
  if (!isSafeDemoMode()) {
    throw new Error("Only DEMO mode is available until integrations are approved and tested.");
  }
}

export function isDemoDomain(domain: ProductDomain): boolean {
  return isSafeDemoMode() && domainModes[domain] === "LABELLED_DEMO";
}

export function isAuthenticationDemoGated(): boolean {
  return false;
}

export function isAccountsOAuthDemoGated(): boolean {
  return false;
}
