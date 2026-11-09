import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

import { AUTH_COOKIE } from "./constants";
export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(config.url, config.publishableKey, {
    cookieOptions: {
      name: AUTH_COOKIE,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      httpOnly: true,
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* Server Components cannot set cookies; proxy refreshes before rendering. */
        }
      },
    },
  });
}
