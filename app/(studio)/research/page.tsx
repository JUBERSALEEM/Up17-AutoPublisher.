import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export const metadata = { title: "Research Centre" };

export default function Page() {
  return (
    <ScreenPlaceholder
      title="Research Centre"
      description="Find relevant ideas with sources, freshness and a clear path into a content brief."
      features={[
        "BGMI/PUBG topics and update research",
        "Keywords, hashtags and content questions",
        "Saved ideas and source attribution",
      ]}
      availability="No live research source is connected. Example ideas will be labelled and no patch or trend will be invented."
    />
  );
}
