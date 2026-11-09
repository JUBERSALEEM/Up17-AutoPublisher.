import { NotificationsInbox } from "@/components/notifications/notifications-inbox";
import { CloudInbox } from "@/components/notifications/cloud-inbox";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const metadata = { title: "Notifications" };
export default async function Page() {
  const workspace = await getWorkspaceContext();
  if (!workspace) return <NotificationsInbox />;
  const client = await createSupabaseServerClient();
  const { data, error } = await client!
    .from("notifications")
    .select("*")
    .eq("workspace_id", workspace.workspaceId)
    .eq("user_id", workspace.userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Notifications are temporarily unavailable.");
  return <CloudInbox notices={data} />;
}
