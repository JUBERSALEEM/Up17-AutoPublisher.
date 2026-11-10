import type { ConnectionPlatform } from "./types";

/**
 * Owner-only external review requirements. These are documentation and UI
 * instructions, never proof of configuration. Credentials belong only in the
 * deployment secret manager; exact redirect URIs are rendered from server state.
 */
export interface ProviderRequirement {
  dashboardUrl: string;
  navigation: readonly string[];
  fields: readonly string[];
  expectedResult: string;
  restrictions: readonly string[];
  publishingScopes: readonly string[];
  documentationUrl: string;
}

export const providerRequirements: Record<ConnectionPlatform, ProviderRequirement> = {
  youtube: {
    dashboardUrl: "https://console.cloud.google.com/apis/credentials",
    navigation: [
      "Google Cloud Console → select the connected project → APIs & Services → Library → enable YouTube Data API v3",
      "APIs & Services → OAuth consent screen → Audience / Branding / Data Access",
      "APIs & Services → Credentials → Create credentials → OAuth client ID → Web application",
      "Vercel → Project Settings → Environment Variables → add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET",
    ],
    fields: [
      "OAuth client type: Web application",
      "Authorized redirect URI: the exact YouTube bridge callback shown on this card",
      "OAuth consent-screen audience, app name, support email and developer contact",
      "Data Access: only the read-only foundation scope youtube.readonly",
    ],
    expectedResult:
      "A published or testable Google OAuth consent screen, an enabled YouTube Data API v3 project, a Web OAuth client with the exact redirect URI, and both credentials stored in Vercel Preview. A real owner authorization must then succeed through the bridge.",
    restrictions: [
      "Publishing is not requested in this milestone; youtube.upload is excluded.",
      "External/test users, consent-screen publishing status and scope verification are owner dashboard decisions that the app cannot inspect.",
      "No real Google/YouTube connection is claimed from credentials, code, health checks or synthetic tests alone.",
    ],
    publishingScopes: ["https://www.googleapis.com/auth/youtube.upload"],
    documentationUrl:
      "https://developers.google.com/youtube/v3/live/guides/auth/server-side-web-apps",
  },
  instagram: {
    dashboardUrl: "https://developers.facebook.com/apps/",
    navigation: [
      "Meta for Developers → My Apps → create/select a Business app → Add products → Instagram API with Instagram Login",
      "App settings → Basic → copy App ID and App Secret into Vercel as INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET",
      "Instagram Business Login → configure OAuth redirect URIs and permissions",
      "App Review → Permissions and Features → request and verify the required access level",
    ],
    fields: [
      "Instagram API with Instagram Login (Business Login for Instagram)",
      "Valid OAuth Redirect URI: the exact Instagram bridge callback shown on this card",
      "Foundation permission: instagram_business_basic",
      "Client ID / App ID and client secret / App Secret in Vercel Preview",
    ],
    expectedResult:
      "A Meta Business app with Instagram Login, a professional Instagram account eligible for the API, the exact redirect URI registered, foundation permission accessible to the owner/test user, both credentials stored in Vercel, and one real authorization that returns through the bridge.",
    restrictions: [
      "Publishing is not requested in this milestone; instagram_business_content_publish is excluded.",
      "Advanced Access, Page Publishing Authorization where required, and app review are owner-only external gates.",
      "Standard Access and test roles may limit authorization to app admins/developers/testers.",
      "No ready, connected or public-publishing claim is made before verified permissions and approval.",
    ],
    publishingScopes: ["instagram_business_content_publish"],
    documentationUrl:
      "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/",
  },
  tiktok: {
    dashboardUrl: "https://developers.tiktok.com/apps",
    navigation: [
      "TikTok Developer Portal → Manage apps → create/select app → Login Kit → configure Web login",
      "Add the exact redirect URI shown on this card and request the foundation user.info.basic scope",
      "Content Posting API → add/verify Direct Post and its video.publish requirement for a later publishing milestone",
      "App details → copy Client key and Client secret into Vercel as TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET",
    ],
    fields: [
      "Login Kit for Web with an eligible TikTok creator account",
      "Redirect URI: the exact TikTok bridge callback shown on this card",
      "Foundation scope: user.info.basic",
      "Client key and client secret in Vercel Preview",
    ],
    expectedResult:
      "An approved TikTok app with Login Kit, the exact redirect URI, accessible foundation scope, both credentials in Vercel, and one real authorization that returns through the bridge. A later publishing milestone additionally requires approved video.publish and a Content Posting API audit.",
    restrictions: [
      "Publishing is not requested in this milestone; video.publish is excluded.",
      "Unaudited Content Posting API clients are restricted to private viewing; public publishing needs a TikTok audit and explicit owner consent.",
      "Account eligibility, privacy-level options and app-review approval are owner-only external gates.",
      "No ready, connected or public-publishing claim is made before verified permissions and approval.",
    ],
    publishingScopes: ["video.publish"],
    documentationUrl:
      "https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post",
  },
};
