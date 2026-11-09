import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { Badge, Card, CardHeader, DemoBadge } from "@/components/ui";

export function ScreenPlaceholder({
  title,
  description,
  features,
  availability,
}: {
  title: string;
  description: string;
  features: string[];
  availability: string;
}) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Creator workspace</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
        <Badge tone="warning" icon={<Construction size={14} />}>
          Screen in progress
        </Badge>
      </div>
      <div className="grid grid-2">
        <Card>
          <CardHeader
            title="Planned for this section"
            description="The navigation shell is ready. The screen implementation follows in the next UI batch."
          />
          <ul className="notes-list">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </Card>
        <Card variant="inset">
          <CardHeader title="Current availability" action={<DemoBadge label="Frontend only" />} />
          <p className="unavailable-note">{availability}</p>
          <Link href="/" className="btn btn-secondary btn-md placeholder-back">
            <ArrowLeft size={17} aria-hidden="true" />
            Back to overview
          </Link>
        </Card>
      </div>
    </div>
  );
}
