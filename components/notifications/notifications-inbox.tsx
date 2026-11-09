"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Bell, CheckCheck, CircleAlert, Search, Settings2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  DemoBadge,
  Dialog,
  EmptyState,
  Input,
  SegmentedControl,
  Select,
} from "@/components/ui";
import { DemoNotice, PageHeader } from "@/components/features/common";
import {
  demoNotifications,
  filterNotifications,
  parseReadIds,
  READ_KEY,
  type DemoNotification,
} from "@/features/notifications/model";
import { categoryLabels, notificationCategories } from "@/features/preferences/model";
import { usePreferences } from "@/features/preferences/use-preferences";
import { useBrowserValue, writeBrowserValue } from "@/lib/browser-store";
import { formatDateTime } from "@/features/demo/selectors";

export function NotificationsInbox() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState("all");
  const [detail, setDetail] = useState<DemoNotification | null>(null);
  const [notice, setNotice] = useState("");
  const readIds = useBrowserValue<string[]>(READ_KEY, [], parseReadIds);
  const { preferences } = usePreferences();
  const enabledItems = demoNotifications.filter((n) => preferences.notifications[n.category]);
  const unread = enabledItems.filter((n) => !readIds.includes(n.id)).length;
  const items = useMemo(
    () =>
      filterNotifications(
        demoNotifications,
        query,
        category,
        unreadOnly === "unread",
        readIds,
        preferences.notifications,
      ),
    [query, category, unreadOnly, readIds, preferences.notifications],
  );
  const hidden = notificationCategories.filter((c) => !preferences.notifications[c]).length;
  const mark = (ids: string[], read: boolean) => {
    const next = read
      ? [...new Set([...readIds, ...ids])]
      : readIds.filter((id) => !ids.includes(id));
    const persisted = writeBrowserValue(READ_KEY, next);
    setNotice(
      persisted
        ? "Demo inbox read state saved in this browser."
        : "Read state updated for this session only; storage is unavailable.",
    );
  };
  const clear = () => {
    setQuery("");
    setCategory("all");
    setUnreadOnly("all");
  };
  return (
    <div className="page notifications-page">
      <PageHeader
        eyebrow="The things worth your attention"
        title="Notifications"
        description="A calm inbox for workflow updates. These are interface examples, not real processing or publishing events."
        actions={
          <>
            <Button
              icon={<CheckCheck size={18} />}
              disabled={!unread}
              onClick={() =>
                mark(
                  enabledItems.map((n) => n.id),
                  true,
                )
              }
            >
              Mark all demo read
            </Button>
            <DemoBadge />
          </>
        }
      />
      <DemoNotice>
        No event service is connected. Every notice below is labelled demo content; no real
        publishing success, token expiry or analytics sync is implied.
      </DemoNotice>
      {notice ? (
        <p className="save-notice" role="status">
          {notice}
        </p>
      ) : null}
      <div className="inbox-summary">
        <div>
          <Bell size={20} />
          <strong>
            {unread} unread demo {unread === 1 ? "notice" : "notices"}
          </strong>
          <span className="muted small">{enabledItems.length} visible examples</span>
        </div>
        <Link href="/settings#notifications" className="text-link small">
          <Settings2 size={16} />
          Inbox preferences
        </Link>
      </div>
      {hidden ? (
        <p className="unavailable-note">
          <strong>
            {hidden} {hidden === 1 ? "category is" : "categories are"} hidden by your preferences.
          </strong>{" "}
          <Link href="/settings#notifications" className="text-link">
            Manage categories
          </Link>
          .
        </p>
      ) : null}
      <Card className="inbox-toolbar">
        <div className="search-field">
          <Search size={18} />
          <Input
            label="Search notifications"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search demo notices…"
          />
        </div>
        <Select
          label="Notification category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          {notificationCategories.map((c) => (
            <option key={c} value={c}>
              {categoryLabels[c]}
            </option>
          ))}
        </Select>
        <SegmentedControl
          label="Read state"
          value={unreadOnly}
          onChange={setUnreadOnly}
          items={[
            { id: "all", label: "All" },
            { id: "unread", label: "Unread" },
          ]}
        />
      </Card>
      {!items.length ? (
        <EmptyState
          title={
            unreadOnly === "unread" && !query && category === "all"
              ? "You’re caught up on demo notices"
              : "No matching demo notices"
          }
          description={
            hidden === 4
              ? "All categories are hidden. Enable a category in settings to see examples."
              : "Adjust your search or filters. No real events are waiting in a connected service."
          }
          action={<Button onClick={clear}>Clear filters</Button>}
        />
      ) : (
        <div className="notification-list">
          {items.map((item) => {
            const isRead = readIds.includes(item.id);
            return (
              <Card
                key={item.id}
                as="article"
                className={`notification-row ${isRead ? "notification-read" : "notification-unread"}`}
              >
                <span className={`notification-icon tone-${item.tone}`} aria-hidden="true">
                  <CircleAlert size={21} />
                </span>
                <div className="notification-copy">
                  <div className="row row-wrap">
                    <Badge tone={item.tone}>{categoryLabels[item.category]}</Badge>
                    <DemoBadge />
                    <span className="muted tiny">{isRead ? "Read" : "Unread"}</span>
                  </div>
                  <h2>{item.title}</h2>
                  <p className="muted small">{item.description}</p>
                  <time className="muted tiny" dateTime={item.at}>
                    {formatDateTime(item.at, "Asia/Dubai")} · demo timestamp
                  </time>
                </div>
                <div className="notification-actions">
                  <Button size="sm" onClick={() => setDetail(item)}>
                    Details
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => mark([item.id], !isRead)}>
                    {isRead ? "Mark unread" : "Mark read"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.title ?? "Notice"}
        description="Labelled demo notice · not a real event"
        footer={
          detail ? (
            <>
              <Button
                onClick={() => {
                  mark([detail.id], true);
                  setDetail(null);
                }}
              >
                Mark read & close
              </Button>
              <Link
                href={detail.href}
                className="btn btn-primary btn-md"
                onClick={() => {
                  mark([detail.id], true);
                  setDetail(null);
                }}
              >
                Open related section <ArrowRight size={16} />
              </Link>
            </>
          ) : null
        }
      >
        {detail ? (
          <div className="stack">
            <Badge tone={detail.tone}>{categoryLabels[detail.category]}</Badge>
            <p>{detail.description}</p>
            <p>{detail.detail}</p>
            <p className="field-hint">
              Example timestamp: {formatDateTime(detail.at, "Asia/Dubai")} (Asia/Dubai). No service
              generated this notice.
            </p>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
