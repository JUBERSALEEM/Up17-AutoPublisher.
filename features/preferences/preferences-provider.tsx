"use client";
import { createContext, useContext, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useBrowserValue, writeBrowserValue } from "@/lib/browser-store";
import { savePreferences } from "@/lib/auth/workspace-actions";
import type { WorkspaceContext } from "@/lib/auth/workspace";
import {
  defaultPreferences,
  parsePreferences,
  PREFERENCES_KEY,
  type WorkspacePreferences,
} from "./model";

type CloudData = Pick<
  WorkspaceContext,
  "workspaceId" | "userId" | "email" | "displayName" | "role" | "preferences" | "revision"
>;
interface PreferencesValue {
  preferences: WorkspacePreferences;
  update: (patch: Partial<WorkspacePreferences>) => Promise<boolean>;
  cloud: CloudData | null;
  pending: boolean;
}
const Context = createContext<PreferencesValue | null>(null);
export function PreferencesProvider({
  children,
  cloud = null,
}: {
  children: ReactNode;
  cloud?: CloudData | null;
}) {
  const local = useBrowserValue(PREFERENCES_KEY, defaultPreferences, parsePreferences);
  const [pending, transition] = useTransition();
  const router = useRouter();
  const update = async (patch: Partial<WorkspacePreferences>) => {
    const next = parsePreferences({ ...(cloud?.preferences ?? local), ...patch });
    if (!next) return false;
    if (!cloud) return writeBrowserValue(PREFERENCES_KEY, next);
    return new Promise<boolean>((resolve) =>
      transition(async () => {
        try {
          const result = await savePreferences(next);
          router.refresh();
          resolve(result.ok);
        } catch {
          resolve(false);
        }
      }),
    );
  };
  return (
    <Context.Provider
      value={{ preferences: cloud?.preferences ?? local, update, cloud: cloud, pending }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspacePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("PreferencesProvider is required.");
  return value;
}
