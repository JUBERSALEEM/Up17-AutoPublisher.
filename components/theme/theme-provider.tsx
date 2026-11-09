"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  parseThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemeId,
  type ThemePreference,
} from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeId;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const listeners = new Set<() => void>();
let temporaryPreference: ThemePreference = "system";

function emit() {
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function readPreference(): ThemePreference {
  try {
    temporaryPreference = parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY)) ?? "system";
  } catch {
    // Retain an in-memory preference when browser storage is unavailable.
  }
  return temporaryPreference;
}
function subscribeSystem(listener: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
function readSystemDark() {
  return matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    () => "system" as ThemePreference,
  );
  const systemDark = useSyncExternalStore(subscribeSystem, readSystemDark, () => false);
  const theme = resolveTheme(preference, systemDark);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme.endsWith("dark") ? "dark" : "light";
  }, [theme]);

  const setPreference = useCallback((next: ThemePreference) => {
    temporaryPreference = next;
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage denial must not break the visible theme change.
    }
    emit();
  }, []);

  const value = useMemo(
    () => ({ theme, preference, setPreference }),
    [theme, preference, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
