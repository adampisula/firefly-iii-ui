import Link from "next/link";
import { getCurrentAuth } from "@/lib/auth/service";
import { assistantEnabled } from "@/lib/assistant/config";
import { getOwnerKey } from "@/lib/user-data/owner-key";
import { getProviderSettings } from "@/lib/assistant/store";
import { publicAssistantSettings } from "@/lib/assistant/provider-config";
import { AssistantSettingsForm } from "@/features/assistant/assistant-settings-form";
import { PageHeader, Status } from "@/components/ui/primitives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AssistantSettingsPage() {
  if (!assistantEnabled()) {
    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Assistant settings"
          title="Assistant is disabled"
          lede="Set AI_ASSISTANT_ENABLED=true in the frontend deployment to enable provider configuration."
        />
        <section className="panel">
          <Status kind="neutral">Feature disabled by deployment</Status>
        </section>
      </div>
    );
  }

  const auth = await getCurrentAuth();
  if (!auth.session) {
    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Assistant settings"
          title="Connect an account first"
          lede="Provider settings are scoped to your Firefly user."
        />
        <section className="panel">
          <Link className="button-link" href="/assistant">
            Go to the assistant
          </Link>
        </section>
      </div>
    );
  }

  const settings = publicAssistantSettings(
    getProviderSettings(getOwnerKey(auth.session.user.id)),
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Assistant settings"
        title="AI provider configuration"
        lede="These settings are stored for your Firefly user in SQLite. The API key is encrypted and never returned to the browser."
        actions={
          <Link className="text-link" href="/assistant">
            Back to assistant
          </Link>
        }
      />
      <section className="panel">
        <AssistantSettingsForm initial={settings} />
      </section>
      <section className="panel">
        <h2>How tools behave</h2>
        <ul>
          <li>
            Read tools execute immediately against the existing Firefly API.
          </li>
          <li>
            Write tools are only available when you enable them above. Every
            write still pauses for an exact-operation approval card.
          </li>
          <li>
            Conversation text is stored in SQLite for your user. The API key is
            encrypted with a key derived from SESSION_SECRET.
          </li>
          <li>
            If SESSION_SECRET changes, re-enter the API key. Existing
            conversations remain.
          </li>
        </ul>
      </section>
    </div>
  );
}
