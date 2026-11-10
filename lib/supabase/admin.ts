import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

/** Privileged broker client. Never import from a Client Component or expose its key. */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!config || !key) return null;
  if (key.startsWith("sb_publishable_"))
    throw new Error("A publishable key cannot be used by the token broker.");
  return createClient(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "X-Client-Info": "up17-token-broker" } },
  });
}

export function requireSupabaseAdminClient(): SupabaseClient {
  const client = createSupabaseAdminClient();
  if (!client) throw new Error("The server-side connection broker is not configured.");
  return client;
}
