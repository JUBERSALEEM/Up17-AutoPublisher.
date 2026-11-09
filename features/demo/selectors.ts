import type { DemoJob, DemoVideo, JobStatus, Platform, VideoStatus } from "./contracts";
import { accountById } from "./fixtures";

export type VideoSort = "newest" | "oldest" | "title" | "duration";

export function filterVideos(
  videos: readonly DemoVideo[],
  query: string,
  status: VideoStatus | "all",
  sort: VideoSort,
): DemoVideo[] {
  const q = query.trim().toLowerCase();
  const filtered = videos.filter(
    (video) =>
      (status === "all" || video.status === status) &&
      (!q ||
        `${video.title} ${video.fileName} ${video.game} ${video.map} ${video.weapon} ${video.tags.join(" ")}`
          .toLowerCase()
          .includes(q)),
  );
  return [...filtered].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "duration") return a.durationSeconds - b.durationSeconds;
    const delta = Date.parse(a.uploadedAt) - Date.parse(b.uploadedAt);
    return sort === "oldest" ? delta : -delta;
  });
}

export function filterJobs(
  jobs: readonly DemoJob[],
  query: string,
  status: JobStatus | "all",
  platform: Platform | "all",
  accountId: string | "all",
): DemoJob[] {
  const q = query.trim().toLowerCase();
  return jobs
    .filter((job) => {
      const account = accountById(job.accountId);
      return (
        (status === "all" || job.status === status) &&
        (platform === "all" || account?.platform === platform) &&
        (accountId === "all" || job.accountId === accountId) &&
        (!q ||
          `${job.id} ${job.error ?? ""} ${account?.displayName ?? ""} ${account?.handle ?? ""}`
            .toLowerCase()
            .includes(q))
      );
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dubai",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, timezone = "Asia/Dubai"): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso));
}
