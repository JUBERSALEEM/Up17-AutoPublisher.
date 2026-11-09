import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.UP17_TEST_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: {
      // Optional locally reviewed executable; default remains Playwright Chromium.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      args: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? ["--no-sandbox", "--disable-dev-shm-usage"]
        : [],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // pretest:* builds first. Never reuse a stale server or test development HMR.
    // The checked wrapper avoids resolving an older nested global npm CLI.
    command: `node scripts/run-next.mjs start --hostname 0.0.0.0 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
  },
});
