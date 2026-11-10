import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bridgeAuthorizeUrl,
  callbackBridgeOrigin,
  callbackBridgeUrl,
} from "@/lib/connections/bridge";
import {
  decryptSecret,
  encryptSecret,
  sha256Hex,
  type CryptoContext,
} from "@/lib/connections/crypto";

const origin = "https://example.supabase.co";
const base = `${origin}/functions/v1/up17-oauth-callback`;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", origin);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_synthetic-test-key");
  vi.stubEnv("UP17_OAUTH_CALLBACK_BASE_URL", base);
  vi.stubEnv("UP17_TOKEN_ACTIVE_KEY_ID", "primary");
  vi.stubEnv(
    "UP17_TOKEN_KEYS",
    JSON.stringify({ primary: Buffer.alloc(32, 3).toString("base64") }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public OAuth callback bridge", () => {
  it("uses the exact same-project public origin and provider callback query", () => {
    expect(callbackBridgeOrigin()).toBe(origin);
    expect(callbackBridgeUrl("youtube")).toBe(`${base}?mode=callback&platform=youtube`);
    expect(callbackBridgeUrl("instagram")).toBe(`${base}?mode=callback&platform=instagram`);
    expect(callbackBridgeUrl("tiktok")).toBe(`${base}?mode=callback&platform=tiktok`);
  });

  it("rejects a callback base on a different origin or with extra URL parts", () => {
    vi.stubEnv(
      "UP17_OAUTH_CALLBACK_BASE_URL",
      "https://other.example.com/functions/v1/up17-oauth-callback",
    );
    expect(callbackBridgeOrigin()).toBeNull();
    vi.stubEnv("UP17_OAUTH_CALLBACK_BASE_URL", `${base}?unexpected=1`);
    expect(callbackBridgeOrigin()).toBeNull();
  });

  it("falls back to the validated public project origin without a plaintext env override", () => {
    vi.stubEnv("UP17_OAUTH_CALLBACK_BASE_URL", "");
    expect(callbackBridgeOrigin()).toBe(origin);
    expect(callbackBridgeUrl("tiktok")).toBe(`${base}?mode=callback&platform=tiktok`);
  });

  it("passes the provider authorization URL only to the bridge, not to the app callback", () => {
    const provider =
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=synthetic&state=state-value";
    const handoff = new URL(
      bridgeAuthorizeUrl({
        bridgeId: "11111111-1111-4111-8111-111111111111",
        state: "state-value",
        authorizationUrl: provider,
      }),
    );
    expect(handoff.origin).toBe(origin);
    expect(handoff.pathname).toBe("/functions/v1/up17-oauth-callback");
    expect(handoff.searchParams.get("mode")).toBe("authorize");
    expect(handoff.searchParams.get("authorize")).toBe(provider);
    expect(handoff.searchParams.has("code")).toBe(false);
    expect(handoff.searchParams.has("access_token")).toBe(false);
  });

  it("binds the encrypted one-time provider code to OAuth state and workspace context", () => {
    const state = "synthetic-state";
    const context: CryptoContext = {
      purpose: "oauth_code",
      workspaceId: "11111111-1111-4111-8111-111111111111",
      platform: "youtube",
      subject: sha256Hex(state),
    };
    const envelope = encryptSecret("synthetic-provider-code", context);
    expect(decryptSecret(envelope.ciphertext, context)).toBe("synthetic-provider-code");
    expect(() =>
      decryptSecret(envelope.ciphertext, { ...context, purpose: "access_token" }),
    ).toThrow();
    expect(() => decryptSecret(envelope.ciphertext, { ...context, subject: "replayed" })).toThrow();
  });
});
