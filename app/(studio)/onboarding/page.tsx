import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Badge, Button, Card, CardHeader } from "@/components/ui";
import { PageHeader } from "@/components/features/common";
import { getAccountSession } from "@/lib/auth/session";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { bootstrapFirstWorkspace } from "@/lib/auth/workspace-actions";
import {
  WORKSPACE_SETUP_FAILURE_MESSAGES,
  workspaceDestination,
  workspaceSetupFailurePath,
  workspaceSetupFailureReason,
  workspaceSetupPath,
} from "@/lib/auth/workspace-setup";
import { supabaseConfigAvailable } from "@/lib/supabase/config";

export const metadata = { title: "Set up your workspace" };

/** Manual retry remains a Server Action: mutations and revalidation never run during render. */
async function retrySetup(form: FormData): Promise<void> {
  "use server";
  const next = workspaceDestination(form.get("next"));
  const result = await bootstrapFirstWorkspace();
  if (result.ok) redirect(next);
  redirect(workspaceSetupFailurePath(next, workspaceSetupFailureReason(result.reason)));
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = workspaceDestination(params.next);
  if (!supabaseConfigAvailable())
    return (
      <div className="page">
        <PageHeader
          eyebrow="Verified workspace setup"
          title="Set up your workspace"
          description="Authentication is not configured in this local preview."
        />
        <Card className="settings-section">
          <CardHeader
            title="Configuration required"
            description="Set the public Supabase URL and publishable key in the deployment to enable the real signup and onboarding flow."
          />
          <Link href="/" className="text-link">
            Back to sample-data overview
          </Link>
        </Card>
      </div>
    );
  const session = await getAccountSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!session.confirmed) redirect(`/auth/verify-email?next=${encodeURIComponent(next)}`);
  const workspace = await getWorkspaceContext();
  if (workspace) redirect(next);
  // The setup Route Handler is the only automatic first-load entry point. It
  // follows a committed auth session, performs the RPC in request context and
  // redirects here only with an explicit failure reason.
  if (params.error !== "setup-failed") redirect(workspaceSetupPath(next));
  const reason = workspaceSetupFailureReason(params.reason);
  return (
    <div className="page">
      <PageHeader
        eyebrow="Verified workspace setup"
        title="Set up your private workspace"
        description="Your email is confirmed. The workspace owner role is assigned only by the server-side bootstrap for a first-time verified account."
        actions={<Badge tone="success">Email confirmed</Badge>}
      />
      <Card className="settings-section">
        <CardHeader
          title="Workspace setup needs another try"
          description="The verified bootstrap is idempotent and safe to retry. It derives identity only from the confirmed session."
        />
        <p className="validation-summary" role="alert">
          {WORKSPACE_SETUP_FAILURE_MESSAGES[reason]}
        </p>
        <p className="muted small">
          <ShieldCheck size={15} aria-hidden="true" /> Your account id comes from the verified
          Supabase session. No identity, workspace id or role is supplied by the browser.
        </p>
        <form action={retrySetup} className="stack">
          <input type="hidden" name="next" value={next} />
          <Button type="submit" variant="primary">
            Retry secure workspace setup
          </Button>
          <p className="field-hint">
            Existing members are never promoted to owner. If you already belong to a workspace, this
            page redirects there without changing your role.
          </p>
        </form>
        <div className="row row-wrap">
          <Link href="/login" className="btn btn-secondary btn-md">
            Sign in again
          </Link>
          <Link href="/auth/verify-email" className="text-link">
            Confirmation help
          </Link>
        </div>
      </Card>
    </div>
  );
}
