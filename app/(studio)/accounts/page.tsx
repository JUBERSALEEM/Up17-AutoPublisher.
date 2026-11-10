import { RealAccountsBoard } from "@/components/accounts/real-accounts-board";
import { getAccountsState } from "@/lib/connections/deployment-readiness";

export const metadata = { title: "Accounts" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
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
  const state = await getAccountsState();
  return (
    <RealAccountsBoard
      readiness={state.readiness}
      cards={state.cards}
      connections={state.connections}
      canManage={state.canManage}
      notice={notice}
    />
  );
}
