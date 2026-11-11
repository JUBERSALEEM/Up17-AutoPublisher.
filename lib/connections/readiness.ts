import type { ConnectionPlatform, ProviderAvailability, RealConnection } from "./types";
import { providerRequirements, type ProviderRequirement } from "./provider-requirements";

/** Owner-visible states. Every disabled state names an actionable cause. */
export const connectionStatuses = [
  "Not configured",
  "Sign in required",
  "Email confirmation required",
  "Workspace setup required",
  "Owner authorization required",
  "Credentials missing",
  "Provider configuration incomplete",
  "Encryption keyring missing",
  "Ready to connect",
  "Connecting",
  "Connected",
  "Limited permissions",
  "Connection failed",
  "Reauthorization required",
  "Error",
] as const;

export type ConnectionStatus = (typeof connectionStatuses)[number];
export type StatusTone = "success" | "warning" | "danger" | "neutral";

/** Every deployment setting uses exactly one evidence-backed state. */
export const setupStatuses = [
  "MISSING",
  "CONFIGURED",
  "VERIFIED",
  "OWNER ACTION REQUIRED",
  "BLOCKED",
  "NOT APPLICABLE",
] as const;
export type SetupStatus = (typeof setupStatuses)[number];
export const setupStatusTone: Record<SetupStatus, StatusTone> = {
  MISSING: "danger",
  CONFIGURED: "neutral",
  VERIFIED: "success",
  "OWNER ACTION REQUIRED": "warning",
  BLOCKED: "danger",
  "NOT APPLICABLE": "neutral",
};

/** Dashboard names, non-secret states and non-secret evidence only. */
export interface SetupCheck {
  id: string;
  names: readonly string[];
  location: string;
  status: SetupStatus;
  configured: boolean;
  evidence: string;
  ownerAction: string;
  /** True when the app cannot inspect a dashboard-only owner action. */
  ownerVerification?: boolean;
  /** Omit for deployment-wide checks. */
  platforms?: readonly ConnectionPlatform[];
}

export interface DeploymentEvidenceRow {
  key: string;
  state: string;
  evidence: string;
  verified_at: string | null;
}

/** VERIFIED requires an explicit evidence record and timestamp, never variable presence. */
export function applyDeploymentEvidence(
  checks: SetupCheck[],
  rows: DeploymentEvidenceRow[],
): SetupCheck[] {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return checks.map((check) => {
    const row = byKey.get(check.id);
    if (!row || !(setupStatuses as readonly string[]).includes(row.state)) return check;
    const state = row.state as SetupStatus;
    const hasProof = Boolean(row.evidence.trim() && row.verified_at);
    const effectiveState = state === "VERIFIED" && !hasProof ? "BLOCKED" : state;
    const safeEvidence = /^[a-z0-9_ -]{1,160}$/i.test(row.evidence.trim())
      ? row.evidence.trim()
      : "Evidence recorded privately; no sensitive values displayed.";
    return {
      ...check,
      status: effectiveState,
      configured: ["CONFIGURED", "VERIFIED", "NOT APPLICABLE"].includes(effectiveState),
      ownerVerification: effectiveState === "OWNER ACTION REQUIRED",
      evidence:
        effectiveState === "BLOCKED" && state === "VERIFIED"
          ? "VERIFIED requires a timestamped evidence record."
          : safeEvidence,
    };
  });
}

export interface DeploymentReadiness {
  demoMode: boolean;
  /** Any Supabase Auth session, confirmed or not. */
  authenticated: boolean;
  /** The session's email is confirmed with Supabase Auth. */
  emailConfirmed: boolean;
  workspaceReady: boolean;
  canManage: boolean;
  /** Server-recognized workspace role; null until a workspace exists. */
  role: string | null;
  publicSupabaseConfigured: boolean;
  exactSiteUrlConfigured: boolean;
  serverKeyConfigured: boolean;
  keyringConfigured: boolean;
  connectionReadError: boolean;
  providerCredentials: Record<ConnectionPlatform, boolean>;
  providerConfigurationVerified: Record<ConnectionPlatform, boolean>;
  callbackPaths: Record<ConnectionPlatform, string>;
  externalCallbackUrls: Record<ConnectionPlatform, string | null>;
  bridgeOrigin: string | null;
  checks: SetupCheck[];
}

