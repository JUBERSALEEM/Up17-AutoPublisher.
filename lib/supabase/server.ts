import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import { authDiagnosticReference, recordAuthDiagnostic } from "@/lib/auth/diagnostics";
import type { Database } from "./database.types";

import { AUTH_COOKIE } from "./constants";
export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) {
    recordAuthDiagnostic({
      stage: "supabase-client",
      action: "createSupabaseServerClient",
      outcome: "client-unconfigured",
      reference: authDiagnosticReference(),
    });
    return null;
  }
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
        } catch (error) {
          /* Server Components cannot set cookies; proxy refreshes before rendering. */
          recordAuthDiagnostic({
            stage: "supabase-client",
            action: "cookie.setAll",
            outcome: "cookie-write-deferred",
            reference: authDiagnosticReference(),
            error,
          });
        }
      },
    },
  });
}
