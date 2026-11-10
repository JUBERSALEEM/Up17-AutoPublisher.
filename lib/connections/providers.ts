import "server-only";
import { z } from "zod";
import type {
  ConnectionPlatform,
  ProviderAvailability,
  ProviderIdentity,
  TokenEnvelope,
} from "./types";

export interface ProviderSecrets {
  clientId: string;
  clientSecret: string;
}

export function providerSecrets(platform: ConnectionPlatform): ProviderSecrets | null {
  const pairs: Record<ConnectionPlatform, [string | undefined, string | undefined]> = {
    youtube: [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET],
    instagram: [process.env.INSTAGRAM_CLIENT_ID, process.env.INSTAGRAM_CLIENT_SECRET],
    tiktok: [process.env.TIKTOK_CLIENT_KEY, process.env.TIKTOK_CLIENT_SECRET],
  };
  const [clientId, clientSecret] = pairs[platform];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/**
 * Minimum foundation scopes only. Publishing scopes are not requested until a
 * separate reviewed milestone; no stored connection is a publishing permission.
 */
export const providerScopes: Record<ConnectionPlatform, string[]> = {
  youtube: ["https://www.googleapis.com/auth/youtube.readonly"],
  instagram: ["instagram_business_basic"],
  tiktok: ["user.info.basic"],
};

export const publishingScopes: Record<ConnectionPlatform, string[]> = {
  youtube: ["https://www.googleapis.com/auth/youtube.upload"],
  instagram: ["instagram_business_content_publish"],
  tiktok: ["video.publish"],
};

/** Instagram Business Login has no PKCE verifier; TikTok uses the documented hex S256 form. */
export const pkceMethods: Record<ConnectionPlatform, "S256_BASE64URL" | "S256_HEX" | null> = {
  youtube: "S256_BASE64URL",
  instagram: null,
  tiktok: "S256_HEX",
};

export function providerAvailability(): ProviderAvailability[] {
  return [
    {
      platform: "youtube",
      label: "YouTube",
      configured: Boolean(providerSecrets("youtube")),
      loginPath: "Google OAuth 2.0 for Web Server",
      scopes: providerScopes.youtube,
      publishingScopes: publishingScopes.youtube,
      reviewNote:
        "Google Cloud project, YouTube Data API v3, OAuth consent screen, exact bridge redirect URI and credential storage are owner-only. Publishing scope is not requested.",
    },
    {
      platform: "instagram",
      label: "Instagram",
      configured: Boolean(providerSecrets("instagram")),
      loginPath: "Business Login for Instagram",
      scopes: providerScopes.instagram,
      publishingScopes: publishingScopes.instagram,
      reviewNote:
        "Meta Business app, Instagram professional account, exact bridge redirect URI, permission access and app review are owner-only. Publishing permission is not requested.",
    },
    {
      platform: "tiktok",
      label: "TikTok",
      configured: Boolean(providerSecrets("tiktok")),
      loginPath: "TikTok Login Kit for Web",
      scopes: providerScopes.tiktok,
      publishingScopes: publishingScopes.tiktok,
      reviewNote:
        "TikTok app, Login Kit, exact bridge redirect URI, account eligibility and review are owner-only. Direct Post audit and video.publish are not part of this foundation.",
    },
  ];
}

export function callbackUrl(origin: string, platform: ConnectionPlatform): string {
  return `${origin}/api/connections/callback/${platform}`;
}

export function authorizationUrl(
  platform: ConnectionPlatform,
  secrets: ProviderSecrets,
  redirectUri: string,
  state: string,
  challenge: string | null,
): string {
  const url = new URL(
    platform === "youtube"
      ? "https://accounts.google.com/o/oauth2/v2/auth"
      : platform === "instagram"
        ? "https://www.instagram.com/oauth/authorize"
        : "https://www.tiktok.com/v2/auth/authorize/",
  );
  url.searchParams.set(platform === "tiktok" ? "client_key" : "client_id", secrets.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", providerScopes[platform].join(platform === "youtube" ? " " : ","));
  url.searchParams.set("state", state);
  if (platform === "youtube") {
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent select_account");
    url.searchParams.set("include_granted_scopes", "true");
  }
  if (challenge) {
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

async function formPost(url: string, form: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(form),
    cache: "no-store",
    redirect: "error",
  });
  const body = await response.text();
  let parsed: unknown = null;
  if (body.trim()) {
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = null;
    }
  }
  if (!response.ok) {
    const code = z
      .object({
        error: z.union([z.string(), z.object({ code: z.string().optional() })]).optional(),
      })
      .safeParse(parsed);
    const detail = code.success ? code.data.error : undefined;
    const label = typeof detail === "string" ? detail : detail?.code;
    throw new Error(`provider_error:${label ?? response.status}`);
  }
  // Google and TikTok revocation endpoints can answer 200 with an empty body.
  if (!body.trim()) return {};
  if (parsed === null) throw new Error(`provider_response_invalid:${response.status}`);
  return parsed;
}

async function getJson(url: string, accessToken: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok) throw new Error(`provider_error:${response.status}`);
  return response.json();
}

