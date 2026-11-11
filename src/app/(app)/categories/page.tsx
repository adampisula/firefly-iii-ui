import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listCategories } from "@/features/classification/service";
import { CategoryForm } from "@/features/classification/class-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Categories</p>
          <h1>Connect to manage categories</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Categories are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let categories;
  try {
    categories = await listCategories(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Categories could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Categories</p>
        <h1>Categories</h1>
        <p className="lede">
          Classification values used by transactions and budgets.
        </p>
        <Link className="text-link" href="/tags">
          Manage tags
        </Link>{" "}
        <Link className="text-link" href="/object-groups">
          Object groups
        </Link>
      </section>
      <section className="panel">
        <h2>Category list</h2>
        {categories.length === 0 ? (
          <PermissionState title="No categories">
            <p>Create one below.</p>
          </PermissionState>
        ) : (
          <ul className="link-list">
            {categories.map((category) => (
              <li key={category.id}>
                <Link className="text-link" href={`/categories/${category.id}`}>
                  {category.name}
                </Link>
                {category.notes ? (
                  <span className="muted-note"> · {category.notes}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel">
        <h2>Create category</h2>
        <CategoryForm />
      </section>
    </div>
  );
}
