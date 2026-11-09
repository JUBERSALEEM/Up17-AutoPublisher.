import type { NotificationCategory } from "@/features/preferences/model";
export const READ_KEY = "up17.demo.notification-reads.v1";
export interface DemoNotification {
  id: string;
  source: "demo";
  category: NotificationCategory;
  title: string;
  description: string;
  detail: string;
  at: string;
  tone: "neutral" | "primary" | "accent" | "success" | "warning" | "danger";
  href: string;
}
/** Interface examples, not event-service records. There are no real success/expiry/sync events. */
export const demoNotifications: readonly DemoNotification[] = [
  {
    id: "notice-1",
    source: "demo",
    category: "accounts",
    title: "Your creator workflow needs a connection",
    description: "No real account is connected. This is an example of an action-required notice.",
    detail:
      "Official OAuth, consent and capability checks are planned for a separately approved phase. No token has expired because no token exists.",
    at: "2026-11-08T08:45:00+04:00",
    tone: "warning",
    href: "/accounts",
  },
  {
    id: "notice-2",
    source: "demo",
    category: "processing",
    title: "A content package is ready to review",
    description: "Demo workflow example — no video was processed and no AI result was generated.",
    detail:
      "The library contains illustrative metadata. Open Creator Studio to write and save your own browser-local draft.",
    at: "2026-11-08T08:20:00+04:00",
    tone: "accent",
    href: "/creator-studio",
  },
  {
    id: "notice-3",
    source: "demo",
    category: "publishing",
    title: "A publishing failure would appear here",
    description: "Illustrative failure layout. No publication was attempted or failed.",
    detail:
      "A future durable queue will preserve plain-language errors and attempt history. Retry is unavailable in this frontend preview.",
    at: "2026-11-07T19:15:00+04:00",
    tone: "danger",
    href: "/queue",
  },
  {
    id: "notice-4",
    source: "demo",
    category: "analytics",
    title: "Performance data is not connected",
    description: "No analytics sync has run. Missing metrics are never replaced with zeroes.",
    detail:
      "Authorized platform reports are required before views, retention or publishing comparisons can be shown.",
    at: "2026-11-07T17:00:00+04:00",
    tone: "neutral",
    href: "/performance",
  },
  {
    id: "notice-5",
    source: "demo",
    category: "processing",
    title: "Processing states have a home",
    description: "Simulation of a processing update, not a running worker or upload completion.",
    detail:
      "Real upload, analysis and content-readiness events require approved storage and worker services.",
    at: "2026-11-07T16:05:00+04:00",
    tone: "primary",
    href: "/ai-content",
  },
];
export function filterNotifications(
  items: readonly DemoNotification[],
  query: string,
  category: string,
  unreadOnly: boolean,
  readIds: string[],
  enabled: Record<NotificationCategory, boolean>,
) {
  const q = query.trim().toLowerCase();
  return items.filter(
    (n) =>
      enabled[n.category] &&
      (category === "all" || n.category === category) &&
      (!unreadOnly || !readIds.includes(n.id)) &&
      (!q || `${n.title} ${n.description}`.toLowerCase().includes(q)),
  );
}
export function parseReadIds(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((id) => typeof id === "string")
    ? [...new Set(value as string[])].filter((id) => demoNotifications.some((n) => n.id === id))
    : null;
}
