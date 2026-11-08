import { afterEach, describe, expect, it, vi } from "vitest";
import { getFoundationStatus } from "@/lib/foundation";

afterEach(() => vi.unstubAllEnvs());

describe("honest foundation mode", () => {
  it("defaults to demo with no connected integrations or publishing", () => {
    vi.stubEnv("UP17_APP_MODE", undefined);
    expect(getFoundationStatus()).toEqual({
      product: "Up17 AutoPublisher",
      milestone: "M1.1",
      mode: "DEMO",
      integrations: "NOT_CONNECTED",
      publishing: "DISABLED",
    });
  });
  it("rejects an unsupported live mode instead of simulating a connection", () => {
    vi.stubEnv("UP17_APP_MODE", "LIVE");
    expect(() => getFoundationStatus()).toThrow("Only DEMO mode");
  });
});
