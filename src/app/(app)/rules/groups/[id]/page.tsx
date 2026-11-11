import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getRuleGroup, groupRules } from "@/features/rules/service";
import { DeleteRuleGroup, RuleGroupForm } from "@/features/rules/rule-forms";
import { ErrorState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function RuleGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to view this group">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  let group;
  let rules;
  try {
    [group, rules] = await Promise.all([
      getRuleGroup(context.client, id),
      groupRules(context.client, id),
    ]);
  } catch {
    return (
      <ErrorState level={1} title="Rule group could not be loaded">
        <Link className="text-link" href="/rules">
          Return to rules
        </Link>
      </ErrorState>
    );
  }
  if (!group) notFound();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Rule group {group.id}</p>
        <h1>{group.title}</h1>
        <p className="muted-note">
          {group.description ?? "No description."} · order {group.order}
        </p>
        <div className="button-row">
          <DeleteRuleGroup id={group.id} />
          <Link className="text-link" href="/rules">
            Back to rules
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Rules in this group</h2>
        {rules.length === 0 ? (
          <p className="muted-note">No rules.</p>
        ) : (
          <ul className="link-list">
            {rules.map((rule) => (
              <li key={rule.id}>
                <Link className="text-link" href={`/rules/${rule.id}`}>
                  {rule.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel">
        <h2>Edit group</h2>
        <RuleGroupForm group={group} />
      </section>
    </div>
  );
}
