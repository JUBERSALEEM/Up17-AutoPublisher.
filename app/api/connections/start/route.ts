import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sameOrigin } from "@/lib/auth/redirects";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { appOrigin } from "@/lib/supabase/config";
import { beginOAuth, ConnectionError } from "@/lib/connections/broker";
import {
  bridgeAuthorizeUrl,
  callbackBridgeOrigin,
  callbackBridgeUrl,
  createBridgeSession,
} from "@/lib/connections/bridge";
import { custodyConfigured, pkcePair, randomToken } from "@/lib/connections/crypto";
import { authorizationUrl, pkceMethods, providerSecrets } from "@/lib/connections/providers";
import { isConnectionPlatform } from "@/lib/connections/types";

export const runtime = "nodejs";
const BINDING_COOKIE = "up17-oauth-binding";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403, headers });
  const workspace = await getWorkspaceContext();
  if (!workspace)
    return NextResponse.json(
      { error: "Sign in again to connect an account." },
      { status: 401, headers },
    );
  if (workspace.role !== "owner" && workspace.role !== "admin")
    return NextResponse.json(
      { error: "Only workspace owners/admins can connect accounts." },
      { status: 403, headers },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON required." }, { status: 415, headers });
  }
  const platform =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>).platform : null;
  if (!isConnectionPlatform(platform))
    return NextResponse.json({ error: "Unsupported platform." }, { status: 400, headers });
  const secrets = providerSecrets(platform);
  if (!secrets || !custodyConfigured() || !callbackBridgeOrigin())
    return NextResponse.json(
      { error: "Official OAuth is not configured on this deployment." },
      { status: 503, headers },
    );
  const state = randomToken(32);
  const binding = randomToken(32);
  const method = pkceMethods[platform];
  const pair = method ? pkcePair(method) : null;
  const redirectUri = callbackBridgeUrl(platform);
  const providerUrl = authorizationUrl(
    platform,
    secrets,
    redirectUri,
    state,
    pair?.challenge ?? null,
  );
  try {
    await beginOAuth({
      actorId: workspace.userId,
      workspaceId: workspace.workspaceId,
      platform,
      redirectUri,
      state,
      binding,
      verifier: pair?.verifier ?? null,
    });
    const bridgeId = await createBridgeSession({
      actorId: workspace.userId,
      workspaceId: workspace.workspaceId,
      platform,
      state,
      binding,
      redirectUri,
      returnOrigin: appOrigin(),
    });
    (await cookies()).set(BINDING_COOKIE, binding, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/connections",
      maxAge: 600,
    });
    return NextResponse.json(
      {
        ok: true,
        authorizationUrl: bridgeAuthorizeUrl({ bridgeId, state, authorizationUrl: providerUrl }),
      },
      { headers },
    );
  } catch (error) {
    const status = error instanceof ConnectionError ? error.status : 503;
    return NextResponse.json(
      {
        error: error instanceof ConnectionError ? error.message : "Connection broker unavailable.",
      },
      { status, headers },
    );
  }
}
