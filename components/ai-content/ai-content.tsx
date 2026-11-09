"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  AudioLines,
  BrainCircuit,
  CircleDashed,
  Crosshair,
  FileText,
  MapPin,
  ScanLine,
  Scissors,
  ShieldCheck,
  Sparkles,
  Swords,
  Volume2,
} from "lucide-react";
import { Badge, Button, Card, CardHeader, DemoBadge, Select, Unavailable } from "@/components/ui";
import { DemoNotice, PageHeader, VideoArtwork } from "@/components/features/common";
import { demoVideos, videoById } from "@/features/demo/fixtures";
import { formatDuration } from "@/features/demo/selectors";

/** Generic interface markers only. These are not detections, findings or clip recommendations. */
const markerTemplates = [
  {
    id: "opening",
    fraction: 0.08,
    label: "Opening review point",
    kind: "Visual",
    detail:
      "A place to review the opening frame. No hook score or visual finding has been computed.",
  },
  {
    id: "audio",
    fraction: 0.3,
    label: "Audio review point",
    kind: "Audio",
    detail: "A place to review game audio, voice and music. No audio was extracted or measured.",
  },
  {
    id: "action",
    fraction: 0.58,
    label: "Gameplay review point",
    kind: "Visual",
    detail:
      "A place to inspect gameplay evidence. No fight, weapon, map, knock or elimination was detected.",
  },
  {
    id: "boundary",
    fraction: 0.82,
    label: "Clip boundary example",
    kind: "Clip",
    detail:
      "An illustrative edit boundary, not an AI recommendation. No pacing or dead-time score exists.",
  },
] as const;
const stages = [
  { label: "Source intake", note: "Real upload unavailable", icon: FileText },
  { label: "Visual analysis", note: "Provider not connected", icon: ScanLine },
  { label: "Audio analysis", note: "Provider not connected", icon: AudioLines },
  { label: "Evidence review", note: "No observations to verify", icon: ShieldCheck },
  { label: "Content packages", note: "Manual local editor available", icon: Sparkles },
];
export function AiContent() {
  const [videoId, setVideoId] = useState(demoVideos[0].id);
  const [selected, setSelected] = useState("opening");
  const video = videoById(videoId)!;
  const markers = markerTemplates.map((marker) => ({
    ...marker,
    second: Math.round(video.durationSeconds * marker.fraction),
  }));
  const active = markers.find((marker) => marker.id === selected) ?? markers[0];
  return (
    <div className="page ai-page">
      <PageHeader
        eyebrow="Understand the footage before telling the story"
        title="AI Content"
        description="Explore the analysis workflow and evidence standards. No model has run and no gameplay result is fabricated."
        actions={
          <>
            <Link href={`/creator-studio?video=${videoId}`} className="btn btn-primary btn-md">
              Open manual editor <ArrowRight size={17} />
            </Link>
            <DemoBadge label="Simulation" />
          </>
        }
      />
      <DemoNotice>
        This timeline is an interface simulation. Marker positions are generic fractions of the demo
        duration, not detected moments. Weapon, map, fight and confidence results remain
        unavailable.
      </DemoNotice>
      <Card className="analysis-source">
        <div className="analysis-source-select">
          <Select
            label="Demo source video"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
          >
            {demoVideos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="analysis-source-status">
          <CircleDashed size={19} />
          <div>
            <strong>Analysis not run</strong>
            <span className="muted tiny">No worker, provider request or token usage</span>
          </div>
        </div>
        <Button
          disabled
          icon={<BrainCircuit size={17} />}
          title="Video processing and AI providers are not connected"
        >
          Run analysis unavailable
        </Button>
      </Card>
      <div className="analysis-layout">
        <aside className="stack">
          <Card className="analysis-preview">
            <VideoArtwork video={video} />
            <div className="stack">
              <div className="row row-wrap">
                <Badge tone="accent">Demo source</Badge>
                <span className="muted tiny">{formatDuration(video.durationSeconds)}</span>
              </div>
              <h2>{video.title}</h2>
              <p className="muted small">{video.description}</p>
              <Unavailable
                feature="Video playback"
                reason="This is schematic artwork, not an uploaded file."
              />
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Source metadata ≠ analysis"
              description="These labels come from the demo fixture, not from visual detection."
            />
            <dl className="metadata-grid">
              <div>
                <dt>Game label</dt>
                <dd>{video.game}</dd>
              </div>
              <div>
                <dt>Map label</dt>
                <dd>{video.map}</dd>
              </div>
              <div>
                <dt>Weapon label</dt>
                <dd>{video.weapon}</dd>
              </div>
              <div>
                <dt>Verified by AI</dt>
                <dd>No · not run</dd>
              </div>
            </dl>
          </Card>
        </aside>
        <div className="stack">
          <Card>
            <CardHeader
              title="From footage to a trustworthy package"
              description="Workflow design, not a progress report. No stage is executing."
              action={<Badge>Planned workflow</Badge>}
            />
            <ol className="analysis-stages">
              {stages.map((stage, index) => (
                <li key={stage.label}>
                  <span className="analysis-stage-icon">
                    <stage.icon size={19} />
                  </span>
                  <div>
                    <strong>
                      {index + 1}. {stage.label}
                    </strong>
                    <span className="muted tiny">{stage.note}</span>
                  </div>
                  <Badge tone={index === 4 ? "accent" : "neutral"}>
                    {index === 4 ? "Manual only" : "Unavailable"}
                  </Badge>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="timeline-card">
            <CardHeader
              title="Analysis timeline"
              description="Select a generic review point to see what a future evidence panel would contain."
              action={<DemoBadge label="Simulation" />}
            />
            <div className="timeline-track" role="group" aria-label="Illustrative timeline markers">
              <div className="timeline-rail" aria-hidden="true" />
              {markers.map((marker) => (
                <button
                  key={marker.id}
                  type="button"
                  className={`timeline-marker ${selected === marker.id ? "timeline-marker-active" : ""}`}
                  style={{ left: `${marker.fraction * 100}%` }}
                  aria-pressed={selected === marker.id}
                  aria-label={`${marker.label} at ${formatDuration(marker.second)}, simulation`}
                  onClick={() => setSelected(marker.id)}
                >
                  <span>
                    {marker.kind === "Audio" ? (
                      <Volume2 size={16} />
                    ) : marker.kind === "Clip" ? (
                      <Scissors size={16} />
                    ) : (
                      <Crosshair size={16} />
                    )}
                  </span>
                  <small>{formatDuration(marker.second)}</small>
                </button>
              ))}
            </div>
            <div className="timeline-axis muted tiny">
              <span>0:00</span>
              <span>Generic review points · not detections</span>
              <span>{formatDuration(video.durationSeconds)}</span>
            </div>
            <div className="marker-detail" aria-live="polite">
              <div className="spread">
                <h3>{active.label}</h3>
                <Badge tone="accent">{formatDuration(active.second)} · demo</Badge>
              </div>
              <p className="muted small">{active.detail}</p>
              <div className="marker-confidence">
                <span>Confidence</span>
                <strong>Not available</strong>
                <span>Evidence</span>
                <strong>No frame analysed</strong>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Observations & confidence"
              description="Unknown is a valid result. Demo labels never become factual claims."
            />
            <div className="observation-grid">
              {[
                { label: "Weapon & scope", icon: Crosshair },
                { label: "Map & location", icon: MapPin },
                { label: "Fights & outcomes", icon: Swords },
                { label: "Audio balance", icon: AudioLines },
              ].map((item) => (
                <div key={item.label} className="observation-item">
                  <item.icon size={20} />
                  <strong>{item.label}</strong>
                  <span className="muted small">Not analysed</span>
                  <Badge>Confidence unavailable</Badge>
                </div>
              ))}
            </div>
            <Unavailable
              feature="Corrections and clip suggestions"
              reason="There are no observations to correct. Verified facts, estimates and user corrections require the later analysis phase."
            />
            <Button disabled title="No analysis result exists">
              Correct observation unavailable
            </Button>
          </Card>
          <Card>
            <CardHeader
              title="AI run metadata"
              description="Transparent provenance, even when nothing has run."
            />
            <dl className="metadata-grid">
              <div>
                <dt>Provider / model</dt>
                <dd>Not configured</dd>
              </div>
              <div>
                <dt>Run ID / version</dt>
                <dd>Not run</dd>
              </div>
              <div>
                <dt>Started / completed</dt>
                <dd>Not available</dd>
              </div>
              <div>
                <dt>Tokens / cost</dt>
                <dd>No request made</dd>
              </div>
            </dl>
            <p className="privacy-inline">
              <ShieldCheck size={17} />
              No invented world records, kills, distances or achievements. Unproven claims must stay
              out of metadata.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
