import "server-only";
import { requireSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret, sha256Hex, type CryptoContext } from "./crypto";
import {
  connectionStateForScopes,
  exchangeCode,
  fetchIdentity,
  pkceMethods,
  providerSecrets,
  refreshTokens,
  revokeProviderToken,
} from "./providers";
import type { ConnectionPlatform, RealConnection, TokenEnvelope } from "./types";

export class ConnectionError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

function rpcError(error: { message?: string } | null, fallback: string): never {
  const message = error?.message ?? fallback;
  if (message.includes("workspace_access_denied"))
    throw new ConnectionError("Workspace access denied.", 403);
  if (message.includes("oauth_rate_limited"))
    throw new ConnectionError("Too many connection attempts. Try again later.", 429);
  if (message.includes("oauth_state_invalid_or_replayed"))
    throw new ConnectionError("This authorization link expired or was already used.", 400);
  if (message.includes("refresh_busy_or_unavailable"))
    throw new ConnectionError(
      "A refresh is already running or the credential is unavailable.",
      409,
    );
  throw new ConnectionError(fallback, 502);
}

export async function beginOAuth(input: {
  actorId: string;
  workspaceId: string;
  platform: ConnectionPlatform;
  redirectUri: string;
  state: string;
  binding: string;
  verifier: string | null;
}): Promise<void> {
  const admin = requireSupabaseAdminClient();
  const context: CryptoContext = {
    purpose: "oauth_verifier",
    workspaceId: input.workspaceId,
    platform: input.platform,
    subject: sha256Hex(input.state),
  };
  const method = pkceMethods[input.platform];
  if ((method === null && input.verifier !== null) || (method !== null && !input.verifier))
    throw new ConnectionError("PKCE verifier does not match the provider login path.", 400);
  const encrypted = input.verifier ? encryptSecret(input.verifier, context) : null;
  const { error } = await admin.rpc("up17_oauth_begin", {
    p_actor: input.actorId,
    p_workspace: input.workspaceId,
    p_platform: input.platform,
    p_state_hash: sha256Hex(input.state),
    p_binding_hash: sha256Hex(input.binding),
    p_verifier_ciphertext: encrypted?.ciphertext ?? null,
    p_key_id: encrypted?.keyId ?? "none",
    p_redirect_uri: input.redirectUri,
  });
  if (error) rpcError(error, "Could not start the authorization request.");
}

export async function completeOAuth(input: {
  actorId: string;
  platform: ConnectionPlatform;
  state: string;
  binding: string;
  code: string;
}): Promise<string> {
  const admin = requireSupabaseAdminClient();
  const secrets = providerSecrets(input.platform);
  if (!secrets) throw new ConnectionError("Provider credentials are not configured.", 503);
  const stateHash = sha256Hex(input.state);
  const { data: attempt, error } = await admin.rpc("up17_oauth_consume", {
    p_state_hash: stateHash,
    p_binding_hash: sha256Hex(input.binding),
    p_actor: input.actorId,
  });
  if (error || !attempt) rpcError(error, "Authorization state could not be verified.");
  const record = attempt as Record<string, unknown>;
  if (
    record.platform !== input.platform ||
    typeof record.redirect_uri !== "string" ||
    typeof record.workspace_id !== "string"
  )
    throw new ConnectionError("Authorization response did not match the request.", 400);
  if (pkceMethods[input.platform] === null) {
    if (record.verifier_ciphertext !== null || record.encryption_key_id !== "none")
      throw new ConnectionError(
        "Instagram authorization unexpectedly contained a PKCE verifier.",
        400,
      );
  } else if (
    typeof record.verifier_ciphertext !== "string" ||
    record.encryption_key_id === "none"
  ) {
    throw new ConnectionError("Authorization state is missing its PKCE verifier.", 400);
  }
  const verifier =
    typeof record.verifier_ciphertext === "string"
      ? decryptSecret(record.verifier_ciphertext, {
          purpose: "oauth_verifier",
          workspaceId: record.workspace_id,
          platform: input.platform,
          subject: stateHash,
        })
      : null;
  const tokens = await exchangeCode(
    input.platform,
    secrets,
    input.code,
    record.redirect_uri,
    verifier,
  );
  const identity = await fetchIdentity(input.platform, tokens.accessToken);
  const workspaceId = record.workspace_id;
  const subject = identity.providerAccountId;
  const access = encryptSecret(tokens.accessToken, {
    purpose: "access_token",
    workspaceId,
    platform: input.platform,
    subject,
  });
  const refresh = tokens.refreshToken
    ? encryptSecret(tokens.refreshToken, {
        purpose: "refresh_token",
        workspaceId,
        platform: input.platform,
        subject,
      })
    : null;
  const state = connectionStateForScopes(input.platform, tokens.scopes);
  const { data, error: upsertError } = await admin.rpc("up17_connection_upsert", {
    p_actor: input.actorId,
    p_workspace: workspaceId,
    p_platform: input.platform,
    p_provider_account_id: identity.providerAccountId,
    p_display_name: identity.displayName,
    p_handle: identity.handle,
    p_avatar_url: identity.avatarUrl,
    p_scopes: tokens.scopes,
    p_access_ciphertext: access.ciphertext,
    p_refresh_ciphertext: refresh?.ciphertext ?? null,
    p_key_id: access.keyId,
    p_expires_at: tokens.expiresAt,
    p_refresh_expires_at: tokens.refreshExpiresAt,
    p_capabilities: {
      loginPath: input.platform === "instagram" ? "business_login" : "oauth",
      accountType: identity.accountType,
      publishing: false,
      verifiedScopes: tokens.scopes,
    },
    p_state: state,
  });
  if (upsertError || typeof data !== "string")
    rpcError(upsertError, "Could not store the authorized connection.");
  return data;
}

