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

  it("keeps deployment readiness server-only and the Accounts board value-free", () => {
    const readiness = readFileSync("lib/connections/deployment-readiness.ts", "utf8");
    expect(readiness).toContain('import "server-only";');
    const board = readFileSync("components/accounts/real-accounts-board.tsx", "utf8");
    expect(board).not.toContain("process.env");
    expect(board).not.toMatch(/SUPABASE_(?:SERVICE_ROLE|SECRET)_KEY\s*=/);
    expect(board).not.toMatch(/UP17_TOKEN_KEYS\s*=/);
  });

  it("keeps provider codes off the protected app callback and uses one-time receipts", () => {
    const callback = readFileSync("app/api/connections/callback/[platform]/route.ts", "utf8");
    expect(callback).toContain('url.searchParams.has("code")');
    expect(callback).toContain("consumeBridgeReceipt");
    const start = readFileSync("app/api/connections/start/route.ts", "utf8");
    expect(start).toContain("callbackBridgeUrl");
    expect(start).toContain("bridgeAuthorizeUrl");
  });
});

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : /\.tsx?$/.test(path) ? [path] : [];
  });
}
