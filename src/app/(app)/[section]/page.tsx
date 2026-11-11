import Link from "next/link";
import { notFound } from "next/navigation";
import { Status } from "@/components/ui/primitives";
import { findNavLinkBySegment } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function PlannedSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const link = findNavLinkBySegment(section);
  if (!link) notFound();

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">{link.label}</p>
        <h1>{link.label} is planned</h1>
        <p className="lede">{link.description}</p>
        <p>
          <Status kind="warning">Not available in this release slice</Status>
        </p>
        <p>
          This section is owned by task <strong>{link.task}</strong> and is not
          simulated with demo data. It becomes available when its supported API
          contract and runtime evidence are complete.
        </p>
        <div className="button-row">
          <Link className="button-link" href="/">
            Return to overview
          </Link>
          <Link className="text-link" href="/help">
            Connection and version help
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Why this page is empty</h2>
        <p>
          The Firefly backend is unchanged and only existing API operations are
          used. Showing invented balances, cards, payments or household features
          would misrepresent what the backend can safely do.
        </p>
      </section>
    </div>
  );
}
