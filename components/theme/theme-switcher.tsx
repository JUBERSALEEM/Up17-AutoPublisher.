"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { themes, type ThemePreference } from "@/lib/themes";
import { Badge } from "@/components/ui";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, preference, setPreference } = useTheme();
  const options: { id: ThemePreference; label: string }[] = [
    { id: "system", label: "System" },
    ...themes.map((t) => ({ id: t.id as ThemePreference, label: t.label })),
  ];
  return (
    <div className="theme-switcher" role="group" aria-label="Theme selection">
      {!compact ? <p className="field-label">Appearance</p> : null}
      <div className="theme-options">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`theme-option ${preference === option.id ? "theme-option-active" : ""}`}
            aria-pressed={preference === option.id}
            onClick={() => setPreference(option.id)}
          >
            <span className="theme-swatch" data-swatch={option.id} aria-hidden="true">
              {option.id === "system" ? (
                <Monitor size={14} />
              ) : option.id.endsWith("dark") ? (
                <Moon size={14} />
              ) : (
                <Sun size={14} />
              )}
            </span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      {!compact ? (
        <p className="field-hint">
          Active: {themes.find((t) => t.id === theme)?.label}. Saved only in this browser.
        </p>
      ) : null}
    </div>
  );
}

export function ThemeMenu() {
  const { theme, preference, setPreference } = useTheme();
  return (
    <details className="theme-menu">
      <summary
        className="icon-btn icon-btn-secondary"
        aria-label="Choose theme"
        title="Choose theme"
      >
        {theme.endsWith("dark") ? <Moon size={19} /> : <Sun size={19} />}
      </summary>
      <div className="theme-menu-panel">
        <p className="field-label">Theme</p>
        {(["system", ...themes.map((t) => t.id)] as ThemePreference[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`menu-item ${preference === id ? "menu-item-active" : ""}`}
            onClick={() => setPreference(id)}
          >
            <span>{id === "system" ? "Match system" : themes.find((t) => t.id === id)?.label}</span>
            {preference === id ? <Badge tone="primary">Active</Badge> : null}
          </button>
        ))}
      </div>
    </details>
  );
}
