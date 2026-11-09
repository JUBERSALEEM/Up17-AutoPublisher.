import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export const metadata = { title: "Smart Scheduler" };

export default function Page() {
  return (
    <ScreenPlaceholder
      title="Smart Scheduler"
      description="See drafts and planned publishing times without pretending anything is queued live."
      features={[
        "Calendar and accessible agenda views",
        "Platform and account filters",
        "Timezone clarity and account-specific slots",
      ]}
      availability="No publishing scheduler is connected. Demo schedules are illustrative; real recommendations require account analytics."
    />
  );
}
