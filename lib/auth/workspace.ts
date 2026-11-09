import "server-only";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "./session";
import {
  parsePreferences,
  defaultPreferences,
  type WorkspacePreferences,
} from "@/features/preferences/model";
import { WORKSPACE_COOKIE } from "@/lib/supabase/constants";
import type { MemberRole } from "@/lib/supabase/database.types";

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  email: string;
  displayName: string;
  role: MemberRole;
  preferences: WorkspacePreferences;
  revision: number;
}
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const selected = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  const baseQuery = () =>
    client
      .from("workspace_members")
      .select("workspace_id,role,workspaces(name)")
      .eq("user_id", viewer.id)
      .order("created_at")
      .limit(1);
  let query = baseQuery();
  const validSelected = Boolean(
    selected && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selected),
  );
  if (validSelected) query = query.eq("workspace_id", selected!);
  const initial = await query.maybeSingle();
  if (initial.error) throw new Error("Workspace data is temporarily unavailable.");
  let member = initial.data;
  // A stale/removed workspace selection must not lock a still-member user out.
  if (!member && validSelected) {
    const fallback = await baseQuery().maybeSingle();
    if (fallback.error) throw new Error("Workspace data is temporarily unavailable.");
    member = fallback.data;
  }
  if (!member) return null;
  const { data: prefs, error: prefError } = await client
    .from("preferences")
    .select("settings,revision")
    .eq("workspace_id", member.workspace_id)
    .eq("user_id", viewer.id)
    .maybeSingle();
  if (prefError || !prefs) throw new Error("Workspace preferences are temporarily unavailable.");
  const workspace = member.workspaces as unknown as { name: string };
  const preferences = parsePreferences({
    ...defaultPreferences,
    ...(prefs.settings as object),
    name: workspace.name,
  }) ?? { ...defaultPreferences, name: workspace.name };
  return {
    workspaceId: member.workspace_id,
    userId: viewer.id,
    email: viewer.email,
    displayName: viewer.name || "Creator",
    role: member.role,
    preferences,
    revision: prefs.revision,
  };
}
