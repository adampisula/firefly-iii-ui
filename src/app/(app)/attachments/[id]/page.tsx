import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getAttachment } from "@/features/attachments/service";
import {
  DeleteAttachmentDialog,
  UpdateAttachmentForm,
  UploadAttachmentForm,
} from "@/features/attachments/attachment-forms";
import { ErrorState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function AttachmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to view this attachment">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Attachments are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let attachment;
  try {
    attachment = await getAttachment(context.client, id);
  } catch {
    return (
      <ErrorState level={1} title="Attachment could not be loaded">
        <Link className="text-link" href="/attachments">
          Return to attachments
        </Link>
      </ErrorState>
    );
  }
  if (!attachment) notFound();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Attachment {attachment.id}</p>
        <h1>{attachment.title}</h1>
        <p>
          {attachment.filename || "No filename"} ·{" "}
          {attachment.mime || "unknown type"} · {attachment.size} bytes
        </p>
        <p className="muted-note">
          Attached to {attachment.attachableType} {attachment.attachableId}
          {attachment.notes ? ` · ${attachment.notes}` : ""}
        </p>
        <div className="button-row">
          <a
            className="button-link"
            href={`/api/attachments/${attachment.id}/download`}
          >
            Download file
          </a>
          <DeleteAttachmentDialog id={attachment.id} title={attachment.title} />
          <Link className="text-link" href="/attachments">
            Back to attachments
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Edit metadata</h2>
        <UpdateAttachmentForm attachment={attachment} />
      </section>
      <section className="panel">
        <h2>Upload or replace binary</h2>
        <UploadAttachmentForm id={attachment.id} />
      </section>
    </div>
  );
}
