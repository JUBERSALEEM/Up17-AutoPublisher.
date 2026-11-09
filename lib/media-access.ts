import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/workspace";
const inputSchema = z.object({ videoId: z.string().uuid() }).strict();
export const MEDIA_BUCKET = "creator-media";
export const SIGNED_URL_SECONDS = 60;
export async function privateVideoUrl(
  input: unknown,
): Promise<{ url: string; expiresIn: number } | null> {
  const parsed = inputSchema.safeParse(input);
  const workspace = await getWorkspaceContext();
  const client = await createSupabaseServerClient();
  if (!parsed.success || !workspace || !client) return null;
  const { data, error } = await client
    .from("videos")
    .select("storage_path,state")
    .eq("workspace_id", workspace.workspaceId)
    .eq("id", parsed.data.videoId)
    .neq("state", "deleted")
    .maybeSingle();
  if (error || !data || !data.storage_path.startsWith(`${workspace.workspaceId}/`)) return null;
  const result = await client.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(data.storage_path, SIGNED_URL_SECONDS);
  if (result.error || !result.data?.signedUrl) return null;
  return { url: result.data.signedUrl, expiresIn: SIGNED_URL_SECONDS };
}
