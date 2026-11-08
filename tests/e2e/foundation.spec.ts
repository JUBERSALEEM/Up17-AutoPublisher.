import { expect, test } from "@playwright/test";

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
