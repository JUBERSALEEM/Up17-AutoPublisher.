import type { ConnectionPlatform, ProviderAvailability, RealConnection } from "./types";

export const connectionStatuses = [
  "Not configured",
  "Authentication required",
  "Workspace setup required",
  "Provider credentials missing",
  "Encryption keyring missing",
  "Ready to connect",
  "Connected",
  "Limited permissions",
  "Needs reauthorization",
  "Error",
] as const;

export type ConnectionStatus = (typeof connectionStatuses)[number];
export type StatusTone = "success" | "warning" | "danger" | "neutral";

/** Dashboard names and booleans only. This object must never carry secret values. */
export interface SetupCheck {
  id: string;
  names: readonly string[];
  location: string;
  configured: boolean;
  ownerAction: string;
  /** True when the app cannot inspect a dashboard-only owner action. */
  ownerVerification?: boolean;
  /** Omit for deployment-wide checks. */
  platforms?: readonly ConnectionPlatform[];
}

export interface DeploymentReadiness {
  demoMode: boolean;
  authenticated: boolean;
  workspaceReady: boolean;
  canManage: boolean;
  publicSupabaseConfigured: boolean;
  exactSiteUrlConfigured: boolean;
  serverKeyConfigured: boolean;
  keyringConfigured: boolean;
  connectionReadError: boolean;
  providerCredentials: Record<ConnectionPlatform, boolean>;
  callbackPaths: Record<ConnectionPlatform, string>;
  checks: SetupCheck[];
}

export interface ProviderCard extends ProviderAvailability {
  connectLabel: string;
  status: ConnectionStatus;
  blocker: ConnectionStatus | null;
  description: string;
  canStart: boolean;
  missing: SetupCheck[];
  callbackPath: string;
  providerDashboard: string;
  connection: RealConnection | null;
}

export const connectLabels: Record<ConnectionPlatform, string> = {
  youtube: "Connect Google / YouTube",
  instagram: "Connect Instagram",
  tiktok: "Connect TikTok",
};

export const providerDashboards: Record<ConnectionPlatform, string> = {
  youtube: "Google Cloud Console → APIs & Services → Credentials / OAuth consent screen",
  instagram: "Meta for Developers → your app → Instagram Business Login",
  tiktok: "TikTok Developer Portal → your app → Login Kit",
};

export const providerSetupNames: Record<ConnectionPlatform, readonly string[]> = {
  youtube: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  instagram: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
  tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
};

export const statusTone: Record<ConnectionStatus, StatusTone> = {
  "Not configured": "danger",
  "Authentication required": "warning",
  "Workspace setup required": "warning",
  "Provider credentials missing": "warning",
  "Encryption keyring missing": "warning",
  "Ready to connect": "success",
  Connected: "success",
  "Limited permissions": "warning",
  "Needs reauthorization": "warning",
  Error: "danger",
};

const statusDescriptions: Record<ConnectionStatus, string> = {
  "Not configured":
    "Deployment setup is incomplete. Complete the checklist below; this page exposes names and booleans only, never values.",
  "Authentication required":
    "Sign in with a confirmed email. The owner must configure custom SMTP in Supabase before confirmation and recovery emails can be verified.",
  "Workspace setup required":
    "A confirmed user needs an owner/admin workspace. Confirmed signup creates it from the reviewed trigger; otherwise ask a workspace owner to add the account.",
  "Provider credentials missing":
    "The provider app credentials are absent from this deployment's server-only environment.",
  "Encryption keyring missing":
    "The server-side AES-256-GCM keyring is absent or invalid. Tokens cannot be encrypted until it is configured.",
  "Ready to connect":
    "Ready to start official provider authorization. You will be sent to the provider's own page; publishing remains disabled.",
  Connected:
    "A real account is connected. Its credentials stay encrypted server-side, and publishing remains disabled.",
  "Limited permissions":
    "The stored account is missing required scopes. Reconnect to request the reviewed permissions again.",
  "Needs reauthorization":
    "The stored account needs fresh official authorization. Reconnect to continue.",
  Error:
    "The stored connection has an error. Check its last error code and reconnect when the cause is fixed.",
};

function storedStatus(connection: RealConnection | null): ConnectionStatus | null {
  if (!connection) return null;
  switch (connection.state) {
    case "connected":
      return "Connected";
    case "limited_permissions":
      return "Limited permissions";
    case "needs_authorisation":
    case "pending":
      return "Needs reauthorization";
    case "error":
      return "Error";
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
  if (!readiness.authenticated) return "Authentication required";
  if (!readiness.workspaceReady || !readiness.canManage) return "Workspace setup required";
  if (readiness.connectionReadError) return "Error";
  if (!readiness.providerCredentials[platform]) return "Provider credentials missing";
  if (!readiness.keyringConfigured) return "Encryption keyring missing";
  return null;
}

function describe(
  status: ConnectionStatus,
  card: Pick<ProviderCard, "platform" | "callbackPath" | "providerDashboard" | "missing">,
): string {
  const base = statusDescriptions[status];
  if (status === "Provider credentials missing") {
    return `${base} Add ${providerSetupNames[card.platform].join(", ")} in Vercel. Register ${card.callbackPath} as the exact redirect URI in ${card.providerDashboard}.`;
  }
  if (status === "Workspace setup required") {
    return `${base} Only owner/admin roles can connect, refresh or disconnect accounts.`;
  }
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
        !check.configured &&
        !check.ownerVerification &&
        (check.platforms === undefined || check.platforms.includes(platform)),
    );
    const callbackPath = readiness.callbackPaths[platform];
    const providerDashboard = providerDashboards[platform];
    const canStart = blocker === null && !(connection && connection.state === "connected");
    const draft: Pick<ProviderCard, "platform" | "callbackPath" | "providerDashboard" | "missing"> =
      { platform, callbackPath, providerDashboard, missing };
    return {
      ...provider,
      connectLabel: connectLabels[platform],
      status,
      blocker,
      description: describe(status, draft),
      canStart,
      missing,
      callbackPath,
      providerDashboard,
      connection,
    };
  });
}
