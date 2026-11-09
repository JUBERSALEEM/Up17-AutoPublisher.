import { fileURLToPath } from "node:url";
import { build } from "vite";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../..", import.meta.url));

describe.each([
  "lib/foundation.ts",
  "lib/supabase/config.ts",
  "lib/supabase/server.ts",
  "lib/auth/workspace.ts",
  "lib/media-access.ts",
])("%s server-only boundary", (module) => {
  it("rejects a real browser-condition bundle", async () => {
    const result = await build({
      configFile: false,
      root,
      logLevel: "silent",
      resolve: { alias: { "@": root } },
      build: {
        write: false,
        minify: false,
        lib: {
          entry: fileURLToPath(new URL(`../../../${module}`, import.meta.url)),
          formats: ["es"],
        },
      },
    });
    const output = Array.isArray(result) ? result[0] : result;
    if (!("output" in output)) throw new Error("Expected an in-memory client bundle");
    const chunk = output.output.find((item) => item.type === "chunk");
    if (!chunk) throw new Error("Expected a client bundle chunk");
    const dataUrl = `data:text/javascript;base64,${Buffer.from(chunk.code).toString("base64")}`;
    await expect(import(dataUrl)).rejects.toThrow("cannot be imported from a Client Component");
  }, 20_000);
});
