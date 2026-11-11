import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listTags } from "@/features/classification/service";
import { TagForm } from "@/features/classification/class-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Tags</p>
          <h1>Connect to manage tags</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Tags are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let tags;
  try {
    tags = await listTags(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Tags could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Tags</p>
        <h1>Tags</h1>
        <p className="lede">
          Tag names support Unicode and special characters. Individual deletion
          is supported; mass tag deletion has no verified API.
        </p>
        <Link className="text-link" href="/categories">
          Categories
        </Link>
      </section>
      <section className="panel">
        <h2>Tag list</h2>
        {tags.length === 0 ? (
          <PermissionState title="No tags">
            <p>Create one below.</p>
          </PermissionState>
        ) : (
          <ul className="link-list">
            {tags.map((tag) => (
              <li key={tag.id}>
                <Link
                  className="text-link"
                  href={`/tags/${encodeURIComponent(tag.tag)}`}
                >
                  {tag.tag}
                </Link>
                {tag.description ? (
                  <span className="muted-note"> · {tag.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel">
        <h2>Create tag</h2>
        <TagForm />
      </section>
    </div>
  );
}
