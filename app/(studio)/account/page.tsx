import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, LogOut } from "lucide-react";
import { Badge, Button, Card, CardHeader, Unavailable } from "@/components/ui";
import { PageHeader } from "@/components/features/common";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { signOut } from "@/lib/auth/actions";
import { selectWorkspace } from "@/lib/auth/workspace-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const metadata = { title: "Account security" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!getSupabaseConfig())
    return (
      <div className="page">
        <PageHeader
          title="Account security"
          description="Authentication is not configured in this local demo."
        />
        <Link href="/settings" className="text-link">
          Return to local settings
        </Link>
      </div>
    );
  const workspace = await getWorkspaceContext();
  if (!workspace) redirect("/sign-in?next=/account");
  const params = await searchParams;
  const client = await createSupabaseServerClient();
  const { data: memberships } = await client!
    .from("workspace_members")
    .select("workspace_id,role,workspaces(name)")
    .eq("user_id", workspace.userId)
    .order("created_at");
  const options = (memberships ?? []).map((m) => ({
    id: m.workspace_id,
    name: (m.workspaces as unknown as { name: string }).name,
    role: m.role,
  }));
  return (
    <div className="page">
      <PageHeader
        eyebrow="Your private creator account"
        title="Account security"
        description="Manage your authenticated session. Social-platform connections are a separate, not-yet-connected service."
        actions={<Badge tone="success">Signed in</Badge>}
      />
      {params.password === "updated" ? (
        <p className="save-notice" role="status">
          Password updated. Other sessions were signed out.
        </p>
      ) : null}
      <Card className="settings-section">
        <CardHeader
          title="Session"
          description="Verified by the authentication server on each request."
        />
        <dl className="metadata-grid">
          <div>
            <dt>Email</dt>
            <dd>{workspace.email}</dd>
          </div>
          <div>
            <dt>Workspace</dt>
            <dd>{workspace.preferences.name}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{workspace.role}</dd>
          </div>
          <div>
            <dt>Social accounts</dt>
            <dd>Not connected</dd>
          </div>
        </dl>
        <div className="account-actions">
          <form action={signOut}>
            <Button type="submit" icon={<LogOut size={17} />}>
              Sign out
            </Button>
          </form>
          <Link href="/reset-password" className="btn btn-secondary btn-md">
            Change password by email
          </Link>
        </div>
      </Card>
      {options.length > 1 ? (
        <Card className="settings-section">
          <CardHeader
            title="Active workspace"
            description="You belong to multiple workspaces. Choose which private workspace the studio uses."
          />
          <form action={selectWorkspace} className="row row-wrap">
            <select
              name="workspaceId"
              defaultValue={workspace.workspaceId}
              className="input"
              aria-label="Active workspace"
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} · {option.role}
                </option>
              ))}
            </select>
            <Button type="submit">Switch workspace</Button>
          </form>
        </Card>
      ) : null}
      <Card className="settings-section">
        <CardHeader
          title="Privacy controls"
          description="Cloud data and browser demo data are separate."
        />
        <ShieldCheck size={24} />
        <Unavailable
          feature="Cloud export and account deletion"
          reason="A verified retention/deletion workflow is still required. Do not use the local demo reset as a cloud deletion tool."
        />
      </Card>
    </div>
  );
}
