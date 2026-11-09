import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export const metadata = { title: "Creator Studio" };

export default function Page() {
  return (
    <ScreenPlaceholder
      title="Creator Studio"
      description="Prepare a shared video into independent packages for each destination account."
      features={[
        "Title, description, hashtags and tags",
        "Per-platform settings and thumbnail selection",
        "Account selection, schedule and validation",
      ]}
      availability="Saving drafts will be browser-local in this UI phase. Publishing and platform validation remain unavailable."
    />
  );
}
