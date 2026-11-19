import Link from "next/link";
import { getCurrentAuth } from "@/lib/auth/service";
import { getServerEnvironment } from "@/lib/server-env";
import { assistantEnabled } from "@/lib/assistant/config";
import { getOwnerKey } from "@/lib/user-data/owner-key";
import { getProviderSettings, listConversations } from "@/lib/assistant/store";
import { publicAssistantSettings } from "@/lib/assistant/provider-config";
import { ConnectForm } from "@/features/onboarding/connect-form";
import { AssistantChat } from "@/features/assistant/assistant-chat";
import { PageHeader, Status } from "@/components/ui/primitives";

export const runtime = "nodejs";
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

export default async function AssistantPage() {
  if (!assistantEnabled()) {
    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Assistant"
          title="AI assistant is disabled"
          lede="The deployment switch AI_ASSISTANT_ENABLED is not true. No provider settings, API keys or chat history are touched while the feature is off."
        />
        <section className="panel">
          <Status kind="neutral">Feature disabled by deployment</Status>
          <p className="muted-note">
            An administrator can enable the assistant by setting
            AI_ASSISTANT_ENABLED=true and restarting the frontend. Provider URL,
            model and API key are then configured per user in Assistant
            settings.
          </p>
        </section>
      </div>
    );
  }

  const auth = await getCurrentAuth();
  if (!auth.session) {
    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Assistant"
          title="Connect to use the financial assistant"
          lede="The assistant reads your own Firefly data through the existing frontend session and asks for approval before every write."
        />
        <section className="panel">
          <ConnectForm backendPublicUrl={backendPublicUrlOrNull()} />
        </section>
      </div>
    );
  }

  const ownerKey = getOwnerKey(auth.session.user.id);
  const stored = getProviderSettings(ownerKey);
  const settings = publicAssistantSettings(stored);

  if (!settings.configured) {
    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Assistant"
          title="Configure your AI provider"
          lede="Provider URL, model and API key are stored per user in SQLite. The API key is encrypted and never returned to the browser."
          actions={
            <Link className="button-link" href="/assistant/settings">
              Open assistant settings
            </Link>
          }
        />
        <section className="panel">
          <Status kind="warning">No provider key configured</Status>
          <p>
            Add an OpenRouter-compatible base URL, model and API key. The
            default model is deepseek/deepseek-v4.1-flash-1017.
          </p>
        </section>
      </div>
    );
  }

  const conversations = listConversations(
    ownerKey,
    settings.historyRetentionDays,
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Assistant"
        title="Talk to your Firefly data"
        lede="Read accounts, transactions, budgets, bills, insights and savings goals. Every POST, PUT or DELETE requires your explicit approval."
        actions={
          <Link className="text-link" href="/assistant/settings">
            Assistant settings
          </Link>
        }
      />
      <AssistantChat
        initialSettings={settings}
        initialConversations={conversations}
      />
    </div>
  );
}
