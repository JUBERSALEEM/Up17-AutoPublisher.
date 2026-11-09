import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getViewer } from "@/lib/auth/session";
export const metadata = { title: "Choose a new password" };
export default async function Page() {
  if (!(await getViewer())) redirect("/reset-password");
  return <AuthForm mode="update" />;
}
