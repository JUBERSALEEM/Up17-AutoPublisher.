"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link2Off, Plus, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { Badge, Button, Card, DemoBadge, Dialog, EmptyState } from "@/components/ui";
import { PageHeader, PlatformBadge, PlatformIcon } from "@/components/features/common";
import {
  setupStatusTone,
  statusTone,
  type DeploymentReadiness,
  type ProviderCard,
} from "@/lib/connections/readiness";
import type { ConnectionPlatform, RealConnection } from "@/lib/connections/types";

const stateTone: Record<RealConnection["state"], "success" | "warning" | "danger" | "neutral"> = {
  pending: "neutral",
  connected: "success",
  limited_permissions: "warning",
  needs_authorisation: "warning",
  error: "danger",
  disconnected: "neutral",
};

const connectionStatusLabels: Record<RealConnection["state"], string> = {
  pending: "Needs reauthorization",
  connected: "Connected",
  limited_permissions: "Limited permissions",
  needs_authorisation: "Needs reauthorization",
  error: "Error",
  disconnected: "Disconnected",
};

const providerOrigins: Record<ConnectionPlatform, string> = {
  youtube: "https://accounts.google.com",
  instagram: "https://www.instagram.com",
  tiktok: "https://www.tiktok.com",
};

export function RealAccountsBoard({
  readiness,
  cards,
  connections,
  canManage,
  notice,
}: {
  readiness: DeploymentReadiness;
  cards: ProviderCard[];
  connections: RealConnection[];
  canManage: boolean;
  notice: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [connectPlatform, setConnectPlatform] = useState<ConnectionPlatform | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<RealConnection | null>(null);
  const [message, setMessage] = useState<string | null>(notice);
  const connected = connections.filter(
    (connection) => connection.state === "connected" || connection.state === "limited_permissions",
  ).length;
  const firstReadyPlatform = cards.find((card) => card.canStart)?.platform ?? null;
  const selectedCard = connectPlatform
    ? (cards.find((card) => card.platform === connectPlatform) ?? null)
    : null;

  const act = (connection: RealConnection, action: "refresh" | "health" | "disconnect") => {
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/connections/${connection.id}/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const body = (await response.json()) as {
          ok?: boolean;
          error?: string;
          message?: string;
          remoteRevoked?: boolean;
          code?: string | null;
        };
        if (!response.ok || !body.ok) {
          setMessage(body.error ?? "Connection action failed.");
          return;
        }
        if (action === "disconnect") {
          setDisconnectTarget(null);
          setMessage(
            body.remoteRevoked
              ? "Disconnected. Provider authorization was revoked and local credentials were deleted."
              : `Disconnected. Local credentials were deleted. Remote revocation was not confirmed${body.code ? ` (${body.code})` : ""}; remove the app in the provider's settings if needed.`,
          );
        } else {
          setMessage(body.message ?? "Connection health checked.");
        }
        router.refresh();
      } catch {
        setMessage("Connection service is temporarily unavailable.");
      }
    });
  };

  const startOAuth = (platform: ConnectionPlatform) => {
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/connections/start", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ platform }),
        });
        const body = (await response.json()) as {
          ok?: boolean;
          authorizationUrl?: string;
          error?: string;
        };
        if (!response.ok || !body.ok || !body.authorizationUrl) {
          setMessage(body.error ?? "Official OAuth is not configured on this deployment.");
          return;
        }
        const target = new URL(body.authorizationUrl);
        const bridge = readiness.bridgeOrigin;
        const isBridge =
          Boolean(bridge) &&
          target.origin === bridge &&
          target.pathname === "/functions/v1/up17-oauth-callback" &&
          target.searchParams.get("mode") === "authorize";
        let providerOrigin = target.origin;
        if (isBridge) {
          const inner = target.searchParams.get("authorize");
          if (!inner) throw new Error("Unexpected authorization handoff.");
          providerOrigin = new URL(inner).origin;
        }
        if (providerOrigin !== providerOrigins[platform])
          throw new Error("Unexpected provider origin.");
        window.location.assign(target.toString());
      } catch {
        setMessage("Could not start official OAuth.");
      }
    });
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Official provider authorization"
        title="Accounts"
        description="Keep permissions, publishing readiness and account settings separate. No real identity is connected until official OAuth completes; real connection controls are below."
        actions={
          <>
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              disabled={!canManage || !firstReadyPlatform || pending}
              title={
                firstReadyPlatform
                  ? "Connect an account"
                  : "Complete the deployment and owner setup checklist first"
              }
              onClick={() => {
                if (firstReadyPlatform) setConnectPlatform(firstReadyPlatform);
              }}
            >
              Connect an account
            </Button>
            <Badge tone={connected ? "success" : "neutral"}>{connected} connected</Badge>
          </>
        }
      />

      {readiness.demoMode ? (
        <Card variant="inset" className="demo-mode-card" data-testid="demo-mode">
          <div className="spread">
            <div>
              <h2>Demo mode is active</h2>
              <p className="muted small">
                <code>UP17_APP_MODE=DEMO</code> means other product screens may show labelled sample
                data. The three cards below are live deployment controls, not demo identities. No
                account is connected and no authorization is simulated here.
              </p>
            </div>
            <DemoBadge label="Demo mode" />
          </div>
        </Card>
      ) : null}

      <div className="account-security-note">
        <ShieldCheck size={22} aria-hidden="true" />
        <div>
          <strong>Official OAuth only. Your credentials stay yours.</strong>
          <p>
            Up17 never asks for a social password. Tokens are encrypted server-side, never sent to
            the browser, and connecting an account never approves publishing.
          </p>
        </div>
        <Badge tone="accent">Publishing disabled</Badge>
      </div>

      {message ? (
        <p className="save-notice" role="status">
          {message}
        </p>
      ) : null}
      {!readiness.authenticated ? (
        <p className="unavailable-note">
          <strong>Authentication required.</strong> Sign in with a confirmed email before a real
          connection can start. Email confirmation needs custom SMTP configured in Supabase.
        </p>
      ) : !canManage ? (
        <p className="unavailable-note">
          <strong>Read-only access.</strong> Only workspace owners/admins can connect, refresh or
          disconnect accounts.
        </p>
      ) : null}
      {readiness.connectionReadError ? (
        <p className="unavailable-note">
          <strong>Connection records could not be read.</strong> Check the server-only broker
          configuration and workspace permissions; no connection status is invented.
        </p>
      ) : null}

      <section aria-labelledby="real-connection-heading" className="accounts-section">
        <div className="section-heading">
          <div>
            <h2 id="real-connection-heading">Real connection controls</h2>
            <p className="muted small">
              Each card reports its actual deployment status. No simulated authorization; disabled
              buttons are honest setup blockers.
            </p>
          </div>
          <Badge tone="neutral">3 providers</Badge>
        </div>
        <div className="accounts-grid grid grid-3">
          {cards.map((card) => (
            <Card
              key={card.platform}
              className="account-card real-account-card"
              data-platform={card.platform}
              data-status={card.status}
            >
              <div className="spread">
                <span className={`platform-icon platform-large platform-${card.platform}`}>
                  <PlatformIcon platform={card.platform} size={25} />
                </span>
                <Badge tone={statusTone[card.status]}>{card.status}</Badge>
              </div>
              <h2>{card.label}</h2>
              <p className="muted small">{card.loginPath}</p>
              {card.blocker && card.blocker !== card.status ? (
                <Badge tone="warning">Setup blocker: {card.blocker}</Badge>
              ) : null}
              <p id={`${card.platform}-status`} className="account-note muted small">
                {card.description}
              </p>
              <dl className="account-meta">
                <div>
                  <dt>Requested scopes</dt>
                  <dd className="wrap-anywhere">{card.scopes.join(", ")}</dd>
                </div>
                <div>
                  <dt>Exact provider redirect URI</dt>
                  <dd className="wrap-anywhere">{card.externalCallbackUrl ?? card.callbackPath}</dd>
                </div>
                <div>
                  <dt>Provider console</dt>
                  <dd className="wrap-anywhere">{card.providerDashboard}</dd>
                </div>
                <div>
                  <dt>Publishing</dt>
                  <dd>
                    <Badge tone="warning">Disabled</Badge>
                  </dd>
                </div>
              </dl>
              {card.missing.length ? (
                <div className="setup-missing">
                  <strong>Still needed for this provider</strong>
                  <ul>
                    {card.missing.map((check) => (
                      <li key={check.id}>
                        <span>{check.names.join(", ")}</span>
                        <span className="muted small"> · {check.location}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="account-card-actions">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!card.canStart || pending}
                  aria-describedby={`${card.platform}-status`}
                  title={card.canStart ? card.connectLabel : "Complete the setup checklist first"}
                  onClick={() => setConnectPlatform(card.platform)}
                >
                  {card.connectLabel}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="setup-heading" className="accounts-section">
        <div className="section-heading">
          <div>
            <h2 id="setup-heading">Deployment and owner setup checklist</h2>
            <p className="muted small">
              Only names, evidence-backed states, dashboard locations and non-secret evidence are
              shown. Values stay in the deployment secret manager; none are copied into Git, chat,
              URLs or logs.
            </p>
          </div>
        </div>
        <ul className="setup-checklist">
          {readiness.checks.map((check) => (
            <li key={check.id} className="setup-check-item">
              <Badge tone={setupStatusTone[check.status]}>{check.status}</Badge>
              <div className="setup-check-copy">
                <strong className="wrap-anywhere">{check.names.join(", ")}</strong>
                <p className="muted small wrap-anywhere">{check.location}</p>
                <p className="muted small wrap-anywhere">Evidence: {check.evidence}</p>
                <p className="small">{check.ownerAction}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="journey-heading" className="accounts-section">
        <div className="section-heading">
          <div>
            <h2 id="journey-heading">How to reach real connections</h2>
            <p className="muted small">
              Demo mode does not replace this journey. Build and unit-test results are not live
              OAuth acceptance.
            </p>
          </div>
        </div>
        <ol className="accounts-journey">
          <li>
            <strong>Sign in.</strong> <Link href="/sign-up">Create account</Link> or{" "}
            <Link href="/sign-in">Sign in</Link>, then confirm the email. Custom SMTP and the exact
            Supabase Site URL / Redirect URLs are owner dashboard steps.
          </li>
          <li>
            <strong>Get an owner/admin workspace.</strong> Confirmed signup creates the workspace,
            member and preferences from the reviewed trigger. Viewer/editor roles cannot manage
            connections.
          </li>
          <li>
            <strong>Complete the checklist.</strong> Add the public Supabase URL/key, exact{" "}
            <code>UP17_SITE_URL</code>, server-only service/secret key, token keyring and the
            credentials for each provider in Vercel, then redeploy.
          </li>
          <li>
            <strong>Register exact provider callbacks.</strong> Use the three public bridge redirect
            URIs above in Google Cloud, Meta for Developers and TikTok Developer Portal. The main
            app stays protected; the bridge exchanges a one-time receipt before returning to the
            protected callback. Complete consent-screen, professional-account, Advanced Access and
            Direct Post audit gates where applicable.
          </li>
          <li>
            <strong>Connect.</strong> Return here, press the enabled provider button, verify the
            official provider origin in the address bar, consent, and come back through the real
            callback. Publishing stays disabled and paused.
          </li>
        </ol>
      </section>

      <section aria-labelledby="connections-heading" className="accounts-section">
        <div className="section-heading">
          <div>
            <h2 id="connections-heading">Connected real accounts</h2>
            <p className="muted small">
              Only accounts created by a successful official OAuth callback appear here. Refresh,
              health and disconnect act on those stored records.
            </p>
          </div>
        </div>
        {!connections.length ? (
          <EmptyState
            title="No real accounts connected"
            description="A real identity appears here only after provider consent and a valid callback. No demo identity is presented as a connection."
            icon={<Link2Off size={26} />}
          />
        ) : (
          <div className="accounts-grid grid grid-3">
            {connections.map((connection) => (
              <Card key={connection.id} className="account-card real-connection-card">
                <div className="spread">
                  <PlatformBadge platform={connection.platform} />
                  <Badge tone={stateTone[connection.state]}>
                    {connectionStatusLabels[connection.state]}
                  </Badge>
                </div>
                <h2>{connection.displayName}</h2>
                <p className="muted small">
                  {connection.handle ?? connection.providerAccountId ?? "Identity unavailable"}
                </p>
                <dl className="account-meta">
                  <div>
                    <dt>Granted scopes</dt>
                    <dd className="wrap-anywhere">
                      {connection.grantedScopes.length
                        ? connection.grantedScopes.join(", ")
                        : "None recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt>Last verified</dt>
                    <dd>
                      {connection.lastVerifiedAt
                        ? new Date(connection.lastVerifiedAt).toLocaleString()
                        : "Never"}
                    </dd>
                  </div>
                  <div>
                    <dt>Publishing</dt>
                    <dd>
                      <Badge tone="warning">
                        {connection.publishingEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </dd>
                  </div>
                  {connection.lastErrorCode ? (
                    <div>
                      <dt>Last error</dt>
                      <dd className="wrap-anywhere">{connection.lastErrorCode}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="account-card-actions">
                  <Button
                    size="sm"
                    disabled={!canManage || pending}
                    icon={<RefreshCw size={15} />}
                    onClick={() => act(connection, "refresh")}
                  >
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!canManage || pending}
                    onClick={() => act(connection, "health")}
                  >
                    Check health
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!canManage || pending}
                    icon={<Unplug size={15} />}
                    onClick={() => setDisconnectTarget(connection)}
                  >
                    Disconnect
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(connectPlatform)}
        onClose={() => setConnectPlatform(null)}
        title={connectPlatform ? `Connect ${connectPlatform}` : "Connect an account"}
        description="You will be redirected to the official provider authorization page."
        footer={
          <>
            <Button onClick={() => setConnectPlatform(null)}>Close</Button>
            <Button
              variant="primary"
              disabled={!selectedCard?.canStart || pending}
              onClick={() => {
                if (connectPlatform && selectedCard?.canStart) {
                  setConnectPlatform(null);
                  startOAuth(connectPlatform);
                }
              }}
            >
              Continue to provider
            </Button>
          </>
        }
      >
        <div className="stack">
          <p className="muted small">
            Only connect accounts you own or administer. Authorization does not enable publishing.
            You can disconnect and delete local credentials at any time.
          </p>
          {selectedCard ? (
            <p className="unavailable-note">
              <strong>{selectedCard.label}:</strong> {selectedCard.description}
            </p>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={Boolean(disconnectTarget)}
        onClose={() => setDisconnectTarget(null)}
        title="Disconnect account"
        description={
          disconnectTarget
            ? `${disconnectTarget.displayName} will lose access to this workspace.`
            : undefined
        }
        footer={
          <>
            <Button onClick={() => setDisconnectTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => {
                if (disconnectTarget) act(disconnectTarget, "disconnect");
              }}
            >
              Disconnect and delete credentials
            </Button>
          </>
        }
      >
        <p className="muted small">
          Up17 will attempt provider revocation where supported, then delete local encrypted
          credentials. If remote revocation is unsupported or fails, the UI will say so and provide
          a manual remedy.
        </p>
      </Dialog>
    </div>
  );
}
