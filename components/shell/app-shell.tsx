"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleUserRound,
  Download,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  allDestinations,
  designSystemDestination,
  destinationForPath,
  destinations,
  isRouteActive,
  mobilePrimaryHrefs,
  searchDestinations,
} from "@/lib/navigation";
import { Badge, Button, DemoBadge, Dialog, IconButton, Input, Popover } from "@/components/ui";
import { ThemeMenu } from "@/components/theme/theme-switcher";
import { BrandMark, NavIcon } from "./icons";
import { usePwa } from "./pwa-provider";
import { usePreferences } from "@/features/preferences/use-preferences";

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  const results = searchDestinations(query);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Find your next step"
      description="Search the application sections. No account or video data is queried."
    >
      <Input
        ref={input}
        label="Search destinations"
        type="search"
        placeholder="Try videos, schedule or settings…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className="search-results list-plain" aria-label="Matching destinations">
        {results.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="search-result" onClick={onClose}>
              <span className="nav-icon">
                <NavIcon name={item.icon} />
              </span>
              <span>
                <strong>{item.label}</strong>
                <span className="muted small">{item.description}</span>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </li>
        ))}
        {!results.length ? (
          <li className="search-no-results muted">
            No matching sections. Try “videos”, “queue” or “settings”.
          </li>
        ) : null}
      </ul>
    </Dialog>
  );
}

