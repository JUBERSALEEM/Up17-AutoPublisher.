import type { Platform } from "@/features/demo/contracts";
export const BRIEFS_KEY = "up17.demo.briefs.v1";
export interface ContentBrief {
  id: string;
  source: "demo";
  title: string;
  notes: string;
  platform: Platform | "any";
  updatedAt: string;
}
export interface EditorialPrompt {
  id: string;
  title: string;
  game: "BGMI" | "PUBG" | "Both";
  topic: "Skills" | "Comparisons" | "Explainers";
  rationale: string;
  keywords: string[];
}
/** Evergreen editorial questions, not trends, search-volume claims or verified game news. */
export const editorialPrompts: readonly EditorialPrompt[] = [
  {
    id: "prompt-1",
    title: "What makes a controlled long-range spray repeatable?",
    game: "Both",
    topic: "Skills",
    rationale: "Turn your own recorded practice into a clear, evidence-led explanation.",
    keywords: ["recoil control", "long-range spray", "practice routine"],
  },
  {
    id: "prompt-2",
    title: "AKM or M762: explain the trade-off without inventing stats",
    game: "Both",
    topic: "Comparisons",
    rationale: "Compare only what your footage and an authorized, current source can support.",
    keywords: ["AKM", "M762", "weapon comparison"],
  },
  {
    id: "prompt-3",
    title: "Build a short M416 scope-change explainer",
    game: "BGMI",
    topic: "Explainers",
    rationale: "Use a visible scope change in your own clip; do not infer an unsupported distance.",
    keywords: ["M416", "scope change", "BGMI tips"],
  },
  {
    id: "prompt-4",
    title: "Where does squad positioning break down?",
    game: "PUBG",
    topic: "Skills",
    rationale: "Review your own rotation and communicate what is visible, not an invented outcome.",
    keywords: ["squad positioning", "rotation", "PUBG Mobile"],
  },
  {
    id: "prompt-5",
    title: "Compare two opening hooks from your own footage",
    game: "Both",
    topic: "Comparisons",
    rationale: "A future experiment question. No audience result or winning hook is available yet.",
    keywords: ["opening hook", "short-form pacing", "content experiment"],
  },
  {
    id: "prompt-6",
    title: "Explain one verified fight, frame by frame",
    game: "BGMI",
    topic: "Explainers",
    rationale: "Keep knocks, eliminations and distances unknown until the footage verifies them.",
    keywords: ["fight breakdown", "gameplay review", "BGMI"],
  },
];
export function filterPrompts(query: string, game: string, topic: string) {
  const q = query.trim().toLowerCase();
  return editorialPrompts.filter(
    (p) =>
      (game === "all" || p.game === game || p.game === "Both") &&
      (topic === "all" || p.topic === topic) &&
      (!q || [p.title, p.rationale, ...p.keywords].join(" ").toLowerCase().includes(q)),
  );
}
export function validateBrief(title: string, notes: string): string[] {
  const errors: string[] = [];
  if (title.trim().length < 3 || title.trim().length > 120)
    errors.push("Brief title must contain 3–120 characters.");
  if (notes.length > 2000) errors.push("Keep brief notes within 2,000 characters.");
  return errors;
}
export function parseBriefs(value: unknown): ContentBrief[] | null {
  return Array.isArray(value) &&
    value.length <= 200 &&
    value.every(
      (b) =>
        b &&
        typeof b.id === "string" &&
        b.id.length > 0 &&
        b.source === "demo" &&
        typeof b.title === "string" &&
        typeof b.notes === "string" &&
        ["any", "youtube", "instagram", "tiktok"].includes(b.platform) &&
        typeof b.updatedAt === "string" &&
        !Number.isNaN(Date.parse(b.updatedAt)) &&
        !validateBrief(b.title, b.notes).length,
    )
    ? value
    : null;
}
