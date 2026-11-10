import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/auth/redirects";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import {
  checkConnectionHealth,
  disconnectConnection,
  refreshConnection,
  ConnectionError,
} from "@/lib/connections/broker";

export const runtime = "nodejs";
const paramsSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["refresh", "health", "disconnect"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; action: string }> },
) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403, headers });
  const workspace = await getWorkspaceContext();
  if (!workspace) return NextResponse.json({ error: "Sign in again." }, { status: 401, headers });
  if (workspace.role !== "owner" && workspace.role !== "admin")
    return NextResponse.json(
      { error: "Only workspace owners/admins can manage connections." },
      { status: 403, headers },
    );
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid connection request." }, { status: 400, headers });
  try {
    if (parsed.data.action === "refresh") {
      await refreshConnection(workspace.userId, parsed.data.id);
      return NextResponse.json(
        { ok: true, message: "Token refreshed and identity reverified." },
        { headers },
      );
    }
    if (parsed.data.action === "health") {
      const state = await checkConnectionHealth(workspace.userId, parsed.data.id);
      return NextResponse.json({ ok: true, state }, { headers });
    }
    const result = await disconnectConnection(workspace.userId, parsed.data.id);
    return NextResponse.json({ ok: true, ...result }, { headers });
  } catch (error) {
    const status = error instanceof ConnectionError ? error.status : 503;
    return NextResponse.json(
      {
        error: error instanceof ConnectionError ? error.message : "Connection service unavailable.",
      },
      { status, headers },
    );
  }
}
