import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PwaProvider } from "@/components/shell/pwa-provider";
import { PreferencesProvider } from "@/features/preferences/preferences-provider";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const workspace = await getWorkspaceContext();
  return (
    <PwaProvider>
      <PreferencesProvider cloud={workspace}>
        <AppShell authAvailable={Boolean(getSupabaseConfig())}>{children}</AppShell>
      </PreferencesProvider>
    </PwaProvider>
  );
}