export interface ProviderCard extends ProviderAvailability {
  connectLabel: string;
  status: ConnectionStatus;
  blocker: ConnectionStatus | null;
  description: string;
  canStart: boolean;
  missing: SetupCheck[];
  nextSteps: string[];
  callbackPath: string;
  externalCallbackUrl: string | null;
  providerDashboard: string;
  requirements: ProviderRequirement;
  connection: RealConnection | null;
}

export const connectLabels: Record<ConnectionPlatform, string> = {
  youtube: "Connect Google / YouTube",
  instagram: "Connect Instagram",
  tiktok: "Connect TikTok",
};

export const providerDashboards: Record<ConnectionPlatform, string> = {
  youtube: "https://console.cloud.google.com/apis/credentials",
  instagram: "https://developers.facebook.com/apps/",
  tiktok: "https://developers.tiktok.com/apps",
};

export const providerSetupNames: Record<ConnectionPlatform, readonly string[]> = {
  youtube: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  instagram: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
  tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
};

export const statusTone: Record<ConnectionStatus, StatusTone> = {
  "Not configured": "danger",
  "Sign in required": "warning",
  "Email confirmation required": "warning",
  "Workspace setup required": "warning",
  "Owner authorization required": "warning",
  "Credentials missing": "warning",
  "Provider configuration incomplete": "warning",
  "Encryption keyring missing": "warning",
  "Ready to connect": "success",
  Connecting: "neutral",
  Connected: "success",
  "Limited permissions": "warning",
  "Connection failed": "danger",
  "Reauthorization required": "warning",
  Error: "danger",
};

const statusDescriptions: Record<ConnectionStatus, string> = {
  "Not configured":
    "Deployment setup is incomplete: the public Supabase URL/key, exact site URL, server-only key or callback bridge is missing. Complete the deployment checklist below.",
  "Sign in required":
    "Sign in with your Up17 email and password. New signups use a six-digit numeric email code, not a confirmation link.",
  "Email confirmation required":
    "Enter the six-digit numeric code Supabase sent to your email. Up17 does not create a workspace or allow connections until Supabase confirms the address.",
  "Workspace setup required":
    "Finish verified onboarding to create your first owner workspace, or ask an existing owner/admin for an invitation.",
  "Owner authorization required":
    "Your workspace role is not owner/admin. Only owner/admin roles can start, refresh, health-check or disconnect real provider connections. Viewer and editor roles cannot manage connections.",
  "Credentials missing":
    "The provider app credentials are absent from this deployment's server-only environment. Add them in Vercel Preview; never paste values into chat or Git.",
  "Provider configuration incomplete":
    "External provider app setup, exact redirect URI registration, consent/review and account eligibility are not evidence-verified. Complete the exact owner actions listed on this card and record timestamped VERIFIED evidence from genuine provider-side checks; no checkbox or self-attestation can start real OAuth.",
  "Encryption keyring missing":
    "The server-side AES-256-GCM keyring is absent or invalid. Tokens cannot be encrypted until the owner configures it in Vercel.",
  "Ready to connect":
    "Server-side gates and timestamped VERIFIED external setup evidence are recorded. This starts real official provider authorization; only foundation read-only/identity scopes are requested and publishing remains disabled.",
  Connecting:
    "Authorization has started but no provider identity is stored. Finish consent in the provider window, or dismiss this state and start again.",
  Connected:
    "A real identity is connected for the read-only foundation. Credentials stay encrypted server-side; publishing permissions were not requested and publishing remains disabled.",
  "Limited permissions":
    "The stored account is missing foundation scopes. Reconnect to request the reviewed minimum permissions again.",
  "Connection failed":
    "The stored connection has an error. Check the last error code, fix the provider setup and reconnect; no connection is invented.",
  "Reauthorization required":
    "The stored account needs fresh official authorization. Reconnect to continue.",
  Error:
    "Connection records could not be read or authorization failed. Check the server-only broker configuration, workspace permissions and provider response.",
};

function storedStatus(connection: RealConnection | null): ConnectionStatus | null {
  if (!connection) return null;
  switch (connection.state) {
    case "connected":
      return "Connected";
    case "limited_permissions":
      return "Limited permissions";
    case "pending":
      return "Connecting";
    case "needs_authorisation":
      return "Reauthorization required";
    case "error":
      return "Connection failed";
    case "disconnected":
      return null;
    default:
      return null;
  }
}

