import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listAttachments } from "@/features/attachments/service";
import { CreateAttachmentForm } from "@/features/attachments/attachment-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function AttachmentsPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Attachments</p>
          <h1>Connect to manage attachments</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Attachments are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let attachments;
  try {
    attachments = await listAttachments(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Attachments could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Attachments</p>
        <h1>Attachments</h1>
        <p className="lede">
          Metadata, binary upload, download and deletion through existing
          attachment operations. Files never pass through browser storage.
        </p>
      </section>
      <section className="panel">
        <h2>Attachment list</h2>
        {attachments.length === 0 ? (
          <PermissionState title="No attachments">
            <p>Create one below.</p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Attachments"
          >
            <table className="data-table">
              <caption>Attachments</caption>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">File</th>
                  <th scope="col">Attached to</th>
                  <th scope="col">Size</th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((attachment) => (
                  <tr key={attachment.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/attachments/${attachment.id}`}
                      >
                        {attachment.title}
                      </Link>
                    </td>
                    <td>
                      {attachment.filename || "No filename"}
                      <span className="muted-note">
                        {" "}
                        · {attachment.mime || "unknown"}
                      </span>
                    </td>
                    <td>
                      {attachment.attachableType} {attachment.attachableId}
                    </td>
                    <td>{attachment.size} bytes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Create attachment</h2>
        <CreateAttachmentForm />
      </section>
    </div>
  );
}
