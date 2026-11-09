import { describe, expect, it } from "vitest";
import {
  destinations,
  destinationForPath,
  mobilePrimaryHrefs,
  searchDestinations,
} from "@/lib/navigation";

describe("canonical application navigation", () => {
  it("exposes exactly the ten named main destinations with unique routes", () => {
    expect(destinations.map((item) => item.label)).toEqual([
      "Overview",
      "Video Studio",
      "AI Content",
      "Smart Scheduler",
      "Publishing Queue",
      "Creator Studio",
      "Research Centre",
      "Performance Lab",
      "Accounts",
      "Settings",
    ]);
    expect(new Set(destinations.map((item) => item.href)).size).toBe(10);
    expect(
      mobilePrimaryHrefs.every((href) => destinations.some((item) => item.href === href)),
    ).toBe(true);
  });
  it("resolves nested workspace routes and defaults safely", () => {
    expect(destinationForPath("/video-studio/demo-1").label).toBe("Video Studio");
    expect(destinationForPath("/notifications").label).toBe("Notifications");
    expect(destinationForPath("/unknown").label).toBe("Overview");
  });
  it("searches labels, aliases and descriptions without external data", () => {
    expect(searchDestinations("videos").map((item) => item.href)).toContain("/video-studio");
    expect(searchDestinations("publishing queue")[0].href).toBe("/queue");
    expect(searchDestinations("no-such-section")).toEqual([]);
    expect(searchDestinations("  ")).toHaveLength(11);
  });
});
