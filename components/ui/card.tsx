import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "raised" | "inset" | "flat";
  as?: "div" | "section" | "article" | "aside";
}

export function Card({
  variant = "raised",
  as: Tag = "div",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Tag className={`card card-${variant} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="card-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="card-title">{title}</h2>
        {description ? <p className="card-description">{description}</p> : null}
      </div>
      {action ? <div className="card-action">{action}</div> : null}
    </div>
  );
}
