import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export const metadata = { title: "Publishing Queue" };

export default function Page() {
  return (
    <ScreenPlaceholder
      title="Publishing Queue"
      description="Follow each account’s publishing work independently."
      features={[
        "Upcoming, draft, scheduled and failed views",
        "Platform/account filters and job details",
        "Clear retry and attention explanations",
      ]}
      availability="No publishing engine is connected. Demo jobs never report a real publication; retry actions stay unavailable."
    />
  );
}
