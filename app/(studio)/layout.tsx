import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PwaProvider } from "@/components/shell/pwa-provider";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <PwaProvider>
      <AppShell>{children}</AppShell>
    </PwaProvider>
  );
}
