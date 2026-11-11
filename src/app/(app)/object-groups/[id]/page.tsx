import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  getObjectGroup,
  objectGroupBills,
  objectGroupPiggyBanks,
} from "@/features/classification/service";
import {
  DeleteObjectGroup,
  ObjectGroupForm,
} from "@/features/classification/class-forms";
import { ErrorState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function ObjectGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to view this object group">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  let group;
  let pigs;
  let bills;
  try {
    [group, pigs, bills] = await Promise.all([
      getObjectGroup(context.client, id),
      objectGroupPiggyBanks(context.client, id),
      objectGroupBills(context.client, id),
    ]);
  } catch {
    return (
      <ErrorState level={1} title="Object group could not be loaded">
        <Link className="text-link" href="/object-groups">
          Return to object groups
        </Link>
      </ErrorState>
    );
  }
  if (!group) notFound();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Object group {group.id}</p>
        <h1>{group.title}</h1>
        <div className="button-row">
          <DeleteObjectGroup id={group.id} title={group.title} />
          <Link className="text-link" href="/object-groups">
            Back to object groups
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Savings goals</h2>
        {pigs.length === 0 ? (
          <p className="muted-note">No piggy banks.</p>
        ) : (
          <ul className="link-list">
            {pigs.map((pig) => (
              <li key={pig.id}>{pig.name}</li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel">
        <h2>Subscriptions</h2>
        {bills.length === 0 ? (
          <p className="muted-note">No subscriptions.</p>
        ) : (
          <ul className="link-list">
            {bills.map((bill) => (
              <li key={bill.id}>{bill.name}</li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel">
        <h2>Edit object group</h2>
        <ObjectGroupForm group={group} />
      </section>
    </div>
  );
}
