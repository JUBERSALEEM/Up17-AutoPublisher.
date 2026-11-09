import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  DEFAULT_THEME,
  parseThemePreference,
  resolveTheme,
  themeIds,
} from "@/lib/themes";

// Read the actual CSS source rather than maintaining a second palette in tests.
const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  const block = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]),
  );
}

describe("theme engine", () => {
  it("defaults to Clay Light and respects unsaved system appearance", () => {
    expect(DEFAULT_THEME).toBe("clay-light");
    expect(resolveTheme(null, false)).toBe("clay-light");
    expect(resolveTheme(null, true)).toBe("clay-dark");
    expect(resolveTheme("system", true)).toBe("clay-dark");
    expect(resolveTheme("bento-light", true)).toBe("bento-light");
  });
  it("parses only supported persisted preferences", () => {
    for (const id of themeIds) expect(parseThemePreference(id)).toBe(id);
    expect(parseThemePreference("system")).toBe("system");
    expect(parseThemePreference("neon")).toBeNull();
    expect(parseThemePreference(null)).toBeNull();
  });
  it("defines complete tokens and accessible core/status pairs in all four themes", () => {
    const base = tokens(':root,\n[data-theme="clay-light"]');
    for (const role of [
      "background",
      "surface",
      "surface-raised",
      "surface-inset",
      "text",
      "muted",
      "primary",
      "secondary",
      "accent",
      "success",
      "warning",
      "danger",
      "border",
      "focus-ring",
      "shadow-raised",
      "shadow-pressed",
      "radius-card",
      "font-sans",
      "space-4",
      "text-base",
      "motion-fast",
    ])
      expect(base[`--${role}`], role).toBeTruthy();
    for (const id of themeIds) {
      const theme = { ...base, ...(id === "clay-light" ? {} : tokens(`[data-theme="${id}"]`)) };
      for (const background of ["background", "surface", "surface-raised", "surface-inset"]) {
        for (const foreground of ["text", "muted"])
          expect(
            contrastRatio(theme[`--${foreground}`], theme[`--${background}`]),
            `${id} ${foreground}/${background}`,
          ).toBeGreaterThanOrEqual(4.5);
      }
      expect(
        contrastRatio(theme["--primary-foreground"], theme["--primary"]),
        `${id} action`,
      ).toBeGreaterThanOrEqual(4.5);
      for (const state of ["primary", "accent", "success", "warning", "danger"])
        expect(
          contrastRatio(theme[`--${state}`], theme[`--${state}-soft`]),
          `${id} ${state}`,
        ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
