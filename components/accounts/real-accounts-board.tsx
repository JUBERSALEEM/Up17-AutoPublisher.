"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2Off, Plus, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { Badge, Button, Card, Dialog, EmptyState } from "@/components/ui";
import { PageHeader, PlatformBadge, PlatformIcon } from "@/components/features/common";
import {
  connectionStateLabels,
  type ConnectionPlatform,
  type ProviderAvailability,
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

export function RealAccountsBoard({
  connections,
  providers,
  canManage,
  notice,
}: {
  connections: RealConnection[];
  providers: ProviderAvailability[];
  canManage: boolean;
  notice: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [connectPlatform, setConnectPlatform] = useState<ConnectionPlatform | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<RealConnection | null>(null);
  const [message, setMessage] = useState<string | null>(notice);
  const connected = connections.filter(
    (c) => c.state === "connected" || c.state === "limited_permissions",
  ).length;

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
          setMessage(body.error ?? "OAuth is not configured on this deployment.");
          return;
        }
        const target = new URL(body.authorizationUrl);
        if (target.origin !== providerOrigins[platform])
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
        description="Connect real creator identities with official OAuth. Publishing remains disabled until a separate approved publishing workflow exists."
        actions={
          <>
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              disabled={!canManage}
              onClick={() => setConnectPlatform("youtube")}
            >
              Connect an account
            </Button>
            <Badge tone={connected ? "success" : "neutral"}>{connected} connected</Badge>
          </>
        }
      />
      <div className="account-security-note">
        <ShieldCheck size={22} aria-hidden="true" />
        <div>
          <strong>Your credentials stay yours.</strong>
          <p>
            Up17 never asks for social passwords. Tokens are encrypted server-side and are never
            sent to the browser.
          </p>
        </div>
        <Badge tone="accent">Publishing disabled</Badge>
      </div>
      {message ? (
        <p className="save-notice" role="status">
          {message}
        </p>
      ) : null}
      {!canManage ? (
        <p className="unavailable-note">
          <strong>Read-only access.</strong> Only workspace owners/admins can connect, refresh or
          disconnect accounts.
        </p>
      ) : null}
      <div className="accounts-grid grid grid-3">
        {providers.map((provider) => (
          <Card key={provider.platform} className="account-card">
            <div className="spread">
              <span className={`platform-icon platform-large platform-${provider.platform}`}>
                <PlatformIcon platform={provider.platform} size={25} />
              </span>
              <Badge tone={provider.configured ? "success" : "warning"}>
                {provider.configured ? "OAuth configured" : "Setup required"}
              </Badge>
            </div>
            <h2>{provider.label}</h2>
            <p className="muted small">{provider.loginPath}</p>
            <p className="account-note muted small">{provider.reviewNote}</p>
            <dl className="account-meta">
              <div>
                <dt>Requested scopes</dt>
                <dd>{provider.scopes.join(", ")}</dd>
              </div>
              <div>
                <dt>Publishing</dt>
                <dd>
                  <Badge tone="warning">Disabled</Badge>
                </dd>
              </div>
            </dl>
            <div className="account-card-actions">
              <Button
                size="sm"
                variant="primary"
                disabled={!canManage || !provider.configured || pending}
                title={
                  provider.configured
                    ? `Connect ${provider.label}`
                    : "Provider credentials are not configured"
                }
                onClick={() => startOAuth(provider.platform)}
              >
                {provider.configured ? `Connect ${provider.label}` : "OAuth unavailable"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <h2 className="section-title">Real connections</h2>
      {!connections.length ? (
        <EmptyState
          title="No real accounts connected"
          description="Authorized accounts will appear here only after a successful official OAuth callback. Demo identities below are not real connections."
          icon={<Link2Off size={26} />}
        />
      ) : (
        <div className="accounts-grid grid grid-3">
          {connections.map((connection) => (
            <Card key={connection.id} className="account-card">
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
                  <dd>
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
                    <dd>{connection.lastErrorCode}</dd>
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
              disabled={!connectPlatform || pending}
              onClick={() => {
                if (connectPlatform) {
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
        <p className="muted small">
          Only connect accounts you own or administer. Authorization does not enable publishing. You
          can disconnect and delete local credentials at any time.
        </p>
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
