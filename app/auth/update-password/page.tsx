import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getViewer } from "@/lib/auth/session";
import { supabaseConfigAvailable } from "@/lib/supabase/config";
export const metadata = { title: "Choose a new password" };
export default async function Page() {
  if (!(await getViewer())) redirect("/login?next=/auth/update-password&error=expired-link");
  return <AuthForm mode="update" authAvailable={supabaseConfigAvailable()} />;
}
