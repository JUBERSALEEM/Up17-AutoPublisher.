"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WORKSPACE_COOKIE } from "@/lib/supabase/constants";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "./workspace";
import { defaultPreferences, timezones } from "@/features/preferences/model";

const schema = z
  .object({
    name: z.string().trim().min(2).max(48),
    niche: z.string().trim().min(2).max(80),
    audience: z.string().trim().max(120),
    voice: z.enum(["Clear & encouraging", "Direct & analytical", "Friendly & conversational"]),
    language: z.enum(["English", "Hindi", "Arabic"]),
    timezone: z.enum(timezones),
    reduceMotion: z.boolean(),
    notifications: z
      .object({
        processing: z.boolean(),
        publishing: z.boolean(),
        accounts: z.boolean(),
        analytics: z.boolean(),
      })
      .strict(),
  })
  .strict();
export type SaveResult = { ok: boolean; message: string; revision?: number };
export async function savePreferences(input: unknown): Promise<SaveResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Check the workspace profile and preference values." };
  const context = await getWorkspaceContext();
  const client = await createSupabaseServerClient();
  if (!context || !client)
    return { ok: false, message: "Sign in again to save workspace preferences." };
  if (context.role === "viewer" || context.role === "editor")
    parsed.data.name = context.preferences.name;
  const { data, error } = await client.rpc("save_workspace_preferences", {
    target_workspace: context.workspaceId,
    expected_revision: context.revision,
    proposed_settings: parsed.data,
  });
  if (error)
    return {
      ok: false,
      message: "Preferences were not saved. Another edit may have occurred; reload and try again.",
    };
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Workspace preferences saved to your private workspace.",
    revision: data,
  };
}
export async function markNotifications(ids: unknown, read: unknown): Promise<SaveResult> {
  const parsed = z.array(z.string().uuid()).min(1).max(100).safeParse(ids);
  if (!parsed.success || typeof read !== "boolean")
    return { ok: false, message: "Invalid notification selection." };
  const context = await getWorkspaceContext();
  const client = await createSupabaseServerClient();
  if (!context || !client) return { ok: false, message: "Sign in again to update notifications." };
  const { data, error } = await client
    .from("notifications")
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq("user_id", context.userId)
    .eq("workspace_id", context.workspaceId)
    .in("id", parsed.data)
    .select("id");
  if (error || !data?.length)
    return { ok: false, message: "No matching notifications were updated." };
  revalidatePath("/notifications");
  return { ok: true, message: "Notification read state saved." };
}
export async function restorePreferences(): Promise<SaveResult> {
  const context = await getWorkspaceContext();
  if (!context) return { ok: false, message: "Sign in again to restore defaults." };
  return savePreferences({ ...defaultPreferences, name: context.preferences.name });
}

export async function selectWorkspace(form: FormData): Promise<void> {
  const id = form.get("workspaceId");
  const context = await getWorkspaceContext();
  const client = await createSupabaseServerClient();
  if (!context || !client || typeof id !== "string" || !z.string().uuid().safeParse(id).success)
    redirect("/account");
  const { data } = await client
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", context.userId)
    .eq("workspace_id", id)
    .maybeSingle();
  if (!data) redirect("/account");
  (await cookies()).set(WORKSPACE_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/", "layout");
  redirect("/account");
}
