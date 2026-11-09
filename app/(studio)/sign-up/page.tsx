import { AuthForm } from "@/components/auth/auth-form";
import { safeNext } from "@/lib/auth/redirects";
export const metadata = { title: "Create account" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="sign-up"
      next={safeNext(params.next)}
      expired={params.error === "expired-link"}
    />
  );
}
