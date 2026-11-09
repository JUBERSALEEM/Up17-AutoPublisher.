import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export const metadata = { title: "Video Studio" };

export default function Page() {
  return (
    <ScreenPlaceholder
      title="Video Studio"
      description="Your video library, from first import to a ready-to-publish source."
      features={[
        "Searchable card and list library",
        "Video metadata, preview and processing states",
        "Honest upload availability and demo examples",
      ]}
      availability="No media upload or storage service is connected. Demo videos will be labelled and will not imply a real upload."
    />
  );
}
