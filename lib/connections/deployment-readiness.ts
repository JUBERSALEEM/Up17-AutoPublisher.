import "server-only";
import { getViewer } from "@/lib/auth/session";
import { getWorkspaceContext, type WorkspaceContext } from "@/lib/auth/workspace";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { custodyConfigured } from "./crypto";
import { providerAvailability, providerSecrets } from "./providers";
import {
  buildProviderCards,
  type DeploymentReadiness,
  type ProviderCard,
  type SetupCheck,
} from "./readiness";
import {
  connectionPlatforms,
  type ConnectionPlatform,
  type ProviderAvailability,
  type RealConnection,
} from "./types";

export interface AccountsState {
  readiness: DeploymentReadiness;
  providers: ProviderAvailability[];
  cards: ProviderCard[];
  connections: RealConnection[];
  canManage: boolean;
}

const BRANCH_ORIGIN_NOTE =
  "Use the exact deployment HTTPS origin with no path, query or fragment. Register the exact callback paths below in each provider console.";

function publicSupabaseConfigured(): boolean {
  try {
    return Boolean(getSupabaseConfig());
  } catch {
    return false;
  }
}

function exactSiteUrlConfigured(): boolean {
  const raw = process.env.UP17_SITE_URL;
  if (!raw) return false;
  try {
    const url = new URL(raw);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    return (
      (url.protocol === "https:" || (url.protocol === "http:" && local)) &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function serverKeyConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  return Boolean(key && !key.startsWith("sb_publishable_"));
}

function keyringConfigured(): boolean {
  try {
    return custodyConfigured();
  } catch {
    return false;
  }
}

function providerCredentialFlags(): Record<ConnectionPlatform, boolean> {
  return Object.fromEntries(
    connectionPlatforms.map((platform) => [platform, Boolean(providerSecrets(platform))]),
  ) as Record<ConnectionPlatform, boolean>;
}

function callbackPaths(): Record<ConnectionPlatform, string> {
  return Object.fromEntries(
    connectionPlatforms.map((platform) => [platform, `/api/connections/callback/${platform}`]),
  ) as Record<ConnectionPlatform, string>;
}

function setupChecks(flags: Record<ConnectionPlatform, boolean>): SetupCheck[] {
  const paths = callbackPaths();
  return [
    {
      id: "public-supabase",
      names: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
      location: "Vercel → Project Settings → Environment Variables → Preview/Production",
      configured: publicSupabaseConfigured(),
      ownerAction:
        "Set both to the Supabase project's public URL and publishable key. A service/secret key must never use NEXT_PUBLIC_.",
    },
    {
      id: "site-url",
      names: ["UP17_SITE_URL"],
      location: "Vercel → Project Settings → Environment Variables → Preview/Production",
      configured: exactSiteUrlConfigured(),
      ownerAction: BRANCH_ORIGIN_NOTE,
    },
    {
      id: "server-key",
      names: ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"],
      location: "Vercel → Project Settings → Environment Variables → Sensitive",
      configured: serverKeyConfigured(),
      ownerAction:
        "Store one server-only Supabase service/secret key. The broker rejects a publishable key and never sends this value to the browser.",
    },
    {
      id: "keyring",
      names: ["UP17_TOKEN_ACTIVE_KEY_ID", "UP17_TOKEN_KEYS"],
      location: "Vercel → Project Settings → Environment Variables → Sensitive",
      configured: keyringConfigured(),
      ownerAction:
        "Generate base64 32-byte keys outside Git. Keep old key ids until every encrypted credential has been refreshed or disconnected.",
    },
    {
      id: "cron-secret",
      names: ["CRON_SECRET"],
      location: "Vercel → Project Settings → Environment Variables → Sensitive",
      configured: false,
      ownerVerification: true,
      ownerAction:
        "Generate a long random value for the daily production cron. Preview deployments do not run cron; redeploy after changing the variable.",
    },
    {
      id: "email-smtp",
      names: ["Supabase custom SMTP"],
      location: "Supabase → Authentication → Sign In / Providers → Email / SMTP Settings",
      configured: false,
      ownerVerification: true,
      ownerAction:
        "Configure custom SMTP and send a real signup-confirmation and password-recovery email. The app cannot read SMTP credentials or claim delivery success.",
    },
    {
      id: "auth-redirects",
      names: ["Supabase Site URL", "Supabase Redirect URLs"],
      location: "Supabase → Authentication → URL Configuration",
      configured: false,
      ownerVerification: true,
      ownerAction:
        "Set Site URL to the exact deployment origin and allow /auth/callback, /auth/confirm and /auth/update-password with their reviewed query forms. Redeploy after Vercel env changes.",
    },
    {
      id: "youtube-credentials",
      names: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      location: "Google Cloud Console → APIs & Services → Credentials; Vercel Sensitive/plain env",
      configured: flags.youtube,
      platforms: ["youtube"],
      ownerAction: `Create a Web application OAuth client and register ${paths.youtube} as the exact Authorized redirect URI.`,
    },
    {
      id: "instagram-credentials",
      names: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
      location: "Meta for Developers → your app → Instagram Business Login; Vercel env",
      configured: flags.instagram,
      platforms: ["instagram"],
      ownerAction: `Register ${paths.instagram} as the exact Business Login redirect URI.`,
    },
    {
      id: "tiktok-credentials",
      names: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
      location: "TikTok Developer Portal → your app → Login Kit; Vercel env",
      configured: flags.tiktok,
      platforms: ["tiktok"],
      ownerAction: `Register ${paths.tiktok} as the exact Login Kit redirect URI.`,
    },
    {
      id: "youtube-review",
      names: ["Google OAuth consent screen", "YouTube API scope verification"],
      location: "Google Cloud Console → APIs & Services → OAuth consent screen",
      configured: false,
      ownerVerification: true,
      platforms: ["youtube"],
      ownerAction:
        "Verify the consent screen, test users, YouTube Data API v3 and applicable upload-scope verification before external accounts can authorize.",
    },
    {
      id: "instagram-review",
      names: ["Meta app review", "Instagram professional account", "Advanced Access"],
      location: "Meta for Developers → App Review / Instagram Business Login",
      configured: false,
      ownerVerification: true,
      platforms: ["instagram"],
      ownerAction:
        "Use a professional account and complete Advanced Access/app review before public use; refresh long-lived tokens only after 24 hours.",
    },
    {
      id: "tiktok-review",
      names: ["TikTok Direct Post audit", "video.publish approval"],
      location: "TikTok Developer Portal → your app → Content Posting API / Audit",
      configured: false,
      ownerVerification: true,
      platforms: ["tiktok"],
      ownerAction:
        "Complete Login Kit and Direct Post audit gates. Unaudited clients remain private/self-test only; a connection token is not publishing approval.",
    },
  ];
}

function mapConnections(
  rows: Array<{
    id: string;
    platform: string;
    provider_account_id: string | null;
    display_name: string;
    state: string;
    granted_scopes: string[] | null;
    last_verified_at: string | null;
    last_error_code: string | null;
    social_accounts: unknown;
  }>,
): RealConnection[] {
  return rows.map((row) => {
    const account = Array.isArray(row.social_accounts)
      ? (row.social_accounts[0] as
          { handle: string | null; paused: boolean; publishing_enabled: boolean } | undefined)
      : (row.social_accounts as
          | { handle: string | null; paused: boolean; publishing_enabled: boolean }
          | null
          | undefined);
    return {
      id: row.id,
      platform: row.platform as RealConnection["platform"],
      providerAccountId: row.provider_account_id,
      displayName: row.display_name,
      state: row.state as RealConnection["state"],
      grantedScopes: row.granted_scopes ?? [],
      lastVerifiedAt: row.last_verified_at,
      lastErrorCode: row.last_error_code,
      handle: account?.handle ?? null,
      paused: account?.paused ?? true,
      publishingEnabled: account?.publishing_enabled ?? false,
    };
  });
}

async function safeViewer(): Promise<boolean> {
  try {
    return Boolean(await getViewer());
  } catch {
    return false;
  }
}

async function safeWorkspace(): Promise<WorkspaceContext | null> {
  try {
    return await getWorkspaceContext();
  } catch {
    return null;
  }
}

export async function getAccountsState(): Promise<AccountsState> {
  const demoMode = (process.env.UP17_APP_MODE ?? "DEMO") === "DEMO";
  const authenticated = await safeViewer();
  const workspace = await safeWorkspace();
  const providers = providerAvailability();
  const providerCredentials = providerCredentialFlags();
  const paths = callbackPaths();
  const canManage = workspace?.role === "owner" || workspace?.role === "admin";
  let connections: RealConnection[] = [];
  let connectionReadError = false;
  if (workspace) {
    try {
      const client = await createSupabaseServerClient();
      if (!client) {
        connectionReadError = true;
      } else {
        const { data, error } = await client
          .from("platform_connections")
          .select(
            "id,platform,provider_account_id,display_name,state,granted_scopes,last_verified_at,last_error_code,social_accounts(handle,paused,publishing_enabled)",
          )
          .eq("workspace_id", workspace.workspaceId)
          .order("created_at", { ascending: false });
        if (error) connectionReadError = true;
        else connections = mapConnections(data ?? []);
      }
    } catch {
      connectionReadError = true;
    }
  }
  const readiness: DeploymentReadiness = {
    demoMode,
    authenticated,
    workspaceReady: Boolean(workspace),
    canManage,
    publicSupabaseConfigured: publicSupabaseConfigured(),
    exactSiteUrlConfigured: exactSiteUrlConfigured(),
    serverKeyConfigured: serverKeyConfigured(),
    keyringConfigured: keyringConfigured(),
    connectionReadError,
    providerCredentials,
    callbackPaths: paths,
    checks: setupChecks(providerCredentials),
  };
  return {
    readiness,
    providers,
    cards: buildProviderCards(readiness, providers, connections),
    connections,
    canManage,
  };
}
