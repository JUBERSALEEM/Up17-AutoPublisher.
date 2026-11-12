import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("first-workspace initialization boundaries", () => {
  it("never mutates or revalidates during Server Component render", () => {
    const page = read("app/(studio)/onboarding/page.tsx");
    expect(page).toContain('"use server"');
    expect(page).toContain(
      'if (params.error !== "setup-failed") redirect(workspaceSetupPath(next))',
    );
    const renderPath = page.slice(page.indexOf("export default async function Page"));
    expect(renderPath).not.toContain("bootstrapFirstWorkspace(");
    expect(page.match(/bootstrapFirstWorkspace\(/g)).toHaveLength(1);
  });

  it("runs the automatic first-load write in a fresh GET Route Handler", () => {
    const route = read("app/workspace/setup/route.ts");
    expect(route).toContain('export const dynamic = "force-dynamic"');
    expect(route).toContain("const session = await getAccountSession()");
    expect(route).toContain("const result = await bootstrapFirstWorkspace()");
    expect(route).toContain("const workspace = await getWorkspaceContext()");
    expect(route.indexOf("getAccountSession()")).toBeLessThan(
      route.indexOf("bootstrapFirstWorkspace()"),
    );
  });

  it("routes both password sign-in and OTP verification through the setup handler", () => {
    const actions = read("lib/auth/actions.ts");
    expect(actions.match(/workspaceSetupPath\(form\.get\("next"\)\)/g)).toHaveLength(2);
    expect(actions).toContain(
      "await (await client(reference)).auth.signInWithPassword(parsed.data)",
    );
    expect(actions).toContain('type: "signup"');
    expect(actions).toContain('revalidatePath("/", "layout")');
  });

  it("uses server-provided workspace context without client polling or reloads", () => {
    const layout = read("app/(studio)/layout.tsx");
    const provider = read("features/preferences/preferences-provider.tsx");
    const shell = read("components/shell/app-shell.tsx");
    expect(layout).toContain("getWorkspaceContext()");
    expect(layout).toContain("PreferencesProvider cloud={workspace}");
    expect(provider).toContain("cloud?.preferences ?? local");
    expect(provider).not.toContain("window.location.reload");
    expect(provider).not.toContain("setInterval");
    expect(provider).not.toContain("fetch(");
    expect(shell).not.toContain("fetch(");
  });

  it("keeps the confirmed-session RPC and RLS migrations unchanged", () => {
    const migration = read("supabase/migrations/20261110085716_verified_first_workspace.sql");
    const policies = read("supabase/migrations/20261109113102_up17_foundation_part3.sql");
    expect(migration).toContain("if auth.uid() is null then");
    expect(migration).toContain("v_user.email_confirmed_at is null");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain(
      "grant execute on function public.up17_ensure_first_workspace() to authenticated",
    );
    expect(policies).toContain(
      "members_read on public.workspace_members for select to authenticated",
    );
    expect(policies).toContain("preferences_own on public.preferences for all to authenticated");
  });
});
