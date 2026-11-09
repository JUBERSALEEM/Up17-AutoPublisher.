/** Local UI preferences only. These values never authorize automation or contact a provider. */
export const PREFERENCES_KEY = "up17.preferences.v1";
export const notificationCategories = [
  "processing",
  "publishing",
  "accounts",
  "analytics",
] as const;
export type NotificationCategory = (typeof notificationCategories)[number];
export const categoryLabels: Record<NotificationCategory, string> = {
  processing: "Processing & content",
  publishing: "Publishing updates",
  accounts: "Account attention",
  analytics: "Analytics & insights",
};
export interface WorkspacePreferences {
  name: string;
  niche: string;
  audience: string;
  voice: string;
  language: string;
  timezone: string;
  reduceMotion: boolean;
  notifications: Record<NotificationCategory, boolean>;
}
export const defaultPreferences: WorkspacePreferences = {
  name: "Up17 Gaming",
  niche: "BGMI / PUBG Mobile",
  audience: "Mobile gameplay learners",
  voice: "Clear & encouraging",
  language: "English",
  timezone: "Asia/Dubai",
  reduceMotion: false,
  notifications: { processing: true, publishing: true, accounts: true, analytics: true },
};
export const timezones = [
  "Asia/Dubai",
  "Asia/Kolkata",
  "UTC",
  "Europe/London",
  "America/New_York",
] as const;
export function validateProfile(
  form: Pick<WorkspacePreferences, "name" | "niche" | "audience">,
): string[] {
  const errors: string[] = [];
  if (form.name.trim().length < 2 || form.name.trim().length > 48)
    errors.push("Workspace name must contain 2–48 characters.");
  if (form.niche.trim().length < 2 || form.niche.trim().length > 80)
    errors.push("Content niche must contain 2–80 characters.");
  if (form.audience.trim().length > 120)
    errors.push("Audience description must be 120 characters or fewer.");
  return errors;
}
export function parsePreferences(value: unknown): WorkspacePreferences | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const strings = ["name", "niche", "audience", "voice", "language", "timezone"] as const;
  if (strings.some((key) => typeof v[key] !== "string" || (v[key] as string).length > 200))
    return null;
  if (
    validateProfile({
      name: v.name as string,
      niche: v.niche as string,
      audience: v.audience as string,
    }).length
  )
    return null;
  if (
    typeof v.reduceMotion !== "boolean" ||
    !v.notifications ||
    typeof v.notifications !== "object"
  )
    return null;
  const notifications = v.notifications as Record<string, unknown>;
  if (notificationCategories.some((key) => typeof notifications[key] !== "boolean")) return null;
  return {
    name: v.name as string,
    niche: v.niche as string,
    audience: v.audience as string,
    voice: v.voice as string,
    language: v.language as string,
    timezone: timezones.includes(v.timezone as (typeof timezones)[number])
      ? (v.timezone as string)
      : "Asia/Dubai",
    reduceMotion: v.reduceMotion,
    notifications: Object.fromEntries(
      notificationCategories.map((key) => [key, notifications[key]]),
    ) as Record<NotificationCategory, boolean>,
  };
}
