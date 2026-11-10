import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export interface CryptoContext {
  purpose: "oauth_code" | "oauth_verifier" | "access_token" | "refresh_token";
  workspaceId: string;
  platform: string;
  subject: string;
}

interface Keyring {
  active: string;
  keys: Map<string, Buffer>;
}

function keyring(): Keyring {
  const active = process.env.UP17_TOKEN_ACTIVE_KEY_ID;
  const raw = process.env.UP17_TOKEN_KEYS;
  if (!active || !raw) throw new Error("Token custody keyring is not configured.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
    // Secret managers may store a JSON object as a JSON string literal.
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
  } catch {
    throw new Error("Token custody keyring is invalid.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Token custody keyring is invalid.");
  const keys = new Map<string, Buffer>();
  for (const [id, value] of Object.entries(parsed)) {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || typeof value !== "string")
      throw new Error("Token custody keyring is invalid.");
    const key = Buffer.from(value, "base64");
    if (key.length !== 32) throw new Error("Token custody keys must be 32-byte base64 values.");
    keys.set(id, key);
  }
  if (!keys.has(active)) throw new Error("Active token custody key is missing.");
  return { active, keys };
}

function aad(context: CryptoContext, keyId: string): Buffer {
  return Buffer.from(
    JSON.stringify({
      v: 1,
      purpose: context.purpose,
      workspace: context.workspaceId,
      platform: context.platform,
      subject: context.subject,
      key: keyId,
    }),
  );
}

export function custodyConfigured(): boolean {
  try {
    keyring();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(
  plaintext: string,
  context: CryptoContext,
): { ciphertext: string; keyId: string } {
  const ring = keyring();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", ring.keys.get(ring.active)!, iv);
  cipher.setAAD(aad(context, ring.active));
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    keyId: ring.active,
    ciphertext: `v1.${ring.active}.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`,
  };
}

export function decryptSecret(ciphertext: string, context: CryptoContext): string {
  const ring = keyring();
  const parts = ciphertext.split(".");
  if (parts.length !== 5 || parts[0] !== "v1") throw new Error("Invalid credential envelope.");
  const [, keyId, iv, tag, data] = parts;
  const key = ring.keys.get(keyId);
  if (!key) throw new Error("Credential key is unavailable.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAAD(aad(context, keyId));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function pkcePair(method: "S256_BASE64URL" | "S256_HEX"): {
  verifier: string;
  challenge: string;
} {
  const verifier = randomToken(48);
  const digest = createHash("sha256").update(verifier, "utf8").digest();
  return {
    verifier,
    challenge: method === "S256_HEX" ? digest.toString("hex") : digest.toString("base64url"),
  };
}
