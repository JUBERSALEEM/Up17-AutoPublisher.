import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Badge, Button, Card, CardHeader } from "@/components/ui";
import { PageHeader } from "@/components/features/common";
import { getAccountSession } from "@/lib/auth/session";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { bootstrapFirstWorkspace } from "@/lib/auth/workspace-actions";
import { safeNext } from "@/lib/auth/redirects";
import { supabaseConfigAvailable } from "@/lib/supabase/config";

export const metadata = { title: "Set up your workspace" };

async function retrySetup(form: FormData): Promise<void> {
  "use server";
  const next = safeNext(form.get("next"));
  const result = await bootstrapFirstWorkspace();
  if (result.ok) redirect(next);
  redirect(`/onboarding?error=setup-failed&next=${encodeURIComponent(next)}`);
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
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
  if (!session.confirmed)
    redirect(
      `/auth/verify-email?next=${encodeURIComponent("/onboarding?next=" + encodeURIComponent(next))}`,
    );
  const workspace = await getWorkspaceContext();
  if (workspace) redirect(next);
  const result = await bootstrapFirstWorkspace();
  if (result.ok) redirect(next);
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
          description="No owner role or workspace was created by the failed attempt. The verified bootstrap is idempotent and safe to retry."
        />
        <p className="validation-summary" role="alert">
          {params.error === "setup-failed"
            ? "The previous retry did not finish. Confirm your session and try again."
            : result.message}
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
