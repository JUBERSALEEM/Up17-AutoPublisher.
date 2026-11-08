import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    passWithNoTests: false,
  },
  resolve: { alias: { "@": new URL(".", import.meta.url).pathname } },
});
