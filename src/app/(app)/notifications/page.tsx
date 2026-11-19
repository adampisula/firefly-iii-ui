import Link from "next/link";
import { getServerEnvironment } from "@/lib/server-env";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";
function backendPublicUrlOrNull(): string | null {
  try {
    return getServerEnvironment()
      .backendPublicUrl.toString()
      .replace(/\/$/, "");
  } catch {
    return null;
  }
}
export default function NotificationsPage() {
  const backend = backendPublicUrlOrNull();
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Notifications"
        title="Notification configuration is native-only"
        lede="Firefly 6.7.9 exposes no API for user/owner notification events, encrypted channel credentials or delivery tests. Storing channel secrets as ordinary plaintext preferences is not an acceptable substitute."
      />
      <section className="panel">
        <p>
          <strong>Residual GAP-04:</strong> notification-channel configuration
          and testing require the native backend UI or an explicitly approved
          future contract.
        </p>
        {backend ? (
          <a className="text-link" href={`${backend}/profile`} rel="noreferrer">
            Open native profile notifications
          </a>
        ) : (
          <p className="muted-note">
            Set BACKEND_PUBLIC_URL to open the native profile.
          </p>
        )}
        <p className="muted-note">
          No fake delivery test, no plaintext credential form and no hidden
          writes are provided.
        </p>
        <Link className="text-link" href="/settings">
          Back to settings
        </Link>
      </section>
    </div>
  );
}
