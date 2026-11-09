import { Layers } from "lucide-react";
import { Badge, Card, CardHeader, DemoBadge } from "@/components/ui";
import { PreviewControls } from "@/components/design-system/preview-controls";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export default function FoundationPage() {
  return (
    <main className="page" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
      <div className="page-header">
        <div>
          <p className="eyebrow">Design system preview</p>
          <h1 className="page-title">Up17 AutoPublisher</h1>
          <p className="page-subtitle">
            Clay-first creator studio foundation. This is a local interface preview, not a connected
            product.
          </p>
        </div>
        <DemoBadge label="Demo mode" />
      </div>
      <Card>
        <CardHeader
          title="Theme engine"
          description="Four token-driven appearances. Clay Light is the default; an unsaved preference follows system appearance."
          action={
            <Badge tone="primary" icon={<Layers size={14} />}>
              4 themes
            </Badge>
          }
        />
        <ThemeSwitcher />
      </Card>
      <PreviewControls />
    </main>
  );
}