function firstBlocker(
  readiness: DeploymentReadiness,
  platform: ConnectionPlatform,
): ConnectionStatus | null {
  if (
    !readiness.publicSupabaseConfigured ||
    !readiness.exactSiteUrlConfigured ||
    !readiness.serverKeyConfigured
  )
    return "Not configured";
  if (!readiness.authenticated) return "Sign in required";
  if (!readiness.emailConfirmed) return "Email confirmation required";
  if (!readiness.workspaceReady) return "Workspace setup required";
  if (!readiness.canManage) return "Owner authorization required";
  if (readiness.connectionReadError) return "Error";
  if (!readiness.providerCredentials[platform]) return "Credentials missing";
  if (!readiness.keyringConfigured) return "Encryption keyring missing";
  if (!readiness.providerConfigurationVerified[platform])
    return "Provider configuration incomplete";
  return null;
}

function describe(
  status: ConnectionStatus,
  card: Pick<
    ProviderCard,
    | "platform"
    | "callbackPath"
    | "externalCallbackUrl"
    | "providerDashboard"
    | "requirements"
    | "missing"
    | "nextSteps"
  >,
): string {
  const base = statusDescriptions[status];
  if (status === "Credentials missing") {
    const redirect =
      card.externalCallbackUrl ?? `the external callback bridge for ${card.callbackPath}`;
    return `${base} Add ${providerSetupNames[card.platform].join(", ")} in Vercel. Register ${redirect} as the exact redirect URI at ${card.providerDashboard}.`;
  }
  if (status === "Provider configuration incomplete") {
    const missing = card.missing.map((check) => check.names.join(", ")).join("; ");
    return `${base} Outstanding owner checks: ${missing || "external app review"}. ${card.nextSteps[0] ?? ""}`;
  }
  if (status === "Workspace setup required")
    return `${base} Only owner/admin roles can connect, refresh or disconnect accounts.`;
  if (status === "Owner authorization required")
    return `${base} Ask an existing owner/admin for an invitation; do not grant privileges from the browser.`;
  if (status === "Email confirmation required")
    return `${base} Use the resend control on the verification page if the code expired.`;
  if (status === "Sign in required")
    return `${base} Email delivery is managed by Supabase; custom SMTP must be owner-verified before broad rollout.`;
  return base;
}

export function buildProviderCards(
  readiness: DeploymentReadiness,
  providers: ProviderAvailability[],
  connections: RealConnection[],
): ProviderCard[] {
  return providers.map((provider) => {
    const platform = provider.platform;
    const connection =
      connections.find((item) => item.platform === platform && item.state !== "disconnected") ??
      null;
    const blocker = firstBlocker(readiness, platform);
    const status = storedStatus(connection) ?? blocker ?? "Ready to connect";
    const missing = readiness.checks.filter(
      (check) =>
        (check.platforms === undefined || check.platforms.includes(platform)) &&
        check.status !== "VERIFIED" &&
        check.status !== "NOT APPLICABLE" &&
        (!check.configured || check.ownerVerification),
    );
    const nextSteps = missing.map(
      (check) => `${check.names.join(", ")} — ${check.ownerAction} Where: ${check.location}.`,
    );
    const callbackPath = readiness.callbackPaths[platform];
    const externalCallbackUrl = readiness.externalCallbackUrls[platform];
    const providerDashboard = providerDashboards[platform];
    const requirements = providerRequirements[platform];
    const canStart =
      blocker === null && connection?.state !== "connected" && connection?.state !== "pending";
    const draft: Pick<
      ProviderCard,
      | "platform"
      | "callbackPath"
      | "externalCallbackUrl"
      | "providerDashboard"
      | "requirements"
      | "missing"
      | "nextSteps"
    > = {
      platform,
      callbackPath,
      externalCallbackUrl,
      providerDashboard,
      requirements,
      missing,
      nextSteps,
    };
    return {
      ...provider,
      connectLabel: connectLabels[platform],
      status,
      blocker,
      description: describe(status, draft),
      canStart,
      missing,
      nextSteps,
      callbackPath,
      externalCallbackUrl,
      providerDashboard,
      requirements,
      connection,
    };
  });
}
