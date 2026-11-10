import { describe, expect, it } from "vitest";
import {
  applyDeploymentEvidence,
  buildProviderCards,
  connectionStatuses,
  setupStatuses,
  setupStatusTone,
  statusTone,
  type DeploymentReadiness,
  type SetupCheck,
} from "@/lib/connections/readiness";
import type { ProviderAvailability, RealConnection } from "@/lib/connections/types";

const providers: ProviderAvailability[] = [
  {
    platform: "youtube",
    label: "YouTube",
    configured: true,
    loginPath: "Google OAuth 2.0 for Web Server",
    scopes: ["youtube.readonly", "youtube.upload"],
    reviewNote: "Consent screen and verification apply.",
  },
  {
    platform: "instagram",
    label: "Instagram",
    configured: true,
    loginPath: "Business Login for Instagram",
    scopes: ["instagram_business_basic", "instagram_business_content_publish"],
    reviewNote: "Professional account and review apply.",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    configured: true,
    loginPath: "TikTok Login Kit for Web",
    scopes: ["user.info.basic", "video.publish"],
    reviewNote: "Direct Post audit applies.",
  },
];

const checks: SetupCheck[] = [
  {
    id: "deployment",
    names: ["UP17_SITE_URL"],
    location: "Vercel → Project Settings → Environment Variables",
    status: "CONFIGURED",
    configured: true,
    evidence: "site_url_present",
    ownerAction: "Set the exact origin.",
  },
  {
    id: "owner-only",
    names: ["Supabase custom SMTP"],
    location: "Supabase → Authentication",
    status: "OWNER ACTION REQUIRED",
    configured: false,
    ownerVerification: true,
    evidence: "smtp_not_exposed_by_connector",
    ownerAction: "Owner must verify delivery.",
  },
  {
    id: "youtube-creds",
    names: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    location: "Google Cloud Console / Vercel",
    status: "CONFIGURED",
    configured: true,
    evidence: "credentials_present_no_authorization",
    platforms: ["youtube"],
    ownerAction: "Register the exact callback.",
  },
];

const ready: DeploymentReadiness = {
  demoMode: true,
  authenticated: true,
  workspaceReady: true,
  canManage: true,
  publicSupabaseConfigured: true,
  exactSiteUrlConfigured: true,
  serverKeyConfigured: true,
  keyringConfigured: true,
  connectionReadError: false,
  providerCredentials: { youtube: true, instagram: true, tiktok: true },
  callbackPaths: {
    youtube: "/api/connections/callback/youtube",
    instagram: "/api/connections/callback/instagram",
    tiktok: "/api/connections/callback/tiktok",
  },
  externalCallbackUrls: {
    youtube:
      "https://example.supabase.co/functions/v1/up17-oauth-callback?mode=callback&platform=youtube",
    instagram:
      "https://example.supabase.co/functions/v1/up17-oauth-callback?mode=callback&platform=instagram",
    tiktok:
      "https://example.supabase.co/functions/v1/up17-oauth-callback?mode=callback&platform=tiktok",
  },
  bridgeOrigin: "https://example.supabase.co",
  checks,
};

function connection(
  platform: RealConnection["platform"],
  state: RealConnection["state"],
): RealConnection {
  return {
    id: `${platform}-${state}`,
    platform,
    providerAccountId: null,
    displayName: `${platform} account`,
    state,
    grantedScopes: [],
    lastVerifiedAt: null,
    lastErrorCode: null,
    handle: null,
    paused: true,
    publishingEnabled: false,
  };
}

