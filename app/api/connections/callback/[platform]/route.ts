import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getViewer } from "@/lib/auth/session";
import { completeOAuth } from "@/lib/connections/broker";
import { consumeBridgeReceipt } from "@/lib/connections/bridge";
import { isConnectionPlatform } from "@/lib/connections/types";

export const runtime = "nodejs";
const BINDING_COOKIE = "up17-oauth-binding";

export async function GET(request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform } = await context.params;
  const url = new URL(request.url);
  const destination = new URL("/accounts", url.origin);
  const clear = (response: NextResponse) => {
    response.cookies.set(BINDING_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/connections",
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  const invalid = (reason: string) => {
    destination.searchParams.set("connection", reason);
    destination.searchParams.set("platform", platform);
    return clear(NextResponse.redirect(destination, 303));
  };
  if (!isConnectionPlatform(platform)) return clear(NextResponse.redirect(destination, 303));
  const receipt = url.searchParams.get("receipt");
  const providerError = url.searchParams.get("error");
  const binding = (await cookies()).get(BINDING_COOKIE)?.value;
  const viewer = await getViewer();
  if (providerError) return invalid("denied");
  // Provider codes terminate at the public bridge. The protected app accepts only
  // a short-lived, one-time receipt plus the original HttpOnly binding cookie.
  if (url.searchParams.has("code") || url.searchParams.has("state")) return invalid("invalid");
  if (!viewer || !receipt || !binding || receipt.length > 256 || binding.length > 256)
    return invalid("invalid");
  try {
    const resolved = await consumeBridgeReceipt({ receipt, actorId: viewer.id, binding });
    if (resolved.platform !== platform) return invalid("invalid");
    await completeOAuth({
      actorId: viewer.id,
      platform,
      state: resolved.state,
      binding,
      code: resolved.code,
    });
    destination.searchParams.set("connection", "authorized");
    destination.searchParams.set("platform", platform);
  } catch {
    destination.searchParams.set("connection", "failed");
    destination.searchParams.set("platform", platform);
  }
  return clear(NextResponse.redirect(destination, 303));
}
