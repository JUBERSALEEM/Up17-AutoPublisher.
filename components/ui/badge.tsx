import type { ReactNode } from "react";

export type Tone = "neutral" | "primary" | "accent" | "success" | "warning" | "danger";

export function Badge({
  tone = "neutral",
  children,
  icon,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()}>
      {icon ? (
        <span className="badge-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

export function DemoBadge({ label = "Demo data" }: { label?: string }) {
  return (
    <Badge tone="accent" className="demo-badge">
      {label}
    </Badge>
  );
}
