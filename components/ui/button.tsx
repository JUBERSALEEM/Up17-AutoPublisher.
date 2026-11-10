import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  /** Visible, exact explanation whenever the button is disabled. */
  disabledReason?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    icon,
    className = "",
    children,
    disabled,
    disabledReason,
    title,
    type = "button",
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const reasonId = useId();
  const isDisabled = Boolean(disabled || loading);
  const describedBy =
    [ariaDescribedBy, isDisabled && disabledReason ? reasonId : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <>
      <button
        ref={ref}
        type={type}
        className={`btn btn-${variant} btn-${size} ${className}`.trim()}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-describedby={describedBy}
        title={title ?? (isDisabled && disabledReason ? disabledReason : undefined)}
        {...props}
      >
        {loading ? (
          <LoaderCircle className="spin icon" aria-hidden="true" />
        ) : icon ? (
          <span className="icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {children ? <span>{children}</span> : null}
      </button>
      {isDisabled && disabledReason ? (
        <p id={reasonId} className="field-hint small button-disabled-reason sr-only">
          {disabledReason}
        </p>
      ) : null}
    </>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "ghost", className = "", children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={`icon-btn icon-btn-${variant} ${className}`.trim()}
      {...props}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
});
