import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getViewer = cache(async () => {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || !data.user.email_confirmed_at) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    name: data.user.user_metadata.display_name as string | undefined,
  };
});
