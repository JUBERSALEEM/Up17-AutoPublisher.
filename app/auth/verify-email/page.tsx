import { cookies } from "next/headers";
import { OtpForm } from "@/components/auth/otp-form";
import { safeNext } from "@/lib/auth/redirects";
import { supabaseConfigAvailable } from "@/lib/supabase/config";

export const metadata = { title: "Verify your email" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pendingEmail = (await cookies()).get("up17_pending_email")?.value ?? "";
  return (
    <OtpForm
      next={safeNext(params.next)}
      expired={params.error === "expired-link"}
      authAvailable={supabaseConfigAvailable()}
      defaultEmail={pendingEmail}
    />
  );
}
