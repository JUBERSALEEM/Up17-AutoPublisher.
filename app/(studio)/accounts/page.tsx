import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export const metadata = { title: "Accounts" };

export default function Page() {
  return (
    <ScreenPlaceholder
      title="Accounts"
      description="Manage the identities and permissions behind each publishing destination."
      features={[
        "YouTube, Instagram and TikTok account cards",
        "Multiple identities per platform",
        "Connection, pause and authorization status",
      ]}
      availability="No OAuth or account connection is available in this frontend phase. All real accounts remain disconnected."
    />
  );
}
