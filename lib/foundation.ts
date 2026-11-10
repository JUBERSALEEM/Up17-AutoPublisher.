import "server-only";

import { z } from "zod";
import { assertSafeMode } from "./app-mode";

/** M1.1 safely gates creator workflows; auth/onboarding are separate real domains. */
export const foundationStatusSchema = z.object({
  product: z.literal("Up17 AutoPublisher"),
  milestone: z.literal("M1.1"),
  mode: z.literal("DEMO"),
  integrations: z.literal("NOT_CONNECTED"),
  publishing: z.literal("DISABLED"),
});

export type FoundationStatus = z.infer<typeof foundationStatusSchema>;

export function getFoundationStatus(): FoundationStatus {
  assertSafeMode();
  return foundationStatusSchema.parse({
    product: "Up17 AutoPublisher",
    milestone: "M1.1",
    mode: "DEMO",
    integrations: "NOT_CONNECTED",
    publishing: "DISABLED",
  });
}
