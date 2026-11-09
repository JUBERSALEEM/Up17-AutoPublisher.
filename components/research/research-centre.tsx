"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BookmarkPlus,
  ExternalLink,
  Lightbulb,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DemoBadge,
  Dialog,
  EmptyState,
  Input,
  Select,
  Tabs,
  Textarea,
  Unavailable,
} from "@/components/ui";
import { DemoNotice, PageHeader } from "@/components/features/common";
import {
  BRIEFS_KEY,
  filterPrompts,
  parseBriefs,
  validateBrief,
  type ContentBrief,
  type EditorialPrompt,
} from "@/features/research/model";
import { platformLabels, type Platform } from "@/features/demo/contracts";
import { formatDate } from "@/features/demo/selectors";
import { removeBrowserValue, useBrowserValue, writeBrowserValue } from "@/lib/browser-store";

const blankForm = { title: "", notes: "", platform: "any" as Platform | "any" };
function BriefEditor({
  initial,
  onSave,
  onClose,
}: {
  initial?: ContentBrief;
  onSave: (form: typeof blankForm) => boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? { title: initial.title, notes: initial.notes, platform: initial.platform }
      : blankForm,
  );
  const [errors, setErrors] = useState<string[]>([]);
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        const next = validateBrief(form.title, form.notes);
        setErrors(next);
        if (!next.length && onSave({ ...form, title: form.title.trim() })) onClose();
      }}
    >
      {errors.length ? (
        <div className="validation-summary" role="alert">
          <strong>Review this brief</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <Input
        label="Brief title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="What do you want to explore?"
        maxLength={120}
        required
      />
      <Textarea
        label="Notes & evidence to verify"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Separate your idea from facts that still need a source…"
        maxLength={2000}
        hint={`${form.notes.length}/2,000 characters · stored only in this browser`}
      />
      <Select
        label="Intended platform"
        value={form.platform}
        onChange={(e) => setForm({ ...form, platform: e.target.value as Platform | "any" })}
      >
        <option value="any">Keep flexible</option>
        {Object.entries(platformLabels).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>
      <p className="field-hint">
        A brief is your own planning note, not a verified trend or a generated content package.
      </p>
      <div className="dialog-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initial?.id ? "Save changes" : "Save brief"}
        </Button>
      </div>
    </form>
  );
}

export function ResearchCentre() {
  const [tab, setTab] = useState("ideas");
  const [query, setQuery] = useState("");
  const [game, setGame] = useState("all");
  const [topic, setTopic] = useState("all");
  const [briefQuery, setBriefQuery] = useState("");
  const [editor, setEditor] = useState<{ brief?: ContentBrief } | null>(null);
  const [deleting, setDeleting] = useState<ContentBrief | null>(null);
  const [notice, setNotice] = useState("");
  const briefs = useBrowserValue<ContentBrief[]>(BRIEFS_KEY, [], parseBriefs);
  const prompts = useMemo(() => filterPrompts(query, game, topic), [query, game, topic]);
  const visibleBriefs = briefs.filter((b) =>
    `${b.title} ${b.notes}`.toLowerCase().includes(briefQuery.trim().toLowerCase()),
  );
  const saveBrief = (form: typeof blankForm) => {
    const brief: ContentBrief = {
      id: editor?.brief?.id || `brief-${crypto.randomUUID()}`,
      source: "demo",
      ...form,
      updatedAt: new Date().toISOString(),
    };
    const next = editor?.brief?.id
      ? briefs.map((b) => (b.id === brief.id ? brief : b))
      : [brief, ...briefs];
    const persisted = writeBrowserValue(BRIEFS_KEY, next);
    setNotice(
      persisted
        ? "Brief saved in this browser. No research request or AI generation was sent."
        : "Brief saved for this session only; browser storage is unavailable.",
    );
    return true;
  };
  const openPrompt = (prompt: EditorialPrompt) =>
    setEditor({
      brief: {
        id: "",
        source: "demo",
        title: prompt.title,
        notes: `${prompt.rationale}\n\nEditorial keywords to investigate: ${prompt.keywords.join(", ")}.\n\nEvidence still required: verify any game, weapon, map or outcome claim against your own footage and a permitted current source.`,
        platform: "any",
        updatedAt: "",
      },
    });
  const clear = () => {
    setQuery("");
    setGame("all");
    setTopic("all");
  };
  return (
    <div className="page research-page">
      <PageHeader
        eyebrow="Better questions. More original content."
        title="Research Centre"
        description="Shape your next idea without pretending to know what is trending. Live research is not connected."
        actions={
          <>
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => setEditor({})}>
              New brief
            </Button>
            <Badge tone="warning">Live research unavailable</Badge>
          </>
        }
      />
      <DemoNotice>
        The prompts below are evergreen editorial questions, not current trends or verified game
        news. No search volume, patch note, event or popularity claim is invented.
      </DemoNotice>
      {notice ? (
        <p className="save-notice" role="status">
          {notice}
        </p>
      ) : null}
      <Tabs
        label="Research workspace"
        value={tab}
        onChange={setTab}
        items={[
          {
            id: "ideas",
            label: (
              <span className="row">
                <Lightbulb size={16} />
                Editorial prompts
              </span>
            ),
            content: (
              <div className="stack">
                <div className="research-toolbar card card-flat">
                  <div className="search-field">
                    <Search size={18} />
                    <Input
                      label="Search editorial prompts"
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search questions or keywords…"
                    />
                  </div>
                  <Select label="Game focus" value={game} onChange={(e) => setGame(e.target.value)}>
                    <option value="all">All games</option>
                    <option>BGMI</option>
                    <option>PUBG</option>
                  </Select>
                  <Select
                    label="Content angle"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option value="all">All angles</option>
                    <option>Skills</option>
                    <option>Comparisons</option>
                    <option>Explainers</option>
                  </Select>
                </div>
                <div className="spread">
                  <p className="muted small" role="status">
                    {prompts.length} editorial prompts · not trend results
                  </p>
                  {query || game !== "all" || topic !== "all" ? (
                    <Button size="sm" variant="ghost" onClick={clear}>
                      Clear filters
                    </Button>
                  ) : null}
                </div>
                {prompts.length ? (
                  <div className="research-grid grid grid-2">
                    {prompts.map((prompt) => (
                      <Card as="article" key={prompt.id} className="research-prompt">
                        <div className="spread">
                          <Badge tone="accent">{prompt.topic}</Badge>
                          <span className="muted tiny">{prompt.game} · editorial prompt</span>
                        </div>
                        <h2>{prompt.title}</h2>
                        <p className="muted small">{prompt.rationale}</p>
                        <div className="keyword-list" aria-label="Keywords to investigate">
                          {prompt.keywords.map((keyword) => (
                            <span key={keyword}>{keyword}</span>
                          ))}
                        </div>
                        <div className="spread">
                          <span className="muted tiny">Relevance not measured</span>
                          <Button
                            size="sm"
                            icon={<BookmarkPlus size={16} />}
                            onClick={() => openPrompt(prompt)}
                          >
                            Save as brief
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No prompts match"
                    description="Try a different question or clear the filters. These are local editorial prompts, not a live search."
                    action={<Button onClick={clear}>Clear filters</Button>}
                  />
                )}
              </div>
            ),
          },
          {
            id: "briefs",
            label: (
              <span className="row">
                <BookOpen size={16} />
                Saved briefs ({briefs.length})
              </span>
            ),
            content: (
              <div className="stack">
                <div className="research-brief-toolbar">
                  <Input
                    label="Search saved briefs"
                    type="search"
                    value={briefQuery}
                    onChange={(e) => setBriefQuery(e.target.value)}
                    placeholder="Find a local brief…"
                  />
                  <span className="muted tiny">Browser-local · no cloud sync</span>
                </div>
                {visibleBriefs.length ? (
                  <div className="brief-list">
                    {visibleBriefs.map((brief) => (
                      <Card key={brief.id} as="article" className="brief-card">
                        <div className="brief-copy">
                          <div className="row row-wrap">
                            <Badge>
                              {brief.platform === "any"
                                ? "Flexible platform"
                                : platformLabels[brief.platform]}
                            </Badge>
                            <DemoBadge label="Local brief" />
                          </div>
                          <h2>{brief.title}</h2>
                          <p className="muted small brief-notes">
                            {brief.notes ||
                              "No notes yet. Add the evidence you still need to verify."}
                          </p>
                          <span className="muted tiny">Updated {formatDate(brief.updatedAt)}</span>
                        </div>
                        <div className="brief-actions">
                          <Button
                            size="sm"
                            icon={<Pencil size={15} />}
                            onClick={() => setEditor({ brief })}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Trash2 size={15} />}
                            onClick={() => setDeleting(brief)}
                          >
                            Delete
                          </Button>
                          <Link className="text-link tiny" href="/creator-studio">
                            Open draft editor <ArrowRight size={14} />
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={
                      briefs.length ? "No briefs match your search" : "Give your next idea a home"
                    }
                    description={
                      briefs.length
                        ? "Try another title or note keyword."
                        : "Save an editorial prompt or write your own brief. It stays in this browser until you reset local demo content."
                    }
                    action={
                      <Button variant="primary" onClick={() => setEditor({})}>
                        Create a brief
                      </Button>
                    }
                  />
                )}
              </div>
            ),
          },
          {
            id: "sources",
            label: (
              <span className="row">
                <ExternalLink size={16} />
                Updates & sources
              </span>
            ),
            content: (
              <div className="stack">
                <Card>
                  <CardHeader
                    title="Current BGMI / PUBG updates"
                    description="No live source is connected, so there are no current updates to display."
                    action={<Badge tone="warning">Unavailable</Badge>}
                  />
                  <EmptyState
                    title="No verified updates available"
                    description="Patch notes, weapon changes, events and announcements need a permitted source, publication date and freshness check. This preview does not scrape or invent them."
                  />
                  <Unavailable
                    feature="Refresh research"
                    reason="A compliant research adapter and source allowlist require a later approved integration phase."
                  />
                  <Button disabled title="No research source is connected">
                    Check for updates unavailable
                  </Button>
                </Card>
                <div className="grid grid-2">
                  <Card>
                    <CardHeader title="What a useful source must provide" />
                    <ul className="requirements-list">
                      <li>Official or otherwise permitted origin</li>
                      <li>Source URL and publication date</li>
                      <li>Clear separation of fact and suggestion</li>
                      <li>Relevance to your niche, not just popularity</li>
                      <li>Freshness and permission to use the information</li>
                    </ul>
                  </Card>
                  <Card>
                    <CardHeader
                      title="Keywords & hashtags"
                      description="Draft keywords are starting points, not measured search demand."
                    />
                    <div className="keyword-list">
                      <span>#BGMI</span>
                      <span>#PUBGMobile</span>
                      <span>#RecoilControl</span>
                      <span>#GameplayTips</span>
                    </div>
                    <p className="field-hint">
                      No hashtag volume, ranking or relevance score is available. Verify suitability
                      before using a tag.
                    </p>
                    <Link href="/creator-studio" className="text-link small">
                      Edit a content draft <ArrowRight size={15} />
                    </Link>
                  </Card>
                </div>
              </div>
            ),
          },
        ]}
      />
      <Dialog
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor?.brief?.id ? "Edit your brief" : "Save a content brief"}
        description="A local planning note. No external research or AI request is made."
      >
        {editor ? (
          <BriefEditor
            key={editor.brief?.id || editor.brief?.title || "new"}
            initial={
              editor.brief?.id
                ? editor.brief
                : editor.brief
                  ? { ...editor.brief, id: "" }
                  : undefined
            }
            onSave={saveBrief}
            onClose={() => setEditor(null)}
          />
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this local brief?"
        description={deleting?.title}
        footer={
          <>
            <Button onClick={() => setDeleting(null)}>Keep brief</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!deleting) return;
                const next = briefs.filter((b) => b.id !== deleting.id);
                if (next.length) writeBrowserValue(BRIEFS_KEY, next);
                else removeBrowserValue(BRIEFS_KEY);
                setDeleting(null);
                setNotice("Brief removed from this browser’s demo collection.");
              }}
            >
              Delete brief
            </Button>
          </>
        }
      >
        <p className="muted small">
          This removes the browser-local planning note only. No cloud copy exists.
        </p>
      </Dialog>
    </div>
  );
}
