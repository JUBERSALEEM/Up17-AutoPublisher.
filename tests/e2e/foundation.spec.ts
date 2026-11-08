import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("foundation main screen has no automated accessibility violations @a11y", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Up17 AutoPublisher" })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});

test("foundation is honest and has no page overflow @visual", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Up17 AutoPublisher" })).toBeVisible();
  await expect(page.getByText("DEMO · M1.1")).toBeVisible();
  await expect(page.getByText(/not a working automation product/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