describe("unified Accounts readiness", () => {
  it("defines exactly the ten owner-visible statuses with a tone", () => {
    expect(connectionStatuses).toHaveLength(10);
    expect(new Set(connectionStatuses).size).toBe(10);
    for (const status of connectionStatuses) expect(statusTone[status]).toBeDefined();
  });

  it("always exposes the three exact real connection buttons", () => {
    const cards = buildProviderCards(ready, providers, []);
    expect(cards.map((card) => card.connectLabel)).toEqual([
      "Connect Google / YouTube",
      "Connect Instagram",
      "Connect TikTok",
    ]);
  });

  it("resolves deployment and owner blockers in precedence order", () => {
    const cases: Array<[Partial<DeploymentReadiness>, string]> = [
      [{ publicSupabaseConfigured: false }, "Not configured"],
      [{ exactSiteUrlConfigured: false }, "Not configured"],
      [{ serverKeyConfigured: false }, "Not configured"],
      [{ authenticated: false }, "Authentication required"],
      [{ workspaceReady: false }, "Workspace setup required"],
      [{ canManage: false }, "Workspace setup required"],
      [{ connectionReadError: true }, "Error"],
      [{ keyringConfigured: false }, "Encryption keyring missing"],
    ];
    for (const [override, expected] of cases) {
      const cards = buildProviderCards({ ...ready, ...override }, providers, []);
      expect(cards.every((card) => card.status === expected)).toBe(true);
      expect(cards.every((card) => card.canStart === false)).toBe(true);
    }
  });

  it("reports provider credentials per platform without affecting other providers", () => {
    const cards = buildProviderCards(
      {
        ...ready,
        providerCredentials: { youtube: false, instagram: true, tiktok: true },
      },
      providers,
      [],
    );
    expect(cards[0].status).toBe("Provider credentials missing");
    expect(cards[0].description).toContain("GOOGLE_CLIENT_ID");
    expect(cards[0].description).toContain(
      "https://example.supabase.co/functions/v1/up17-oauth-callback?mode=callback&platform=youtube",
    );
    expect(cards[1].status).toBe("Ready to connect");
    expect(cards[2].status).toBe("Ready to connect");
  });

  it("reports Ready to connect only when every server-side gate is present", () => {
    const cards = buildProviderCards(ready, providers, []);
    expect(cards.every((card) => card.status === "Ready to connect")).toBe(true);
    expect(cards.every((card) => card.canStart)).toBe(true);
    expect(cards.every((card) => card.blocker === null)).toBe(true);
  });

  it("maps stored connection states to exact owner-visible statuses", () => {
    const states: Array<[RealConnection["state"], string]> = [
      ["connected", "Connected"],
      ["limited_permissions", "Limited permissions"],
      ["needs_authorisation", "Needs reauthorization"],
      ["pending", "Needs reauthorization"],
      ["error", "Error"],
    ];
    for (const [state, expected] of states) {
      const cards = buildProviderCards(ready, providers, [connection("youtube", state)]);
      expect(cards[0].status).toBe(expected);
    }
    const disconnected = buildProviderCards(ready, providers, [
      connection("youtube", "disconnected"),
    ]);
    expect(disconnected[0].status).toBe("Ready to connect");
  });

  it("keeps a connected account visible while disabling a duplicate connect", () => {
    const cards = buildProviderCards(ready, providers, [connection("instagram", "connected")]);
    expect(cards[1].status).toBe("Connected");
    expect(cards[1].canStart).toBe(false);
    expect(cards[1].connection?.platform).toBe("instagram");
  });

  it("does not turn owner-verification checks into app-inferred blockers", () => {
    const cards = buildProviderCards(ready, providers, []);
    expect(cards[0].missing.map((check) => check.id)).toEqual([]);
    expect(ready.checks.find((check) => check.id === "owner-only")?.ownerVerification).toBe(true);
  });

  it("uses exactly the six evidence-backed deployment states", () => {
    expect(setupStatuses).toEqual([
      "MISSING",
      "CONFIGURED",
      "VERIFIED",
      "OWNER ACTION REQUIRED",
      "BLOCKED",
      "NOT APPLICABLE",
    ]);
    for (const status of setupStatuses) expect(setupStatusTone[status]).toBeDefined();
    for (const item of ready.checks) expect(setupStatuses).toContain(item.status);
  });

  it("requires timestamped evidence before accepting VERIFIED", () => {
    const withoutProof = applyDeploymentEvidence(checks, [
      { key: "deployment", state: "VERIFIED", evidence: "hosted_test", verified_at: null },
    ]);
    expect(withoutProof[0].status).toBe("BLOCKED");
    const withProof = applyDeploymentEvidence(checks, [
      {
        key: "deployment",
        state: "VERIFIED",
        evidence: "hosted_test",
        verified_at: "2026-11-08T00:00:00.000Z",
      },
    ]);
    expect(withProof[0].status).toBe("VERIFIED");
    expect(withProof[0].configured).toBe(true);
  });

  it("never displays a suspected sensitive evidence value", () => {
    const sanitized = applyDeploymentEvidence(checks, [
      {
        key: "deployment",
        state: "CONFIGURED",
        evidence: "eyJhbGciOi.eyJyb2xl.signature",
        verified_at: null,
      },
    ]);
    expect(sanitized[0].evidence).toBe(
      "Evidence recorded privately; no sensitive values displayed.",
    );
  });
});