export function AppShell({
  children,
  authAvailable = false,
  connectedCount = 0,
}: {
  children: ReactNode;
  authAvailable?: boolean;
  connectedCount?: number;
}) {
  const pathname = usePathname();
  const current = destinationForPath(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const { canInstall, install, installed } = usePwa();
  const { preferences, cloud } = usePreferences();
  useEffect(() => {
    document.documentElement.dataset.motion = preferences.reduceMotion ? "reduce" : "system";
  }, [preferences.reduceMotion]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const isActive = (href: string) => isRouteActive(pathname, href);
  const moreActive = allDestinations.some(
    (item) => !(mobilePrimaryHrefs as readonly string[]).includes(item.href) && isActive(item.href),
  );
  const workspaceButton = (
    <button
      type="button"
      className="workspace-switch"
      onClick={() => setWorkspaceOpen(true)}
      title="View workspace details"
    >
      <span className="workspace-avatar">U17</span>
      <span className="workspace-copy">
        <strong>{preferences.name}</strong>
        <span>Creator workspace</span>
      </span>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar" aria-label="Workspace sidebar">
        <Link href="/" className="brand" aria-label="Up17 AutoPublisher overview">
          <BrandMark />
          <span>
            <strong>Up17</strong> <span>AutoPublisher</span>
          </span>
        </Link>
        {workspaceButton}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {(["Workspace", "Automation", "Insights", "Manage"] as const).map((group) => (
            <div className="nav-group" key={group}>
              <p className="nav-group-label">{group}</p>
              {destinations
                .filter((item) => item.group === group)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive(item.href) ? "nav-link-active" : ""}`}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    <NavIcon name={item.icon} />
                    <span>{item.label}</span>
                    {isActive(item.href) ? (
                      <span className="active-dot" aria-hidden="true" />
                    ) : null}
                  </Link>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="connection-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <strong>Frontend preview</strong>
              <span>No accounts connected</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm install-button"
            disabled={!canInstall}
            title={
              installed
                ? "Already installed"
                : canInstall
                  ? "Install Up17 on this device"
                  : "Install becomes available when your browser offers this app"
            }
            onClick={install}
          >
            <Download size={17} aria-hidden="true" />
            {installed ? "App installed" : "Install app"}
          </button>
        </div>
      </aside>
      <div className="shell-main">
        <header className="topbar">
          <Link href="/" className="mobile-brand" aria-label="Up17 AutoPublisher overview">
            <BrandMark small />
            <strong>Up17</strong>
          </Link>
          <div className="breadcrumb">
            <span>{current.group}</span>
            <span aria-hidden="true">/</span>
            <strong>{current.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-desktop">
              <DemoBadge label="Demo mode" />
            </span>
            <span className="demo-mobile">
              <DemoBadge label="Demo" />
            </span>
            <button type="button" className="search-trigger" onClick={() => setSearchOpen(true)}>
              <Search size={17} aria-hidden="true" />
              <span>Search anything</span>
              <kbd aria-hidden="true">⌘ K</kbd>
            </button>
            <IconButton
              label="Search application sections"
              className="mobile-search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={19} />
            </IconButton>
            <Link
              href="/notifications"
              className={`icon-btn icon-btn-secondary ${isActive("/notifications") ? "icon-btn-active" : ""}`}
              aria-label="Notifications"
              title="Notifications"
              aria-current={isActive("/notifications") ? "page" : undefined}
            >
              <NavIcon name="notifications" />
            </Link>
            <ThemeMenu />
            <Popover
              label={cloud ? "Account menu" : "Local profile menu"}
              trigger={<CircleUserRound size={20} />}
              className="profile-popover"
            >
              {(close) => (
                <>
                  <div className="profile-summary">
                    <span className="profile-avatar">
                      {cloud ? cloud.displayName.slice(0, 2).toUpperCase() : "JC"}
                    </span>
                    <div>
                      <strong>{cloud?.displayName ?? "Local creator"}</strong>
                      <p className="field-hint">
                        {cloud ? cloud.email : "Demo profile · not signed in"}
                      </p>
                    </div>
                  </div>
                  <Link className="menu-item" href="/settings" onClick={close}>
                    Workspace settings
                  </Link>
                  <Link className="menu-item" href={designSystemDestination.href} onClick={close}>
                    {designSystemDestination.label}
                  </Link>
                  <p className="menu-footnote">
                    <ShieldCheck size={15} aria-hidden="true" />
                    {cloud ? (
                      "Private session · social accounts not connected"
                    ) : authAvailable ? (
                      <Link href="/sign-in" onClick={close}>
                        Sign in to your workspace
                      </Link>
                    ) : (
                      "Authentication is not configured locally."
                    )}
                  </p>
                </>
              )}
            </Popover>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="shell-footer">
          <span>Up17 AutoPublisher</span>
          <span>
            <span className="status-dot" aria-hidden="true" />
            {cloud
              ? "Private workspace · creator workflows still demo"
              : "Local frontend · integrations not connected"}
          </span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {mobilePrimaryHrefs.map((href) => {
          const item = destinations.find((destination) => destination.href === href)!;
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-link ${isActive(href) ? "bottom-link-active" : ""}`}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <NavIcon name={item.icon} size={21} />
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`bottom-link ${moreActive ? "bottom-link-active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-label="More destinations"
          aria-current={moreActive ? "page" : undefined}
        >
          <Menu size={21} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>
      <Dialog
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Your creator workspace"
        description="All sections, one tap away."
      >
        <div className="mobile-more-grid">
          {allDestinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`more-link ${isActive(item.href) ? "more-link-active" : ""}`}
              onClick={() => setMoreOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
              {isActive(item.href) ? <Check size={16} aria-hidden="true" /> : null}
            </Link>
          ))}
        </div>
        <div className="mobile-workspace">{workspaceButton}</div>
      </Dialog>
      <Dialog
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        title={preferences.name}
        description={cloud ? "Your private creator workspace" : "Your local creator workspace"}
        footer={
          <Button variant="primary" onClick={() => setWorkspaceOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="stack">
          <div className="spread">
            <span className="muted small">Workspace handle</span>
            <strong>@up17longshotyt</strong>
          </div>
          <div className="spread">
            <span className="muted small">Content focus</span>
            <Badge>{preferences.niche}</Badge>
          </div>
          <div className="spread">
            <span className="muted small">Connected accounts</span>
            <Badge tone={connectedCount ? "success" : "warning"}>{connectedCount} connected</Badge>
          </div>
          <p className="unavailable-note">
            <strong>{cloud ? "Private workspace." : "One local workspace."}</strong>{" "}
            {cloud
              ? `Your role is ${cloud.role}. Social accounts and publishing are not connected.`
              : "This is browser-local demo data. Sign in to use a private cloud workspace when authentication is configured."}
          </p>
          <Button disabled title="Workspace creation requires the backend phase">
            Create workspace unavailable
          </Button>
        </div>
      </Dialog>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
