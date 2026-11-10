"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  Check,
  Download,
  ExternalLink,
  Info,
  LockKeyhole,
  Monitor,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Dialog,
  Input,
  Select,
  Toggle,
  Unavailable,
} from "@/components/ui";
import { PageHeader } from "@/components/features/common";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { useTheme } from "@/components/theme/theme-provider";
import { usePreferences } from "@/features/preferences/use-preferences";
import {
  categoryLabels,
  defaultPreferences,
  notificationCategories,
  timezones,
  validateProfile,
  type WorkspacePreferences,
} from "@/features/preferences/model";
import { DEMO_DATA_KEYS, collectLocalData } from "@/lib/local-data";
import { removeBrowserValue } from "@/lib/browser-store";

function ProfileForm({
  preferences,
  onSave,
  canRename = true,
  cloud = false,
}: {
  preferences: WorkspacePreferences;
  onSave: (form: WorkspacePreferences) => Promise<boolean>;
  canRename?: boolean;
  cloud?: boolean;
}) {
  const [form, setForm] = useState(preferences);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const update = <K extends keyof WorkspacePreferences>(key: K, value: WorkspacePreferences[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice("");
  };
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const next = validateProfile(form);
        setErrors(next);
        if (next.length) {
          setNotice("");
          return;
        }
        const trimmed = {
          ...form,
          name: form.name.trim(),
          niche: form.niche.trim(),
          audience: form.audience.trim(),
        };
        setForm(trimmed);
        setSubmitting(true);
        const saved = await onSave(trimmed);
        setSubmitting(false);
        setNotice(
          saved
            ? "Workspace preferences saved."
            : cloud
              ? "Preferences were not saved. Check your connection or reload before retrying."
              : "Preferences were not saved. Browser storage is unavailable; changes are kept for this session only.",
        );
      }}
    >
      {errors.length ? (
        <div className="validation-summary" role="alert">
          <strong>Review your workspace profile</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="grid grid-2">
        <Input
          label="Workspace name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          maxLength={48}
          disabled={!canRename}
          title={
            canRename ? undefined : "Only workspace owners/admins can rename the private workspace."
          }
          hint={
            canRename ? undefined : "Only workspace owners/admins can rename the private workspace."
          }
          required
        />
        <Input
          label="Content niche"
          value={form.niche}
          onChange={(e) => update("niche", e.target.value)}
          maxLength={80}
          required
        />
        <Input
          label="Target audience"
          value={form.audience}
          onChange={(e) => update("audience", e.target.value)}
          maxLength={120}
        />
        <Select
          label="Brand voice"
          value={form.voice}
          onChange={(e) => update("voice", e.target.value)}
        >
          {["Clear & encouraging", "Direct & analytical", "Friendly & conversational"].map(
            (voice) => (
              <option key={voice}>{voice}</option>
            ),
          )}
        </Select>
        <Select
          label="Default content language"
          value={form.language}
          onChange={(e) => update("language", e.target.value)}
        >
          {["English", "Hindi", "Arabic"].map((language) => (
            <option key={language}>{language}</option>
          ))}
        </Select>
        <Select
          label="Workspace timezone"
          value={form.timezone}
          onChange={(e) => update("timezone", e.target.value)}
        >
          {timezones.map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
        </Select>
      </div>
      <p className="field-hint settings-field-note">
        These are workspace profile preferences, not AI instructions sent to a provider. The
        interface remains in English. Existing demo records keep their original timezone labels.
      </p>
      <div className="settings-save-row">
        {notice ? (
          <p className="save-notice" role="status">
            <Check size={17} />
            {notice}
          </p>
        ) : (
          <span className="muted tiny">
            {cloud
              ? "Private workspace · database-backed"
              : "Saved on this device only · no cloud sync"}
          </span>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={submitting}
          disabledReason="A workspace preferences save is in progress; wait for it to finish."
          icon={<Save size={17} />}
        >
          Save workspace
        </Button>
      </div>
    </form>
  );
}

const emptySubscribe = () => () => {};

export function SettingsPanel() {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [profileRevision, setProfileRevision] = useState(0);
  const { preferences, update, cloud, pending } = usePreferences();
  const { theme } = useTheme();
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const exportData = () => {
    try {
      const data = collectLocalData((key) => localStorage.getItem(key));
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "up17-local-demo.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Local demo export prepared. It contains no credentials or real account data.");
    } catch {
      setNotice("Export could not read browser storage. No file was downloaded.");
    }
  };
  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="A workspace that feels like yours"
        title="Settings"
        description={
          cloud
            ? "Manage your private workspace. Creator workflows remain demos until their integration gates pass."
            : "Personalize the local experience. Keep automation, privacy and unavailable services clearly separated."
        }
        actions={<Badge tone="accent">{cloud ? "Cloud preferences" : "Local preferences"}</Badge>}
      />
      <nav className="settings-jumps" aria-label="Settings sections">
        {[
          ["appearance", "Appearance"],
          ["workspace", "Workspace"],
          ["notifications", "Notifications"],
          ["automation", "Automation"],
          ["privacy", "Privacy & security"],
          ["about", "About"],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>
      {notice ? (
        <p className="save-notice" role="status">
          <Info size={17} />
          {notice}
        </p>
      ) : null}
      <div className="settings-layout">
        <div className="settings-content">
          <Card id="appearance" className="settings-section">
            <CardHeader
              title="Appearance"
              description="One token system, four distinct experiences. Your choice follows you across the app."
              action={<Badge tone="primary">Active</Badge>}
            />
            <ThemeSwitcher compact />
            <div className="appearance-summary">
              <Monitor size={18} />
              <span className="small">
                System appearance is used until you save a theme. Clay Light is the default.
              </span>
            </div>
            <Toggle
              label="Reduce motion"
              description="Minimize transitions and animated effects. Your device’s reduced-motion setting is always respected."
              checked={preferences.reduceMotion}
              disabled={pending}
              disabledReason="A workspace preferences save is in progress; wait for it to finish."
              onChange={async (value) => {
                const persisted = await update({ reduceMotion: value });
                setNotice(
                  persisted
                    ? value
                      ? "Reduced motion saved."
                      : "Device motion preference restored."
                    : cloud
                      ? "Motion preference was not saved. Check your connection or reload before retrying."
                      : "Motion preference updated for this session only; browser storage is unavailable.",
                );
              }}
            />
          </Card>
          <Card id="workspace" className="settings-section">
            <CardHeader
              title="Workspace profile"
              description="A little context for your creator workspace. Nothing here is sent to an AI service."
            />
            {hydrated ? (
              <ProfileForm
                key={profileRevision}
                preferences={preferences}
                onSave={(form) => update(form)}
                canRename={!cloud || cloud.role === "owner" || cloud.role === "admin"}
                cloud={Boolean(cloud)}
              />
            ) : (
              <p className="muted small">Loading local profile…</p>
            )}
          </Card>
          <Card id="notifications" className="settings-section">
            <CardHeader
              title="Notification preferences"
              description={
                cloud
                  ? "Choose workflow categories for your private inbox. Security notices always remain visible."
                  : "Choose which categories appear in the demo inbox. This does not subscribe you to a delivery service."
              }
              action={
                <Link href="/notifications" className="text-link small">
                  Open inbox
                </Link>
              }
            />
            {notificationCategories.map((category) => (
              <Toggle
                key={category}
                label={categoryLabels[category]}
                description={
                  cloud
                    ? "Show workflow notices in this category."
                    : "Show labelled demo notices in this category."
                }
                checked={preferences.notifications[category]}
                disabled={pending}
                disabledReason="A workspace preferences save is in progress; wait for it to finish."
                onChange={async (value) => {
                  const persisted = await update({
                    notifications: { ...preferences.notifications, [category]: value },
                  });
                  setNotice(
                    persisted
                      ? "Inbox preference saved. No delivery service was changed."
                      : cloud
                        ? "Inbox preference was not saved. Check your connection or reload before retrying."
                        : "Inbox preference updated for this session only; browser storage is unavailable.",
                  );
                }}
              />
            ))}
            <div className="settings-disabled-channel">
              <span>
                <strong>Email & push delivery</strong>
                <span className="muted small">Not configured · no provider approved</span>
              </span>
              <Badge tone="warning">Unavailable</Badge>
            </div>
          </Card>
          <Card id="automation" className="settings-section">
            <CardHeader
              title="Publishing & automation"
              description="Safety boundaries stay visible until a real backend and account authorization exist."
            />
            <div className="settings-readonly-row">
              <span>Real publishing</span>
              <Badge tone="warning">Disabled in frontend preview</Badge>
            </div>
            <div className="settings-readonly-row">
              <span>Account-specific rules</span>
              <Link href="/accounts" className="text-link small">
                Review accounts
              </Link>
            </div>
            <Unavailable
              feature="Automatic publishing"
              reason="Requires approved OAuth, durable jobs and explicit owner enablement. Local preferences never grant permission."
            />
            <Toggle
              label="Enable automatic publishing"
              description="Unavailable until the publishing phase is separately approved."
              checked={false}
              onChange={() => {}}
              disabled
            />
          </Card>
          <Card id="privacy" className="settings-section">
            <CardHeader
              title="Privacy & security"
              description={
                cloud
                  ? "Manage your session and browser-local demo data separately."
                  : "You control the demo data stored in this browser."
              }
            />
            <div className="privacy-note">
              <LockKeyhole size={21} />
              <div>
                <strong>
                  {cloud
                    ? "Private account. Separate demo data."
                    : "No credentials. No cloud data."}
                </strong>
                <p className="muted small">
                  {cloud
                    ? "Your session uses protected cookies. Workspace preferences are stored in the database; the export/reset controls below affect only known local demo keys. No social passwords or provider tokens are stored."
                    : "No authentication, social passwords, OAuth tokens or real media are stored. Only the app’s known local keys are exported or reset."}
                </p>
              </div>
            </div>
            <div className="row row-wrap">
              <Button icon={<Download size={17} />} onClick={exportData}>
                Export local demo data
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 size={17} />}
                onClick={() => setResetOpen(true)}
              >
                Reset demo content
              </Button>
            </div>
            <p className="field-hint settings-field-note">
              Reset removes local drafts, briefs, slots, pause preferences and notification reads.
              Your workspace profile and theme are kept.
            </p>
            {cloud ? (
              <>
                <Link href="/account" className="text-link">
                  Account security & session controls
                </Link>
                <Unavailable
                  feature="Cloud export and account deletion"
                  reason="The privacy workflow still requires a verified export/deletion gate. Local demo export does not export or delete cloud records."
                />
              </>
            ) : (
              <Unavailable
                feature="Cloud export, account deletion and session management"
                reason="Sign in to a configured private workspace to manage your session. Cloud export/deletion remains a separate privacy gate."
              />
            )}
          </Card>
          <Card id="about" className="settings-section">
            <CardHeader
              title="About Up17 AutoPublisher"
              description="A focused creator workflow, currently in local frontend preview."
            />
            <dl className="metadata-grid">
              <div>
                <dt>Application version</dt>
                <dd>0.1.0 · UI preview</dd>
              </div>
              <div>
                <dt>Active theme</dt>
                <dd>{theme}</dd>
              </div>
              <div>
                <dt>Connected accounts</dt>
                <dd>0 · not connected</dd>
              </div>
              <div>
                <dt>Data mode</dt>
                <dd>{cloud ? "Private account & settings · demo workflows" : "Local demo only"}</dd>
              </div>
            </dl>
            <div className="row row-wrap">
              <Link className="btn btn-secondary btn-md" href="/design-system">
                Explore design system <ExternalLink size={16} />
              </Link>
              <span className="muted tiny">Built for original creator content.</span>
            </div>
          </Card>
        </div>
        <aside className="settings-aside">
          <Card variant="inset" className="settings-boundary">
            <ShieldCheck size={28} />
            <h2>
              Local by design.
              <br />
              Honest by default.
            </h2>
            <p className="muted small">
              {cloud
                ? "Your profile and inbox preferences persist in your private workspace. Theme remains local to this browser."
                : "Theme, profile and demo edits stay in this browser. Storage denial falls back to session memory."}
            </p>
            <div className="settings-boundary-line">
              <span>Cloud sync</span>
              <Badge>{cloud ? "Settings connected" : "Not connected"}</Badge>
            </div>
            <div className="settings-boundary-line">
              <span>Real publishing</span>
              <Badge tone="warning">Disabled</Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              disabledReason="A workspace preferences save is in progress; wait for it to finish."
              onClick={async () => {
                const persisted = await update({
                  ...defaultPreferences,
                  reduceMotion: preferences.reduceMotion,
                });
                setProfileRevision((value) => value + 1);
                setNotice(
                  persisted
                    ? "Workspace profile and inbox preferences restored. Theme and demo content were kept."
                    : "Workspace defaults restored for this session only; browser storage is unavailable.",
                );
              }}
            >
              Restore workspace defaults
            </Button>
          </Card>
        </aside>
      </div>
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset local demo content?"
        description="This cannot undo browser-local edits. No server or real account is affected."
        footer={
          <>
            <Button onClick={() => setResetOpen(false)}>Keep my content</Button>
            <Button
              variant="danger"
              onClick={() => {
                DEMO_DATA_KEYS.forEach(removeBrowserValue);
                setResetOpen(false);
                setNotice("Local demo content reset. Your theme and workspace profile were kept.");
              }}
            >
              Reset demo content
            </Button>
          </>
        }
      >
        <p className="muted small">
          Saved drafts, content briefs, demo schedule slots, account pause preferences and
          notification read states will be removed from this browser.
        </p>
      </Dialog>
    </div>
  );
}
