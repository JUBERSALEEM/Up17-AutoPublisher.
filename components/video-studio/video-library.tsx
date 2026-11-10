"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Grid2X2, List, Search, Upload, X } from "lucide-react";
import {
  Button,
  Card,
  DemoBadge,
  Dialog,
  EmptyState,
  IconButton,
  Input,
  Select,
} from "@/components/ui";
import {
  DemoNotice,
  PageHeader,
  VideoArtwork,
  VideoStatusBadge,
} from "@/components/features/common";
import { demoVideos } from "@/features/demo/fixtures";
import { videoStatusLabels, type VideoStatus } from "@/features/demo/contracts";
import {
  filterVideos,
  formatBytes,
  formatDate,
  formatDuration,
  type VideoSort,
} from "@/features/demo/selectors";
import type { DemoVideo } from "@/features/demo/contracts";

export function VideoLibrary() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VideoStatus | "all">("all");
  const [sort, setSort] = useState<VideoSort>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<DemoVideo | null>(null);
  const [uploadInfo, setUploadInfo] = useState(false);
  const videos = useMemo(
    () => filterVideos(demoVideos, query, status, sort),
    [query, status, sort],
  );
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  const clear = () => {
    setQuery("");
    setStatus("all");
    setSort("newest");
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow="Your source library"
        title="Video Studio"
        description="One source, many possibilities. Find a demo clip and prepare it for each creator account."
        actions={
          <>
            <Button
              variant="primary"
              icon={<Upload size={18} />}
              onClick={() => setUploadInfo(true)}
            >
              Upload a video
            </Button>
            <DemoBadge />
          </>
        }
      />
      <DemoNotice>
        These are demo metadata records with original schematic artwork. No video files have been
        uploaded or stored.
      </DemoNotice>
      <div className="library-toolbar card card-flat">
        <div className="search-field">
          <Search size={18} aria-hidden="true" />
          <Input
            label="Search videos"
            type="search"
            placeholder="Search titles, weapons, maps or tags…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select
          label="Processing status"
          value={status}
          onChange={(event) => setStatus(event.target.value as VideoStatus | "all")}
        >
          <option value="all">All statuses</option>
          {Object.entries(videoStatusLabels).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Sort videos"
          value={sort}
          onChange={(event) => setSort(event.target.value as VideoSort)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
          <option value="duration">Shortest first</option>
        </Select>
        <div className="view-switch" role="group" aria-label="Library view">
          <IconButton
            label="Card view"
            className={view === "grid" ? "view-active" : ""}
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <Grid2X2 size={19} />
          </IconButton>
          <IconButton
            label="List view"
            className={view === "list" ? "view-active" : ""}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List size={19} />
          </IconButton>
        </div>
      </div>
      <div className="library-summary spread">
        <p className="muted small" role="status">
          {videos.length} of {demoVideos.length} demo videos
          {selected.length ? ` · ${selected.length} selected` : ""}
        </p>
        {query || status !== "all" ? (
          <Button variant="ghost" size="sm" onClick={clear} icon={<X size={15} />}>
            Clear filters
          </Button>
        ) : (
          <span className="muted tiny">Demo workspace · Asia/Dubai</span>
        )}
      </div>
      {selected.length ? (
        <div className="selection-bar">
          <span>
            <Check size={17} />
            {selected.length} selected
          </span>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Clear selection
          </Button>
          <Button
            size="sm"
            disabled
            title="Bulk media actions require the approved storage/worker phase"
          >
            Process selected unavailable
          </Button>
        </div>
      ) : null}
      {!videos.length ? (
        <EmptyState
          title="No videos match your search"
          description="Try another title, weapon or map, or clear the current filters."
          icon={<Search size={26} />}
          action={<Button onClick={clear}>Clear filters</Button>}
        />
      ) : view === "grid" ? (
        <div className="video-grid">
          {videos.map((video) => (
            <Card as="article" key={video.id} className="video-card">
              <div className="video-card-media">
                <VideoArtwork video={video} />
                <label className="video-select">
                  <input
                    type="checkbox"
                    checked={selected.includes(video.id)}
                    onChange={() => toggle(video.id)}
                    aria-label={`Select ${video.title}`}
                  />
                </label>
              </div>
              <div className="video-card-body">
                <div className="spread">
                  <VideoStatusBadge status={video.status} />
                  <span className="muted tiny">{video.game}</span>
                </div>
                <h2 className="video-card-title">{video.title}</h2>
                <p className="muted tiny">
                  {formatDuration(video.durationSeconds)} · {formatBytes(video.sizeBytes)} ·{" "}
                  {video.height > video.width ? "9:16" : "16:9"}
                </p>
                <div className="video-card-footer">
                  <span className="muted tiny">{formatDate(video.uploadedAt)}</span>
                  <button type="button" className="text-link tiny" onClick={() => setDetail(video)}>
                    Details <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="video-list">
          <div className="video-list-head">
            <span>Video</span>
            <span>Status</span>
            <span>Duration / size</span>
            <span>Added</span>
            <span />
          </div>
          {videos.map((video) => (
            <div className="video-list-row" key={video.id}>
              <div className="video-list-title">
                <input
                  type="checkbox"
                  checked={selected.includes(video.id)}
                  onChange={() => toggle(video.id)}
                  aria-label={`Select ${video.title}`}
                />
                <VideoArtwork video={video} />
                <span>
                  <strong>{video.title}</strong>
                  <span className="muted tiny">{video.fileName}</span>
                </span>
              </div>
              <VideoStatusBadge status={video.status} />
              <span className="small muted">
                {formatDuration(video.durationSeconds)} · {formatBytes(video.sizeBytes)}
              </span>
              <span className="small muted">{formatDate(video.uploadedAt)}</span>
              <Button size="sm" onClick={() => setDetail(video)}>
                Details
              </Button>
            </div>
          ))}
        </Card>
      )}
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.title ?? "Video details"}
        description="Demo source metadata · no real media file"
        wide
        footer={
          detail ? (
            <>
              <Button onClick={() => setDetail(null)}>Close</Button>
              <Link className="btn btn-primary btn-md" href={`/creator-studio?video=${detail.id}`}>
                Prepare content <ArrowRight size={17} />
              </Link>
            </>
          ) : null
        }
      >
        {detail ? (
          <div className="video-detail">
            <VideoArtwork video={detail} />
            <div className="stack">
              <div className="row row-wrap">
                <VideoStatusBadge status={detail.status} />
                <DemoBadge />
              </div>
              <p className="muted small">{detail.description}</p>
              <dl className="metadata-grid">
                <div>
                  <dt>Original filename</dt>
                  <dd>{detail.fileName}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{formatDuration(detail.durationSeconds)}</dd>
                </div>
                <div>
                  <dt>Demo file size</dt>
                  <dd>{formatBytes(detail.sizeBytes)}</dd>
                </div>
                <div>
                  <dt>Dimensions</dt>
                  <dd>
                    {detail.width} × {detail.height}
                  </dd>
                </div>
                <div>
                  <dt>Game / map</dt>
                  <dd>
                    {detail.game} / {detail.map}
                  </dd>
                </div>
                <div>
                  <dt>Weapon</dt>
                  <dd>{detail.weapon}</dd>
                </div>
              </dl>
              <p className="unavailable-note">
                <strong>Preview and processing unavailable.</strong> Artwork is illustrative. Real
                playback, retry, reprocessing and deletion require approved media storage and a
                worker.
              </p>
              <div className="row row-wrap">
                <Button
                  disabled
                  disabledReason="No media processing service is connected to this labelled demo library."
                  title="No media processing service is connected"
                >
                  Retry unavailable
                </Button>
                <Button
                  disabled
                  disabledReason="No real media is stored for this labelled demo item."
                  variant="danger"
                  title="No real media is stored"
                >
                  Delete unavailable
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        open={uploadInfo}
        onClose={() => setUploadInfo(false)}
        title="A home for your next clip"
        description="Upload intake is designed, but storage is not connected."
        footer={
          <Button variant="primary" onClick={() => setUploadInfo(false)}>
            Got it
          </Button>
        }
      >
        <div className="stack">
          <div className="upload-zone">
            <Upload size={30} aria-hidden="true" />
            <strong>Real video upload is unavailable</strong>
            <p>
              MP4-first, direct resumable storage and background processing are planned for a
              separately approved phase.
            </p>
            <Button
              disabled
              disabledReason="Authenticated private storage upload is not enabled in this labelled demo phase."
            >
              Choose a video unavailable
            </Button>
          </div>
          <p className="field-hint">
            No file is read, sent or stored here. Explore the labelled demo library instead.
          </p>
          <Link
            href="/creator-studio?video=demo-video-1"
            className="btn btn-secondary btn-md"
            onClick={() => setUploadInfo(false)}
          >
            Try a demo draft <ArrowRight size={17} />
          </Link>
        </div>
      </Dialog>
    </div>
  );
}
