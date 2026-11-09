"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function Popover({
  label,
  trigger,
  children,
  className = "",
}: {
  label: string;
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const pointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  const close = () => setOpen(false);
  return (
    <div ref={root} className={`popover ${className}`}>
      <button
        ref={button}
        type="button"
        className="icon-btn icon-btn-secondary"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </button>
      <div id={id} className="popover-panel" hidden={!open}>
        {typeof children === "function" ? children(close) : children}
      </div>
    </div>
  );
}
