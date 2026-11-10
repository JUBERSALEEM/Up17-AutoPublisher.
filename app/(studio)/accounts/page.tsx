import { AccountsBoard } from "@/components/accounts/accounts-board";
import { RealAccountsBoard } from "@/components/accounts/real-accounts-board";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { providerAvailability } from "@/lib/connections/providers";
import type { RealConnection } from "@/lib/connections/types";

export const metadata = { title: "Accounts" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const workspace = await getWorkspaceContext();
  if (!workspace) return <AccountsBoard />;
  const client = await createSupabaseServerClient();
  const params = await searchParams;
  const notice =
    params.connection === "authorized"
      ? "Official authorization completed. The account is connected; publishing remains disabled."
      : params.connection === "denied"
        ? "Authorization was denied or cancelled. No account was connected."
        : params.connection === "invalid"
          ? "Authorization link expired or did not match this browser session. Start again."
          : params.connection === "failed"
            ? "Authorization could not be completed. Check provider setup and try again."
            : null;
  let connections: RealConnection[] = [];
  if (client) {
    const { data } = await client
      .from("platform_connections")
      .select(
        "id,platform,provider_account_id,display_name,state,granted_scopes,last_verified_at,last_error_code,social_accounts(handle,paused,publishing_enabled)",
      )
      .eq("workspace_id", workspace.workspaceId)
      .order("created_at", { ascending: false });
    connections = (data ?? []).map((row) => {
      const account = Array.isArray(row.social_accounts)
        ? row.social_accounts[0]
        : row.social_accounts;
      return {
        id: row.id,
        platform: row.platform as RealConnection["platform"],
        providerAccountId: row.provider_account_id,
        displayName: row.display_name,
        state: row.state as RealConnection["state"],
        grantedScopes: row.granted_scopes ?? [],
        lastVerifiedAt: row.last_verified_at,
        lastErrorCode: row.last_error_code,
        handle: account?.handle ?? null,
        paused: account?.paused ?? true,
        publishingEnabled: account?.publishing_enabled ?? false,
      };
    });
  }
  return (
    <RealAccountsBoard
      connections={connections}
      providers={providerAvailability()}
      canManage={workspace.role === "owner" || workspace.role === "admin"}
      notice={notice}
    />
  );
}
