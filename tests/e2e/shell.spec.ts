import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { allDestinations, destinations } from "../../lib/navigation";
import { themeIds } from "../../lib/themes";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("desktop sidebar reaches every canonical destination @e2e", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await expect(nav.getByRole("link")).toHaveCount(10);
  for (const item of destinations) {
    await nav.getByRole("link", { name: item.label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${item.href === "/" ? "/$" : item.href + "$"}`));
    await expect(nav.getByRole("link", { name: item.label, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("phone More menu reaches supporting destinations @e2e", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.getByRole("button", { name: "More destinations" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link")).toHaveCount(11);
  await dialog.getByRole("link", { name: "Research Centre", exact: true }).click();
  await expect(page).toHaveURL(/\/research$/);
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Research Centre", exact: true })).toBeVisible();
});

test("search, workspace details and profile menu have real behavior @e2e", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await page.getByRole("searchbox", { name: "Search destinations" }).fill("queue");
  await page.getByRole("link", { name: /Publishing Queue.*Independent account jobs/ }).click();
  await expect(page).toHaveURL(/\/queue$/);
  await page.getByRole("button", { name: /Up17 Gaming/ }).click();
  await expect(page.getByRole("dialog")).toContainText("@up17longshotyt");
  await expect(page.getByRole("button", { name: "Create workspace unavailable" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Local profile menu" }).click();
  await expect(page.getByRole("link", { name: "Design system", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Local profile menu" })).toBeFocused();
});

test("shell theme menu persists and dismisses accessibly @e2e", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Choose theme" }).click();
  await page.getByRole("button", { name: "Bento Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "bento-dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "bento-dark");
  await page.getByRole("button", { name: "Choose theme" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Choose theme" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Bento Dark" })).not.toBeVisible();
});

for (const item of allDestinations) {
  test(`${item.label} shell has no automated accessibility violations @a11y`, async ({ page }) => {
    await page.goto(item.href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(
      results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  });
}

for (const theme of themeIds) {
  test(`overview shell passes axe in ${theme} @a11y`, async ({ page }) => {
    await page.addInitScript((id) => localStorage.setItem("up17.theme.preference.v1", id), theme);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(
      results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  });
}

for (const width of [320, 360, 390, 430, 768, 1440]) {
  test(`shell fits ${width}px without page overflow @visual`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (width < 1024) {
      const mobileNav = page.getByRole("navigation", { name: "Mobile navigation" });
      await expect(mobileNav).toBeVisible();
      for (const link of await mobileNav.getByRole("link").all()) {
        const box = await link.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    } else
      await expect(
        page.getByRole("navigation", { name: "Main navigation", exact: true }),
      ).toBeVisible();
  });
}

test("PWA manifest, safe cache and offline fallback work @e2e", async ({ page, context }) => {
  await page.goto("/");
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).start_url).toBe("/");
  for (const icon of ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png"])
    expect((await page.request.get(icon)).ok()).toBe(true);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }),
      );
  });
  const cacheUrls = await page.evaluate(async () => {
    const keys = await caches.keys();
    const entries = await Promise.all(
      keys
        .filter((key) => key.startsWith("up17-shell-"))
        .map(async (key) =>
          (await (await caches.open(key)).keys()).map((request) => new URL(request.url).pathname),
        ),
    );
    return entries.flat();
  });
  expect(cacheUrls).toContain("/offline.html");
  expect(
    cacheUrls.every(
      (path) =>
        path === "/offline.html" || path.startsWith("/icons/") || path.startsWith("/_next/static/"),
    ),
  ).toBe(true);
  await context.setOffline(true);
  await page.goto("/accounts");
  await expect(page.getByRole("heading", { name: "You’re offline" })).toBeVisible();
  await context.setOffline(false);
});
