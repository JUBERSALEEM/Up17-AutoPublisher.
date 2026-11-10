import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("library search, filters, views, selection and details are real @e2e", async ({ page }) => {
  await page.goto("/video-studio");
  await expect(page.getByText("6 of 6 demo videos", { exact: false })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search videos" }).fill("M416");
  await expect(page.locator(".video-card")).toHaveCount(3);
  await page.getByLabel("Processing status").selectOption("failed");
  await expect(page.locator(".video-card")).toHaveCount(1);
  await page.getByRole("button", { name: "List view" }).click();
  await expect(page.locator(".video-list-row")).toHaveCount(1);
  await page.getByRole("checkbox", { name: "Select Scope comparison montage" }).check();
  await expect(page.locator(".selection-bar")).toContainText("1 selected");
  await page.locator(".video-list-row").getByRole("button", { name: "Details" }).click();
  await expect(page.getByRole("dialog")).toContainText("scope-comparison-demo.mp4");
  await expect(page.getByRole("button", { name: "Retry unavailable" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.getByRole("searchbox", { name: "Search videos" }).fill("nothing-matches");
  await expect(page.getByRole("heading", { name: "No videos match your search" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters", exact: true }).last().click();
  await expect(page.locator(".video-list-row")).toHaveCount(6);
});

test("workspace validates and persists independent platform drafts @e2e", async ({ page }) => {
  await page.goto("/creator-studio?video=demo-video-1");
  await page.getByLabel("Title", { exact: true }).fill("");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator(".validation-summary")).toContainText("Add a title before saving");
  await page.getByLabel("Title", { exact: true }).fill("My verified M416 practice");
  await page.getByLabel("Description", { exact: true }).fill("A browser-local demo draft.");
  await page.getByRole("checkbox", { name: /Up17 Longshot/ }).check();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved in this browser only");
  await page.reload();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("My verified M416 practice");
  await page.getByRole("tab", { name: "Instagram" }).click();
  await expect(page.getByLabel("Caption", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Up17 Longshot/ })).toHaveCount(0);
  await page.getByRole("checkbox", { name: /Up17 Clips/ }).check();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("tab", { name: "YouTube" }).click();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "A browser-local demo draft.",
  );
  await expect(page.getByRole("button", { name: "Publish unavailable" })).toBeDisabled();
});

test("queue filters and attempt details never simulate publishing @e2e", async ({ page }) => {
  await page.goto("/queue");
  await page
    .getByRole("group", { name: "Queue status" })
    .getByRole("button", { name: "Failed", exact: true })
    .click();
  await expect(page.locator(".queue-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Details" }).click();
  await expect(page.getByRole("dialog")).toContainText("Illustrative failure");
  await expect(page.getByRole("button", { name: "Retry unavailable" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page
    .getByRole("group", { name: "Queue status" })
    .getByRole("button", { name: "Published", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "No real publications" })).toBeVisible();
});

test("scheduler switches views and saves a browser-local demo slot @e2e", async ({ page }) => {
  await page.goto("/scheduler");
  await page
    .getByRole("group", { name: "Calendar view" })
    .getByRole("button", { name: "Agenda" })
    .click();
  await expect(page.locator(".agenda-list .calendar-item")).toHaveCount(4);
  await page.getByRole("button", { name: "Add demo slot" }).click();
  await page.getByRole("button", { name: "Save demo slot" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Choose a valid demo date",
  );
  await page.getByLabel("Demo date and time").fill("2026-11-13T18:30");
  await page.getByRole("button", { name: "Save demo slot" }).click();
  await expect(page.locator(".agenda-list .calendar-item")).toHaveCount(5);
  await page.reload();
  await page
    .getByRole("group", { name: "Calendar view" })
    .getByRole("button", { name: "Agenda" })
    .click();
  await expect(page.locator(".agenda-list .calendar-item")).toHaveCount(5);
});

test("accounts show real OAuth cards and exact setup blockers @e2e", async ({ page }) => {
  await page.goto("/accounts");
  const cards = page.locator(".real-account-card");
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    await expect(card).toContainText("Not configured");
  }
  for (const label of [
    "Connect Google / YouTube",
    "Connect Instagram",
    "Connect TikTok",
  ] as const) {
    const button = page.getByRole("button", { name: label, exact: true });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  }
  await expect(page.getByRole("button", { name: "Connect an account" })).toBeDisabled();
  await expect(page.getByText("Demo mode is active")).toBeVisible();
  await expect(page.getByText("No real identity is connected", { exact: false })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Deployment and owner setup checklist" }),
  ).toBeVisible();
  for (const name of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "UP17_SITE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "UP17_TOKEN_ACTIVE_KEY_ID",
    "UP17_TOKEN_KEYS",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "INSTAGRAM_CLIENT_ID",
    "INSTAGRAM_CLIENT_SECRET",
    "TIKTOK_CLIENT_KEY",
    "TIKTOK_CLIENT_SECRET",
    "CRON_SECRET",
  ]) {
    await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How to reach real connections" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No real accounts connected" })).toBeVisible();
});

test("accounts never present demo identities as connections or simulate OAuth @e2e", async ({
  page,
}) => {
  await page.goto("/accounts");
  await expect(page.locator(".demo-account-card")).toHaveCount(0);
  await expect(page.getByText("Demo identity", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Demo pause preference")).toHaveCount(0);
  await expect(page.getByText("OAuth unavailable")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Requirements" })).toHaveCount(0);
  await expect(page.getByText("No simulated authorization", { exact: false })).toBeVisible();
});

for (const route of [
  "/",
  "/video-studio",
  "/creator-studio",
  "/queue",
  "/scheduler",
  "/accounts",
]) {
  test(`${route} populated screen passes axe @a11y`, async ({ page }) => {
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
