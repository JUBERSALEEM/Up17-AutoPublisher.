import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("settings persist profile, theme, motion and inbox preferences @e2e", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Workspace name", { exact: true }).fill("Up17 Test Studio");
  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect(page.getByRole("status")).toContainText("Workspace preferences saved");
  await page.getByRole("button", { name: "Bento Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "bento-dark");
  await page.getByRole("switch", { name: "Reduce motion" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await page.getByRole("switch", { name: "Publishing updates" }).click();
  await page.reload();
  await expect(page.getByLabel("Workspace name", { exact: true })).toHaveValue("Up17 Test Studio");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "bento-dark");
  await expect(page.getByRole("switch", { name: "Publishing updates" })).not.toBeChecked();
  await page.goto("/");
  await expect(page.getByText("Welcome to Up17 Test Studio.", { exact: false })).toBeVisible();
  await page.goto("/notifications");
  await expect(page.locator(".notification-row")).toHaveCount(4);
});

test("notification search, read state and details are local and honest @e2e", async ({ page }) => {
  await page.goto("/notifications");
  await expect(page.locator(".notification-row")).toHaveCount(5);
  await page
    .locator(".notification-row")
    .first()
    .getByRole("button", { name: "Mark read", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".notification-row").first()).toContainText("Read");
  await page
    .getByRole("group", { name: "Read state" })
    .getByRole("button", { name: "Unread" })
    .click();
  await expect(page.locator(".notification-row")).toHaveCount(4);
  await page.getByRole("searchbox", { name: "Search notifications" }).fill("publishing failure");
  await expect(page.locator(".notification-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Details", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("No publication was attempted");
  await page.getByRole("button", { name: "Mark read & close" }).click();
  await page.getByRole("searchbox", { name: "Search notifications" }).fill("");
  await page.getByRole("button", { name: "Mark all demo read" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re caught up on demo notices" }),
  ).toBeVisible();
});

test("research saves, edits, searches and deletes a local brief @e2e", async ({ page }) => {
  await page.goto("/research");
  await page.getByRole("searchbox", { name: "Search editorial prompts" }).fill("M416");
  await expect(page.locator(".research-prompt")).toHaveCount(1);
  await page.getByRole("button", { name: "Save as brief" }).click();
  await page.getByRole("button", { name: "Save brief", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("tab", { name: /Saved briefs/ }).click();
  await expect(page.locator(".brief-card")).toHaveCount(1);
  await page.reload();
  await page.getByRole("tab", { name: /Saved briefs/ }).click();
  await expect(page.locator(".brief-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Brief title").fill("My verified scope explainer");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("searchbox", { name: "Search saved briefs" }).fill("verified scope");
  await expect(page.locator(".brief-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete brief", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Give your next idea a home" })).toBeVisible();
  await page.getByRole("tab", { name: "Updates & sources" }).click();
  await expect(page.getByRole("heading", { name: "No verified updates available" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check for updates unavailable" })).toBeDisabled();
});

test("AI timeline is explicitly simulated and performance never invents metrics @e2e", async ({
  page,
}) => {
  await page.goto("/ai-content");
  await expect(page.getByRole("button", { name: "Run analysis unavailable" })).toBeDisabled();
  await page.getByRole("button", { name: /Audio review point/ }).click();
  await expect(page.locator(".marker-detail")).toContainText("No audio was extracted");
  await expect(page.locator(".marker-detail")).toContainText("Not available");
  await page.getByLabel("Demo source video").selectOption("demo-video-3");
  await expect(page.locator(".analysis-preview")).toContainText(
    "M762 recoil pattern practice routine",
  );
  await page.goto("/performance");
  await expect(page.locator(".unavailable-metric").first()).toContainText("Unavailable");
  await page.getByLabel("Report platform").selectOption("youtube");
  await page.getByLabel("Date range").selectOption("custom");
  await page.getByLabel("From", { exact: true }).fill("2026-11-09");
  await page.getByLabel("To", { exact: true }).fill("2026-11-01");
  await expect(page.locator(".validation-summary")).toContainText("valid date range");
  await page.getByLabel("From", { exact: true }).fill("2026-10-01");
  await expect(page.locator(".validation-summary")).toHaveCount(0);
  await page
    .getByRole("group", { name: "Performance view" })
    .getByRole("button", { name: "Platforms", exact: true })
    .click();
  await expect(page.locator(".platform-comparison .card")).toHaveCount(2);
  await page
    .getByRole("group", { name: "Performance view" })
    .getByRole("button", { name: "Videos", exact: true })
    .click();
  await page.getByRole("searchbox", { name: "Search demo video performance" }).fill("M416");
  await expect(page.locator(".performance-video-row")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Export unavailable" })).toBeDisabled();
});

test("local export and confirmed reset preserve appearance @e2e", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Bento Light", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export local demo data" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("up17-local-demo.json");
  await page.getByRole("button", { name: "Reset demo content", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset demo content", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "bento-light");
  await expect(page.getByRole("status")).toContainText("Local demo content reset");
});

for (const route of ["/ai-content", "/research", "/performance", "/notifications", "/settings"]) {
  test(`${route} supporting screen passes axe @a11y`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(
      results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  });
  test(`${route} fits a 320px phone @visual`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