interface CredentialRow {
  connection_id: string;
  workspace_id: string;
  platform: ConnectionPlatform;
  provider_account_id: string;
  access_ciphertext: string;
  refresh_ciphertext: string | null;
  encryption_key_id: string;
  scopes: string[];
  lease_token?: string;
}

function decryptRow(row: CredentialRow): { accessToken: string; refreshToken: string | null } {
  const base = {
    workspaceId: row.workspace_id,
    platform: row.platform,
    subject: row.provider_account_id,
  };
  return {
    accessToken: decryptSecret(row.access_ciphertext, { ...base, purpose: "access_token" }),
    refreshToken: row.refresh_ciphertext
      ? decryptSecret(row.refresh_ciphertext, { ...base, purpose: "refresh_token" })
      : null,
  };
}

function encryptEnvelope(row: CredentialRow, tokens: TokenEnvelope) {
  const base = {
    workspaceId: row.workspace_id,
    platform: row.platform,
    subject: row.provider_account_id,
  };
  const access = encryptSecret(tokens.accessToken, { ...base, purpose: "access_token" });
  const refresh = tokens.refreshToken
    ? encryptSecret(tokens.refreshToken, { ...base, purpose: "refresh_token" })
    : null;
  return { access, refresh };
}

export async function refreshConnection(actorId: string, connectionId: string): Promise<void> {
  const admin = requireSupabaseAdminClient();
  const { data, error } = await admin.rpc("up17_connection_refresh_begin", {
    p_actor: actorId,
    p_connection_id: connectionId,
  });
  if (error || !data) rpcError(error, "Could not begin token refresh.");
  const row = data as CredentialRow;
  const secrets = providerSecrets(row.platform);
  if (!secrets || !row.lease_token)
    throw new ConnectionError("Provider credentials are not configured.", 503);
  try {
    const current = decryptRow(row);
    const tokens = await refreshTokens(row.platform, secrets, current);
    const identity = await fetchIdentity(row.platform, tokens.accessToken);
    if (identity.providerAccountId !== row.provider_account_id)
      throw new Error("provider_identity_changed");
    const encrypted = encryptEnvelope(row, tokens);
    const { error: finishError } = await admin.rpc("up17_connection_refresh_finish", {
      p_connection_id: connectionId,
      p_lease_token: row.lease_token,
      p_access_ciphertext: encrypted.access.ciphertext,
      p_refresh_ciphertext: encrypted.refresh?.ciphertext ?? null,
      p_key_id: encrypted.access.keyId,
      p_expires_at: tokens.expiresAt,
      p_refresh_expires_at: tokens.refreshExpiresAt,
      p_state: connectionStateForScopes(row.platform, tokens.scopes),
      p_error_code: null,
    });
    if (finishError) rpcError(finishError, "Could not finish token refresh.");
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "refresh_failed";
    await admin.rpc("up17_connection_refresh_finish", {
      p_connection_id: connectionId,
      p_lease_token: row.lease_token,
      p_access_ciphertext: null,
      p_refresh_ciphertext: null,
      p_key_id: null,
      p_expires_at: null,
      p_refresh_expires_at: null,
      p_state: "needs_authorisation",
      p_error_code: code,
    });
    throw new ConnectionError("Token refresh failed. Reconnect the account.", 502);
  }
}

