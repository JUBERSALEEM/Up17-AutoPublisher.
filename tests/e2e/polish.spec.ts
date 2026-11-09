import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { allDestinations } from "../../lib/navigation";
import { themeIds } from "../../lib/themes";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const theme of themeIds) {
  for (const item of allDestinations) {
    test(`${item.label} passes axe in ${theme} @a11y`, async ({ page }) => {
      await page.addInitScript((id) => localStorage.setItem("up17.theme.preference.v1", id), theme);
      await page.goto(item.href);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(
        results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
      ).toEqual([]);
    });
  }
}

for (const width of [320, 360, 390, 430, 768, 1440]) {
  for (const item of allDestinations) {
    test(`${item.label} fits ${width}px @visual`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(item.href);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (width < 1024)
        await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
      else
        await expect(
          page.getByRole("navigation", { name: "Main navigation", exact: true }),
        ).toBeVisible();
    });
  }
}

test("keyboard skip link, tab arrows and dialog focus return work @e2e", async ({ page }) => {
  await page.goto("/research");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  const first = page.getByRole("tab", { name: "Editorial prompts" });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Saved briefs/ })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
  await page.getByRole("button", { name: "New brief" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("button", { name: "New brief" })).toBeFocused();
});

test("storage denial keeps drafts usable and honestly session-only @e2e", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
    Storage.prototype.removeItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
  });
  await page.goto("/creator-studio?video=demo-video-1");
  await page.getByLabel("Title", { exact: true }).fill("Session-only draft");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("this session only");
  await page.goto("/settings");
  await page.getByLabel("Workspace name", { exact: true }).fill("Session workspace");
  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect(page.getByRole("status")).toContainText("this session only");
});

test("reduced motion preference and device media query disable transitions @e2e", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.getByRole("switch", { name: "Reduce motion" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  const duration = await page
    .locator(".btn")
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(duration)).toBeLessThan(0.01);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("switch", { name: "Reduce motion" }).click();
  const deviceDuration = await page
    .locator(".btn")
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(deviceDuration)).toBeLessThan(0.01);
});

test.describe("touch phone journey", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("mobile navigation, library and draft remain usable @e2e", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Videos" })
      .tap();
    await expect(page).toHaveURL(/\/video-studio$/);
    await page.getByRole("searchbox", { name: "Search videos" }).fill("M416");
    await page.locator(".video-card").first().getByRole("button", { name: "Details" }).tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("link", { name: "Prepare content" }).tap();
    await expect(page).toHaveURL(/\/creator-studio/);
    await page.getByLabel("Title", { exact: true }).fill("Phone draft");
    await page.getByRole("button", { name: "Save draft", exact: true }).tap();
    await expect(page.getByRole("status")).toContainText("Draft saved");
    const saveBox = await page
      .getByRole("button", { name: "Save draft", exact: true })
      .boundingBox();
    expect(saveBox?.height).toBeGreaterThanOrEqual(44);
    const nav = page.getByRole("navigation", { name: "Mobile navigation" });
    for (const link of await nav.getByRole("link").all()) {
      const box = await link.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test("open dialog and mobile More menu pass axe @a11y", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "More destinations" }).click();
  let results = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(
    results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await page.goto("/research");
  await page.getByRole("button", { name: "New brief" }).click();
  results = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(
    results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
});
