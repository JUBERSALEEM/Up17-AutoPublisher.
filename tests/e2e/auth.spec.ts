import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("unconfigured local auth stays honest and account controls do not fake a session @e2e", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(
    page.getByText("Production email delivery is still being verified", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByLabel("Email address")).toHaveJSProperty("validity.valid", false);
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Account security" })).toBeVisible();
  await expect(
    page.getByText("Authentication is not configured in this local demo."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
});

test("auth callback rejects an unsafe next target and expired code @e2e", async ({ page }) => {
  await page.goto("/auth/callback?code=synthetic-test-code&next=https://evil.invalid");
  await expect(page).toHaveURL(/\/sign-in\?error=expired-link$/);
  await expect(page.locator('p[role="alert"]')).toContainText("invalid or expired");
});

test("media access requires same-origin JSON and never returns a demo signed URL @e2e", async ({
  request,
}) => {
  const cross = await request.post("/api/media/access", {
    data: { videoId: "11111111-1111-4111-8111-111111111111" },
    headers: { Origin: "https://evil.invalid" },
  });
  expect(cross.status()).toBe(403);
  const missing = await request.post("/api/media/access", {
    data: { videoId: "11111111-1111-4111-8111-111111111111" },
    headers: { Origin: "http://127.0.0.1:3100" },
  });
  expect(missing.status()).toBe(404);
  expect(missing.headers()["cache-control"]).toContain("no-store");
  expect(await missing.json()).not.toHaveProperty("url");
});

test("session-bearing navigation is not publicly cacheable @e2e", async ({ request }) => {
  const response = await request.get("/settings");
  expect(response.headers()["cache-control"]).toContain("no-store");
});

for (const route of ["/sign-in", "/sign-up", "/reset-password"]) {
  test(`${route} passes axe @a11y`, async ({ page }) => {
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
