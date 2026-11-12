import { NextResponse, type NextRequest } from "next/server";
import { bootstrapFirstWorkspace } from "@/lib/auth/workspace-actions";
import { getAccountSession } from "@/lib/auth/session";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { authDiagnosticReference, recordAuthDiagnostic } from "@/lib/auth/diagnostics";
import {
  workspaceDestination,
  workspaceSetupFailurePath,
  workspaceSetupFailureReason,
} from "@/lib/auth/workspace-setup";

export const dynamic = "force-dynamic";

/**
 * First-workspace initialization belongs in a Route Handler, never a Server
 * Component render. This is a fresh request after sign-in/OTP verification, so
 * the auth cookies are committed and `getAccountSession()` validates the user
 * before the RPC. `revalidatePath()` inside bootstrap is legal in this context.
 */
export async function GET(request: NextRequest) {
  const next = workspaceDestination(request.nextUrl.searchParams.get("next"));
  const fail = (reason: Parameters<typeof workspaceSetupFailurePath>[1]) =>
    NextResponse.redirect(
      new URL(workspaceSetupFailurePath(next, workspaceSetupFailureReason(reason)), request.url),
    );
  const session = await getAccountSession();
  if (!session)
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url));
  if (!session.confirmed)
    return NextResponse.redirect(
      new URL(`/auth/verify-email?next=${encodeURIComponent(next)}`, request.url),
    );

  const reference = authDiagnosticReference();
  try {
    const result = await bootstrapFirstWorkspace();
    if (!result.ok) return fail(result.reason ?? "unavailable");
    // Read the committed membership/preferences through RLS before sending the
    // browser to a workspace route. A stale render cannot show a missing context.
    const workspace = await getWorkspaceContext();
    if (!workspace) {
      recordAuthDiagnostic({
        stage: "bootstrap-workspace",
        action: "route.workspace.setup.context-missing",
        outcome: "auth-unavailable",
        reference,
      });
      return fail("unavailable");
    }
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    recordAuthDiagnostic({
      stage: "bootstrap-workspace",
      action: "route.workspace.setup",
      outcome: "unexpected-exception",
      reference,
      error,
    });
    return fail("unavailable");
  }
}
