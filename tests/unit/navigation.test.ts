import { describe, expect, it } from "vitest";
import {
  allDestinations,
  designSystemDestination,
  destinationForPath,
  destinations,
  isRouteActive,
  mobilePrimaryHrefs,
  notificationsDestination,
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

  it("includes both shell utilities without duplicating canonical routes", () => {
    expect(allDestinations).toHaveLength(12);
    expect(new Set(allDestinations.map((item) => item.href)).size).toBe(12);
    expect(allDestinations).toContain(notificationsDestination);
    expect(allDestinations).toContain(designSystemDestination);
  });

  it("matches active routes by segment rather than sibling prefix", () => {
    expect(isRouteActive("/", "/")).toBe(true);
    expect(isRouteActive("/settings", "/")).toBe(false);
    expect(isRouteActive("/accounts", "/accounts")).toBe(true);
    expect(isRouteActive("/accounts/demo-1", "/accounts")).toBe(true);
    expect(isRouteActive("/accounts-archive", "/accounts")).toBe(false);
    expect(isRouteActive("/notifications", "/notifications")).toBe(true);
    expect(isRouteActive("/design-system", "/design-system")).toBe(true);
  });

  it("resolves nested workspace routes and defaults safely", () => {
    expect(destinationForPath("/video-studio/demo-1").label).toBe("Video Studio");
    expect(destinationForPath("/notifications").label).toBe("Notifications");
    expect(destinationForPath("/design-system").label).toBe("Design System");
    expect(destinationForPath("/unknown").label).toBe("Overview");
  });

  it("searches labels, aliases and descriptions without external data", () => {
    expect(searchDestinations("videos").map((item) => item.href)).toContain("/video-studio");
    expect(searchDestinations("publishing queue")[0].href).toBe("/queue");
    expect(searchDestinations("design system").map((item) => item.href)).toContain(
      "/design-system",
    );
    expect(searchDestinations("no-such-section")).toEqual([]);
    expect(searchDestinations("  ")).toHaveLength(12);
  });
});
