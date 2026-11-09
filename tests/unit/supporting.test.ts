import { describe, expect, it } from "vitest";
import {
  defaultPreferences,
  parsePreferences,
  validateProfile,
} from "@/features/preferences/model";
import {
  editorialPrompts,
  filterPrompts,
  parseBriefs,
  validateBrief,
} from "@/features/research/model";
import {
  demoNotifications,
  filterNotifications,
  parseReadIds,
} from "@/features/notifications/model";
import { collectLocalData, LOCAL_DATA_KEYS } from "@/lib/local-data";

describe("supporting screen local contracts", () => {
  it("validates preferences and rejects malformed storage", () => {
    expect(parsePreferences(defaultPreferences)).toEqual(defaultPreferences);
    expect(parsePreferences({ ...defaultPreferences, name: " " })).toBeNull();
    expect(
      parsePreferences({ ...defaultPreferences, notifications: { processing: "yes" } }),
    ).toBeNull();
    expect(validateProfile({ ...defaultPreferences, name: "x" })).toHaveLength(1);
  });
  it("filters editorial prompts without representing them as trends", () => {
    expect(editorialPrompts.length).toBeGreaterThan(0);
    expect(filterPrompts("M416", "BGMI", "all").every((p) => p.game !== "PUBG")).toBe(true);
    expect(filterPrompts("nothing-matches", "all", "all")).toEqual([]);
    expect(validateBrief("x", "")).toHaveLength(1);
    expect(
      parseBriefs([
        {
          id: "b",
          source: "demo",
          title: "A useful question",
          notes: "",
          platform: "any",
          updatedAt: "2026-11-08T00:00:00Z",
        },
      ]),
    ).toHaveLength(1);
    expect(parseBriefs([{ title: 2 }])).toBeNull();
  });
  it("filters demo notices by category, read state and local preferences", () => {
    expect(demoNotifications.every((n) => n.source === "demo")).toBe(true);
    expect(
      filterNotifications(
        demoNotifications,
        "",
        "all",
        true,
        ["notice-1"],
        defaultPreferences.notifications,
      ).some((n) => n.id === "notice-1"),
    ).toBe(false);
    expect(
      filterNotifications(demoNotifications, "", "all", false, [], {
        ...defaultPreferences.notifications,
        publishing: false,
      }).some((n) => n.category === "publishing"),
    ).toBe(false);
    expect(parseReadIds(["notice-1", "notice-1", "unknown"])).toEqual(["notice-1"]);
  });
  it("exports only known local keys and never credentials", () => {
    const data = collectLocalData((key) =>
      key === LOCAL_DATA_KEYS[0] ? '{"title":"local"}' : null,
    );
    expect(Object.keys(data.data)).toEqual([...LOCAL_DATA_KEYS]);
    expect(data.notice).toContain("No credentials");
    expect(JSON.stringify(data)).not.toContain("password");
  });
});
