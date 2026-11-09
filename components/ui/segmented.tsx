"use client";

import type { ReactNode } from "react";

export function SegmentedControl({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  items: { id: string; label: ReactNode }[];
}) {
  return (
    <div className="tab-list segmented-control" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`tab ${value === item.id ? "tab-active" : ""}`}
          aria-pressed={value === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
