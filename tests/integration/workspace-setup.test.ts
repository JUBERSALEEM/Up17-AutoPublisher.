import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  WORKSPACE_SETUP_FAILURE_MESSAGES,
  workspaceDestination,
  workspaceSetupFailurePath,
  workspaceSetupFailureReason,
  workspaceSetupPath,
} from "@/lib/auth/workspace-setup";

const mocks = vi.hoisted(() => ({
  getAccountSession: vi.fn(),
  getWorkspaceContext: vi.fn(),
  bootstrapFirstWorkspace: vi.fn(),
  recordAuthDiagnostic: vi.fn(),
  authDiagnosticReference: vi.fn(() => "syntheticref12"),
}));

vi.mock("@/lib/auth/session", () => ({ getAccountSession: mocks.getAccountSession }));
vi.mock("@/lib/auth/workspace", () => ({ getWorkspaceContext: mocks.getWorkspaceContext }));
vi.mock("@/lib/auth/workspace-actions", () => ({
  bootstrapFirstWorkspace: mocks.bootstrapFirstWorkspace,
}));
vi.mock("@/lib/auth/diagnostics", () => ({
  recordAuthDiagnostic: mocks.recordAuthDiagnostic,
  authDiagnosticReference: mocks.authDiagnosticReference,
}));

import { GET } from "../../app/workspace/setup/route";

const request = (next = "/settings") =>
  new NextRequest(`https://preview.invalid/workspace/setup?next=${encodeURIComponent(next)}`);
const confirmed = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@up17.invalid",
  confirmed: true,
};
const workspace = { workspaceId: "22222222-2222-4222-8222-222222222222" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authDiagnosticReference.mockReturnValue("syntheticref12");
  mocks.getAccountSession.mockResolvedValue(confirmed);
  mocks.bootstrapFirstWorkspace.mockResolvedValue({ ok: true, workspaceId: workspace.workspaceId });
  mocks.getWorkspaceContext.mockResolvedValue(workspace);
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe("request-scoped first-workspace setup (synthetic, not hosted)", () => {
  it("builds safe setup/failure paths and keeps the exact owner-visible failure message", () => {
    expect(workspaceSetupPath("/settings?tab=security")).toBe(
      "/workspace/setup?next=%2Fsettings%3Ftab%3Dsecurity",
    );
    expect(workspaceSetupPath("//evil.invalid")).toBe("/workspace/setup?next=%2Faccount");
    expect(workspaceSetupPath("/onboarding?next=/account")).toBe(
      "/workspace/setup?next=%2Faccount",
    );
    expect(workspaceSetupFailurePath("/settings", "rpc")).toBe(
      "/onboarding?error=setup-failed&reason=rpc&next=%2Fsettings",
    );
    expect(workspaceSetupFailureReason("javascript:alert(1)")).toBe("unavailable");
    expect(WORKSPACE_SETUP_FAILURE_MESSAGES.unavailable).toBe(
      "Workspace setup is temporarily unavailable. Reload this page to retry.",
    );
  });

  it("rejects setup/onboarding as final destinations to prevent redirect loops", () => {
    expect(workspaceDestination("/workspace/setup?next=/settings")).toBe("/account");
    expect(workspaceDestination("/onboarding?next=/account")).toBe("/account");
    expect(workspaceDestination("/settings?tab=security")).toBe("/settings?tab=security");
  });

  it("requires a committed, confirmed session before any workspace write", async () => {
    mocks.getAccountSession.mockResolvedValueOnce(null);
    const signedOut = await GET(request());
    expect(signedOut.headers.get("location")).toBe(
      "https://preview.invalid/login?next=%2Fsettings",
    );
    expect(mocks.bootstrapFirstWorkspace).not.toHaveBeenCalled();

    mocks.getAccountSession.mockResolvedValueOnce({ ...confirmed, confirmed: false });
    const unconfirmed = await GET(request());
    expect(unconfirmed.headers.get("location")).toBe(
      "https://preview.invalid/auth/verify-email?next=%2Fsettings",
    );
    expect(mocks.bootstrapFirstWorkspace).not.toHaveBeenCalled();
  });

  it("bootstraps, verifies RLS-visible context, then redirects without a page refresh", async () => {
    const response = await GET(request());
    expect(mocks.bootstrapFirstWorkspace).toHaveBeenCalledOnce();
    expect(mocks.getWorkspaceContext).toHaveBeenCalledOnce();
    expect(mocks.bootstrapFirstWorkspace.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getWorkspaceContext.mock.invocationCallOrder[0],
    );
    expect(response.headers.get("location")).toBe("https://preview.invalid/settings");
    expect(response.headers.get("refresh")).toBeNull();
    expect(response.status).toBe(307);
  });

  it("redirects to an explicit safe failure page when the RPC fails", async () => {
    mocks.bootstrapFirstWorkspace.mockResolvedValue({
      ok: false,
      reason: "rpc",
      message: "Workspace setup could not finish. Reload this page to retry; no data was changed.",
    });
    const response = await GET(request());
    expect(mocks.getWorkspaceContext).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://preview.invalid/onboarding?error=setup-failed&reason=rpc&next=%2Fsettings",
    );
    expect(response.headers.get("location")).not.toContain("could not finish");
  });

  it("does not send the browser to a workspace route when the context read fails", async () => {
    mocks.getWorkspaceContext.mockRejectedValueOnce(new Error("synthetic read failure"));
    const response = await GET(request("/workspace/setup?next=/settings"));
    expect(response.headers.get("location")).toContain("/onboarding?error=setup-failed");
    expect(response.headers.get("location")).toContain("reason=unavailable");
    expect(response.headers.get("location")).toContain("next=%2Faccount");
    expect(mocks.recordAuthDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "bootstrap-workspace",
        outcome: "unexpected-exception",
      }),
    );
  });
});
