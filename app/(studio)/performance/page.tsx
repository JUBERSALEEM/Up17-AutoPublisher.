import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export const metadata = { title: "Performance Lab" };

export default function Page() {
  return (
    <ScreenPlaceholder
      title="Performance Lab"
      description="Compare content and account performance using only data that actually exists."
      features={[
        "Channel, video and platform comparisons",
        "Views, engagement and retention definitions",
        "Date ranges, experiments and limitations",
      ]}
      availability="No analytics source is connected. Live metrics remain unavailable; any illustrative chart will be explicitly marked Demo data."
    />
  );
}
