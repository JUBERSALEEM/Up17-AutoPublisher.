import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { themeIds } from "../../lib/themes";

test("foundation is honest and has no page overflow @visual", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Up17 AutoPublisher", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Demo mode", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

for (const theme of themeIds) {
  test(`${theme} preview has no automated accessibility violations @a11y`, async ({ page }) => {
    await page.addInitScript((id) => localStorage.setItem("up17.theme.preference.v1", id), theme);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(
      page.getByRole("heading", { name: "Up17 AutoPublisher", exact: true }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });
}

test("theme selection updates tokens and persists @e2e", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bento Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "bento-dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "bento-dark");
  await page.getByRole("button", { name: "Clay Light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "clay-light");
});

test("preview controls and modal work with keyboard @e2e", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Preview notice" }).click();
  await expect(page.getByRole("status")).toContainText("Nothing was published");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByRole("button", { name: "Accessibility", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Accessibility", exact: true })).toBeFocused();
});

test("system mode follows appearance changes and clears saved preference @e2e", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "clay-dark");
  await page.getByRole("button", { name: "Bento Light", exact: true }).click();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "bento-light");
  await page.getByRole("button", { name: "System", exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem("up17.theme.preference.v1"))).toBeNull();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "clay-dark");
});
