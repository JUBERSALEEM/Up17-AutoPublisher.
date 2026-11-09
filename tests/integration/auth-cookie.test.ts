import { createServerClient } from "@supabase/ssr";
import { describe, expect, it, vi, afterEach } from "vitest";

afterEach(() => vi.unstubAllGlobals());
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "creator@synthetic.invalid",
  email_confirmed_at: "2026-11-08T00:00:00Z",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-11-08T00:00:00Z",
};
function session(refresh = "refresh") {
  return {
    access_token: "synthetic-test-access",
    refresh_token: `synthetic-test-${refresh}`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
}
function fixture() {
  const jar = new Map<string, { value: string; options: Record<string, unknown> }>();
  const headers: Record<string, string> = {};
  const client = createServerClient(
    "https://project.supabase.co",
    "sb_publishable_synthetic-test",
    {
      cookieOptions: {
        name: "up17-auth",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      },
      cookies: {
        getAll: () => [...jar].map(([name, { value }]) => ({ name, value })),
        setAll: (values, responseHeaders) => {
          values.forEach(({ name, value, options }) => {
            if (value) jar.set(name, { value, options });
            else jar.delete(name);
          });
          Object.assign(headers, responseHeaders);
        },
      },
    },
  );
  return { client, jar, headers };
}
describe("SSR auth cookie adapter contract (local HTTP double, not hosted delivery)", () => {
  it("stores a password session in protected cookies and emits no-store headers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(session())),
    );
    const { client, jar, headers } = fixture();
    const result = await client.auth.signInWithPassword({
      email: user.email,
      password: "synthetic-test-password",
    });
    expect(result.error).toBeNull();
    expect(jar.size).toBeGreaterThan(0);
    for (const { options } of jar.values()) {
      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe("lax");
      expect(options.path).toBe("/");
    }
    expect(headers["Cache-Control"]).toContain("no-store");
    expect(JSON.stringify([...jar])).not.toContain("synthetic-test-password");
  });
  it("verifies the user with the auth server rather than trusting cookie profile data", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/token?grant_type=password")) return Response.json(session());
      if (url.endsWith("/user")) return Response.json(user);
      return Response.json({ msg: "not found" }, { status: 404 });
    });
    vi.stubGlobal("fetch", fetcher);
    const { client } = fixture();
    await client.auth.signInWithPassword({
      email: user.email,
      password: "synthetic-test-password",
    });
    const result = await client.auth.getUser();
    expect(result.data.user?.id).toBe(user.id);
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith("/user"))).toBe(true);
  });
  it("rotates a refresh token through the cookie adapter", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) =>
      String(input).includes("grant_type=refresh_token")
        ? Response.json(session("rotated"))
        : Response.json(session()),
    );
    vi.stubGlobal("fetch", fetcher);
    const { client, jar } = fixture();
    await client.auth.signInWithPassword({
      email: user.email,
      password: "synthetic-test-password",
    });
    const result = await client.auth.refreshSession();
    expect(result.error).toBeNull();
    expect(result.data.session?.refresh_token).toBe("synthetic-test-rotated");
    const stored = [...jar.values()]
      .map(({ value }) => Buffer.from(value.replace(/^base64-/, ""), "base64url").toString("utf8"))
      .join("");
    expect(stored).toContain("synthetic-test-rotated");
  });
  it("clears protected session cookies on sign-out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(session())),
    );
    const { client, jar } = fixture();
    await client.auth.signInWithPassword({
      email: user.email,
      password: "synthetic-test-password",
    });
    await client.auth.signOut({ scope: "local" });
    expect(jar.size).toBe(0);
  });
});
