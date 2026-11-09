import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { allDestinations } from "../../lib/navigation";
import { themeIds } from "../../lib/themes";

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
];

async function material(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        shadow: style.boxShadow,
        image: style.backgroundImage,
        border: style.borderWidth,
        transform: style.transform,
        radius: style.borderRadius,
      };
    });
}

for (const theme of themeIds) {
  for (const viewport of viewports) {
    test(`${theme} ${viewport.name} material contract @clay @visual`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((id) => localStorage.setItem("up17.theme.preference.v1", id), theme);
      await page.goto("/design-system");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      await expect(page.getByRole("button", { name: "Preview notice" })).not.toBeFocused();
      await expect
        .poll(async () => (await material(page, ".btn-primary")).shadow.split("inset").length - 1)
        .toBe(theme.startsWith("clay-") ? 2 : 0);
      const card = await material(page, ".card-raised");
      const button = await material(page, ".btn-primary");
      const input = await material(page, ".input");
      const inset = await material(page, ".card-inset");
      const clay = theme.startsWith("clay-");
      expect(card.shadow.split("inset").length - 1).toBe(clay ? 2 : 0);
      expect(button.shadow.split("inset").length - 1).toBe(clay ? 2 : 0);
      expect(input.shadow.split("inset").length - 1).toBe(clay ? 2 : 0);
      expect(inset.shadow.split("inset").length - 1).toBe(clay ? 2 : 0);
      expect(card.image.includes("gradient")).toBe(clay);
      expect(button.image.includes("gradient")).toBe(clay);
      expect(input.image.includes("gradient")).toBe(clay);
      expect(parseFloat(card.radius)).toBe(clay ? 28 : 18);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );

      if (clay) {
        await page.getByRole("button", { name: "Preview notice" }).hover();
        await expect
          .poll(async () => (await material(page, ".btn-primary")).transform)
          .not.toBe("none");
        await page.mouse.down();
        expect((await material(page, ".btn-primary")).shadow).toContain("inset");
        await page.mouse.up();
        await page.getByRole("button", { name: "Reset", exact: true }).focus();
        await page.keyboard.press("Tab");
        const focused = page.getByRole("button", { name: "Accessibility", exact: true });
        await expect(focused).toBeFocused();
        expect(await focused.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
        expect((await material(page, ".btn:disabled")).shadow).toBe("none");
      }
      await page.mouse.move(0, 0);
      await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
      await expect(page).toHaveScreenshot(`design-system-${theme}-${viewport.name}.png`, {
        fullPage: true,
        animations: "disabled",
        maxDiffPixelRatio: 0.01,
      });
    });
  }
}

for (const theme of themeIds) {
  for (const destination of allDestinations) {
    test(`${theme} ${destination.label} uses family-safe shared materials @clay @visual`, async ({
      page,
    }) => {
      await page.addInitScript((id) => localStorage.setItem("up17.theme.preference.v1", id), theme);
      await page.goto(destination.href);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(250);
      const styles = await page
        .locator(".card-raised, .btn-primary, .input:not(.select)")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return {
              shadow: style.boxShadow,
              image: style.backgroundImage,
              disabled: element.matches(":disabled"),
            };
          }),
        );
      expect(styles.length).toBeGreaterThan(0);
      for (const style of styles) {
        if (style.disabled) continue;
        if (theme.startsWith("clay-")) {
          expect(style.shadow).toContain("inset");
        } else {
          expect(style.shadow).not.toContain("inset");
          expect(style.image).not.toContain("gradient");
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }
}

for (const theme of ["clay-light", "clay-dark"] as const) {
  test(`${theme} sculptural controls retain accessible contrast @clay @a11y`, async ({ page }) => {
    await page.addInitScript((id) => localStorage.setItem("up17.theme.preference.v1", id), theme);
    await page.goto("/design-system");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  });
}
