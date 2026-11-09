export type NavigationIcon =
  | "overview"
  | "video"
  | "ai"
  | "calendar"
  | "queue"
  | "studio"
  | "research"
  | "performance"
  | "accounts"
  | "settings"
  | "notifications";

export interface Destination {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: NavigationIcon;
  group: "Workspace" | "Automation" | "Insights" | "Manage";
}

/** The ten canonical main destinations from PLAN.md §7. Notifications is a shell utility. */
export const destinations: readonly Destination[] = [
  {
    href: "/",
    label: "Overview",
    shortLabel: "Overview",
    description: "Your creator workspace at a glance",
    icon: "overview",
    group: "Workspace",
  },
  {
    href: "/video-studio",
    label: "Video Studio",
    shortLabel: "Videos",
    description: "Library, uploads and processing",
    icon: "video",
    group: "Workspace",
  },
  {
    href: "/ai-content",
    label: "AI Content",
    shortLabel: "AI Content",
    description: "Gameplay analysis and content preparation",
    icon: "ai",
    group: "Workspace",
  },
  {
    href: "/scheduler",
    label: "Smart Scheduler",
    shortLabel: "Scheduler",
    description: "Calendar, drafts and account-specific timing",
    icon: "calendar",
    group: "Automation",
  },
  {
    href: "/queue",
    label: "Publishing Queue",
    shortLabel: "Queue",
    description: "Independent account jobs and outcomes",
    icon: "queue",
    group: "Automation",
  },
  {
    href: "/creator-studio",
    label: "Creator Studio",
    shortLabel: "Creator",
    description: "Per-account metadata and publishing packages",
    icon: "studio",
    group: "Workspace",
  },
  {
    href: "/research",
    label: "Research Centre",
    shortLabel: "Research",
    description: "Relevant topics, sources and content ideas",
    icon: "research",
    group: "Insights",
  },
  {
    href: "/performance",
    label: "Performance Lab",
    shortLabel: "Performance",
    description: "Sourced analytics and content comparisons",
    icon: "performance",
    group: "Insights",
  },
  {
    href: "/accounts",
    label: "Accounts",
    shortLabel: "Accounts",
    description: "Platform identities, permissions and status",
    icon: "accounts",
    group: "Manage",
  },
  {
    href: "/settings",
    label: "Settings",
    shortLabel: "Settings",
    description: "Appearance, workspace and privacy preferences",
    icon: "settings",
    group: "Manage",
  },
];

export const notificationsDestination: Destination = {
  href: "/notifications",
  label: "Notifications",
  shortLabel: "Alerts",
  description: "Processing, account and publishing updates",
  icon: "notifications",
  group: "Manage",
};

export const allDestinations = [...destinations, notificationsDestination];
export const mobilePrimaryHrefs = ["/", "/video-studio", "/queue", "/accounts"] as const;

export function destinationForPath(pathname: string): Destination {
  return (
    allDestinations.find((item) => item.href === pathname) ??
    [...allDestinations]
      .reverse()
      .find((item) => item.href !== "/" && pathname.startsWith(`${item.href}/`)) ??
    destinations[0]
  );
}

export function searchDestinations(query: string): Destination[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return allDestinations.filter((item) =>
    terms.every((term) =>
      `${item.label} ${item.shortLabel} ${item.description} ${item.href}`
        .toLowerCase()
        .includes(term),
    ),
  );
}