export async function checkConnectionHealth(
  actorId: string,
  connectionId: string,
): Promise<RealConnection["state"]> {
  const admin = requireSupabaseAdminClient();
  const { data, error } = await admin.rpc("up17_connection_token", {
    p_actor: actorId,
    p_connection_id: connectionId,
  });
  if (error || !data) rpcError(error, "Credential is unavailable.");
  const row = data as CredentialRow;
  const secrets = providerSecrets(row.platform);
  if (!secrets) throw new ConnectionError("Provider credentials are not configured.", 503);
  try {
    const current = decryptRow(row);
    const identity = await fetchIdentity(row.platform, current.accessToken);
    if (identity.providerAccountId !== row.provider_account_id)
      throw new Error("provider_identity_changed");
    const state = connectionStateForScopes(row.platform, row.scopes);
    const { error: healthError } = await admin.rpc("up17_connection_health", {
      p_actor: actorId,
      p_connection_id: connectionId,
      p_state: state,
      p_error_code: null,
      p_capabilities: {
        accountType: identity.accountType,
        publishing: false,
        verifiedScopes: row.scopes,
      },
    });
    if (healthError) rpcError(healthError, "Could not record connection health.");
    return state;
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "health_check_failed";
    await admin.rpc("up17_connection_health", {
      p_actor: actorId,
      p_connection_id: connectionId,
      p_state: "needs_authorisation",
      p_error_code: code,
      p_capabilities: { publishing: false },
    });
    return "needs_authorisation";
  }
}

export async function disconnectConnection(
  actorId: string,
  connectionId: string,
): Promise<{ remoteRevoked: boolean; code: string | null }> {
  const admin = requireSupabaseAdminClient();
  const { data } = await admin.rpc("up17_connection_token", {
    p_actor: actorId,
    p_connection_id: connectionId,
  });
  let remote = { revoked: false, code: "credential_unavailable" as string | null };
  if (data) {
    const row = data as CredentialRow;
    const secrets = providerSecrets(row.platform);
    if (secrets) {
      const current = decryptRow(row);
      remote = await revokeProviderToken(
        row.platform,
        secrets,
        current.refreshToken ?? current.accessToken,
      );
    }
  }
  const { error } = await admin.rpc("up17_connection_disconnect", {
    p_actor: actorId,
    p_connection_id: connectionId,
    p_remote_revoked: remote.revoked,
    p_error_code: remote.code,
  });
  if (error) rpcError(error, "Could not disconnect the account.");
  return { remoteRevoked: remote.revoked, code: remote.code };
}

export async function runScheduledRefresh(
  limit = 20,
): Promise<{ processed: number; failed: number }> {
  const admin = requireSupabaseAdminClient();
  const { data, error } = await admin.rpc("up17_connection_refresh_claim", { p_limit: limit });
  if (error) rpcError(error, "Could not claim due refreshes.");
  const rows = (data ?? []) as CredentialRow[];
  let failed = 0;
  for (const row of rows) {
    const secrets = providerSecrets(row.platform);
    if (!secrets || !row.lease_token) {
      failed += 1;
      continue;
    }
    try {
      const current = decryptRow(row);
      const tokens = await refreshTokens(row.platform, secrets, current);
      const identity = await fetchIdentity(row.platform, tokens.accessToken);
      if (identity.providerAccountId !== row.provider_account_id)
        throw new Error("provider_identity_changed");
      const encrypted = encryptEnvelope(row, tokens);
      const { error: finishError } = await admin.rpc("up17_connection_refresh_finish", {
        p_connection_id: row.connection_id,
        p_lease_token: row.lease_token,
        p_access_ciphertext: encrypted.access.ciphertext,
        p_refresh_ciphertext: encrypted.refresh?.ciphertext ?? null,
        p_key_id: encrypted.access.keyId,
        p_expires_at: tokens.expiresAt,
        p_refresh_expires_at: tokens.refreshExpiresAt,
        p_state: connectionStateForScopes(row.platform, tokens.scopes),
        p_error_code: null,
      });
      if (finishError) throw finishError;
    } catch (error) {
      failed += 1;
      await admin.rpc("up17_connection_refresh_finish", {
        p_connection_id: row.connection_id,
        p_lease_token: row.lease_token,
        p_access_ciphertext: null,
        p_refresh_ciphertext: null,
        p_key_id: null,
        p_expires_at: null,
        p_refresh_expires_at: null,
        p_state: "needs_authorisation",
        p_error_code: error instanceof Error ? error.message.slice(0, 120) : "refresh_failed",
      });
    }
  }
  await admin.rpc("up17_oauth_cleanup", {});
  return { processed: rows.length, failed };
}
