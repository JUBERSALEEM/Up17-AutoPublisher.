"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link2Off, Plus, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { Badge, Button, Card, Dialog, EmptyState } from "@/components/ui";
import { PageHeader, PlatformBadge, PlatformIcon } from "@/components/features/common";
import {
  setupStatusTone,
  statusTone,
  type DeploymentReadiness,
  type ProviderCard,
} from "@/lib/connections/readiness";
import {
  connectionStateLabels,
  isConnectionPlatform,
  type ConnectionPlatform,
  type RealConnection,
} from "@/lib/connections/types";

const stateTone: Record<RealConnection["state"], "success" | "warning" | "danger" | "neutral"> = {
  pending: "neutral",
  connected: "success",
  limited_permissions: "warning",
  needs_authorisation: "warning",
  error: "danger",
  disconnected: "neutral",
};

const providerOrigins: Record<ConnectionPlatform, string> = {
  youtube: "https://accounts.google.com",
  instagram: "https://www.instagram.com",
  tiktok: "https://www.tiktok.com",
};

const PENDING_KEY = "up17:connection:pending";
const PENDING_EVENT = "up17:connection:pending-change";

function pendingSnapshot(): string {
  const marker = window.sessionStorage.getItem(PENDING_KEY);
  return marker && isConnectionPlatform(marker) ? marker : "";
}
function pendingServerSnapshot(): string {
  return "";
}
function subscribePending(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(PENDING_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PENDING_EVENT, callback);
  };
}
function setPending(platform: ConnectionPlatform | null): void {
  if (platform) window.sessionStorage.setItem(PENDING_KEY, platform);
  else window.sessionStorage.removeItem(PENDING_KEY);
  window.dispatchEvent(new Event(PENDING_EVENT));
}

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
  const pendingMarker = useSyncExternalStore(
    subscribePending,
    pendingSnapshot,
    pendingServerSnapshot,
  );
  const connected = connections.filter(
    (connection) => connection.state === "connected" || connection.state === "limited_permissions",
  ).length;
  const firstReadyPlatform = cards.find((card) => card.canStart)?.platform ?? null;
  const selectedCard = connectPlatform
    ? (cards.find((card) => card.platform === connectPlatform) ?? null)
    : null;
  const noticeAuthorized =
    notice ===
    "Official authorization completed. The account is connected; publishing remains disabled.";
  const markerResolved =
    pendingMarker &&
    connections.some(
      (connection) =>
        connection.platform === pendingMarker &&
        (connection.state === "connected" || connection.state === "limited_permissions"),
    );
  const inProgressPlatform =
    pendingMarker && !noticeAuthorized && !markerResolved && isConnectionPlatform(pendingMarker)
      ? pendingMarker
      : null;

  useEffect(() => {
    if (pendingMarker && (noticeAuthorized || markerResolved)) setPending(null);
  }, [markerResolved, noticeAuthorized, pendingMarker]);

  const blockerSummaries = cards
    .filter((card) => card.blocker)
    .map((card) => `${card.label}: ${card.blocker}. ${card.description}`);
  const topReason = pending
    ? "A connection action is in progress. Wait for the provider window or current request to finish."
    : blockerSummaries.length
      ? blockerSummaries.join(" ")
      : "No provider has every owner-verified readiness check recorded yet.";
  const managementReason = pending
    ? "A connection action is in progress; wait for it to finish."
    : !canManage
      ? "Only workspace owners/admins can refresh, check health or disconnect accounts."
      : "Actions are enabled for your owner/admin workspace; publishing remains disabled.";
  const continueReason = pending
    ? "A connection action is in progress; wait for it to finish."
    : selectedCard?.canStart
      ? "This starts real official OAuth on the provider's own domain."
      : `${selectedCard?.blocker ?? "Setup incomplete"}: ${selectedCard?.description ?? "Complete the owner setup checklist first."}`;
  const disconnectReason = pending
    ? "A connection action is in progress; wait for it to finish."
    : "Disconnect attempts provider revocation where supported, then deletes the encrypted local credential.";

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
        // A non-secret marker only. No state, code, token or credential is stored in the browser.
        setPending(platform);
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
              aria-describedby="connect-account-reason"
              title={topReason}
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
      <p id="connect-account-reason" className="field-hint small">
        {topReason}
      </p>

      <Card variant="inset" className="safe-preview-card" data-testid="safe-preview">
        <div className="spread">
          <div>
            <h2>Evidence-backed readiness</h2>
            <p className="muted small">
              Authentication, verified workspace onboarding and these Accounts controls are real and
              are not trapped behind demo mode. Video, scheduling, analytics and sample content are
              labelled demo workflows; publishing stays disabled. No account is connected and no
              authorization is simulated here.
            </p>
          </div>
          <Badge tone="accent">Safe preview</Badge>
        </div>
      </Card>

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
      {inProgressPlatform ? (
        <p className="unavailable-note">
          <strong>Connection in progress.</strong> Finish consent in the official provider window,
          then return here. If you cancelled,{" "}
          <button
            type="button"
            className="text-link small"
            onClick={() => {
              setPending(null);
              setMessage(null);
            }}
          >
            dismiss this state
          </button>{" "}
          and start again.
        </p>
      ) : null}
      {!readiness.authenticated ? (
        <p className="unavailable-note">
          <strong>Sign in required.</strong>{" "}
          <Link href="/login" className="text-link">
            Sign in
          </Link>{" "}
          with a confirmed email, or{" "}
          <Link href="/signup" className="text-link">
            create an account
          </Link>
          . Custom SMTP delivery is owner-verified; use the confirmation-help page if email is
          interrupted.
        </p>
      ) : !canManage ? (
        <p className="unavailable-note">
          <strong>Workspace setup required.</strong>{" "}
          <Link href="/onboarding" className="text-link">
            Finish verified onboarding
          </Link>{" "}
          for your first owner workspace, or ask an owner/admin for an invitation. Viewer/editor
          roles cannot connect, refresh or disconnect accounts.
        </p>
      ) : null}
      {readiness.connectionReadError ? (
        <p className="unavailable-note">
          <strong>Error.</strong> Connection records could not be read. Check the server-only broker
          configuration and workspace permissions; no connection status is invented.
        </p>
      ) : null}

      <section aria-labelledby="real-connection-heading" className="accounts-section">
        <div className="section-heading">
          <div>
            <h2 id="real-connection-heading">Real connection controls</h2>
            <p className="muted small">
              Each card reports its actual deployment status. No simulated authorization; disabled
              buttons name the exact blocker and the owner action that completes it.
            </p>
          </div>
          <Badge tone="neutral">3 providers</Badge>
        </div>
        <div className="accounts-grid grid grid-3">
          {cards.map((card) => {
            const cardReason = card.canStart
              ? "This starts real official OAuth on the provider's own domain."
              : `${card.blocker ?? card.status}: ${card.description}`;
            return (
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
                <p id={`${card.platform}-blocker`} className="field-hint small">
                  {cardReason}
                </p>
                <dl className="account-meta">
                  <div>
                    <dt>Foundation scopes</dt>
                    <dd className="wrap-anywhere">{card.scopes.join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Publishing scopes</dt>
                    <dd className="wrap-anywhere">
                      {card.publishingScopes.join(", ")} · not requested
                    </dd>
                  </div>
                  <div>
                    <dt>Exact provider redirect URI</dt>
                    <dd className="wrap-anywhere">
                      {card.externalCallbackUrl ?? card.callbackPath}
                    </dd>
                  </div>
                  <div>
                    <dt>Provider console</dt>
                    <dd className="wrap-anywhere">
                      <a
                        href={card.providerDashboard}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-link"
                      >
                        {card.providerDashboard}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>Publishing</dt>
                    <dd>
                      <Badge tone="warning">Disabled</Badge>
                    </dd>
                  </div>
                </dl>
                <details className="provider-requirements">
                  <summary>Exact owner setup steps</summary>
                  <ol>
                    {card.requirements.navigation.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="small">
                    <strong>Fields:</strong> {card.requirements.fields.join("; ")}.
                  </p>
                  <p className="small">
                    <strong>Expected result:</strong> {card.requirements.expectedResult}
                  </p>
                  <p className="small">
                    <strong>Restrictions:</strong> {card.requirements.restrictions.join(" ")}
                  </p>
                  <p className="small">
                    <a
                      href={card.requirements.documentationUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-link"
                    >
                      Official provider documentation
                    </a>
                  </p>
                </details>
                {card.missing.length ? (
                  <div className="setup-missing">
                    <strong>Still needed for this provider</strong>
                    <ul>
                      {card.missing.map((check) => (
                        <li key={check.id}>
                          <span>{check.names.join(", ")}</span>
                          <span className="muted small"> · {check.location}</span>
                          <span className="muted small"> · {check.ownerAction}</span>
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
                    aria-describedby={`${card.platform}-status ${card.platform}-blocker`}
                    title={cardReason}
                    onClick={() => setConnectPlatform(card.platform)}
                  >
                    {card.connectLabel}
                  </Button>
                </div>
              </Card>
            );
          })}
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
              Safe preview does not replace this journey. Build and unit-test results are not live
              OAuth acceptance.
            </p>
          </div>
        </div>
        <ol className="accounts-journey">
          <li>
            <strong>Sign in.</strong> <Link href="/signup">Create account</Link> or{" "}
            <Link href="/login">Sign in</Link>, confirm the email, then finish verified onboarding.
            Custom SMTP and delivery testing are owner dashboard steps.
          </li>
          <li>
            <strong>Get an owner/admin workspace.</strong> Verified onboarding creates the first
            workspace, owner membership and preferences through a server-side RPC. Existing members
            are never promoted; viewer/editor roles cannot manage connections.
          </li>
          <li>
            <strong>Complete the checklist.</strong> Confirm the public Supabase URL/key, exact{" "}
            <code>UP17_SITE_URL</code>, server-only service/secret key, token keyring and the
            credentials for each provider in Vercel, then redeploy.
          </li>
          <li>
            <strong>Register exact provider callbacks.</strong> Use the three public bridge redirect
            URIs above in Google Cloud, Meta for Developers and TikTok Developer Portal. Complete
            consent-screen, professional-account, Advanced Access and Direct Post audit gates only
            when the corresponding publishing milestone is approved.
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
                    {connectionStateLabels[connection.state]}
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
                <p id={`account-management-reason-${connection.id}`} className="field-hint small">
                  {managementReason}
                </p>
                <div className="account-card-actions">
                  <Button
                    size="sm"
                    disabled={!canManage || pending}
                    aria-describedby={`account-management-reason-${connection.id}`}
                    title={managementReason}
                    icon={<RefreshCw size={15} />}
                    onClick={() => act(connection, "refresh")}
                  >
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!canManage || pending}
                    aria-describedby={`account-management-reason-${connection.id}`}
                    title={managementReason}
                    onClick={() => act(connection, "health")}
                  >
                    Check health
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!canManage || pending}
                    aria-describedby={`account-management-reason-${connection.id}`}
                    title={managementReason}
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
              aria-describedby="continue-reason"
              title={continueReason}
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
          <p id="continue-reason" className="field-hint small">
            {continueReason}
          </p>
          {selectedCard?.nextSteps.length ? (
            <ul>
              {selectedCard.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
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
              aria-describedby="disconnect-reason"
              title={disconnectReason}
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
        <p id="disconnect-reason" className="field-hint small">
          {disconnectReason}
        </p>
      </Dialog>
    </div>
  );
}
