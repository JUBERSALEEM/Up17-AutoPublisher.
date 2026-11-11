import "server-only";
import { getAccountSession, getViewer, type AccountSession } from "@/lib/auth/session";
import { getWorkspaceContext, type WorkspaceContext } from "@/lib/auth/workspace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { callbackBridgeOrigin, callbackBridgeUrl } from "./bridge";
import { custodyConfigured } from "./crypto";
import { providerRequirements } from "./provider-requirements";
import { providerAvailability, providerSecrets } from "./providers";
import { isSafeDemoMode } from "@/lib/app-mode";
import {
  applyDeploymentEvidence,
  buildProviderCards,
  type DeploymentEvidenceRow,
  type DeploymentReadiness,
  type ProviderCard,
  type SetupCheck,
  type SetupStatus,
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
  "Use the exact deployment HTTPS origin with no path, query or fragment. Provider redirect URIs are the public callback bridge URLs below, not protected app paths.";

function publicSupabaseConfigured(): boolean {
  try {
    return Boolean(getSupabaseConfig());
  } catch {
    return false;
  }
}

/** Only a trusted Vercel deployment origin counts; request headers are never trusted. */
function exactSiteUrlConfigured(): boolean {
  const raw = process.env.UP17_SITE_URL;
  if (!raw) return false;
  try {
    const url = new URL(raw);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (
      !(url.protocol === "https:" || (url.protocol === "http:" && local)) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return false;
    const production = process.env.VERCEL_ENV === "production";
    const expectedHosts = production
      ? [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]
      : [process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL];
    if (expectedHosts.some(Boolean)) {
      return expectedHosts.filter(Boolean).some((host) => url.host === host);
    }
    return local;
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

function externalCallbackUrls(): Record<ConnectionPlatform, string | null> {
  const origin = callbackBridgeOrigin();
  return Object.fromEntries(
    connectionPlatforms.map((platform) => [platform, origin ? callbackBridgeUrl(platform) : null]),
  ) as Record<ConnectionPlatform, string | null>;
}

function status(present: boolean, fallback: SetupStatus = "MISSING"): SetupStatus {
  return present ? "CONFIGURED" : fallback;
}

function check(input: {
  id: string;
  names: readonly string[];
  location: string;
  state: SetupStatus;
  evidence: string;
  ownerAction: string;
  platforms?: readonly ConnectionPlatform[];
}): SetupCheck {
  return {
    id: input.id,
    names: input.names,
    location: input.location,
    status: input.state,
    configured: ["CONFIGURED", "VERIFIED", "NOT APPLICABLE"].includes(input.state),
    ownerVerification: input.state === "OWNER ACTION REQUIRED",
    evidence: input.evidence,
    ownerAction: input.ownerAction,
    platforms: input.platforms,
  };
}

function setupChecks(flags: Record<ConnectionPlatform, boolean>, siteUrlOk: boolean): SetupCheck[] {
  const urls = externalCallbackUrls();
  const production = process.env.VERCEL_ENV === "production";
  const cronPresent = Boolean(process.env.CRON_SECRET);
  return [
    check({
      id: "public-supabase",
      names: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
      location: "Vercel → Project Settings → Environment Variables → Preview/Production",
      state: status(publicSupabaseConfigured()),
      evidence: publicSupabaseConfigured()
        ? "public_config_present_no_session_test"
        : "public_config_absent",
      ownerAction:
        "Set both to the Supabase project's public URL and publishable key. A privileged key must never use NEXT_PUBLIC_.",
    }),
    check({
      id: "site-url",
      names: ["UP17_SITE_URL"],
      location: "Vercel → Project Settings → Environment Variables → Preview/Production",
      state: status(siteUrlOk),
      evidence: siteUrlOk
        ? "site_url_matches_deployment_origin_no_email_redirect_test"
        : "site_url_missing_or_mismatched",
      ownerAction: BRANCH_ORIGIN_NOTE,
    }),
    check({
      id: "server-key",
      names: ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"],
      location: "Vercel → Project Settings → Environment Variables → Sensitive",
      state: status(serverKeyConfigured()),
      evidence: serverKeyConfigured()
        ? "server_key_present_no_runtime_service_test"
        : "server_key_absent",
      ownerAction:
        "Store one server-only Supabase privileged key. The broker rejects a publishable key and never sends this value to the browser.",
    }),
    check({
      id: "keyring",
      names: ["UP17_TOKEN_ACTIVE_KEY_ID", "UP17_TOKEN_KEYS"],
      location: "Vercel → Project Settings → Environment Variables → Sensitive",
      state: status(keyringConfigured()),
      evidence: keyringConfigured()
        ? "keyring_format_valid_no_stored_token_round_trip"
        : "keyring_absent_or_invalid",
      ownerAction:
        "Generate base64 32-byte keys outside Git. Keep old key ids until every encrypted credential has been refreshed or disconnected.",
    }),
    check({
      id: "callback-bridge",
      names: ["UP17_OAUTH_CALLBACK_BASE_URL", "Supabase Edge Function"],
      location: "Supabase → Edge Functions → up17-oauth-callback",
      state: callbackBridgeOrigin() ? "CONFIGURED" : "MISSING",
      evidence: callbackBridgeOrigin()
        ? "bridge_origin_matches_public_supabase_project"
        : "bridge_origin_missing_or_mismatched",
      ownerAction:
        "Keep the main app protected. The public bridge validates state, browser binding, provider origin and one-time receipts before returning to the app.",
    }),
    check({
      id: "oauth-state-replay",
      names: ["OAuth state", "PKCE", "browser binding", "one-time receipt"],
      location: "Supabase → private bridge RPCs; Vercel → protected callback route",
      state: "CONFIGURED",
      evidence: "state_pkce_binding_and_receipt_guards_implemented",
      ownerAction:
        "A real provider authorization is required to verify the complete external callback, token exchange and secure persistence flow.",
    }),
    check({
      id: "cron-secret",
      names: ["CRON_SECRET"],
      location: "Vercel → Project Settings → Environment Variables → Sensitive",
      state: production ? status(cronPresent) : "NOT APPLICABLE",
      evidence: production
        ? cronPresent
          ? "production_cron_secret_present_no_execution_test"
          : "production_cron_secret_absent"
        : "vercel_hobby_cron_is_production_only_preview_not_applicable",
      ownerAction:
        "Production cron requires a long random bearer secret and a successful scheduled execution record. Preview deployments do not run cron.",
    }),
    check({
      id: "otp-template",
      names: ["Confirm signup email template", "Email OTP length"],
      location:
        "Supabase → Authentication → Email Templates → Confirm signup; Authentication → Sign In / Providers → Email; or Management API PATCH /v1/projects/{ref}/config/auth",
      state: "OWNER ACTION REQUIRED",
      evidence:
        "hosted_connector_inspected_link_template_otp_length_8_smtp_null_no_template_setter",
      ownerAction:
        "Replace the Confirm signup template's {{ .ConfirmationURL }} link with a numeric {{ .Token }} code only, set mailer_otp_length to 6, keep mailer_otp_exp and autoconfirm false, then send a real signup OTP. The connector cannot set these fields or Custom SMTP.",
    }),
    check({
      id: "email-smtp",
      names: ["Supabase custom SMTP", "email delivery"],
      location: "Supabase → Authentication → Sign In / Providers → Email / SMTP Settings",
      state: "OWNER ACTION REQUIRED",
      evidence: "smtp_settings_not_exposed_by_connector_no_delivery_test",
      ownerAction:
        "Configure custom SMTP directly in Supabase and send a real numeric signup OTP and password-recovery email. The connector cannot set SMTP host/user/password.",
    }),
    check({
      id: "auth-redirects",
      names: ["Supabase Site URL", "Supabase Redirect URLs"],
      location: "Supabase → Authentication → URL Configuration",
      state: "CONFIGURED",
      evidence: "hosted_auth_config_inspected_no_email_delivery_test",
      ownerAction:
        "The exact Site URL and reviewed redirect allowlist are configured. Verify a real OTP email and session before treating them as VERIFIED.",
    }),
    check({
      id: "storage-rls",
      names: ["creator-media bucket", "scoped storage policies"],
      location: "Supabase → Storage → creator-media; SQL → policies",
      state: "CONFIGURED",
      evidence: "private_bucket_rls_and_scoped_policies_inspected_no_upload_test",
      ownerAction:
        "A real authenticated workspace upload and cross-workspace denial test are required before storage access can be VERIFIED.",
    }),
    check({
      id: "migration-parity",
      names: ["Supabase migrations"],
      location: "Supabase → SQL → schema_migrations; Git → supabase/migrations",
      state: "CONFIGURED",
      evidence: "eleven_hosted_migrations_and_local_files_inspected",
      ownerAction:
        "Keep local and hosted migration names and canonical SQL parity. Never reapply a confirmed migration.",
    }),
    ...connectionPlatforms.flatMap((platform) => {
      const requirement = providerRequirements[platform];
      const redirect = urls[platform] ?? "the exact public bridge callback";
      return [
        check({
          id: `${platform}-credentials`,
          names:
            platform === "youtube"
              ? ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]
              : platform === "instagram"
                ? ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"]
                : ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
          location: `${requirement.dashboardUrl}; Vercel → Project Settings → Environment Variables`,
          state: flags[platform] ? "CONFIGURED" : "BLOCKED",
          evidence: flags[platform]
            ? `${platform}_credentials_present_no_account_authorization`
            : `${platform}_credentials_absent_external_account_access_required`,
          ownerAction: `Copy the provider app's client ID/key and secret into Vercel Preview only. Register ${redirect} as the exact redirect URI. Never paste values into chat.`,
          platforms: [platform],
        }),
        check({
          id: `${platform}-redirect`,
          names: ["Exact provider redirect URI", "OAuth client registration"],
          location: `${requirement.dashboardUrl}; ${requirement.navigation[requirement.navigation.length - 2] ?? ""}`,
          state: "OWNER ACTION REQUIRED",
          evidence: `${platform}_redirect_uri_registration_not_inspectable_by_connector`,
          ownerAction: `Register exactly ${redirect} as the authorized redirect URI. Expected result: the provider accepts the URL without normalization and returns to the public bridge.`,
          platforms: [platform],
        }),
        check({
          id: `${platform}-review`,
          names: ["Provider app setup", "consent / permissions", "app review"],
          location: requirement.navigation.join(" → "),
          state: "OWNER ACTION REQUIRED",
          evidence: `${platform}_external_review_not_inspectable_by_connector`,
          ownerAction: `${requirement.expectedResult} Official documentation: ${requirement.documentationUrl}.`,
          platforms: [platform],
        }),
        check({
          id: `${platform}-account`,
          names: ["Eligible owner account", "test user / access restrictions"],
          location: requirement.dashboardUrl,
          state: "OWNER ACTION REQUIRED",
          evidence: `${platform}_account_eligibility_not_inspectable_by_connector`,
          ownerAction: `${requirement.restrictions.join(" ")} Perform one real authorization and verify the returned identity, encrypted persistence and workspace isolation.`,
          platforms: [platform],
        }),
      ];
    }),
  ];
}

/**
 * External provider configuration is READY only when every owner-only check is
 * an explicitly timestamped VERIFIED record (or explicitly NOT APPLICABLE).
 * Credential presence alone never makes a provider Ready.
 */
function providerConfigurationVerified(checks: SetupCheck[]): Record<ConnectionPlatform, boolean> {
  return Object.fromEntries(
    connectionPlatforms.map((platform) => {
      const requiredIds = [`${platform}-redirect`, `${platform}-review`, `${platform}-account`];
      const required = checks.filter((item) => requiredIds.includes(item.id));
      return [
        platform,
        required.length === requiredIds.length &&
          required.every((item) => ["VERIFIED", "NOT APPLICABLE"].includes(item.status)),
      ];
    }),
  ) as Record<ConnectionPlatform, boolean>;
}

/** Server-side OAuth start gate: owner-only external checks must be VERIFIED. */
export async function providerConfigurationReady(platform: ConnectionPlatform): Promise<boolean> {
  try {
    const evidence = await loadEvidence();
    const checks = applyDeploymentEvidence(
      setupChecks(providerCredentialFlags(), exactSiteUrlConfigured()),
      evidence,
    );
    return providerConfigurationVerified(checks)[platform];
  } catch {
    return false;
  }
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

async function loadEvidence(): Promise<DeploymentEvidenceRow[]> {
  try {
    const client = createSupabaseAdminClient();
    if (!client) return [];
    const { data, error } = await client
      .from("deployment_evidence")
      .select("key,state,evidence,verified_at");
    if (error) return [];
    return (data ?? []).filter(
      (row): row is DeploymentEvidenceRow =>
        typeof row.key === "string" &&
        typeof row.state === "string" &&
        typeof row.evidence === "string" &&
        (typeof row.verified_at === "string" || row.verified_at === null),
    );
  } catch {
    return [];
  }
}

async function safeSession(): Promise<AccountSession | null> {
  try {
    return await getAccountSession();
  } catch {
    return null;
  }
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
  const demoMode = isSafeDemoMode();
  const session = await safeSession();
  const emailConfirmed = await safeViewer();
  const workspace = await safeWorkspace();
  const providers = providerAvailability();
  const providerCredentials = providerCredentialFlags();
  const paths = callbackPaths();
  const urls = externalCallbackUrls();
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
  const evidence = await loadEvidence();
  const checks = applyDeploymentEvidence(
    setupChecks(providerCredentials, exactSiteUrlConfigured()),
    evidence,
  );
  const readiness: DeploymentReadiness = {
    demoMode,
    authenticated: Boolean(session),
    emailConfirmed,
    workspaceReady: Boolean(workspace),
    canManage,
    role: workspace?.role ?? null,
    publicSupabaseConfigured: publicSupabaseConfigured(),
    exactSiteUrlConfigured: exactSiteUrlConfigured(),
    serverKeyConfigured: serverKeyConfigured(),
    keyringConfigured: keyringConfigured(),
    connectionReadError,
    providerCredentials,
    providerConfigurationVerified: providerConfigurationVerified(checks),
    callbackPaths: paths,
    externalCallbackUrls: urls,
    bridgeOrigin: callbackBridgeOrigin(),
    checks,
  };
  return {
    readiness,
    providers,
    cards: buildProviderCards(readiness, providers, connections),
    connections,
    canManage,
  };
}
