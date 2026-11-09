"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/features/common";
import { markNotifications } from "@/lib/auth/workspace-actions";
import { usePreferences } from "@/features/preferences/use-preferences";
import { categoryLabels } from "@/features/preferences/model";
import { safeNext } from "@/lib/auth/redirects";
import type { Database } from "@/lib/supabase/database.types";

type Notice = Database["public"]["Tables"]["notifications"]["Row"];
export function CloudInbox({ notices }: { notices: Notice[] }) {
  const { preferences } = usePreferences();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const visible = notices.filter(
    (n) => n.category === "security" || preferences.notifications[n.category],
  );
  const unread = visible.filter((n) => !n.read_at);
  const mark = (ids: string[], read: boolean) =>
    start(async () => {
      const result = await markNotifications(ids, read);
      setMessage(result.message);
      router.refresh();
    });
  return (
    <div className="page notifications-page">
      <PageHeader
        eyebrow="Your workspace activity"
        title="Notifications"
        description="Database-backed notices for your private workspace. No demo events are mixed into this inbox."
        actions={
          <Button
            icon={<CheckCheck size={18} />}
            disabled={!unread.length || pending}
            loading={pending}
            onClick={() =>
              mark(
                unread.map((n) => n.id),
                true,
              )
            }
          >
            Mark all read
          </Button>
        }
      />
      <div className="inbox-summary">
        <div>
          <Bell size={20} />
          <strong>{unread.length} unread notices</strong>
          <span className="muted small">{visible.length} visible records</span>
        </div>
        <Link href="/settings#notifications" className="text-link small">
          Inbox preferences
        </Link>
      </div>
      {message ? (
        <p role="status" className="save-notice">
          {message}
        </p>
      ) : null}
      {!visible.length ? (
        <EmptyState
          title="No workspace notices yet"
          description="Real processing, account and publishing events will appear here when those services are connected. Security notices are never hidden."
          action={
            <Button icon={<RefreshCw size={16} />} onClick={() => router.refresh()}>
              Refresh inbox
            </Button>
          }
        />
      ) : (
        <div className="notification-list">
          {visible.map((notice) => (
            <Card as="article" key={notice.id} className="notification-row">
              <div className="notification-copy">
                <div className="row row-wrap">
                  <Badge>
                    {notice.category === "security" ? "Security" : categoryLabels[notice.category]}
                  </Badge>
                  <span className="muted tiny">{notice.read_at ? "Read" : "Unread"}</span>
                </div>
                <h2>{notice.title}</h2>
                <p className="muted small">{notice.body}</p>
                <time className="muted tiny" dateTime={notice.created_at}>
                  {new Date(notice.created_at).toISOString()}
                </time>
              </div>
              <div className="notification-actions">
                {notice.action_path && safeNext(notice.action_path, "") ? (
                  <Link href={safeNext(notice.action_path, "")} className="text-link small">
                    Open section
                  </Link>
                ) : null}
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() => mark([notice.id], !notice.read_at)}
                >
                  {notice.read_at ? "Mark unread" : "Mark read"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
