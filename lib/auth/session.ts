import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AccountSession {
  id: string;
  email: string;
  name?: string;
  confirmed: boolean;
}

/**
 * Verifies the caller with the auth server. An unconfirmed session is kept
 * distinguishable so signup can recover from an interrupted numeric OTP.
 */
export const getAccountSession = cache(async (): Promise<AccountSession | null> => {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    name: data.user.user_metadata.display_name as string | undefined,
    confirmed: Boolean(data.user.email_confirmed_at),
  };
});

/** Only an email-confirmed, auth-server-verified caller reaches private workspace data. */
export const getViewer = cache(async () => {
  const session = await getAccountSession();
  if (!session?.confirmed) return null;
  return {
    id: session.id,
    email: session.email,
    name: session.name,
  };
});
