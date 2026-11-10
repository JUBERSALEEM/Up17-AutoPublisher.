import { expect, test, type Page } from "@playwright/test";
import {
  allDestinations,
  designSystemDestination,
  mobilePrimaryHrefs,
  type Destination,
} from "../../lib/navigation";
import { THEME_STORAGE_KEY, themes } from "../../lib/themes";

test.setTimeout(180_000);

type Mode = "desktop" | "mobile";

const routeContent: Record<string, { heading: string; signature: string }> = {
  "/": { heading: "Your next great clip starts here.", signature: "Welcome to" },
  "/video-studio": { heading: "Video Studio", signature: "One source, many possibilities." },
  "/ai-content": { heading: "AI Content", signature: "No model has run" },
  "/scheduler": { heading: "Smart Scheduler", signature: "Plan demo slots" },
  "/queue": { heading: "Publishing Queue", signature: "never submits a real publication" },
  "/creator-studio": {
    heading: "Creator Studio",
    signature: "Shape the title, cover and settings",
  },
  "/research": { heading: "Research Centre", signature: "Live research is not connected" },
  "/performance": { heading: "Performance Lab", signature: "No analytics are connected" },
  "/accounts": { heading: "Accounts", signature: "No real identity is connected" },
  "/settings": { heading: "Settings", signature: "Personalize the local experience" },
  "/notifications": { heading: "Notifications", signature: "interface examples" },
  "/design-system": {
    heading: "Design System",
    signature: "Clay-first creator studio foundation",
  },
};

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText;
    // Next.js cancels superseded RSC prefetches and in-flight static chunks when a
    // real navigation/reload replaces the document. Final route/content assertions
    // below still have to pass; console/page errors and HTTP >=400 remain failures.
    if (
      failure === "net::ERR_ABORTED" &&
      (request.url().includes("_rsc=") || request.url().includes("/_next/static/"))
    )
      return;
    errors.push(`requestfailed: ${request.url()} ${failure ?? "unknown"}`);
  });
  return errors;
}

