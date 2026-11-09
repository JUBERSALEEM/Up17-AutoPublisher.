import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Card } from "./card";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card variant="inset" className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        {icon ?? <Inbox size={26} />}
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </Card>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function Unavailable({ feature, reason }: { feature: string; reason: string }) {
  return (
    <p className="unavailable-note">
      <strong>{feature} unavailable.</strong> {reason}
    </p>
  );
}
