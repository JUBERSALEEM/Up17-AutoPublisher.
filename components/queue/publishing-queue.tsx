"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CircleAlert, Clock3, ListChecks, Search, X } from "lucide-react";
import {
  Button,
  Card,
  DemoBadge,
  Dialog,
  EmptyState,
  Input,
  Select,
  SegmentedControl,
} from "@/components/ui";
import {
  DemoNotice,
  JobStatusBadge,
  PageHeader,
  PlatformBadge,
  PlatformIcon,
} from "@/components/features/common";
import { accountById, demoAccounts, demoJobs, videoById } from "@/features/demo/fixtures";
import {
  platformLabels,
  type JobStatus,
  type Platform,
  type DemoJob,
} from "@/features/demo/contracts";
import { filterJobs, formatDateTime } from "@/features/demo/selectors";

export function PublishingQueue() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [account, setAccount] = useState("all");
  const [detail, setDetail] = useState<DemoJob | null>(null);
  const status: JobStatus | "all" =
    tab === "all" || tab === "upcoming" || tab === "attention" ? "all" : (tab as JobStatus);
  const jobs = useMemo(
    () =>
      filterJobs(demoJobs, query, status, platform, account).filter(
        (job) => tab !== "upcoming" || Boolean(job.scheduledAt),
      ),
    [query, status, platform, account, tab],
  );
  const clear = () => {
    setQuery("");
    setPlatform("all");
    setAccount("all");
    setTab("all");
  };
  const counts = {
    upcoming: demoJobs.filter((j) => j.scheduledAt).length,
    drafts: demoJobs.filter((j) => j.status === "draft").length,
    attention: demoJobs.filter(
      (j) => j.status === "needs_attention" || j.status === "waiting_for_authorisation",
    ).length,
    failed: demoJobs.filter((j) => j.status === "failed").length,
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow="Every account, its own outcome"
        title="Publishing Queue"
        description="Follow preparation, timing and attention items independently. This preview never submits a real publication."
        actions={
          <>
            <DemoBadge />
            <Link href="/scheduler" className="btn btn-secondary btn-md">
              <Clock3 size={17} />
              Open calendar
            </Link>
          </>
        }
      />
      <DemoNotice>
        All jobs below are simulation records. Retry, cancellation and publishing require a durable,
        authorized backend.
      </DemoNotice>
      <div className="queue-stats grid grid-4">
        {(
          [
            { key: "upcoming", label: "Upcoming demo slots", icon: Clock3 },
            { key: "drafts", label: "Demo drafts", icon: ListChecks },
            { key: "attention", label: "Need review", icon: CircleAlert },
            { key: "failed", label: "Failed examples", icon: CircleAlert },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`queue-stat card card-raised ${tab === key ? "queue-stat-active" : ""}`}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            <Icon size={20} aria-hidden="true" />
            <strong>{counts[key]}</strong>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <Card className="queue-card">
        <SegmentedControl
          label="Queue status"
          value={tab}
          onChange={setTab}
          items={[
            { id: "all", label: "All jobs" },
            { id: "upcoming", label: "Upcoming" },
            { id: "draft", label: "Drafts" },
            { id: "scheduled", label: "Scheduled" },
            { id: "attention", label: "Needs attention" },
            { id: "failed", label: "Failed" },
            { id: "published", label: "Published" },
          ]}
        />
        <div className="queue-filters">
          <div className="search-field">
            <Search size={18} aria-hidden="true" />
            <Input
              label="Search queue"
              type="search"
              placeholder="Search jobs or accounts…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            label="Platform"
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
            label="Account"
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
        </div>
        <div className="spread queue-result-summary">
          <span className="muted small" role="status">
            {jobs.length} demo jobs
          </span>
          <Button size="sm" variant="ghost" icon={<X size={15} />} onClick={clear}>
            Reset filters
          </Button>
        </div>
        {!jobs.length ? (
          <EmptyState
            title={tab === "published" ? "No real publications" : "No matching demo jobs"}
            description={
              tab === "published"
                ? "Nothing has been published. Demo jobs cannot create a real success outcome."
                : "Adjust the status, platform, account or search to see more examples."
            }
            action={<Button onClick={clear}>Show all demo jobs</Button>}
          />
        ) : (
          <div className="queue-list">
            {jobs.map((job) => {
              const video = videoById(job.videoId)!;
              const identity = accountById(job.accountId)!;
              return (
                <article className="queue-row" key={job.id}>
                  <span className={`platform-icon platform-${identity.platform}`}>
                    <PlatformIcon platform={identity.platform} />
                  </span>
                  <div className="queue-row-main">
                    <strong>{video.title}</strong>
                    <span className="muted tiny">
                      {identity.handle} ·{" "}
                      {job.scheduledAt
                        ? formatDateTime(job.scheduledAt)
                        : `Updated ${formatDateTime(job.updatedAt)}`}
                    </span>
                    {job.error ? (
                      <span className="queue-error">
                        <CircleAlert size={14} aria-hidden="true" />
                        {job.error}
                      </span>
                    ) : null}
                  </div>
                  <JobStatusBadge status={job.status} />
                  <Button size="sm" onClick={() => setDetail(job)}>
                    Details <ArrowRight size={14} />
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </Card>
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Independent account job"
        description={detail ? `${detail.id} · Simulation record` : undefined}
        wide
        footer={
          <>
            <Button onClick={() => setDetail(null)}>Close</Button>
            <Button
              disabled
              title="A durable publishing engine and real authorization are required"
            >
              Retry unavailable
            </Button>
          </>
        }
      >
        {detail ? (
          <div className="stack">
            <div className="row row-wrap">
              <JobStatusBadge status={detail.status} />
              <PlatformBadge platform={accountById(detail.accountId)!.platform} />
              <DemoBadge />
            </div>
            <h3>{videoById(detail.videoId)?.title}</h3>
            <p className="muted small">
              {accountById(detail.accountId)?.displayName} · {accountById(detail.accountId)?.handle}
            </p>
            {detail.scheduledAt ? (
              <p className="small">Demo slot: {formatDateTime(detail.scheduledAt)} · Asia/Dubai</p>
            ) : null}
            {detail.error ? (
              <p className="unavailable-note">
                <strong>Attention required.</strong> {detail.error}
              </p>
            ) : null}
            <h4>Attempt history</h4>
            <ol className="attempt-list">
              {detail.attempts.map((attempt) => (
                <li key={attempt.at}>
                  <span className="activity-icon">
                    <Clock3 size={17} />
                  </span>
                  <div>
                    <strong>{attempt.step}</strong>
                    <p className="muted small">{attempt.result}</p>
                    <span className="muted tiny">{formatDateTime(attempt.at)}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="unavailable-note">
              <strong>No external action.</strong> This history is illustrative. Cancel, retry and
              reschedule cannot change a real platform outcome.
            </p>
            <div className="row row-wrap">
              <Button disabled title="No real job is running">
                Cancel unavailable
              </Button>
              <Link
                className="btn btn-secondary btn-md"
                href={`/creator-studio?video=${detail.videoId}`}
              >
                Review draft <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
