"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowLeft, Check, Clock3, Info, Save, Sparkles, Upload } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DemoBadge,
  Input,
  Select,
  Skeleton,
  Tabs,
  Textarea,
} from "@/components/ui";
import {
  DemoNotice,
  PageHeader,
  PlatformIcon,
  VideoArtwork,
  VideoStatusBadge,
} from "@/components/features/common";
import { demoAccounts, demoVideos, videoById } from "@/features/demo/fixtures";
import { platformLabels, type Platform } from "@/features/demo/contracts";
import { formatBytes, formatDate, formatDuration } from "@/features/demo/selectors";
import {
  DRAFTS_KEY,
  draftLimits,
  emptyDraft,
  isDraftMap,
  parseHashtags,
  validateDraft,
  type DraftForm,
  type DraftMap,
} from "@/features/creator-studio/draft";
import { removeBrowserValue, useBrowserValue, writeBrowserValue } from "@/lib/browser-store";

function PackageEditor({
  videoId,
  platform,
  saved,
  onSave,
}: {
  videoId: string;
  platform: Platform;
  saved?: DraftForm;
  onSave: (form: DraftForm) => boolean;
}) {
  const video = videoById(videoId)!;
  const [form, setForm] = useState<DraftForm>(
    saved ?? { ...emptyDraft(video.title), artwork: video.artwork },
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const limits = draftLimits[platform];
  const accounts = demoAccounts.filter((account) => account.platform === platform);
  const update = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice("");
  };
  const save = (schedule = false) => {
    const nextErrors = validateDraft(form, platform, schedule);
    setErrors(nextErrors);
    if (nextErrors.length) {
      setNotice("");
      return;
    }
    const persisted = onSave(form);
    setNotice(
      persisted
        ? schedule
          ? "Demo schedule saved in this browser. Nothing was queued or published."
          : "Draft saved in this browser only. No account or platform received it."
        : "Saved for this session only because browser storage is unavailable. Nothing was sent.",
    );
  };
  return (
    <div className="package-editor">
      <DemoNotice>
        Draft guidance is local only. Character limits and settings are not live platform
        validation.
      </DemoNotice>
      {errors.length ? (
        <div className="validation-summary" role="alert">
          <strong>Review this draft</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {notice ? (
        <p className="save-notice" role="status">
          <Check size={18} aria-hidden="true" />
          {notice}
        </p>
      ) : null}
      <Card>
        <CardHeader
          title="The story you want to tell"
          description="Keep verified gameplay facts separate from suggestions. This editor never invents analysis."
        />
        <div className="stack">
          <Input
            label="Title"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            hint={`${form.title.length}/${limits.title} characters · draft guidance`}
            error={errors.find((e) => e.startsWith("Title") || e === "Add a title before saving.")}
          />
          <Textarea
            label={platform === "youtube" ? "Description" : "Caption"}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Describe what is actually shown in the clip…"
            hint={`${form.description.length}/${limits.description} characters · avoid unverified claims`}
          />
          <Input
            label="Hashtags"
            value={form.hashtags}
            onChange={(event) => update("hashtags", event.target.value)}
            placeholder="#BGMI #M416 #Gameplay"
            hint={`${parseHashtags(form.hashtags).length}/${limits.hashtags} unique hashtags · separate with spaces or commas`}
          />
          {platform === "youtube" ? (
            <Input
              label="Tags"
              value={form.tags}
              onChange={(event) => update("tags", event.target.value)}
              hint={`${form.tags.length}/500 characters · comma-separated draft tags`}
            />
          ) : (
            <p className="field-hint">
              Separate search tags are not a supported field for this platform in this preview.
            </p>
          )}
          <div className="row row-wrap">
            <Button
              disabled
              disabledReason="No approved AI provider is connected; no analysis request is simulated."
              icon={<Sparkles size={17} />}
              title="AI provider is not connected"
            >
              Generate unavailable
            </Button>
            <span className="muted tiny">No AI request or generated result is simulated.</span>
          </div>
        </div>
      </Card>
      <div className="grid grid-2">
        <Card>
          <CardHeader
            title="Destination accounts"
            description="Each identity will have its own package and publishing outcome."
            action={<DemoBadge label="Demo identities" />}
          />
          <fieldset className="account-choices">
            <legend className="sr-only">Select {platformLabels[platform]} demo accounts</legend>
            {accounts.map((account) => (
              <label
                key={account.id}
                className={`account-choice ${form.accountIds.includes(account.id) ? "account-choice-selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={form.accountIds.includes(account.id)}
                  onChange={() =>
                    update(
                      "accountIds",
                      form.accountIds.includes(account.id)
                        ? form.accountIds.filter((id) => id !== account.id)
                        : [...form.accountIds, account.id],
                    )
                  }
                />
                <span>
                  <strong>{account.displayName}</strong>
                  <span className="muted tiny">{account.handle} · not connected</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="field-hint">
            Selection is saved locally. Real authorization and independent publishing jobs are
            unavailable.
          </p>
        </Card>
        <Card>
          <CardHeader
            title="Platform settings"
            description="Prepare settings without applying them to a real account."
          />
          <div className="stack">
            {platform === "youtube" ? (
              <>
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(event) => update("category", event.target.value)}
                >
                  <option>Gaming</option>
                  <option>Education</option>
                  <option>Entertainment</option>
                </Select>
                <Select
                  label="Audience"
                  value={form.audience}
                  onChange={(event) => update("audience", event.target.value)}
                >
                  <option>General</option>
                  <option>Not made for kids</option>
                  <option>Made for kids</option>
                </Select>
              </>
            ) : (
              <Select
                label="Interaction settings"
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
              >
                <option>Gaming</option>
                <option>Comments require review</option>
                <option>Interactions disabled</option>
              </Select>
            )}
            <Select
              label="Visibility / privacy"
              value={form.visibility}
              onChange={(event) => update("visibility", event.target.value)}
            >
              <option value="private">Private / only me</option>
              <option value="unlisted">Unlisted, if supported</option>
              <option value="public">Public — requires later approval</option>
            </Select>
            <p className="field-hint">
              Public visibility is a draft preference, never permission to publish.
            </p>
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader
          title="Cover direction"
          description="Choose original demo artwork. A real thumbnail upload is not connected."
        />
        <fieldset className="artwork-choices">
          <legend className="sr-only">Select demo cover artwork</legend>
          {([1, 2, 3] as const).map((artwork) => (
            <label
              key={artwork}
              className={`artwork-choice ${form.artwork === artwork ? "artwork-choice-selected" : ""}`}
            >
              <input
                type="radio"
                name={`cover-${platform}`}
                checked={form.artwork === artwork}
                onChange={() => update("artwork", artwork)}
              />
              <VideoArtwork video={{ ...video, artwork }} />
              <span>
                Direction {artwork}{" "}
                {form.artwork === artwork ? <Check size={15} aria-hidden="true" /> : null}
              </span>
            </label>
          ))}
        </fieldset>
        <Button
          size="sm"
          disabled
          icon={<Upload size={16} />}
          title="Cover upload requires approved media storage"
        >
          Upload cover unavailable
        </Button>
      </Card>
      <Card>
        <CardHeader
          title="Give it a time"
          description="Optional demo schedule. No recommendation is inferred from another account’s audience."
          action={<Clock3 size={20} className="muted" />}
        />
        <div className="grid grid-2">
          <Input
            label="Demo date and time"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(event) => update("scheduledAt", event.target.value)}
            hint="Local workspace time; not a live publishing reservation"
          />
          <Select
            label="Timezone"
            value={form.timezone}
            onChange={(event) => update("timezone", event.target.value)}
          >
            <option>Asia/Dubai</option>
            <option>Asia/Kolkata</option>
            <option>UTC</option>
            <option>Europe/London</option>
          </Select>
        </div>
        <p className="unavailable-note">
          <strong>Smart recommendations unavailable.</strong> Account-specific audience history and
          an approved scheduling service are required.
        </p>
      </Card>
      <div className="workspace-save-bar">
        <span className="muted small">Browser-local demo draft · no cloud sync</span>
        <div className="row row-wrap">
          <Button variant="primary" icon={<Save size={17} />} onClick={() => save()}>
            Save draft
          </Button>
          <Button
            disabled
            disabledReason="Publishing is disabled; no official provider connection or approved publishing integration exists."
            title="Publishing is not connected"
          >
            Publish unavailable
          </Button>
        </div>
      </div>
    </div>
  );
}

const emptySubscribe = () => () => {};

export function VideoWorkspace({ initialVideoId }: { initialVideoId?: string }) {
  const [videoId, setVideoId] = useState(
    initialVideoId && videoById(initialVideoId) ? initialVideoId : demoVideos[0].id,
  );
  const [platform, setPlatform] = useState<Platform>("youtube");
  const drafts = useBrowserValue<DraftMap>(DRAFTS_KEY, {}, isDraftMap);
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [resetVersion, setResetVersion] = useState(0);
  const video = videoById(videoId)!;
  const save = (form: DraftForm) =>
    writeBrowserValue(DRAFTS_KEY, { ...drafts, [`${videoId}:${platform}`]: form });
  const reset = () => {
    const next = { ...drafts };
    delete next[`${videoId}:${platform}`];
    if (Object.keys(next).length) writeBrowserValue(DRAFTS_KEY, next);
    else removeBrowserValue(DRAFTS_KEY);
    setResetVersion((value) => value + 1);
  };
  return (
    <div className="page workspace-page">
      <PageHeader
        eyebrow="One video. Independent destinations."
        title="Creator Studio"
        description="Shape the title, cover and settings for each account. Save a local draft without sending anything to a platform."
        actions={
          <>
            <Link href="/video-studio" className="btn btn-ghost btn-md">
              <ArrowLeft size={17} />
              Library
            </Link>
            <DemoBadge />
          </>
        }
      />
      <div className="workspace-source card card-flat">
        <div className="workspace-source-select">
          <Select
            label="Demo source video"
            value={videoId}
            onChange={(event) => setVideoId(event.target.value)}
          >
            {demoVideos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </Select>
        </div>
        <Badge tone="accent">Local draft editor</Badge>
      </div>
      <div className="workspace-layout">
        <aside className="workspace-preview stack">
          <Card className="preview-card">
            <VideoArtwork video={video} className="workspace-artwork" />
            <div className="preview-copy">
              <div className="row row-wrap">
                <VideoStatusBadge status={video.status} />
                <DemoBadge />
              </div>
              <h2>{video.title}</h2>
              <p className="muted small">{video.description}</p>
              <dl className="metadata-grid">
                <div>
                  <dt>Duration</dt>
                  <dd>{formatDuration(video.durationSeconds)}</dd>
                </div>
                <div>
                  <dt>Demo size</dt>
                  <dd>{formatBytes(video.sizeBytes)}</dd>
                </div>
                <div>
                  <dt>Dimensions</dt>
                  <dd>
                    {video.width} × {video.height}
                  </dd>
                </div>
                <div>
                  <dt>Added</dt>
                  <dd>{formatDate(video.uploadedAt)}</dd>
                </div>
              </dl>
              <p className="unavailable-note">
                <strong>Video preview unavailable.</strong> This is demo artwork, not a playable
                uploaded file.
              </p>
              <Button
                disabled
                disabledReason="Private media storage and authenticated playback are not connected for demo artwork."
                title="Media storage and playback are not connected"
              >
                Play preview unavailable
              </Button>
            </div>
          </Card>
          <div className="workspace-tip">
            <Info size={18} aria-hidden="true" />
            <p>
              Drafts stay on this device. Use separate packages for different audiences, even on the
              same platform.
            </p>
          </div>
        </aside>
        <div className="workspace-editor">
          {hydrated ? (
            <Tabs
              label="Destination platform"
              value={platform}
              onChange={(id) => setPlatform(id as Platform)}
              items={(["youtube", "instagram", "tiktok"] as const).map((item) => ({
                id: item,
                label: (
                  <span className="row">
                    <PlatformIcon platform={item} size={16} />
                    {platformLabels[item]}
                  </span>
                ),
                content: (
                  <PackageEditor
                    key={`${videoId}:${item}:${resetVersion}`}
                    videoId={videoId}
                    platform={item}
                    saved={drafts[`${videoId}:${item}`]}
                    onSave={save}
                  />
                ),
              }))}
            />
          ) : (
            <Card>
              <Skeleton className="workspace-loading" />
            </Card>
          )}
          <div className="draft-reset-row">
            <span className="muted tiny">
              {drafts[`${videoId}:${platform}`]
                ? "A browser-local draft is saved for this platform."
                : "No saved draft for this platform yet."}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={!drafts[`${videoId}:${platform}`]}
              disabledReason="Save a browser-local draft for this platform first; there is nothing to reset yet."
              onClick={reset}
            >
              Reset saved draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