const googleToken = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
});
const instagramShort = z.object({
  access_token: z.string().min(1),
  user_id: z.union([z.string(), z.number()]).optional(),
  permissions: z.string().optional(),
});
const instagramLong = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().optional(),
});
const tiktokToken = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().optional(),
  open_id: z.string().optional(),
  refresh_token: z.string().optional(),
  refresh_expires_in: z.number().optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
});

function expiry(seconds: number | undefined): string | null {
  return typeof seconds === "number" && Number.isFinite(seconds)
    ? new Date(Date.now() + seconds * 1000).toISOString()
    : null;
}

export async function exchangeCode(
  platform: ConnectionPlatform,
  secrets: ProviderSecrets,
  code: string,
  redirectUri: string,
  verifier: string | null,
): Promise<TokenEnvelope> {
  if (platform === "youtube") {
    const form: Record<string, string> = {
      code,
      client_id: secrets.clientId,
      client_secret: secrets.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    };
    if (verifier) form.code_verifier = verifier;
    const token = googleToken.parse(await formPost("https://oauth2.googleapis.com/token", form));
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      expiresAt: expiry(token.expires_in),
      refreshExpiresAt: null,
      scopes: token.scope ? token.scope.split(" ").filter(Boolean) : providerScopes.youtube,
    };
  }
  if (platform === "instagram") {
    const shortRaw = await formPost("https://api.instagram.com/oauth/access_token", {
      client_id: secrets.clientId,
      client_secret: secrets.clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });
    const short = instagramShort.parse(
      typeof shortRaw === "object" && shortRaw !== null && "data" in shortRaw
        ? (shortRaw as { data: unknown[] }).data[0]
        : shortRaw,
    );
    const longUrl = new URL("https://graph.instagram.com/access_token");
    longUrl.searchParams.set("grant_type", "ig_exchange_token");
    longUrl.searchParams.set("client_secret", secrets.clientSecret);
    longUrl.searchParams.set("access_token", short.access_token);
    const long = instagramLong.parse(await getJson(longUrl.toString(), short.access_token));
    return {
      accessToken: long.access_token,
      refreshToken: null,
      expiresAt: expiry(long.expires_in),
      refreshExpiresAt: null,
      scopes: short.permissions
        ? short.permissions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : providerScopes.instagram,
    };
  }
  const form: Record<string, string> = {
    client_key: secrets.clientId,
    client_secret: secrets.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  };
  if (verifier) form.code_verifier = verifier;
  const token = tiktokToken.parse(
    await formPost("https://open.tiktokapis.com/v2/oauth/token/", form),
  );
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    expiresAt: expiry(token.expires_in),
    refreshExpiresAt: expiry(token.refresh_expires_in),
    scopes: token.scope ? token.scope.split(/[,\s]+/).filter(Boolean) : providerScopes.tiktok,
  };
}

