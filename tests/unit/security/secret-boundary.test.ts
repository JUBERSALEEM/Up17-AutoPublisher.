import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("client source secret boundary", () => {
  it("contains no provider credentials or public-secret configuration", () => {
    const files = ["app", "lib"].flatMap(walk);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /NEXT_PUBLIC_(?!SUPABASE_PUBLISHABLE_KEY\b|SUPABASE_URL\b).*(SECRET|TOKEN|KEY)/,
      );
      expect(source).not.toMatch(
        /(?:ghp_[A-Za-z0-9]{30,}|sk-proj-[A-Za-z0-9_-]{24,}|-----BEGIN PRIVATE KEY-----)/,
      );
      expect(source).not.toContain("service_role");
    }
  });
});

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : /\.tsx?$/.test(path) ? [path] : [];
  });
}
