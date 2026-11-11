import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  getWebhook,
  listAttempts,
  listMessages,
} from "@/features/webhooks/service";
import {
  DeleteWebhook,
  SecretReveal,
  SubmitWebhookForm,
} from "@/features/webhooks/webhook-forms";
import { ErrorState } from "@/components/shell/states";
import { Status } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function WebhookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to view this webhook">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  let webhook;
  let messages;
  let attemptsByMessage: {
    id: string;
    attempts: Awaited<ReturnType<typeof listAttempts>>;
  }[] = [];
  try {
    webhook = await getWebhook(context.client, id);
    if (!webhook) notFound();
    messages = await listMessages(context.client, id);
    attemptsByMessage = await Promise.all(
      messages.map(async (message) => ({
        id: message.id,
        attempts: await listAttempts(context.client, id, message.id).catch(
          () => [],
        ),
      })),
    );
  } catch {
    return (
      <ErrorState level={1} title="Webhook could not be loaded">
        <Link className="text-link" href="/webhooks">
          Return to webhooks
        </Link>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Webhook {webhook.id}</p>
        <h1>{webhook.title}</h1>
        <p className="result-meta">
          <Status kind={webhook.active ? "success" : "neutral"}>
            {webhook.active ? "Active" : "Inactive"}
          </Status>
          <Status kind="neutral">{webhook.triggers.join(", ")}</Status>
        </p>
        <p>{webhook.url}</p>
        <SecretReveal secret={webhook.secret} />
        <div className="button-row">
          <DeleteWebhook id={webhook.id} title={webhook.title} />
          <Link className="text-link" href="/webhooks">
            Back to webhooks
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Test delivery</h2>
        <SubmitWebhookForm id={webhook.id} />
      </section>
      <section className="panel">
        <h2>Messages</h2>
        {messages.length === 0 ? (
          <p className="muted-note">No messages.</p>
        ) : (
          <ul className="journal-list">
            {messages.map((message) => (
              <li key={message.id}>
                Message {message.id} · {message.sent ? "sent" : "pending"} ·{" "}
                {message.created ?? "no date"}
                <ul>
                  {(
                    attemptsByMessage.find((item) => item.id === message.id)
                      ?.attempts ?? []
                  ).map((attempt) => (
                    <li key={attempt.id}>
                      Attempt {attempt.id} · status{" "}
                      {attempt.statusCode ?? "none"} ·{" "}
                      {attempt.response ?? "no response"}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
