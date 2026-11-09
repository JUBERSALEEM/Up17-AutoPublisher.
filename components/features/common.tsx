import type { ReactNode } from "react";
import { Music2 } from "lucide-react";
import { Badge, DemoBadge, type Tone } from "@/components/ui";
import type { JobStatus, Platform, VideoStatus } from "@/features/demo/contracts";
import { jobStatusLabels, platformLabels, videoStatusLabels } from "@/features/demo/contracts";
import type { DemoVideo } from "@/features/demo/contracts";
import { formatDuration } from "@/features/demo/selectors";

export function PageHeader({
  eyebrow = "Creator workspace",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="demo-notice">
      <DemoBadge />
      <p>
        {children ??
          "Illustrative demo content only. No real accounts, media, analytics or publishing are connected."}
      </p>
    </div>
  );
}

export function PlatformIcon({ platform, size = 18 }: { platform: Platform; size?: number }) {
  if (platform === "youtube")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
      </svg>
    );
  if (platform === "instagram")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    );
  return <Music2 size={size} aria-hidden="true" />;
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <Badge icon={<PlatformIcon platform={platform} size={14} />}>{platformLabels[platform]}</Badge>
  );
}

const videoTones: Record<VideoStatus, Tone> = {
  uploaded: "neutral",
  queued: "primary",
  analysing: "accent",
  ready: "success",
  needs_attention: "warning",
  failed: "danger",
};
const jobTones: Record<JobStatus, Tone> = {
  draft: "neutral",
  ready: "primary",
  scheduled: "primary",
  publishing: "accent",
  published: "success",
  waiting_for_authorisation: "warning",
  failed: "danger",
  retry_scheduled: "warning",
  needs_attention: "warning",
  cancelled: "neutral",
};
export function VideoStatusBadge({ status }: { status: VideoStatus }) {
  return <Badge tone={videoTones[status]}>{videoStatusLabels[status]}</Badge>;
}
export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={jobTones[status]}>{jobStatusLabels[status]}</Badge>;
}

/** Original schematic artwork, explicitly not a real gameplay frame or uploaded thumbnail. */
export function VideoArtwork({ video, className = "" }: { video: DemoVideo; className?: string }) {
  const variant = video.artwork;
  return (
    <div
      className={`video-artwork artwork-${variant} ${className}`}
      role="img"
      aria-label={`Demo artwork for ${video.title}`}
    >
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M-20 130 C60 80 90 150 160 100 S260 40 350 80" className="art-route" />
        <path d="M20 40h70v45H20zM210 95h75v50h-75zM135 20h48v32h-48z" className="art-block" />
        <circle
          cx={variant === 1 ? 225 : variant === 2 ? 95 : 160}
          cy={variant === 1 ? 70 : variant === 2 ? 110 : 88}
          r="17"
          className="art-target"
        />
        <path d="M0 150h320M0 30h320" className="art-grid" />
      </svg>
      <span className="art-label">
        {video.game} · {video.map}
      </span>
      <span className="art-duration">{formatDuration(video.durationSeconds)}</span>
      <span className="art-demo">Demo artwork</span>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: Tone;
}) {
  return (
    <div className="metric-card card card-raised">
      <span className="metric-label">{label}</span>
      <strong className={`metric-value metric-${tone}`}>{value}</strong>
      <span className="metric-note">{note}</span>
    </div>
  );
}
