import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirects";
import { workspaceSetupPath } from "@/lib/auth/workspace-setup";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  /** Signup confirmation links are retired; this route serves recovery/invite/etc. only. */
  const allowed: EmailOtpType[] = ["invite", "magiclink", "recovery", "email_change", "email"];
  if (tokenHash && type && allowed.includes(type as EmailOtpType)) {
    const client = await createSupabaseServerClient();
    if (client) {
      const { error } = await client.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      });
      if (!error) {
        const destination =
          type === "recovery"
            ? "/auth/update-password"
            : workspaceSetupPath(safeNext(request.nextUrl.searchParams.get("next")));
        return NextResponse.redirect(new URL(destination, request.url));
      }
    }
  }
  return NextResponse.redirect(new URL("/sign-in?error=expired-link", request.url));
}
