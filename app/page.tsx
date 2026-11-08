import { getFoundationStatus } from "@/lib/foundation";

/** Temporary toolchain smoke screen, not the approved product dashboard. */
export default function FoundationPage() {
  const status = getFoundationStatus();
  return (
    <main className="foundation">
      <span className="foundation-badge">
        {status.mode} · {status.milestone}
      </span>
      <h1>{status.product}</h1>
      <p>The local application foundation is ready for the next approved milestone.</p>
      <p className="foundation-note">
        Accounts: {status.integrations.replaceAll("_", " ").toLowerCase()}. Publishing:{" "}
        {status.publishing.toLowerCase()}. This is a toolchain check, not a working automation
        product.
      </p>
    </main>
  );
}
