import { ScreenPlaceholder } from "@/components/shell/screen-placeholder";

export const metadata = { title: "Settings" };

export default function Page() {
  return (
    <ScreenPlaceholder
      title="Settings"
      description="Make the workspace feel like yours, with clear privacy and availability boundaries."
      features={[
        "Four-theme appearance controls",
        "Workspace and notification preferences",
        "Privacy, security and application information",
      ]}
      availability="Appearance is saved in this browser. Authentication, cloud sync, export and deletion require later approved services."
    />
  );
}
