export const THEME_STORAGE_KEY = "up17.theme.preference.v1";

export const themeIds = ["clay-light", "clay-dark", "bento-light", "bento-dark"] as const;
export type ThemeId = (typeof themeIds)[number];
export type ThemePreference = ThemeId | "system";

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  family: "Clay" | "Bento";
  appearance: "light" | "dark";
  description: string;
}

export const themes: readonly ThemeDefinition[] = [
  {
    id: "clay-light",
    label: "Clay Light",
    family: "Clay",
    appearance: "light",
    description: "Soft raised surfaces, warm lavender canvas and tactile depth.",
  },
  {
    id: "clay-dark",
    label: "Clay Dark",
    family: "Clay",
    appearance: "dark",
    description: "Layered charcoal clay with restrained violet and cyan accents.",
  },
  {
    id: "bento-light",
    label: "Bento Light",
    family: "Bento",
    appearance: "light",
    description: "Crisp modular panels, flatter depth and disciplined geometry.",
  },
  {
    id: "bento-dark",
    label: "Bento Dark",
    family: "Bento",
    appearance: "dark",
    description: "High-contrast dark modules with quiet borders and focused accents.",
  },
];

export const DEFAULT_THEME: ThemeId = "clay-light";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (themeIds as readonly string[]).includes(value);
}

export function parseThemePreference(value: unknown): ThemePreference | null {
  if (value === "system") return "system";
  return isThemeId(value) ? value : null;
}

/** Clay is the default family; an unsaved preference follows system appearance. */
export function resolveTheme(preference: ThemePreference | null, systemDark: boolean): ThemeId {
  if (preference && preference !== "system") return preference;
  return systemDark ? "clay-dark" : DEFAULT_THEME;
}

export function themeDefinition(id: ThemeId): ThemeDefinition {
  return themes.find((theme) => theme.id === id) ?? themes[0];
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}
