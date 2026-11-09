"use client";

import { useSyncExternalStore } from "react";

interface CacheEntry {
  raw: string | null;
  value: unknown;
}
const cache = new Map<string, CacheEntry>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => {
    if (event.key) cache.delete(event.key);
    listener();
  };
  window.addEventListener("storage", storage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", storage);
  };
}

/** Browser-local demo state with a stable snapshot and an in-memory fallback. */
export function readBrowserValue<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => T | null,
): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return (cache.get(key)?.value as T) ?? fallback;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value = fallback;
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      value = validate(parsed) ?? fallback;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeBrowserValue<T>(key: string, value: T): boolean {
  const raw = JSON.stringify(value);
  cache.set(key, { raw, value });
  let persisted = true;
  try {
    localStorage.setItem(key, raw);
  } catch {
    persisted = false;
  }
  emit();
  return persisted;
}

export function removeBrowserValue(key: string): void {
  cache.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    /* in-memory reset still applies */
  }
  emit();
}

export function useBrowserValue<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => T | null,
): T {
  return useSyncExternalStore(
    subscribe,
    () => readBrowserValue(key, fallback, validate),
    () => fallback,
  );
}
