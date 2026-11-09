"use client";
import { useBrowserValue, writeBrowserValue } from "@/lib/browser-store";
import {
  defaultPreferences,
  parsePreferences,
  PREFERENCES_KEY,
  type WorkspacePreferences,
} from "./model";
export function usePreferences() {
  const preferences = useBrowserValue(PREFERENCES_KEY, defaultPreferences, parsePreferences);
  const update = (patch: Partial<WorkspacePreferences>) =>
    writeBrowserValue(PREFERENCES_KEY, { ...preferences, ...patch });
  return { preferences, update };
}
