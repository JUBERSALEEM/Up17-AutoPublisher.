import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export const metadata = { title: "Notifications" };

export default function Page() {
  return (
    <ScreenPlaceholder
      title="Notifications"
      description="Processing, account and publishing updates, without invented success messages."
      features={[
        "Processing and content readiness updates",
        "Publishing outcomes and failures",
        "Authorization and analytics attention items",
      ]}
      availability="No event service is connected. Demo notifications will be labelled; no real publishing success will be shown."
    />
  );
}
