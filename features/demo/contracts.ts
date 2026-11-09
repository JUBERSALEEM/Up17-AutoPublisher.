/** Presentation-only demo contracts. These are not database entities or provider SDK types. */
export type Platform = "youtube" | "instagram" | "tiktok";
export type VideoStatus =
  "uploaded" | "queued" | "analysing" | "ready" | "needs_attention" | "failed";
export type JobStatus =
  | "draft"
  | "ready"
  | "scheduled"
  | "publishing"
  | "published"
  | "waiting_for_authorisation"
  | "failed"
  | "retry_scheduled"
  | "needs_attention"
  | "cancelled";
export type DemoSource = "demo";

export interface DemoAccount {
  id: string;
  source: DemoSource;
  platform: Platform;
  displayName: string;
  handle: string;
  connection: "demo_mode";
  publishingEnabled: false;
  paused: boolean;
  timezone: string;
  scopes: string[];
  note: string;
}

export interface DemoVideo {
  id: string;
  source: DemoSource;
  title: string;
  fileName: string;
  status: VideoStatus;
  durationSeconds: number;
  sizeBytes: number;
  width: number;
  height: number;
  uploadedAt: string;
  game: "BGMI" | "PUBG";
  map: string;
  weapon: string;
  tags: string[];
  description: string;
  artwork: 1 | 2 | 3;
}

export interface DemoAttempt {
  at: string;
  step: string;
  result: string;
}

export interface DemoJob {
  id: string;
  source: DemoSource;
  videoId: string;
  accountId: string;
  status: JobStatus;
  scheduledAt?: string;
  updatedAt: string;
  error?: string;
  attempts: DemoAttempt[];
}

export interface DemoScheduleItem {
  id: string;
  source: DemoSource;
  videoId: string;
  accountId: string;
  scheduledAt: string;
  timezone: string;
  status: "scheduled" | "draft";
}

export const platformLabels: Record<Platform, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
};

export const videoStatusLabels: Record<VideoStatus, string> = {
  uploaded: "Uploaded",
  queued: "Queued",
  analysing: "Analysing",
  ready: "Ready",
  needs_attention: "Needs attention",
  failed: "Failed",
};

export const jobStatusLabels: Record<JobStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  scheduled: "Scheduled",
  publishing: "Publishing",
  published: "Published",
  waiting_for_authorisation: "Waiting for authorisation",
  failed: "Failed",
  retry_scheduled: "Retry scheduled",
  needs_attention: "Needs attention",
  cancelled: "Cancelled",
};
