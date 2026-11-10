// Public OAuth callback bridge for Supabase Edge Functions.
// No provider access token, provider code, service credential or keyring value
// is ever returned to a browser, written to a URL, or logged.

type Platform = "youtube" | "instagram" | "tiktok";

const providerOrigins: Record<Platform, string> = {
  youtube: "https://accounts.google.com",
  instagram: "https://www.instagram.com",
  tiktok: "https://www.tiktok.com",
};
const platforms = Object.keys(providerOrigins) as Platform[];
const cookieName = "up17_oauth_bridge";
const cookiePath = "/functions/v1/up17-oauth-callback";

function isPlatform(value: string | null): value is Platform {
  return value !== null && (platforms as string[]).includes(value);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(bytes = 32): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

function cookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function setCookie(value: string, maxAge: number): string {
  return `${cookieName}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=${cookiePath}; Max-Age=${maxAge}`;
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error("bridge_not_configured");
  return value;
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const url = `${requiredEnv("SUPABASE_URL")}/rest/v1/rpc/${name}`;
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error("bridge_store_unavailable");
  return (text.trim() ? JSON.parse(text) : null) as T;
}

interface BridgeContext {
  id: string;
  state_hash: string;
  binding_hash: string;
  actor_id: string;
  workspace_id: string;
  platform: Platform;
  redirect_uri: string;
  return_origin: string;
}

async function encryptCode(
  code: string,
  context: BridgeContext,
  stateHash: string,
): Promise<{ ciphertext: string; keyId: string }> {
  const active = requiredEnv("UP17_TOKEN_ACTIVE_KEY_ID");
  const raw = requiredEnv("UP17_TOKEN_KEYS");
  let decoded: unknown = JSON.parse(raw);
  if (typeof decoded === "string") decoded = JSON.parse(decoded);
  const parsed = decoded as Record<string, string>;
  const keyValue = parsed[active];
  if (!active.match(/^[A-Za-z0-9_-]{1,64}$/) || typeof keyValue !== "string") {
    throw new Error("bridge_not_configured");
  }
  const key = fromBase64(keyValue);
  if (key.length !== 32) throw new Error("bridge_not_configured");
  const aad = new TextEncoder().encode(
    JSON.stringify({
      v: 1,
      purpose: "oauth_code",
      workspace: context.workspace_id,
      platform: context.platform,
      subject: stateHash,
      key: active,
    }),
  );
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad },
      cryptoKey,
      new TextEncoder().encode(code),
    ),
  );
  const tag = encrypted.slice(encrypted.length - 16);
  const data = encrypted.slice(0, encrypted.length - 16);
  return {
    keyId: active,
    ciphertext: `v1.${active}.${base64Url(iv)}.${base64Url(tag)}.${base64Url(data)}`,
  };
}

function redirect(location: string, cookie: string): Response {
  return new Response(null, {
    status: 303,
    headers: {
      Location: location,
      "Set-Cookie": cookie,
      "Cache-Control": "private, no-store",
    },
  });
}

function safeReturnOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (url.pathname !== "/" || url.search || url.hash) return null;
    if (!url.hostname.endsWith(".vercel.app")) return null;
    return url.origin;
  } catch {
    return null;
  }
}

async function authorize(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const bridgeId = url.searchParams.get("bridge");
  const state = url.searchParams.get("state");
  const providerUrlRaw = url.searchParams.get("authorize");
  if (!bridgeId || !state || !providerUrlRaw || state.length > 256) {
    return json({ error: "Invalid authorization handoff." }, 400);
  }
  const stateHash = await sha256Hex(state);
  let context: BridgeContext;
  try {
    context = await rpc<BridgeContext>("up17_oauth_bridge_resolve", {
      p_bridge_id: bridgeId,
      p_state_hash: stateHash,
    });
  } catch {
    return json({ error: "Authorization handoff expired or invalid." }, 400);
  }
  let providerUrl: URL;
  try {
    providerUrl = new URL(providerUrlRaw);
  } catch {
    return json({ error: "Invalid provider authorization URL." }, 400);
  }
  const forbidden = ["client_secret", "access_token", "refresh_token"];
  if (
    providerUrl.origin !== providerOrigins[context.platform] ||
    providerUrl.searchParams.get("state") !== state ||
    providerUrl.searchParams.get("redirect_uri") !== context.redirect_uri ||
    forbidden.some((name) => providerUrl.searchParams.has(name))
  ) {
    return json({ error: "Provider authorization URL is not allowed." }, 400);
  }
  return redirect(providerUrl.toString(), setCookie(bridgeId, 600));
}

async function callback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform");
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error");
  const bridgeId = cookieValue(request.headers.get("cookie"), cookieName);
  if (!isPlatform(platform) || !state || state.length > 256 || !bridgeId) {
    return json({ error: "Invalid callback request." }, 400);
  }
  const stateHash = await sha256Hex(state);
  let context: BridgeContext;
  try {
    context = await rpc<BridgeContext>("up17_oauth_bridge_resolve", {
      p_bridge_id: bridgeId,
      p_state_hash: stateHash,
    });
  } catch {
    return json({ error: "Callback session expired or invalid." }, 400);
  }
  if (context.platform !== platform) {
    return json({ error: "Callback platform mismatch." }, 400);
  }
  const returnOrigin = safeReturnOrigin(context.return_origin);
  if (!returnOrigin) return json({ error: "Callback destination is not allowed." }, 400);
  const clear = setCookie("", 0);
  if (providerError) {
    const destination = new URL("/accounts", returnOrigin);
    destination.searchParams.set("connection", "denied");
    destination.searchParams.set("platform", platform);
    return redirect(destination.toString(), clear);
  }
  if (!code || code.length > 4096) return json({ error: "Invalid callback request." }, 400);
  try {
    const receiptToken = randomToken(32);
    const receiptHash = await sha256Hex(receiptToken);
    const encrypted = await encryptCode(code, context, stateHash);
    await rpc("up17_oauth_callback_store", {
      p_bridge_id: bridgeId,
      p_state: state,
      p_state_hash: stateHash,
      p_code_ciphertext: encrypted.ciphertext,
      p_key_id: encrypted.keyId,
      p_receipt_token_hash: receiptHash,
      p_provider_error: null,
    });
    const destination = new URL(`/api/connections/callback/${platform}`, returnOrigin);
    destination.searchParams.set("receipt", receiptToken);
    return redirect(destination.toString(), clear);
  } catch {
    return json({ error: "Callback could not be stored securely." }, 503);
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== "GET") return json({ error: "Method not allowed." }, 405);
  const mode = new URL(request.url).searchParams.get("mode");
  if (mode === "authorize") return await authorize(request);
  if (mode === "callback") return await callback(request);
  if (!mode) return json({ ok: true, service: "up17-oauth-callback" });
  return json({ error: "Unknown bridge mode." }, 400);
});
