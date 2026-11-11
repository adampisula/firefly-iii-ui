import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listObjectGroups } from "@/features/classification/service";
import { ErrorState, PermissionState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function ObjectGroupsPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Object groups</p>
          <h1>Connect to manage object groups</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Object groups are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let groups;
  try {
    groups = await listObjectGroups(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Object groups could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Object groups</p>
        <h1>Object groups</h1>
        <p className="lede">
          Rename, reorder and delete groups. There is no standalone create
          route; groups are created through supported resource semantics.
        </p>
      </section>
      <section className="panel">
        <h2>Groups</h2>
        {groups.length === 0 ? (
          <PermissionState title="No object groups">
            <p>Assign a group title in a supported resource editor.</p>
          </PermissionState>
        ) : (
          <ul className="link-list">
            {groups.map((group) => (
              <li key={group.id}>
                <Link className="text-link" href={`/object-groups/${group.id}`}>
                  {group.title}
                </Link>
                <span className="muted-note"> · order {group.order}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