export async function fetchIdentity(
  platform: ConnectionPlatform,
  accessToken: string,
): Promise<ProviderIdentity> {
  if (platform === "youtube") {
    const data = z
      .object({
        items: z
          .array(
            z.object({
              id: z.string(),
              snippet: z.object({
                title: z.string(),
                customUrl: z.string().optional(),
                thumbnails: z
                  .object({ default: z.object({ url: z.string() }).optional() })
                  .optional(),
              }),
            }),
          )
          .optional(),
      })
      .parse(
        await getJson(
          "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
          accessToken,
        ),
      );
    const channel = data.items?.[0];
    if (!channel) throw new Error("youtube_channel_missing");
    return {
      providerAccountId: channel.id,
      displayName: channel.snippet.title,
      handle: channel.snippet.customUrl ?? null,
      avatarUrl: channel.snippet.thumbnails?.default?.url ?? null,
      accountType: "channel",
    };
  }
  if (platform === "instagram") {
    const data = z
      .object({
        user_id: z.union([z.string(), z.number()]).optional(),
        id: z.string().optional(),
        username: z.string().optional(),
        account_type: z.string().optional(),
      })
      .parse(
        await getJson(
          "https://graph.instagram.com/me?fields=user_id,username,account_type",
          accessToken,
        ),
      );
    const id = data.user_id ?? data.id;
    if (!id) throw new Error("instagram_identity_missing");
    return {
      providerAccountId: String(id),
      displayName: data.username ?? String(id),
      handle: data.username ? `@${data.username}` : null,
      avatarUrl: null,
      accountType: data.account_type ?? null,
    };
  }
  const data = z
    .object({
      data: z.object({
        user: z.object({
          open_id: z.string(),
          display_name: z.string().optional(),
          avatar_url: z.string().optional(),
          union_id: z.string().optional(),
        }),
      }),
    })
    .parse(
      await getJson(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
        accessToken,
      ),
    );
  return {
    providerAccountId: data.data.user.open_id,
    displayName: data.data.user.display_name ?? data.data.user.open_id,
    handle: null,
    avatarUrl: data.data.user.avatar_url ?? null,
    accountType: "creator",
  };
}

export async function refreshTokens(
  platform: ConnectionPlatform,
  secrets: ProviderSecrets,
  current: { accessToken: string; refreshToken: string | null },
): Promise<TokenEnvelope> {
  if (platform === "youtube") {
    if (!current.refreshToken) throw new Error("refresh_token_missing");
    const token = googleToken.parse(
      await formPost("https://oauth2.googleapis.com/token", {
        client_id: secrets.clientId,
        client_secret: secrets.clientSecret,
        refresh_token: current.refreshToken,
        grant_type: "refresh_token",
      }),
    );
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? current.refreshToken,
      expiresAt: expiry(token.expires_in),
      refreshExpiresAt: null,
      scopes: token.scope ? token.scope.split(" ").filter(Boolean) : providerScopes.youtube,
    };
  }
  if (platform === "instagram") {
    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", current.accessToken);
    const long = instagramLong.parse(await getJson(url.toString(), current.accessToken));
    return {
      accessToken: long.access_token,
      refreshToken: null,
      expiresAt: expiry(long.expires_in),
      refreshExpiresAt: null,
      scopes: providerScopes.instagram,
    };
  }
  if (!current.refreshToken) throw new Error("refresh_token_missing");
  const token = tiktokToken.parse(
    await formPost("https://open.tiktokapis.com/v2/oauth/token/", {
      client_key: secrets.clientId,
      client_secret: secrets.clientSecret,
      grant_type: "refresh_token",
      refresh_token: current.refreshToken,
    }),
  );
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? current.refreshToken,
    expiresAt: expiry(token.expires_in),
    refreshExpiresAt: expiry(token.refresh_expires_in),
    scopes: token.scope ? token.scope.split(/[,\s]+/).filter(Boolean) : providerScopes.tiktok,
  };
}

export async function revokeProviderToken(
  platform: ConnectionPlatform,
  secrets: ProviderSecrets,
  token: string,
): Promise<{ revoked: boolean; code: string | null }> {
  try {
    if (platform === "youtube") {
      await formPost("https://oauth2.googleapis.com/revoke", { token });
      return { revoked: true, code: null };
    }
    if (platform === "tiktok") {
      await formPost("https://open.tiktokapis.com/v2/oauth/revoke/", {
        client_key: secrets.clientId,
        client_secret: secrets.clientSecret,
        token,
      });
      return { revoked: true, code: null };
    }
    return { revoked: false, code: "instagram_remote_revoke_unsupported" };
  } catch (error) {
    return {
      revoked: false,
      code: error instanceof Error ? error.message.slice(0, 120) : "remote_revoke_failed",
    };
  }
}

/** Reject any extra permission, especially a publishing scope, before storing a token. */
export function foundationScopesOnly(platform: ConnectionPlatform, granted: string[]): boolean {
  const expected = [...providerScopes[platform]].sort();
  const actual = [...new Set(granted.map((scope) => scope.trim()).filter(Boolean))].sort();
  return (
    actual.length === expected.length && actual.every((scope, index) => scope === expected[index])
  );
}

export function connectionStateForScopes(
  platform: ConnectionPlatform,
  granted: string[],
): "connected" | "limited_permissions" {
  const required = providerScopes[platform];
  return required.every((scope) => granted.includes(scope)) ? "connected" : "limited_permissions";
}
