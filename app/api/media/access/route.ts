import { NextResponse, type NextRequest } from "next/server";
import { sameOrigin } from "@/lib/auth/redirects";
import { privateVideoUrl } from "@/lib/media-access";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/**
 * Same-origin JSON endpoint for short-lived private media previews. It never
 * fabricates a demo signed URL: an unauthenticated caller or an unknown video
 * gets a cache-disabled 404, and cross-origin requests are rejected before the
 * body is read.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json"))
    return json({ error: "invalid_request" }, 415);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  const result = await privateVideoUrl(payload);
  if (!result) return json({ error: "not_found" }, 404);
  return json({ url: result.url, expiresIn: result.expiresIn }, 200);
}
