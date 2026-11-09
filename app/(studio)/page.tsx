import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export default function OverviewPage() {
  return (
    <ScreenPlaceholder
      title="Welcome to your creator workspace"
      description="A calm place to prepare, schedule and understand your gameplay content. Your dashboard is the next implementation batch."
      features={[
        "Account and platform readiness",
        "Recent videos and processing activity",
        "Queue, schedule and honest performance summaries",
      ]}
      availability="No accounts, videos or analytics are connected. The dashboard will clearly separate demo examples from unavailable live data."
    />
  );
}
