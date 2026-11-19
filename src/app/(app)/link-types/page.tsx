import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listLinkTypes } from "@/features/transaction-actions/service";
import { LinkTypeForm } from "@/features/transaction-actions/link-type-form";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function LinkTypesPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Link types</p>
          <h1>Connect to manage transaction links</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Link types are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let linkTypes = [];
  try {
    linkTypes = await listLinkTypes(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Link types could not be loaded">
        <p>Check the connection and try again.</p>
      </ErrorState>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Link types"
        title="Transaction link types"
        lede="Link types describe how two transaction journals relate. Names and inward/outward descriptions must be unique; writes are enforced by the owner role in Firefly."
      />

      <section className="panel">
        <h2>Existing link types</h2>
        {linkTypes.length === 0 ? (
          <PermissionState title="No link types">
            <p>Create a link type below.</p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Link types"
          >
            <table className="data-table">
              <caption>Link types</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Inward</th>
                  <th scope="col">Outward</th>
                </tr>
              </thead>
              <tbody>
                {linkTypes.map((linkType) => (
                  <tr key={linkType.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/link-types/${linkType.id}`}
                      >
                        {linkType.name}
                      </Link>
                    </td>
                    <td>{linkType.inward}</td>
                    <td>{linkType.outward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Create link type</h2>
        <LinkTypeForm />
      </section>
    </div>
  );
}
