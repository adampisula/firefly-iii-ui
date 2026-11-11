import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  categoryTransactions,
  getCategory,
} from "@/features/classification/service";
import {
  CategoryForm,
  DeleteCategory,
} from "@/features/classification/class-forms";
import { ErrorState } from "@/components/shell/states";
import { MoneyDisplay } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to view this category">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  let category;
  let transactions;
  try {
    [category, transactions] = await Promise.all([
      getCategory(context.client, id),
      categoryTransactions(context.client, id),
    ]);
  } catch {
    return (
      <ErrorState level={1} title="Category could not be loaded">
        <Link className="text-link" href="/categories">
          Return to categories
        </Link>
      </ErrorState>
    );
  }
  if (!category) notFound();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Category {category.id}</p>
        <h1>{category.name}</h1>
        <div className="button-row">
          <DeleteCategory id={category.id} name={category.name} />
          <Link className="text-link" href="/categories">
            Back to categories
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Category transactions</h2>
        {transactions.groups.length === 0 ? (
          <p className="muted-note">No transactions reported.</p>
        ) : (
          <ul className="journal-list">
            {transactions.groups.map((group) => (
              <li key={group.id}>
                <Link className="text-link" href={`/transactions/${group.id}`}>
                  {group.title}
                </Link>
                {group.journals.map((journal) => (
                  <span key={journal.journalId} className="muted-note">
                    {" "}
                    ·{" "}
                    <MoneyDisplay
                      amount={journal.amount}
                      currency={journal.currencyCode}
                      decimalPlaces={journal.decimalPlaces}
                    />
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel">
        <h2>Edit category</h2>
        <CategoryForm category={category} />
      </section>
    </div>
  );
}
