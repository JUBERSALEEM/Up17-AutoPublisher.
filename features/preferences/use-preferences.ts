"use client";
import { useWorkspacePreferences } from "./preferences-provider";
/** Cloud-backed when signed in; explicitly browser-local in the public demo. */
export function usePreferences() {
  return useWorkspacePreferences();
}
