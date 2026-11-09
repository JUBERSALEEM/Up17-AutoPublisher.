import "server-only";

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

/** Public browser credentials only. Missing configuration keeps the explicit demo. */
export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url && !publishableKey) return null;
  if (!url || !publishableKey || !publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Supabase configuration is incomplete or uses an unsupported key.");
  }
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/"
  ) {
    throw new Error("Supabase URL must be an HTTPS project origin.");
  }
  return { url: parsed.origin, publishableKey };
}

export function appOrigin(): string {
  const explicit = process.env.UP17_SITE_URL;
  const hosted =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  const value = explicit || (hosted ? `https://${hosted}` : "http://localhost:3000");
  const parsed = new URL(value);
  if (
    !["https:", "http:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("Invalid application origin configuration.");
  }
  if (parsed.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
    throw new Error("Non-local application origins require HTTPS.");
  }
  return parsed.origin;
}
