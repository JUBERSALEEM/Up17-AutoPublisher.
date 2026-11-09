"use client";

import { useId, useRef, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export function Tabs({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = items.find((item) => item.id === value) ?? items[0];
  return (
    <div className="tabs">
      <div className="tab-list" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${item.id}`}
            aria-selected={item.id === active.id}
            aria-controls={`${base}-panel-${item.id}`}
            tabIndex={item.id === active.id ? 0 : -1}
            disabled={item.disabled}
            className={`tab ${item.id === active.id ? "tab-active" : ""}`}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => {
              const enabled = items.map((it, i) => ({ it, i })).filter(({ it }) => !it.disabled);
              const current = enabled.findIndex(({ it }) => it.id === item.id);
              let next: number | null = null;
              if (event.key === "ArrowRight") next = (current + 1) % enabled.length;
              if (event.key === "ArrowLeft") next = (current - 1 + enabled.length) % enabled.length;
              if (event.key === "Home") next = 0;
              if (event.key === "End") next = enabled.length - 1;
              if (next !== null) {
                event.preventDefault();
                const target = enabled[next];
                onChange(target.it.id);
                refs.current[target.i]?.focus();
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-panel-${item.id}`}
          aria-labelledby={`${base}-tab-${item.id}`}
          hidden={item.id !== active.id}
          className="tab-panel"
          tabIndex={0}
        >
          {item.id === active.id ? item.content : null}
        </div>
      ))}
    </div>
  );
}
