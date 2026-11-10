"use client";

import { useState } from "react";
import { Check, ChevronRight, Link2Off, Plus, Search, Settings2, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  DemoBadge,
  Dialog,
  EmptyState,
  Input,
  SegmentedControl,
  Toggle,
} from "@/components/ui";
import { DemoNotice, PageHeader, PlatformBadge, PlatformIcon } from "@/components/features/common";
import { demoAccounts } from "@/features/demo/fixtures";
import { platformLabels, type DemoAccount, type Platform } from "@/features/demo/contracts";
import { readBrowserValue, useBrowserValue, writeBrowserValue } from "@/lib/browser-store";

const requirements: Record<Platform, string[]> = {
  youtube: [
    "A verified Google/YouTube channel and an approved OAuth application",
    "Explicit upload and analytics scopes, granted by the account owner",
    "Server-side token handling, quota checks and private test publishing before automation",
  ],
  instagram: [
    "An eligible professional account and approved Meta application",
    "Official login and content-publishing permissions for that identity",
    "Container processing, publishing-limit checks and supported media delivery",
  ],
  tiktok: [
    "An approved TikTok application and eligible creator account",
    "Official authorization and the required Direct Post audit/consent flow",
    "Creator-info checks, privacy/interaction settings and explicit user consent",
  ],
};
function isPausedMap(value: unknown): Record<string, boolean> | null {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === "boolean")
    ? (value as Record<string, boolean>)
    : null;
}

export function AccountsBoard() {
  const [platform, setPlatform] = useState("all");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<DemoAccount | null>(null);
  const [connect, setConnect] = useState<Platform | null>(null);
  const paused = useBrowserValue<Record<string, boolean>>(
    "up17.demo.account-pauses.v1",
    {},
    isPausedMap,
  );
  const accounts = demoAccounts.filter(
    (account) =>
      (platform === "all" || account.platform === platform) &&
      `${account.displayName} ${account.handle}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const togglePause = (id: string) => {
    const current = readBrowserValue("up17.demo.account-pauses.v1", {}, isPausedMap);
    const next = { ...current, [id]: !(current[id] ?? true) };
    writeBrowserValue("up17.demo.account-pauses.v1", next);
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow="Your creator identities"
        title="Accounts"
        description="Keep permissions, publishing readiness and account settings separate. No real identity is connected in this preview."
        actions={
          <>
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              onClick={() => setConnect("youtube")}
            >
              Connect an account
            </Button>
            <DemoBadge label="0 connected" />
          </>
        }
      />
      <div className="account-security-note">
        <ShieldCheck size={22} aria-hidden="true" />
        <div>
          <strong>Your credentials stay yours.</strong>
          <p>
            Connections will use official OAuth only when separately authorized. Up17 never asks for
            your social password.
          </p>
        </div>
        <Badge tone="accent">Frontend only</Badge>
      </div>
      <DemoNotice>
        The identities below are demo examples for a multi-account workflow. Their scopes, pause
        preferences and sync states do not represent real authorization.
      </DemoNotice>
      <div className="accounts-toolbar">
        <SegmentedControl
          label="Account platform"
          value={platform}
          onChange={setPlatform}
          items={[
            { id: "all", label: "All platforms" },
            ...Object.entries(platformLabels).map(([id, label]) => ({ id, label })),
          ]}
        />
        <div className="search-field">
          <Search size={18} aria-hidden="true" />
          <Input
            label="Search accounts"
            type="search"
            placeholder="Search demo identities…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      {!accounts.length ? (
        <EmptyState
          title="No matching demo identities"
          description="Try a different name or platform."
          action={
            <Button
              onClick={() => {
                setQuery("");
                setPlatform("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="accounts-grid grid grid-3">
          {accounts.map((account) => (
            <Card key={account.id} className="account-card">
              <div className="spread">
                <span className={`platform-icon platform-large platform-${account.platform}`}>
                  <PlatformIcon platform={account.platform} size={25} />
                </span>
                <Badge tone="neutral" icon={<Link2Off size={13} />}>
                  Demo identity
                </Badge>
              </div>
              <h2>{account.displayName}</h2>
              <p className="muted small">{account.handle}</p>
              <p className="account-note muted small">{account.note}</p>
              <dl className="account-meta">
                <div>
                  <dt>Real connection</dt>
                  <dd>Not connected</dd>
                </div>
                <div>
                  <dt>Publishing</dt>
                  <dd>
                    <Badge tone="warning">Disabled</Badge>
                  </dd>
                </div>
                <div>
                  <dt>Last real sync</dt>
                  <dd>Never · unavailable</dd>
                </div>
                <div>
                  <dt>Timezone</dt>
                  <dd>{account.timezone}</dd>
                </div>
              </dl>
              <div className="account-card-actions">
                <Button
                  size="sm"
                  onClick={() => {
                    setDetail(account);
                  }}
                  icon={<Settings2 size={16} />}
                >
                  Settings
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConnect(account.platform)}>
                  Requirements <ChevronRight size={15} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card variant="inset" className="account-empty-real">
        <Link2Off size={25} aria-hidden="true" />
        <div>
          <h2 className="card-title">No real accounts connected</h2>
          <p className="muted small">
            OAuth, token refresh, revocation and live capability checks are intentionally
            unavailable. Demo identities cannot publish or expose real analytics.
          </p>
        </div>
      </Card>
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.displayName ?? "Account settings"}
        description="Demo identity settings · no real account is affected"
        footer={
          <Button variant="primary" onClick={() => setDetail(null)}>
            Done
          </Button>
        }
      >
        {detail ? (
          <div className="stack">
            <div className="row row-wrap">
              <PlatformBadge platform={detail.platform} />
              <DemoBadge />
            </div>
            <Toggle
              label="Demo pause preference"
              description="Saved in this browser only. Real publishing remains disabled regardless of this setting."
              checked={paused[detail.id] ?? true}
              onChange={() => togglePause(detail.id)}
            />
            <h3>Illustrative permissions</h3>
            <ul className="notes-list">
              {detail.scopes.map((scope) => (
                <li key={scope}>{scope}</li>
              ))}
            </ul>
            <p className="unavailable-note">
              <strong>Authorization unavailable.</strong> No token, expiry, refresh or real scope
              data exists for this identity.
            </p>
            <div className="row row-wrap">
              <Button
                disabled
                disabledReason="No official OAuth connection exists for this labelled demo account."
                title="No OAuth connection exists"
              >
                Refresh unavailable
              </Button>
              <Button
                disabled
                disabledReason="No real account is connected, so there is nothing to disconnect."
                variant="danger"
                title="No real account is connected"
              >
                Disconnect unavailable
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(connect)}
        onClose={() => setConnect(null)}
        title={connect ? `Connect ${platformLabels[connect]}` : "Connect an account"}
        description="Requirements are visible; the connection itself is not enabled."
        footer={
          <>
            <Button onClick={() => setConnect(null)}>Close</Button>
            <Button
              disabled
              disabledReason="Official OAuth requires owner provider credentials, exact redirect registration, review and real consent."
              title="OAuth and provider setup require separate authorization"
            >
              OAuth unavailable
            </Button>
          </>
        }
      >
        {connect ? (
          <div className="stack">
            <PlatformBadge platform={connect} />
            <ol className="requirements-list">
              {requirements[connect].map((requirement) => (
                <li key={requirement}>
                  <Check size={17} aria-hidden="true" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ol>
            <p className="unavailable-note">
              <strong>Not available in this frontend phase.</strong> No developer app, redirect URI,
              credential or account authorization has been created. No password is requested.
            </p>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
