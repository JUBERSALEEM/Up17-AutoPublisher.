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
    scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
    publishingScopes: ["https://www.googleapis.com/auth/youtube.upload"],
    reviewNote: "Consent screen and exact redirect URI are owner-only.",
  },
  {
    platform: "instagram",
    label: "Instagram",
    configured: true,
    loginPath: "Business Login for Instagram",
    scopes: ["instagram_business_basic"],
    publishingScopes: ["instagram_business_content_publish"],
    reviewNote: "Professional account and review are owner-only.",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    configured: true,
    loginPath: "TikTok Login Kit for Web",
    scopes: ["user.info.basic"],
    publishingScopes: ["video.publish"],
    reviewNote: "Direct Post audit applies to a later publishing milestone.",
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
  emailConfirmed: true,
  workspaceReady: true,
  canManage: true,
  role: "owner",
  publicSupabaseConfigured: true,
  exactSiteUrlConfigured: true,
  serverKeyConfigured: true,
  keyringConfigured: true,
  connectionReadError: false,
  providerCredentials: { youtube: true, instagram: true, tiktok: true },
  providerConfigurationVerified: { youtube: true, instagram: true, tiktok: true },
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
  it("defines every owner-visible status with a tone", () => {
    expect(connectionStatuses).toHaveLength(15);
    expect(new Set(connectionStatuses).size).toBe(15);
    for (const status of connectionStatuses) expect(statusTone[status]).toBeDefined();
    for (const status of [
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
    ] as const) {
      expect(connectionStatuses).toContain(status);
    }
  });

  it("always exposes the three exact real connection buttons", () => {
    const cards = buildProviderCards(ready, providers, []);
    expect(cards.map((card) => card.connectLabel)).toEqual([
      "Connect Google / YouTube",
      "Connect Instagram",
      "Connect TikTok",
    ]);
    expect(cards.every((card) => card.nextSteps.length > 0)).toBe(true);
  });

  it("resolves deployment, identity, workspace and provider blockers in precedence order", () => {
    const cases: Array<[Partial<DeploymentReadiness>, string]> = [
      [{ publicSupabaseConfigured: false }, "Not configured"],
      [{ exactSiteUrlConfigured: false }, "Not configured"],
      [{ serverKeyConfigured: false }, "Not configured"],
      [{ authenticated: false }, "Sign in required"],
      [{ emailConfirmed: false }, "Email confirmation required"],
      [{ workspaceReady: false }, "Workspace setup required"],
      [{ canManage: false }, "Owner authorization required"],
      [{ connectionReadError: true }, "Error"],
      [
        { providerCredentials: { youtube: false, instagram: false, tiktok: false } },
        "Credentials missing",
      ],
      [{ keyringConfigured: false }, "Encryption keyring missing"],
      [
        {
          providerConfigurationVerified: { youtube: false, instagram: false, tiktok: false },
        },
        "Provider configuration incomplete",
      ],
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
    expect(cards[0].status).toBe("Credentials missing");
    expect(cards[0].description).toContain("GOOGLE_CLIENT_ID");
    expect(cards[0].description).toContain(
      "https://example.supabase.co/functions/v1/up17-oauth-callback?mode=callback&platform=youtube",
    );
    expect(cards[1].status).toBe("Ready to connect");
    expect(cards[2].status).toBe("Ready to connect");
  });

  it("reports Ready to connect only when every server-side and owner-verified gate is present", () => {
    const cards = buildProviderCards(ready, providers, []);
    expect(cards.every((card) => card.status === "Ready to connect")).toBe(true);
    expect(cards.every((card) => card.canStart)).toBe(true);
    expect(cards.every((card) => card.blocker === null)).toBe(true);
  });

  it("maps stored connection states to exact owner-visible statuses", () => {
    const states: Array<[RealConnection["state"], string]> = [
      ["connected", "Connected"],
      ["limited_permissions", "Limited permissions"],
      ["needs_authorisation", "Reauthorization required"],
      ["pending", "Connecting"],
      ["error", "Connection failed"],
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

  it("keeps connected and in-progress accounts visible while disabling duplicate starts", () => {
    const connectedCards = buildProviderCards(ready, providers, [
      connection("instagram", "connected"),
    ]);
    expect(connectedCards[1].status).toBe("Connected");
    expect(connectedCards[1].canStart).toBe(false);
    const pendingCards = buildProviderCards(ready, providers, [connection("youtube", "pending")]);
    expect(pendingCards[0].status).toBe("Connecting");
    expect(pendingCards[0].canStart).toBe(false);
  });

  it("shows owner-verification checks as explicit next steps, not silent blockers", () => {
    const cards = buildProviderCards(ready, providers, []);
    expect(cards[0].missing.some((check) => check.id === "owner-only")).toBe(true);
    expect(cards[0].nextSteps.join(" ")).toContain("Supabase custom SMTP");
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
