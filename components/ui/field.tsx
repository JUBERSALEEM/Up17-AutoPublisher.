import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";

interface BaseProps {
  label: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & BaseProps
>(function Input({ label, hint, error, id, className = "", ...props }, ref) {
  const generated = useId();
  const fieldId = id ?? generated;
  const describedBy =
    [hint ? `${fieldId}-hint` : "", error ? `${fieldId}-error` : ""].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field-label" htmlFor={fieldId}>
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        className={`input ${error ? "input-error" : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {hint ? (
        <p className="field-hint" id={`${fieldId}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={`${fieldId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps
>(function Textarea({ label, hint, error, id, className = "", ...props }, ref) {
  const generated = useId();
  const fieldId = id ?? generated;
  const describedBy =
    [hint ? `${fieldId}-hint` : "", error ? `${fieldId}-error` : ""].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field-label" htmlFor={fieldId}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        className={`input textarea ${error ? "input-error" : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {hint ? (
        <p className="field-hint" id={`${fieldId}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={`${fieldId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export function Select({
  label,
  hint,
  error,
  id,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & BaseProps & { children: ReactNode }) {
  const generated = useId();
  const fieldId = id ?? generated;
  const describedBy =
    [hint ? `${fieldId}-hint` : "", error ? `${fieldId}-error` : ""].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field-label" htmlFor={fieldId}>
        {label}
      </label>
      <select
        id={fieldId}
        className={`input select ${error ? "input-error" : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <p className="field-hint" id={`${fieldId}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={`${fieldId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="toggle-row">
      <div>
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        {description ? (
          <p className="field-hint" id={`${id}-desc`}>
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={`toggle ${checked ? "toggle-on" : ""}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}
