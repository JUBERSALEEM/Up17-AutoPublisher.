import Link from "next/link";
import {
  ArrowRight,
  CheckCheck,
  CircleAlert,
  Clapperboard,
  FileVideo,
  Link2Off,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { Badge, Card, CardHeader, DemoBadge, EmptyState } from "@/components/ui";
import {
  DemoNotice,
  JobStatusBadge,
  MetricCard,
  PageHeader,
  PlatformIcon,
  VideoArtwork,
  VideoStatusBadge,
} from "@/components/features/common";
import {
  accountById,
  demoAccounts,
  demoJobs,
  demoSchedule,
  demoVideos,
  videoById,
} from "@/features/demo/fixtures";
import { platformLabels } from "@/features/demo/contracts";
import { formatDateTime, formatDuration } from "@/features/demo/selectors";

export function Dashboard() {
  const recent = [...demoVideos]
    .sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt))
    .slice(0, 3);
  const upcoming = [...demoSchedule]
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
    .slice(0, 3);
  const attention = demoJobs.filter((job) => job.error);
  return (
    <div className="page dashboard-page">
      <PageHeader
        eyebrow="Sunday, 8 November · Demo workspace"
        title="Your next great clip starts here."
        description="Welcome to Up17 Gaming. Prepare your content, keep every account in view, and know what needs your attention."
        actions={
          <>
            <Link className="btn btn-secondary btn-md" href="/video-studio">
              <FileVideo size={18} />
              Open library
            </Link>
            <Link className="btn btn-primary btn-md" href="/creator-studio">
              <Sparkles size={18} />
              Prepare content
            </Link>
          </>
        }
      />
      <DemoNotice>
        Explore the workflow with labelled examples. Live connections, uploads and publishing are
        not enabled.
      </DemoNotice>
      <div className="grid grid-4 dashboard-metrics">
        <MetricCard label="Connected accounts" value="0" note="No real identities connected" />
        <MetricCard
          label="Demo videos"
          value={String(demoVideos.length)}
          note="Illustrative library · not uploads"
          tone="primary"
        />
        <MetricCard
          label="Demo planned slots"
          value={String(demoSchedule.length)}
          note="Nothing is queued for publishing"
          tone="accent"
        />
        <MetricCard
          label="Demo attention items"
          value={String(attention.length)}
          note="Examples of review/error states"
          tone="warning"
        />
      </div>
      <div className="dashboard-columns">
        <div className="stack">
          <Card>
            <CardHeader
              title="Pick up where you left off"
              description="Recent examples from the demo library."
              action={<DemoBadge />}
            />
            <div className="recent-videos">
              {recent.map((video) => (
                <Link
                  href={`/creator-studio?video=${video.id}`}
                  key={video.id}
                  className="recent-video"
                >
                  <VideoArtwork video={video} />
                  <div className="recent-video-info">
                    <strong>{video.title}</strong>
                    <span className="muted tiny">
                      {video.weapon} · {formatDuration(video.durationSeconds)} · Demo source
                    </span>
                    <VideoStatusBadge status={video.status} />
                  </div>
                  <ArrowRight size={17} className="recent-arrow" aria-hidden="true" />
                </Link>
              ))}
            </div>
            <Link href="/video-studio" className="text-link">
              View the full library <ArrowRight size={16} />
            </Link>
          </Card>
          <Card>
            <CardHeader
              title="Processing activity"
              description="Illustrative pipeline states, not a running worker."
              action={<Badge tone="accent">Simulation</Badge>}
            />
            <ul className="activity-list list-plain">
              {demoVideos.slice(0, 4).map((video) => (
                <li key={video.id}>
                  <span className={`activity-icon activity-${video.status}`}>
                    {video.status === "ready" ? (
                      <CheckCheck size={18} aria-hidden="true" />
                    ) : video.status === "needs_attention" || video.status === "failed" ? (
                      <CircleAlert size={18} aria-hidden="true" />
                    ) : (
                      <Clapperboard size={18} aria-hidden="true" />
                    )}
                  </span>
                  <span className="activity-copy">
                    <strong>{video.title}</strong>
                    <span className="muted tiny">
                      {video.status === "ready"
                        ? "Demo package ready to review"
                        : video.status === "analysing"
                          ? "Example analysis in progress · no worker running"
                          : video.status === "queued"
                            ? "Example queue state · not submitted"
                            : "Example review required"}
                    </span>
                  </span>
                  <VideoStatusBadge status={video.status} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="stack">
          <Card className="setup-card">
            <CardHeader
              eyebrow="YOUR NEXT STEP"
              title="Connect your creator workflow"
              description="Start by reviewing the account requirements. No credentials are requested in this preview."
            />
            <div className="setup-progress">
              <span>Workspace ready</span>
              <CheckCheck size={17} aria-hidden="true" />
            </div>
            <div className="setup-step">
              <span className="step-number">1</span>
              <div>
                <strong>Review your platforms</strong>
                <p>YouTube, Instagram and TikTok have independent permissions.</p>
              </div>
            </div>
            <div className="setup-step">
              <span className="step-number">2</span>
              <div>
                <strong>Prepare your first package</strong>
                <p>Edit a demo draft and save it in this browser.</p>
              </div>
            </div>
            <Link href="/accounts" className="btn btn-primary btn-md">
              Review account setup <ArrowRight size={17} />
            </Link>
          </Card>
          <Card>
            <CardHeader
              title="Your platforms"
              action={
                <Link href="/accounts" className="text-link tiny">
                  Manage <ArrowRight size={14} />
                </Link>
              }
            />
            <div className="platform-summary">
              {(["youtube", "instagram", "tiktok"] as const).map((platform) => (
                <div key={platform}>
                  <span className={`platform-icon platform-${platform}`}>
                    <PlatformIcon platform={platform} />
                  </span>
                  <span>
                    <strong>{platformLabels[platform]}</strong>
                    <span className="muted tiny">
                      {demoAccounts.filter((a) => a.platform === platform).length} demo identity · 0
                      connected
                    </span>
                  </span>
                  <Link2Off size={16} className="muted" aria-label="Not connected" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <div className="grid grid-2">
        <Card>
          <CardHeader
            title="Coming up"
            description="Demo calendar · Asia/Dubai"
            action={<DemoBadge />}
          />
          <div className="upcoming-list">
            {upcoming.map((slot) => {
              const video = videoById(slot.videoId)!;
              const account = accountById(slot.accountId)!;
              return (
                <Link href="/scheduler" className="upcoming-item" key={slot.id}>
                  <span className="date-tile">
                    <strong>{new Date(slot.scheduledAt).getUTCDate()}</strong>
                    <span>NOV</span>
                  </span>
                  <span className="upcoming-copy">
                    <strong>{video.title}</strong>
                    <span className="muted tiny">
                      {account.handle} · {formatDateTime(slot.scheduledAt)}
                    </span>
                  </span>
                  <PlatformIcon platform={account.platform} />
                </Link>
              );
            })}
          </div>
          <Link href="/scheduler" className="text-link">
            Open Smart Scheduler <ArrowRight size={16} />
          </Link>
        </Card>
        <Card>
          <CardHeader
            title="Needs your attention"
            description="Examples of actionable workflow states."
            action={<Badge tone="warning">{attention.length} demo items</Badge>}
          />
          <div className="attention-list">
            {attention.map((job) => (
              <Link href="/queue" className="attention-item" key={job.id}>
                <CircleAlert size={19} aria-hidden="true" />
                <span>
                  <strong>{videoById(job.videoId)?.title}</strong>
                  <span className="muted small">{job.error}</span>
                </span>
                <JobStatusBadge status={job.status} />
              </Link>
            ))}
          </div>
          <p className="field-hint">
            These are simulation records. No failed live publication is implied.
          </p>
        </Card>
      </div>
      <div className="grid grid-2">
        <Card>
          <CardHeader
            title="Performance snapshot"
            description="Real metrics need an authorized analytics connection."
          />
          <EmptyState
            title="Your story is still unwritten"
            description="No real views, watch time or engagement data is available. We don’t replace missing metrics with zeroes."
            icon={<ListChecks size={25} />}
            action={
              <Link href="/performance" className="btn btn-secondary btn-md">
                Explore Performance Lab <ArrowRight size={16} />
              </Link>
            }
          />
        </Card>
        <Card>
          <CardHeader
            title="Recent publishing activity"
            description="A real outcome will appear only after a verified integration."
          />
          <EmptyState
            title="No real publications yet"
            description="Demo drafts and schedule entries never become published posts. Publishing is disabled in this frontend phase."
            icon={<CheckCheck size={25} />}
            action={
              <Link href="/queue" className="btn btn-secondary btn-md">
                View demo queue <ArrowRight size={16} />
              </Link>
            }
          />
        </Card>
      </div>
    </div>
  );
}
