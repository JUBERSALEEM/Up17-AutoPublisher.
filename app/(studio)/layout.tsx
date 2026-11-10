import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PwaProvider } from "@/components/shell/pwa-provider";
import { PreferencesProvider } from "@/features/preferences/preferences-provider";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { supabaseConfigAvailable } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const workspace = await getWorkspaceContext();
  let connectedCount = 0;
  if (workspace) {
    const client = await createSupabaseServerClient();
    if (client) {
      const { count } = await client
        .from("platform_connections")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.workspaceId)
        .in("state", ["connected", "limited_permissions"]);
      connectedCount = count ?? 0;
    }
  }
  return (
    <PwaProvider>
      <PreferencesProvider cloud={workspace}>
        <AppShell authAvailable={supabaseConfigAvailable()} connectedCount={connectedCount}>
          {children}
        </AppShell>
      </PreferencesProvider>
    </PwaProvider>
  );
}
