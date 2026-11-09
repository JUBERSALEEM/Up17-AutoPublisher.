import type { Platform } from "@/features/demo/contracts";

export interface DraftForm {
  title: string;
  description: string;
  hashtags: string;
  tags: string;
  accountIds: string[];
  scheduledAt: string;
  timezone: string;
  artwork: 1 | 2 | 3;
  category: string;
  audience: string;
  visibility: string;
}

export const DRAFTS_KEY = "up17.demo.drafts.v1";
export type DraftMap = Record<string, DraftForm>;

/** Draft guidance only. Live platform capability/limit validation is a later integration gate. */
export const draftLimits: Record<
  Platform,
  { title: number; description: number; hashtags: number }
> = {
  youtube: { title: 100, description: 5000, hashtags: 15 },
  instagram: { title: 100, description: 2200, hashtags: 30 },
  tiktok: { title: 100, description: 2200, hashtags: 30 },
};

export function emptyDraft(title = ""): DraftForm {
  return {
    title,
    description: "",
    hashtags: "",
    tags: "",
    accountIds: [],
    scheduledAt: "",
    timezone: "Asia/Dubai",
    artwork: 1,
    category: "Gaming",
    audience: "General",
    visibility: "private",
  };
}

export function parseHashtags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\s,]+/)
        .map((tag) => tag.replace(/^#/, "").trim())
        .filter(Boolean),
    ),
  ];
}

export function validateDraft(
  form: DraftForm,
  platform: Platform,
  requireSchedule = false,
): string[] {
  const limits = draftLimits[platform];
  const errors: string[] = [];
  if (!form.title.trim()) errors.push("Add a title before saving.");
  if (form.title.length > limits.title)
    errors.push(`Title must be ${limits.title} characters or fewer for this draft.`);
  if (form.description.length > limits.description)
    errors.push(`Description must be ${limits.description} characters or fewer for this draft.`);
  if (parseHashtags(form.hashtags).length > limits.hashtags)
    errors.push(`Use at most ${limits.hashtags} hashtags for this draft.`);
  if (platform === "youtube" && form.tags.length > 500)
    errors.push("Keep YouTube tag text within 500 characters for this draft.");
  if (requireSchedule && !form.scheduledAt)
    errors.push("Choose a date and time for the demo schedule.");
  if (requireSchedule && form.accountIds.length === 0)
    errors.push("Select at least one demo account for the schedule.");
  if (form.scheduledAt && Number.isNaN(Date.parse(form.scheduledAt)))
    errors.push("Enter a valid schedule date and time.");
  return errors;
}

export function isDraftForm(value: unknown): value is DraftForm {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.hashtags === "string" &&
    typeof v.tags === "string" &&
    Array.isArray(v.accountIds) &&
    v.accountIds.every((id) => typeof id === "string") &&
    typeof v.scheduledAt === "string" &&
    typeof v.timezone === "string" &&
    (v.artwork === 1 || v.artwork === 2 || v.artwork === 3) &&
    typeof v.category === "string" &&
    typeof v.audience === "string" &&
    typeof v.visibility === "string"
  );
}

export function isDraftMap(value: unknown): DraftMap | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  return entries.every(([, draft]) => isDraftForm(draft)) ? (value as DraftMap) : null;
}
