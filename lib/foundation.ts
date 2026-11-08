import "server-only";

import { z } from "zod";

/** M1.1 supports only an honest, network-free demo foundation. */
export const foundationStatusSchema = z.object({
  product: z.literal("Up17 AutoPublisher"),
  milestone: z.literal("M1.1"),
  mode: z.literal("DEMO"),
  integrations: z.literal("NOT_CONNECTED"),
  publishing: z.literal("DISABLED"),
});

export type FoundationStatus = z.infer<typeof foundationStatusSchema>;

export function getFoundationStatus(): FoundationStatus {
  const configuredMode = process.env.UP17_APP_MODE ?? "DEMO";
  if (configuredMode !== "DEMO") {
    throw new Error("Only DEMO mode is available until integrations are approved and tested.");
  }
  return foundationStatusSchema.parse({
    product: "Up17 AutoPublisher",
    milestone: "M1.1",
    mode: "DEMO",
    integrations: "NOT_CONNECTED",
    publishing: "DISABLED",
  });
}
