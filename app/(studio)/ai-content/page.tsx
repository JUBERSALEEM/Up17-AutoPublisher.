import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export const metadata = { title: "AI Content" };

export default function Page() {
  return (
    <ScreenPlaceholder
      title="AI Content"
      description="Understand gameplay moments before turning them into account-ready content."
      features={[
        "Analysis status and timestamped timeline",
        "Weapons, maps, fights and clip markers",
        "Confidence, unknowns and AI metadata",
      ]}
      availability="No AI provider is connected. Illustrative analysis will be labelled; no gameplay result will be fabricated."
    />
  );
}
