import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import { listWebhooks, type WebhookRecord } from "@/features/webhooks/service";
import { CreateWebhookForm } from "@/features/webhooks/webhook-forms";
import { ErrorState } from "@/components/shell/states";
import { Status, PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function WebhooksPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Webhooks</p>
          <h1>Connect to view webhooks</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Webhooks are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let webhooks: WebhookRecord[];
  let disabled = false;
  try {
    webhooks = await listWebhooks(context.client);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      disabled = true;
      webhooks = [];
    } else {
      return (
        <ErrorState level={1} title="Webhooks could not be loaded">
          <p>Check the connection.</p>
        </ErrorState>
      );
    }
  }
  if (disabled)
    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Webhooks"
          title="Webhooks are disabled"
          lede="Firefly returned 404 for the webhook API. The feature is disabled on this backend."
          actions={
            <Link className="text-link" href="/help">
              Backend help
            </Link>
          }
        />
        <section className="panel">
          <p>
            <Status kind="warning">Feature disabled</Status>
          </p>
          <p>
            No webhook link, delivery or secret control is shown as working.
            Enable the feature in the backend configuration, then reload this
            page.
          </p>
        </section>
      </div>
    );
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Webhooks"
        title="Webhooks and delivery diagnostics"
        lede="Outbound webhook configuration, test delivery, messages and attempts."
      />
      <section className="panel">
        <h2>Webhooks</h2>
        {webhooks.length === 0 ? (
          <p className="muted-note">No webhooks configured.</p>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Webhooks"
          >
            <table className="data-table">
              <caption>Webhooks</caption>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">URL</th>
                  <th scope="col">Triggers</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((webhook) => (
                  <tr key={webhook.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/webhooks/${webhook.id}`}
                      >
                        {webhook.title}
                      </Link>
                    </td>
                    <td>{webhook.url}</td>
                    <td>{webhook.triggers.join(", ")}</td>
                    <td>
                      <Status kind={webhook.active ? "success" : "neutral"}>
                        {webhook.active ? "Active" : "Inactive"}
                      </Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Create webhook</h2>
        <CreateWebhookForm />
      </section>
    </div>
  );
}
