"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3, Plus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  DemoBadge,
  Dialog,
  EmptyState,
  IconButton,
  Input,
  SegmentedControl,
  Select,
} from "@/components/ui";
import { DemoNotice, PageHeader, PlatformBadge, PlatformIcon } from "@/components/features/common";
import {
  accountById,
  DEMO_ANCHOR,
  demoAccounts,
  demoSchedule,
  demoVideos,
  videoById,
} from "@/features/demo/fixtures";
import { platformLabels, type DemoScheduleItem, type Platform } from "@/features/demo/contracts";
import { formatDateTime } from "@/features/demo/selectors";
import { useBrowserValue, writeBrowserValue } from "@/lib/browser-store";

const LOCAL_KEY = "up17.demo.schedule.v1";
function isSlots(value: unknown): DemoScheduleItem[] | null {
  return Array.isArray(value) &&
    value.every(
      (s) =>
        s &&
        typeof s.id === "string" &&
        s.source === "demo" &&
        typeof s.videoId === "string" &&
        typeof s.accountId === "string" &&
        typeof s.scheduledAt === "string" &&
        typeof s.timezone === "string" &&
        (s.status === "draft" || s.status === "scheduled"),
    )
    ? value
    : null;
}
function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function SmartScheduler() {
  const local = useBrowserValue<DemoScheduleItem[]>(LOCAL_KEY, [], isSlots);
  const [view, setView] = useState("week");
  const [anchor, setAnchor] = useState(new Date(DEMO_ANCHOR));
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [account, setAccount] = useState("all");
  const [detail, setDetail] = useState<DemoScheduleItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    videoId: demoVideos[0].id,
    accountId: demoAccounts[0].id,
    time: "",
    timezone: "Asia/Dubai",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const slots = useMemo(
    () =>
      [...demoSchedule, ...local]
        .filter((slot) => {
          const a = accountById(slot.accountId);
          return (
            a &&
            (platform === "all" || a.platform === platform) &&
            (account === "all" || slot.accountId === account)
          );
        })
        .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt)),
    [local, platform, account],
  );
  const start = new Date(anchor);
  start.setUTCHours(0, 0, 0, 0);
  if (view === "week") start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  if (view === "month") start.setUTCDate(1);
  const days = Array.from(
    { length: view === "month" ? 35 : view === "week" ? 7 : 1 },
    (_, index) => {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + index);
      return day;
    },
  );
  const shift = (direction: number) => {
    const next = new Date(anchor);
    next.setUTCDate(
      next.getUTCDate() + direction * (view === "month" ? 30 : view === "week" ? 7 : 1),
    );
    setAnchor(next);
  };
  const addSlot = () => {
    if (!form.time || Number.isNaN(Date.parse(form.time))) {
      setError("Choose a valid demo date and time.");
      return;
    }
    const slot: DemoScheduleItem = {
      id: `local-slot-${Date.now()}`,
      source: "demo",
      videoId: form.videoId,
      accountId: form.accountId,
      scheduledAt: new Date(form.time).toISOString(),
      timezone: form.timezone,
      status: "draft",
    };
    const persisted = writeBrowserValue(LOCAL_KEY, [...local, slot]);
    setAdding(false);
    setError("");
    setNotice(
      persisted
        ? "Demo slot saved in this browser. Nothing was scheduled for publishing."
        : "Demo slot added for this session only; browser storage is unavailable.",
    );
  };
  const item = (slot: DemoScheduleItem) => {
    const video = videoById(slot.videoId);
    const a = accountById(slot.accountId);
    if (!video || !a) return null;
    return (
      <button type="button" key={slot.id} className="calendar-item" onClick={() => setDetail(slot)}>
        <PlatformIcon platform={a.platform} size={14} />
        <span>
          <strong>{video.title}</strong>
          <span>
            {formatDateTime(slot.scheduledAt, slot.timezone)} · {a.handle}
          </span>
        </span>
      </button>
    );
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow="A rhythm that works for you"
        title="Smart Scheduler"
        description="Plan demo slots in a calendar or agenda. Real audience-based recommendations and publishing remain unavailable."
        actions={
          <>
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => setAdding(true)}>
              Add demo slot
            </Button>
            <DemoBadge />
          </>
        }
      />
      <DemoNotice>
        Calendar entries are illustrative. Adding a demo slot does not create a publishing job or
        contact a platform.
      </DemoNotice>
      {notice ? (
        <p className="save-notice" role="status">
          {notice}
        </p>
      ) : null}
      <Card className="scheduler-card">
        <div className="scheduler-toolbar">
          <SegmentedControl
            label="Calendar view"
            value={view}
            onChange={setView}
            items={[
              { id: "day", label: "Day" },
              { id: "week", label: "Week" },
              { id: "month", label: "Month" },
              { id: "list", label: "Agenda" },
            ]}
          />
          <div className="row">
            <IconButton label="Previous period" onClick={() => shift(-1)}>
              <ArrowLeft size={18} />
            </IconButton>
            <strong className="small">
              {anchor.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </strong>
            <IconButton label="Next period" onClick={() => shift(1)}>
              <ArrowRight size={18} />
            </IconButton>
          </div>
        </div>
        <div className="scheduler-filters">
          <Select
            label="Filter by platform"
            value={platform}
            onChange={(event) => {
              setPlatform(event.target.value as Platform | "all");
              setAccount("all");
            }}
          >
            <option value="all">All platforms</option>
            {Object.entries(platformLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            label="Filter by account"
            value={account}
            onChange={(event) => setAccount(event.target.value)}
          >
            <option value="all">All accounts</option>
            {demoAccounts
              .filter((a) => platform === "all" || a.platform === platform)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayName}
                </option>
              ))}
          </Select>
          <span className="muted tiny">
            Calendar dates: UTC · slot labels use their own timezone · demo anchor Nov 2026
          </span>
        </div>
        {view === "list" ? (
          <div className="agenda-list">
            {slots.length ? (
              slots.map(item)
            ) : (
              <EmptyState
                title="No matching demo slots"
                description="Clear filters or add a browser-local demo slot."
              />
            )}
          </div>
        ) : (
          <>
            <div className={`calendar-grid calendar-${view}`}>
              <div className="calendar-weekdays">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="calendar-days">
                {days.map((day) => {
                  const entries = slots.filter(
                    (slot) => dayKey(new Date(slot.scheduledAt)) === dayKey(day),
                  );
                  return (
                    <div
                      key={day.toISOString()}
                      className={`calendar-day ${day.getUTCMonth() !== anchor.getUTCMonth() ? "calendar-day-muted" : ""}`}
                    >
                      <span className="calendar-day-number">{day.getUTCDate()}</span>
                      <div className="calendar-day-items">{entries.map(item)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mobile-agenda">
              <p className="field-hint">
                Compact agenda · use Agenda for all dates, or a wider screen for the full grid.
              </p>
              {slots.length ? (
                slots.map(item)
              ) : (
                <EmptyState
                  title="No matching demo slots"
                  description="Try another filter or add a demo slot."
                />
              )}
            </div>
          </>
        )}
        <p className="unavailable-note">
          <strong>Smart timing unavailable.</strong> Recommendations require each account’s own
          authorized analytics. No best-time claim is invented here.
        </p>
      </Card>
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Demo schedule details"
        description="Illustrative slot · no publishing reservation"
        footer={
          <>
            <Button onClick={() => setDetail(null)}>Close</Button>
            {detail ? (
              <Link
                className="btn btn-primary btn-md"
                href={`/creator-studio?video=${detail.videoId}`}
              >
                Review draft <ArrowRight size={16} />
              </Link>
            ) : null}
          </>
        }
      >
        {detail ? (
          <div className="stack">
            <div className="row row-wrap">
              <PlatformBadge platform={accountById(detail.accountId)!.platform} />
              <Badge>{detail.status === "draft" ? "Demo draft" : "Demo scheduled"}</Badge>
            </div>
            <h3>{videoById(detail.videoId)?.title}</h3>
            <p className="muted small">{accountById(detail.accountId)?.handle}</p>
            <p className="row small">
              <Clock3 size={17} />
              {formatDateTime(detail.scheduledAt, detail.timezone)} · {detail.timezone}
            </p>
            <p className="unavailable-note">
              <strong>Rescheduling unavailable.</strong> This slot is not connected to a publishing
              engine.
            </p>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a demo slot"
        description="Saved only in this browser. This never publishes or queues real work."
        footer={
          <>
            <Button onClick={() => setAdding(false)}>Cancel</Button>
            <Button variant="primary" onClick={addSlot}>
              Save demo slot
            </Button>
          </>
        }
      >
        <div className="stack">
          <Select
            label="Demo video"
            value={form.videoId}
            onChange={(event) => setForm({ ...form, videoId: event.target.value })}
          >
            {demoVideos.map((video) => (
              <option key={video.id} value={video.id}>
                {video.title}
              </option>
            ))}
          </Select>
          <Select
            label="Demo account"
            value={form.accountId}
            onChange={(event) => setForm({ ...form, accountId: event.target.value })}
          >
            {demoAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName} · {platformLabels[a.platform]}
              </option>
            ))}
          </Select>
          <Input
            label="Demo date and time"
            type="datetime-local"
            value={form.time}
            onChange={(event) => setForm({ ...form, time: event.target.value })}
            error={error || undefined}
          />
          <Select
            label="Timezone label"
            value={form.timezone}
            onChange={(event) => setForm({ ...form, timezone: event.target.value })}
          >
            <option>Asia/Dubai</option>
            <option>Asia/Kolkata</option>
            <option>UTC</option>
          </Select>
          <p className="field-hint">
            The browser interprets the entered time locally; the timezone label is illustrative
            until a backend owns scheduling.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
