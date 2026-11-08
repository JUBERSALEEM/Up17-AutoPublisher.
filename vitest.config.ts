import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    clearMocks: true,
    passWithNoTests: false,
    // The server export of server-only is intentionally empty; its browser export throws.
    server: { deps: { inline: ["server-only"] } },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
    conditions: ["react-server", "node", "module", "import", "default"],
  },
  ssr: { resolve: { conditions: ["react-server", "node", "module", "import", "default"] } },
});
