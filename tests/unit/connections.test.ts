import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  custodyConfigured,
  decryptSecret,
  encryptSecret,
  pkcePair,
  randomToken,
  sha256Hex,
  type CryptoContext,
} from "@/lib/connections/crypto";
import {
  authorizationUrl,
  callbackUrl,
  connectionStateForScopes,
  pkceMethods,
  providerScopes,
  revokeProviderToken,
} from "@/lib/connections/providers";
import { isConnectionPlatform } from "@/lib/connections/types";

const primary = Buffer.alloc(32, 1).toString("base64");
const rotated = Buffer.alloc(32, 2).toString("base64");
const secrets = { clientId: "your-client-id", clientSecret: "your-client-secret" };

beforeEach(() => {
  vi.stubEnv("UP17_TOKEN_ACTIVE_KEY_ID", "primary");
  vi.stubEnv("UP17_TOKEN_KEYS", JSON.stringify({ primary, rotated }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("connection crypto", () => {
  const context: CryptoContext = {
    purpose: "access_token",
    workspaceId: "11111111-1111-4111-8111-111111111111",
    platform: "youtube",
    subject: "synthetic-channel",
  };

  it("round-trips an envelope and supports key rotation", () => {
    expect(custodyConfigured()).toBe(true);
    const envelope = encryptSecret("synthetic-test-value", context);
    expect(envelope.keyId).toBe("primary");
    expect(decryptSecret(envelope.ciphertext, context)).toBe("synthetic-test-value");
    vi.stubEnv("UP17_TOKEN_ACTIVE_KEY_ID", "rotated");
    const next = encryptSecret("synthetic-test-value-2", context);
    expect(next.keyId).toBe("rotated");
    expect(decryptSecret(envelope.ciphertext, context)).toBe("synthetic-test-value");
    expect(decryptSecret(next.ciphertext, context)).toBe("synthetic-test-value-2");
  });

  it("rejects tampering, missing keys and every changed AAD context", () => {
    const envelope = encryptSecret("synthetic-test-value", context);
    const parts = envelope.ciphertext.split(".");
    const tamperedTag = [...parts];
    tamperedTag[3] = tamperedTag[3] === "A" ? "B" : "A";
    expect(() => decryptSecret(tamperedTag.join("."), context)).toThrow();
    const unknownKey = [...parts];
    unknownKey[1] = "missing";
    expect(() => decryptSecret(unknownKey.join("."), context)).toThrow();
    expect(() =>
      decryptSecret(envelope.ciphertext, { ...context, purpose: "refresh_token" }),
    ).toThrow();
    expect(() =>
      decryptSecret(envelope.ciphertext, { ...context, workspaceId: "different" }),
    ).toThrow();
    expect(() => decryptSecret(envelope.ciphertext, { ...context, platform: "tiktok" })).toThrow();
    expect(() =>
      decryptSecret(envelope.ciphertext, { ...context, subject: "different" }),
    ).toThrow();
  });

  it("fails closed when the keyring is absent or malformed", () => {
    vi.stubEnv("UP17_TOKEN_KEYS", "");
    expect(custodyConfigured()).toBe(false);
    expect(() => encryptSecret("synthetic-test-value", context)).toThrow();
  });

  it("accepts a secret-manager JSON string literal without exposing values", () => {
    vi.stubEnv("UP17_TOKEN_KEYS", JSON.stringify(JSON.stringify({ primary, rotated })));
    expect(custodyConfigured()).toBe(true);
    const envelope = encryptSecret("synthetic-test-value", context);
    expect(decryptSecret(envelope.ciphertext, context)).toBe("synthetic-test-value");
  });

  it("produces unique state values and both documented S256 encodings", () => {
    expect(randomToken(32)).not.toBe(randomToken(32));
    expect(sha256Hex("state")).toBe(createHash("sha256").update("state", "utf8").digest("hex"));
    for (const method of ["S256_BASE64URL", "S256_HEX"] as const) {
      const pair = pkcePair(method);
      const digest = createHash("sha256").update(pair.verifier, "utf8").digest();
      expect(pair.challenge).toBe(
        method === "S256_HEX" ? digest.toString("hex") : digest.toString("base64url"),
      );
    }
  });
});

describe("provider authorization contracts", () => {
  it("uses provider-specific PKCE methods, with Instagram explicitly null", () => {
    expect(pkceMethods).toEqual({ youtube: "S256_BASE64URL", instagram: null, tiktok: "S256_HEX" });
    expect(isConnectionPlatform("instagram")).toBe(true);
    expect(isConnectionPlatform("facebook")).toBe(false);
    expect(callbackUrl("https://app.example.com", "youtube")).toBe(
      "https://app.example.com/api/connections/callback/youtube",
    );
  });

  it("builds Google, Instagram and TikTok authorize URLs with exact scopes", () => {
    const redirect = "https://app.example.com/api/connections/callback/youtube";
    const google = new URL(
      authorizationUrl("youtube", secrets, redirect, "state-1", "challenge-1"),
    );
    expect(google.origin).toBe("https://accounts.google.com");
    expect(google.searchParams.get("client_id")).toBe(secrets.clientId);
    expect(google.searchParams.get("scope")).toBe(providerScopes.youtube.join(" "));
    expect(google.searchParams.get("access_type")).toBe("offline");
    expect(google.searchParams.get("prompt")).toBe("consent select_account");
    expect(google.searchParams.get("code_challenge_method")).toBe("S256");

    const instagram = new URL(authorizationUrl("instagram", secrets, redirect, "state-2", null));
    expect(instagram.origin).toBe("https://www.instagram.com");
    expect(instagram.searchParams.get("scope")).toBe(providerScopes.instagram.join(","));
    expect(instagram.searchParams.has("code_challenge")).toBe(false);
    expect(instagram.searchParams.has("code_challenge_method")).toBe(false);

    const tiktok = new URL(
      authorizationUrl("tiktok", secrets, redirect, "state-3", "a".repeat(64)),
    );
    expect(tiktok.origin).toBe("https://www.tiktok.com");
    expect(tiktok.searchParams.get("client_key")).toBe(secrets.clientId);
    expect(tiktok.searchParams.get("code_challenge")).toBe("a".repeat(64));
    expect(tiktok.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("never marks partial scope grants as fully connected", () => {
    expect(connectionStateForScopes("youtube", providerScopes.youtube)).toBe("connected");
    expect(connectionStateForScopes("youtube", providerScopes.youtube.slice(0, 1))).toBe(
      "limited_permissions",
    );
  });

  it("accepts an empty 200 revocation response but never fakes Instagram remote revoke", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(revokeProviderToken("youtube", secrets, "synthetic-test-token")).resolves.toEqual({
      revoked: true,
      code: null,
    });
    await expect(
      revokeProviderToken("instagram", secrets, "synthetic-test-token"),
    ).resolves.toEqual({
      revoked: false,
      code: "instagram_remote_revoke_unsupported",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
