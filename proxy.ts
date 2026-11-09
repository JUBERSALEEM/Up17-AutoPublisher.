import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import { AUTH_COOKIE } from "@/lib/supabase/constants";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  // Session-bearing HTML must never become a shared cached response.
  response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  const config = getSupabaseConfig();
  if (!config) return response;
  const client = createServerClient<Database>(config.url, config.publishableKey, {
    cookieOptions: {
      name: AUTH_COOKIE,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      httpOnly: true,
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  try {
    await client.auth.getClaims();
  } catch {
    /* Protected server reads still verify the user; never log cookies/tokens. */
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icons/|sw.js|manifest.webmanifest|offline.html|favicon.ico).*)",
  ],
};
