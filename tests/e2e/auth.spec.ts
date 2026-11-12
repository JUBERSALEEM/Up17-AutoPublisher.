import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("unconfigured local auth stays honest and account controls do not fake a session @e2e", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(
    page.getByText("Custom SMTP delivery still requires owner verification", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("synthetic-test-password");
  await expect(page.getByLabel("Email address")).toHaveJSProperty("validity.valid", false);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeDisabled();
  await expect(
    page.getByText("Authentication is not configured in this local preview").first(),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Account security" })).toBeVisible();
  await expect(
    page.getByText("Authentication is not configured in this local demo."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
});

test("owner-requested login/signup aliases and numeric OTP verification render real auth @e2e", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByTestId("preview-access-note")).toBeVisible();
  await page.goto("/signup");
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(page.getByRole("heading", { name: "Create your creator account" })).toBeVisible();
  await expect(page.getByTestId("preview-access-note")).toBeVisible();
  await page.goto("/auth/verify-email");
  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
  await expect(page.getByTestId("otp-form")).toBeVisible();
  await expect(page.getByTestId("preview-access-note")).toBeVisible();
  await expect(page.locator('[data-testid^="otp-digit-"]')).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Resend code" })).toBeDisabled();
  await expect(page.getByTestId("otp-cooldown")).toContainText("Resend available in 60 seconds");
  await expect(
    page.getByText("Authentication is not configured in this local preview").first(),
  ).toBeVisible();
  await page.goto("/onboarding");
  await expect(
    page.getByRole("heading", { name: "Set up your workspace", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Authentication is not configured in this local preview").first(),
  ).toBeVisible();
});

test("six-digit OTP entry supports paste and backspace without storing a code @e2e", async ({
  page,
}) => {
  await page.goto("/auth/verify-email");
  const inputs = page.locator('[data-testid^="otp-digit-"]');
  await expect(inputs).toHaveCount(6);
  // The local preview has no Supabase public config, so the controls are disabled
  // with an exact reason. Programmatic events still exercise the client handlers.
  await expect(
    page.getByText("Authentication is not configured in this local preview").first(),
  ).toBeVisible();
  await page.evaluate(() => {
    const target = document.querySelector(".otp-inputs");
    if (!target) throw new Error("OTP group missing");
    const data = new DataTransfer();
    data.setData("text/plain", "123456");
    target.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  for (const [index, digit] of ["1", "2", "3", "4", "5", "6"].entries()) {
    await expect(inputs.nth(index)).toHaveValue(digit);
  }
  await expect(page.locator('input[name="token"]')).toHaveValue("123456");
  await page.evaluate(() => {
    const second = document.querySelector('[data-testid="otp-digit-2"]');
    if (!second) throw new Error("Second OTP input missing");
    second.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Backspace", bubbles: true, cancelable: true }),
    );
  });
  await expect(page.locator('input[name="token"]')).toHaveValue("13456");
  await expect(page.getByText("Codes are never stored by Up17", { exact: false })).toBeVisible();
});

test("legacy signup confirmation links are rejected and unsafe next targets stay internal @e2e", async ({
  page,
}) => {
  await page.goto(
    "/auth/confirm?token_hash=synthetic-test-hash&type=signup&next=https://evil.invalid",
  );
  await expect(page).toHaveURL(/\/sign-in\?error=expired-link$/);
  await expect(page.locator('p[role="alert"]')).toContainText("invalid or expired");
  await page.goto("/auth/callback?code=synthetic-test-code&next=https://evil.invalid");
  await expect(page).toHaveURL(/\/sign-in\?error=expired-link$/);
  await expect(page.locator('p[role="alert"]')).toContainText("invalid or expired");
});

test("media access requires same-origin JSON and never returns a demo signed URL @e2e", async ({
  request,
}) => {
  const sameOrigin = new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:3100").origin;
  const cross = await request.post("/api/media/access", {
    data: { videoId: "11111111-1111-4111-8111-111111111111" },
    headers: { Origin: "https://evil.invalid" },
  });
  expect(cross.status()).toBe(403);
  const missing = await request.post("/api/media/access", {
    data: { videoId: "11111111-1111-4111-8111-111111111111" },
    headers: { Origin: sameOrigin },
  });
  expect(missing.status()).toBe(404);
  expect(missing.headers()["cache-control"]).toContain("no-store");
  expect(await missing.json()).not.toHaveProperty("url");
});

test("session-bearing navigation is not publicly cacheable @e2e", async ({ request }) => {
  const response = await request.get("/settings");
  expect(response.headers()["cache-control"]).toContain("no-store");
});

for (const route of ["/sign-in", "/sign-up", "/reset-password", "/auth/verify-email"]) {
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
