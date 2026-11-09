/** Reproducibly rasterize the original SVG icons with local Playwright Chromium. */
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  args: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? ["--no-sandbox", "--disable-dev-shm-usage"]
    : [],
});
try {
  for (const [source, output, size] of [
    ["icon.svg", "icon-192.png", 192],
    ["icon.svg", "icon-512.png", 512],
    ["maskable.svg", "maskable-512.png", 512],
  ]) {
    const svg = await readFile(new URL(`../public/icons/${source}`, import.meta.url), "utf8");
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<body style="margin:0">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`,
    );
    await page.locator("svg").screenshot({
      path: new URL(`../public/icons/${output}`, import.meta.url).pathname,
      omitBackground: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