async function expectRoute(page: Page, item: Destination, mode: Mode) {
  const content = routeContent[item.href];
  await expect(page).toHaveURL(new RegExp(`${item.href === "/" ? "/$" : `${item.href}$`}`));
  await expect(page.getByRole("heading", { level: 1, name: content.heading })).toBeVisible();
  await expect(page.locator("main").first()).toContainText(content.signature);
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  if (item.href === designSystemDestination.href) {
    await expect(
      page
        .getByRole("navigation", { name: "Design system navigation" })
        .getByRole("link", { name: "Design System", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    return;
  }

  if (mode === "desktop") {
    const link =
      item.href === "/notifications"
        ? page.getByRole("link", { name: "Notifications", exact: true })
        : page
            .getByRole("navigation", { name: "Main navigation", exact: true })
            .getByRole("link", { name: item.label, exact: true });
    await expect(link).toHaveAttribute("aria-current", "page");
    return;
  }

  if ((mobilePrimaryHrefs as readonly string[]).includes(item.href)) {
    await expect(
      page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByRole("link", { name: item.shortLabel, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    return;
  }

  const more = page.getByRole("button", { name: "More destinations" });
  await expect(more).toHaveAttribute("aria-current", "page");
  await more.click();
  const dialog = page.getByRole("dialog", { name: "Your creator workspace" });
  await expect(dialog.getByRole("link", { name: item.label, exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
}

async function clickDestination(page: Page, item: Destination, mode: Mode) {
  if (mode === "desktop") {
    if (item.href === "/notifications") {
      await page.getByRole("link", { name: "Notifications", exact: true }).click();
      return;
    }
    if (item.href === designSystemDestination.href) {
      await page.getByRole("button", { name: "Local profile menu" }).click();
      await page.getByRole("link", { name: "Design System", exact: true }).click();
      return;
    }
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("link", { name: item.label, exact: true })
      .click();
    return;
  }

  if ((mobilePrimaryHrefs as readonly string[]).includes(item.href)) {
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: item.shortLabel, exact: true })
      .click();
    return;
  }

  await page.getByRole("button", { name: "More destinations" }).click();
  const dialog = page.getByRole("dialog", { name: "Your creator workspace" });
  await dialog.getByRole("link", { name: item.label, exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

for (const theme of themes) {
  for (const mode of ["desktop", "mobile"] as const) {
    test(`${mode} navigation changes every screen in ${theme.label} @e2e @navigation`, async ({
      page,
    }) => {
      await page.setViewportSize(
        mode === "desktop" ? { width: 1440, height: 1000 } : { width: 390, height: 844 },
      );
      const errors = collectBrowserErrors(page);
      await page.goto("/");
      await page.getByRole("button", { name: "Choose theme" }).click();
      await page.getByRole("button", { name: theme.label, exact: true }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme.id);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme.id);
      expect(await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)).toBe(
        theme.id,
      );

      for (const item of allDestinations) {
        // Start from a different screen so Back has a real in-app history entry.
        const start = item.href === "/" ? "/settings" : "/";
        const startItem = allDestinations.find((candidate) => candidate.href === start)!;
        await page.goto(start);
        await expectRoute(page, startItem, mode);
        await clickDestination(page, item, mode);
        await expectRoute(page, item, mode);
        await page.reload();
        await expectRoute(page, item, mode);
        await page.goBack();
        await expectRoute(page, startItem, mode);
        await page.goForward();
        await expectRoute(page, item, mode);
        await page.goto(item.href);
        await expectRoute(page, item, mode);
      }

      expect(errors).toEqual([]);
    });
  }
}

test("mobile More menu exposes all twelve destinations @e2e @navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "More destinations" }).click();
  const dialog = page.getByRole("dialog", { name: "Your creator workspace" });
  await expect(dialog.getByRole("link")).toHaveCount(12);
  for (const item of allDestinations) {
    await expect(dialog.getByRole("link", { name: item.label, exact: true })).toHaveAttribute(
      "href",
      item.href,
    );
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("design system has a unique screen and a working return link @e2e @navigation", async ({
  page,
}) => {
  await page.goto("/design-system");
  await expect(page.getByRole("heading", { name: "Design System", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to Overview" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Your next great clip starts here." }),
  ).toBeVisible();
});

test("search reaches the design system utility @e2e @navigation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await page.getByRole("searchbox", { name: "Search destinations" }).fill("design");
  await page.getByRole("link", { name: /Design System.*Theme tokens/ }).click();
  await expect(page).toHaveURL(/\/design-system$/);
  await expect(page.getByRole("heading", { name: "Design System", exact: true })).toBeVisible();
});

test("rapid navigation settles on the final distinct screen @e2e @navigation", async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
  for (const label of ["Video Studio", "AI Content", "Publishing Queue", "Settings"]) {
    await nav.getByRole("link", { name: label, exact: true }).click();
  }
  await expectRoute(
    page,
    allDestinations.find((item) => item.href === "/settings")!,
    "desktop",
  );
  expect(errors).toEqual([]);
});

test("development clears an inherited production service worker @e2e @navigation @dev", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.reload();
  await page.waitForFunction(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.length === 0;
  });
  // An unregistered worker can still control the document that performed the
  // unregister until that document is closed. Open a genuinely fresh document in
  // the same context after the registration count reaches zero. CacheStorage
  // deletion is best-effort in the provider; without a registration it cannot
  // serve stale development chunks.
  const fresh = await page.context().newPage();
  await fresh.goto("/");
  await fresh.waitForFunction(() => navigator.serviceWorker.controller === null);
  expect(await fresh.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
  expect(
    await fresh.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
  ).toBe(0);
  await fresh
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Video Studio", exact: true })
    .click();
  await expectRoute(
    fresh,
    allDestinations.find((item) => item.href === "/video-studio")!,
    "desktop",
  );
  await fresh.close();
});
