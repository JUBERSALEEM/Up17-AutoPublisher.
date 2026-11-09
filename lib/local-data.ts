import { DRAFTS_KEY } from "@/features/creator-studio/draft";
import { BRIEFS_KEY } from "@/features/research/model";
import { READ_KEY } from "@/features/notifications/model";
import { PREFERENCES_KEY } from "@/features/preferences/model";
import { THEME_STORAGE_KEY } from "@/lib/themes";
export const DEMO_DATA_KEYS = [
  DRAFTS_KEY,
  BRIEFS_KEY,
  READ_KEY,
  "up17.demo.schedule.v1",
  "up17.demo.account-pauses.v1",
] as const;
export const LOCAL_DATA_KEYS = [...DEMO_DATA_KEYS, PREFERENCES_KEY, THEME_STORAGE_KEY] as const;
/** Export only known application keys; never enumerate unrelated browser storage or credentials. */
export function collectLocalData(read: (key: string) => string | null) {
  return {
    format: "up17-local-demo",
    version: 1,
    exportedAt: new Date().toISOString(),
    notice: "Browser-local demo preferences and drafts only. No credentials or real account data.",
    data: Object.fromEntries(
      LOCAL_DATA_KEYS.map((key) => {
        const raw = read(key);
        try {
          return [key, raw === null ? null : JSON.parse(raw)];
        } catch {
          return [key, null];
        }
      }),
    ),
  };
}
