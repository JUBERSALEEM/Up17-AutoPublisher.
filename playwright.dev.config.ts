import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.UP17_DEV_TEST_PORT ?? 3101);
const baseURL = `http://127.0.0.1:${port}`;

/**
 * Development-mode regressions deliberately exercise Turbopack/HMR rather than a
 * production build. The isolated distDir avoids Next.js's single-dev-server lock
 * so these tests can run while the documented live preview stays on port 3000.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/navigation-dev" }],
  ],
  outputDir: "test-results/navigation-dev",
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      args: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? ["--no-sandbox", "--disable-dev-shm-usage"]
        : [],
    },
  },
  projects: [{ name: "chromium-dev", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `node scripts/run-next.mjs dev --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...process.env, UP17_NEXT_DIST_DIR: ".next-e2e-dev" },
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
  },
});
