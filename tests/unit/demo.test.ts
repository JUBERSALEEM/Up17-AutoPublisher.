import { describe, expect, it } from "vitest";
import { demoAccounts, demoJobs, demoVideos } from "@/features/demo/fixtures";
import { filterJobs, filterVideos, formatBytes, formatDuration } from "@/features/demo/selectors";
import {
  emptyDraft,
  isDraftMap,
  parseHashtags,
  validateDraft,
} from "@/features/creator-studio/draft";

describe("truthful demo presentation contracts", () => {
  it("never represents a real connection or enabled publishing", () => {
    expect(
      demoAccounts.every(
        (a) => a.source === "demo" && a.connection === "demo_mode" && !a.publishingEnabled,
      ),
    ).toBe(true);
    expect(demoVideos.every((v) => v.source === "demo")).toBe(true);
    expect(
      demoJobs.every(
        (j) => j.source === "demo" && j.status !== "published" && j.status !== "publishing",
      ),
    ).toBe(true);
  });
  it("searches, filters and sorts the library deterministically", () => {
    expect(filterVideos(demoVideos, "M416", "all", "title").map((v) => v.id)).toEqual([
      "demo-video-5",
      "demo-video-1",
      "demo-video-6",
    ]);
    expect(filterVideos(demoVideos, "", "failed", "newest").map((v) => v.id)).toEqual([
      "demo-video-6",
    ]);
    expect(filterVideos(demoVideos, "nothing-matches", "all", "newest")).toEqual([]);
    expect(filterVideos(demoVideos, "", "all", "duration")[0].id).toBe("demo-video-5");
  });
  it("isolates queue filters by platform and account", () => {
    expect(
      filterJobs(demoJobs, "", "all", "instagram", "all").every(
        (j) => j.accountId === "demo-ig-clips",
      ),
    ).toBe(true);
    expect(filterJobs(demoJobs, "", "failed", "all", "all").map((j) => j.id)).toEqual([
      "demo-job-4",
    ]);
    expect(formatDuration(75)).toBe("1:15");
    expect(formatBytes(84_300_000)).toBe("84.3 MB");
  });
  it("validates local drafts without claiming live platform validation", () => {
    expect(validateDraft(emptyDraft(), "youtube")).toContain("Add a title before saving.");
    expect(
      validateDraft({ ...emptyDraft("A".repeat(101)), hashtags: "#one #one #two" }, "youtube").some(
        (e) => e.includes("100"),
      ),
    ).toBe(true);
    expect(parseHashtags("#one #one,two")).toEqual(["one", "two"]);
    expect(
      validateDraft(
        { ...emptyDraft("Verified title"), description: "A factual draft." },
        "youtube",
      ),
    ).toEqual([]);
    expect(isDraftMap({ bad: { title: 2 } })).toBeNull();
    expect(isDraftMap({ "demo-video-1:youtube": emptyDraft("Saved") })).not.toBeNull();
  });
});
