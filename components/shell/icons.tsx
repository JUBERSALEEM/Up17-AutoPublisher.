import {
  BarChart3,
  Bell,
  CalendarDays,
  Clapperboard,
  FileVideo,
  LayoutDashboard,
  ListChecks,
  Search,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { NavigationIcon } from "@/lib/navigation";

const icons = {
  overview: LayoutDashboard,
  video: FileVideo,
  ai: Sparkles,
  calendar: CalendarDays,
  queue: ListChecks,
  studio: Clapperboard,
  research: Search,
  performance: BarChart3,
  accounts: UsersRound,
  settings: Settings2,
  notifications: Bell,
};
export function NavIcon({ name, size = 19 }: { name: NavigationIcon; size?: number }) {
  const Icon = icons[name];
  return <Icon size={size} aria-hidden="true" />;
}
export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark ${small ? "brand-mark-small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 256 256" fill="none">
        <path
          d="M48 72v58c0 27 15 43 39 43s39-16 39-43V72M145 72h22v101M181 72h35l-28 101"
          stroke="currentColor"
          strokeWidth="17"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
