export const connectionPlatforms = ["youtube", "instagram", "tiktok"] as const;
export type ConnectionPlatform = (typeof connectionPlatforms)[number];
export type ConnectionState =
  | "pending"
  | "connected"
  | "limited_permissions"
  | "needs_authorisation"
  | "error"
  | "disconnected";

export interface ProviderAvailability {
  platform: ConnectionPlatform;
  label: string;
  configured: boolean;
  loginPath: string;
  /** Minimum foundation scopes requested by the real OAuth start handler. */
  scopes: string[];
  /** Publishing scopes deliberately NOT requested until review and a separate milestone. */
  publishingScopes: string[];
  reviewNote: string;
}

export interface RealConnection {
  id: string;
  platform: ConnectionPlatform;
  providerAccountId: string | null;
  displayName: string;
  state: ConnectionState;
  grantedScopes: string[];
  lastVerifiedAt: string | null;
  lastErrorCode: string | null;
  handle: string | null;
  paused: boolean;
  publishingEnabled: boolean;
}

export interface TokenEnvelope {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  refreshExpiresAt: string | null;
  scopes: string[];
}

export interface ProviderIdentity {
  providerAccountId: string;
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  accountType: string | null;
}

export function isConnectionPlatform(value: unknown): value is ConnectionPlatform {
  return typeof value === "string" && (connectionPlatforms as readonly string[]).includes(value);
}

export const connectionStateLabels: Record<ConnectionState, string> = {
  pending: "Connection in progress",
  connected: "Connected",
  limited_permissions: "Limited permissions",
  needs_authorisation: "Reauthorization required",
  error: "Failed",
  disconnected: "Disconnected",
};
