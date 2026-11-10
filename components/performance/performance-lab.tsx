"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Download,
  Eye,
  FlaskConical,
  GitCompareArrows,
  Info,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  SegmentedControl,
  Select,
  Unavailable,
} from "@/components/ui";
import { DemoNotice, PageHeader, PlatformIcon } from "@/components/features/common";
import { demoAccounts, demoVideos, DEMO_ANCHOR } from "@/features/demo/fixtures";
import { platformLabels, type Platform } from "@/features/demo/contracts";

const ranges = [
  { id: "7", label: "7-day window" },
  { id: "28", label: "28-day window" },
  { id: "90", label: "90-day window" },
  { id: "custom", label: "Custom dates" },
];
function rangeDates(range: string, from: string, to: string) {
  if (range === "custom") return { from, to };
  const end = new Date(DEMO_ANCHOR);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - Number(range) + 1);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}
export function PerformanceLab() {
  const [view, setView] = useState("overview");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [account, setAccount] = useState("all");
  const [range, setRange] = useState("28");
  const [from, setFrom] = useState("2026-10-12");
  const [to, setTo] = useState("2026-11-08");
  const [query, setQuery] = useState("");
  const dates = rangeDates(range, from, to);
  const invalidDates = !dates.from || !dates.to || dates.from > dates.to;
  const accounts = demoAccounts.filter(
    (a) =>
      (platform === "all" || a.platform === platform) && (account === "all" || a.id === account),
  );
  const videos = useMemo(
    () =>
      demoVideos.filter((v) =>
        `${v.title} ${v.weapon} ${v.map}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );
  const scope = `${platform === "all" ? "All platforms" : platformLabels[platform]} · ${account === "all" ? "all demo identities" : demoAccounts.find((a) => a.id === account)?.displayName} · ${invalidDates ? "invalid date range" : `${dates.from} to ${dates.to}`}`;
  return (
    <div className="page performance-page">
      <PageHeader
        eyebrow="Learn from evidence, not guesses"
        title="Performance Lab"
        description="Compare channels, videos and content experiments when authorized reports exist. No analytics are connected today."
        actions={
          <>
            <Link href="/accounts" className="btn btn-primary btn-md">
              Review account setup <ArrowRight size={17} />
            </Link>
            <Badge tone="warning">No live data</Badge>
          </>
        }
      />
      <DemoNotice>
        Filters below change the report scope only. Missing metrics stay unavailable — never zero,
        interpolated or presented as a real result. Date windows use the fixed demo anchor, 8
        November 2026.
      </DemoNotice>
      <Card className="performance-filters">
        <Select
          label="Report platform"
          value={platform}
          onChange={(e) => {
            setPlatform(e.target.value as Platform | "all");
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
        <Select label="Report account" value={account} onChange={(e) => setAccount(e.target.value)}>
          <option value="all">All demo identities</option>
          {demoAccounts
            .filter((a) => platform === "all" || a.platform === platform)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName}
              </option>
            ))}
        </Select>
        <Select label="Date range" value={range} onChange={(e) => setRange(e.target.value)}>
          {ranges.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>
        {range === "custom" ? (
          <div className="custom-date-fields">
            <Input
              label="From"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        ) : null}
        <div className="performance-filter-actions">
          <Button
            disabled
            icon={<RefreshCw size={16} />}
            title="No analytics provider is connected"
          >
            Sync unavailable
          </Button>
          <Button
            disabled
            disabledReason="There is no real analytics report to export from this labelled demo."
            icon={<Download size={16} />}
            title="There is no real report to export"
          >
            Export unavailable
          </Button>
        </div>
      </Card>
      {invalidDates ? (
        <p className="validation-summary" role="alert">
          Choose a valid date range with the start on or before the end.
        </p>
      ) : null}
      <p className="report-scope" role="status">
        <CalendarDays size={16} />
        <span>{scope}</span>
        <Badge>Scope preview</Badge>
      </p>
      <SegmentedControl
        label="Performance view"
        value={view}
        onChange={setView}
        items={[
          { id: "overview", label: "Overview" },
          { id: "platforms", label: "Platforms" },
          { id: "videos", label: "Videos" },
          { id: "experiments", label: "Experiments" },
        ]}
      />
      {view === "overview" ? (
        <div className="stack">
          <div className="grid grid-4 performance-metrics">
            {[
              { label: "Views", icon: Eye },
              { label: "Watch time", icon: BarChart3 },
              { label: "Engagement", icon: UsersRound },
              { label: "Retention", icon: GitCompareArrows },
            ].map((metric) => (
              <Card key={metric.label} className="unavailable-metric">
                <metric.icon size={21} />
                <span className="metric-label">{metric.label}</span>
                <strong>—</strong>
                <span className="muted tiny">Unavailable · no authorized report</span>
              </Card>
            ))}
          </div>
          <div className="performance-overview-grid">
            <Card className="chart-empty-card">
              <CardHeader
                title="Performance over time"
                description="A real, sourced series will appear here after an authorized analytics sync."
                action={<Badge>Not connected</Badge>}
              />
              <EmptyState
                icon={<BarChart3 size={30} />}
                title="Your story is still unwritten"
                description="No views, watch time or engagement data is available. We do not fill missing metrics with zeroes or decorative chart lines."
                action={
                  <Link href="/accounts" className="btn btn-secondary btn-md">
                    Review requirements <ArrowRight size={16} />
                  </Link>
                }
              />
            </Card>
            <Card>
              <CardHeader
                title="Publishing activity"
                description="Real outcomes require a connected publishing service."
              />
              <div className="publishing-empty">
                <span className="empty-icon">
                  <CalendarDays size={25} />
                </span>
                <strong>No real publications yet</strong>
                <p className="muted small">
                  Demo queue records and schedule slots never become published posts in this
                  preview.
                </p>
                <Link href="/queue" className="text-link small">
                  View demo queue <ArrowRight size={15} />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
      {view === "platforms" ? (
        <div className="grid grid-3 platform-comparison">
          {accounts.map((a) => (
            <Card key={a.id} as="article">
              <div className="spread">
                <span className={`platform-icon platform-${a.platform}`}>
                  <PlatformIcon platform={a.platform} size={22} />
                </span>
                <Badge tone="warning">Not connected</Badge>
              </div>
              <h2>{a.displayName}</h2>
              <p className="muted small">
                {platformLabels[a.platform]} · {a.handle} · demo identity
              </p>
              <dl className="metadata-grid">
                <div>
                  <dt>Views / reach</dt>
                  <dd>Unavailable</dd>
                </div>
                <div>
                  <dt>Engagement</dt>
                  <dd>Unavailable</dd>
                </div>
                <div>
                  <dt>Last real sync</dt>
                  <dd>Never</dd>
                </div>
                <div>
                  <dt>Report capability</dt>
                  <dd>Not verified</dd>
                </div>
              </dl>
              <p className="field-hint">
                Available metrics depend on account type, permissions and official API reporting
                rules. No parity is assumed.
              </p>
              <Link href="/accounts" className="text-link small">
                Account requirements <ArrowRight size={15} />
              </Link>
            </Card>
          ))}
        </div>
      ) : null}
      {view === "videos" ? (
        <Card>
          <CardHeader
            title="Video performance"
            description="Demo source records are shown for context; none has a real analytics report."
            action={<Badge>Demo sources</Badge>}
          />
          <div className="search-field">
            <Search size={18} />
            <Input
              label="Search demo video performance"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, weapon or map…"
            />
          </div>
          {videos.length ? (
            <div className="performance-video-list">
              {videos.map((video) => (
                <div key={video.id} className="performance-video-row">
                  <div>
                    <strong>{video.title}</strong>
                    <span className="muted tiny">
                      {video.game} · {video.weapon} · demo source
                    </span>
                  </div>
                  <span className="muted small">Views: unavailable</span>
                  <span className="muted small">Retention: unavailable</span>
                  <Link href={`/creator-studio?video=${video.id}`} className="text-link tiny">
                    Open draft <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No demo sources match"
              description="Try another title, weapon or map."
              action={<Button onClick={() => setQuery("")}>Clear search</Button>}
            />
          )}
          <Unavailable
            feature="Per-video reports and date comparison"
            reason="No published-post association or authorized analytics snapshot exists."
          />
        </Card>
      ) : null}
      {view === "experiments" ? (
        <div className="stack">
          <Card>
            <CardHeader
              title="Content experiments"
              description="Plan a fair comparison before claiming a winner."
              action={<Badge tone="accent">Planning only</Badge>}
            />
            <div className="experiment-question">
              <FlaskConical size={27} />
              <div>
                <h2>Which weapon explanation helps your audience most?</h2>
                <p className="muted small">
                  Compare your own AKM, M762, M416 and M249 explainers using a consistent,
                  authorized metric and comparable time windows. No result or winning weapon is
                  available.
                </p>
              </div>
            </div>
            <div className="keyword-list">
              <span>AKM</span>
              <span>M762</span>
              <span>M416</span>
              <span>M249</span>
            </div>
            <Unavailable
              feature="Experiment results"
              reason="No connected analytics, sample sizes or measured outcomes exist."
            />
            <Link href="/research" className="btn btn-secondary btn-md">
              Plan a research brief <ArrowRight size={16} />
            </Link>
          </Card>
          <Card variant="inset">
            <div className="privacy-inline">
              <Info size={20} />
              <p className="small">
                A useful experiment separates the question, evidence, metric definition and date
                window. Popular does not mean relevant, and a demo label is not a measured result.
              </p>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
