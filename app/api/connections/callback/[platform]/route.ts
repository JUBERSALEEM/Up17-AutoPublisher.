import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getViewer } from "@/lib/auth/session";
import { completeOAuth } from "@/lib/connections/broker";
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
  if (!isConnectionPlatform(platform)) return clear(NextResponse.redirect(destination, 303));
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error");
  const binding = (await cookies()).get(BINDING_COOKIE)?.value;
  const viewer = await getViewer();
  if (providerError) {
    destination.searchParams.set("connection", "denied");
    destination.searchParams.set("platform", platform);
    return clear(NextResponse.redirect(destination, 303));
  }
  if (
    !viewer ||
    !state ||
    !code ||
    !binding ||
    state.length > 256 ||
    code.length > 4096 ||
    binding.length > 256
  ) {
    destination.searchParams.set("connection", "invalid");
    destination.searchParams.set("platform", platform);
    return clear(NextResponse.redirect(destination, 303));
  }
  try {
    await completeOAuth({ actorId: viewer.id, platform, state, binding, code });
    destination.searchParams.set("connection", "authorized");
    destination.searchParams.set("platform", platform);
  } catch {
    destination.searchParams.set("connection", "failed");
    destination.searchParams.set("platform", platform);
  }
  return clear(NextResponse.redirect(destination, 303));
}
