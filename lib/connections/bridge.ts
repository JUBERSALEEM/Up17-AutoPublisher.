import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { decryptSecret, sha256Hex, type CryptoContext } from "./crypto";
import { isConnectionPlatform, type ConnectionPlatform } from "./types";

/** Non-secret public origin of the deployed callback bridge. */
export function callbackBridgeOrigin(): string | null {
  let config: ReturnType<typeof getSupabaseConfig>;
  try {
    config = getSupabaseConfig();
  } catch {
    return null;
  }
  if (!config) return null;
  const explicit = process.env.UP17_OAUTH_CALLBACK_BASE_URL;
  if (!explicit) return config.url;
  try {
    const url = new URL(explicit);
    if (
      url.origin !== config.url ||
      url.pathname !== "/functions/v1/up17-oauth-callback" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

function baseUrl(): URL {
  const origin = callbackBridgeOrigin();
  if (!origin) throw new Error("OAuth callback bridge is not configured.");
  return new URL("/functions/v1/up17-oauth-callback", origin);
}

/** Exact provider redirect URI. The public bridge receives provider codes, not the protected app. */
export function callbackBridgeUrl(platform: ConnectionPlatform): string {
  if (!isConnectionPlatform(platform)) throw new Error("Unsupported platform.");
  const url = baseUrl();
  url.searchParams.set("mode", "callback");
  url.searchParams.set("platform", platform);
  return url.toString();
}

/** Browser handoff URL; the bridge revalidates the provider URL before redirecting. */
export function bridgeAuthorizeUrl(input: {
  bridgeId: string;
  state: string;
  authorizationUrl: string;
}): string {
  const url = baseUrl();
  url.searchParams.set("mode", "authorize");
  url.searchParams.set("bridge", input.bridgeId);
  url.searchParams.set("state", input.state);
  url.searchParams.set("authorize", input.authorizationUrl);
  return url.toString();
}

function rpcError(error: { message?: string } | null): never {
  const message = error?.message ?? "bridge_unavailable";
  if (message.includes("workspace_access_denied")) throw new Error("Workspace access denied.");
  if (message.includes("oauth_rate_limited")) throw new Error("Too many connection attempts.");
  throw new Error("OAuth callback bridge is unavailable.");
}

export async function createBridgeSession(input: {
  actorId: string;
  workspaceId: string;
  platform: ConnectionPlatform;
  state: string;
  binding: string;
  redirectUri: string;
  returnOrigin: string;
}): Promise<string> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("OAuth callback bridge is unavailable.");
  const { data, error } = await admin.rpc("up17_oauth_bridge_create", {
    p_actor: input.actorId,
    p_workspace: input.workspaceId,
    p_platform: input.platform,
    p_state_hash: sha256Hex(input.state),
    p_binding_hash: sha256Hex(input.binding),
    p_redirect_uri: input.redirectUri,
    p_return_origin: input.returnOrigin,
  });
  if (error || typeof data !== "string") rpcError(error);
  return data;
}

export interface BridgeReceipt {
  platform: ConnectionPlatform;
  state: string;
  code: string;
}

/** One-time, actor- and browser-bound receipt consumption. Never returns a ciphertext to a browser. */
export async function consumeBridgeReceipt(input: {
  receipt: string;
  actorId: string;
  binding: string;
}): Promise<BridgeReceipt> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("OAuth callback bridge is unavailable.");
  const { data, error } = await admin.rpc("up17_oauth_callback_consume", {
    p_receipt_token_hash: sha256Hex(input.receipt),
    p_actor: input.actorId,
    p_binding_hash: sha256Hex(input.binding),
  });
  if (error || !data || typeof data !== "object") rpcError(error);
  const record = data as Record<string, unknown>;
  if (
    !isConnectionPlatform(record.platform as string) ||
    typeof record.state !== "string" ||
    typeof record.code_ciphertext !== "string" ||
    typeof record.workspace_id !== "string" ||
    record.provider_error !== null
  )
    throw new Error("OAuth callback receipt is invalid.");
  const platform = record.platform as ConnectionPlatform;
  const stateHash = sha256Hex(record.state);
  const context: CryptoContext = {
    purpose: "oauth_code",
    workspaceId: record.workspace_id,
    platform,
    subject: stateHash,
  };
  return {
    platform,
    state: record.state,
    code: decryptSecret(record.code_ciphertext, context),
  };
}
