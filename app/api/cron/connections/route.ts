import { NextResponse } from "next/server";
import { runScheduledRefresh } from "@/lib/connections/broker";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`)
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  try {
    const result = await runScheduledRefresh(20);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Refresh worker unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
