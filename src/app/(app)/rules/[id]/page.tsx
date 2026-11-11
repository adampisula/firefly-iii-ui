import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getRule, listRuleGroups } from "@/features/rules/service";
import {
  DeleteRule,
  RuleForm,
  RuleTestButtons,
} from "@/features/rules/rule-forms";
import { ErrorState } from "@/components/shell/states";
import { Status } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function RuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to view this rule">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Rules are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let rule;
  let groups;
  try {
    [rule, groups] = await Promise.all([
      getRule(context.client, id),
      listRuleGroups(context.client),
    ]);
  } catch {
    return (
      <ErrorState level={1} title="Rule could not be loaded">
        <Link className="text-link" href="/rules">
          Return to rules
        </Link>
      </ErrorState>
    );
  }
  if (!rule) notFound();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Rule {rule.id}</p>
        <h1>{rule.title}</h1>
        <p className="result-meta">
          <Status kind={rule.active ? "success" : "neutral"}>
            {rule.active ? "Active" : "Inactive"}
          </Status>
          <Status kind="neutral">{rule.ruleGroupTitle}</Status>
          <Status kind="neutral">{rule.trigger}</Status>
        </p>
        <p className="muted-note">{rule.description ?? "No description."}</p>
        <div className="button-row">
          <DeleteRule id={rule.id} />
          <Link className="text-link" href="/rules">
            Back to rules
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Test and execute</h2>
        <RuleTestButtons ruleId={rule.id} />
        <p className="muted-note">
          Testing previews matches. Execution applies the rule to matching
          transactions and cannot be automatically undone.
        </p>
      </section>
      <section className="panel">
        <h2>Current triggers and actions</h2>
        <h3>Triggers</h3>
        <ul className="link-list">
          {rule.triggers.map((trigger, index) => (
            <li key={`${trigger.id ?? index}`}>
              {trigger.type} · {trigger.value || "(no value)"} ·{" "}
              {trigger.active ? "active" : "inactive"}
            </li>
          ))}
        </ul>
        <h3>Actions</h3>
        <ul className="link-list">
          {rule.actions.map((action, index) => (
            <li key={`${action.id ?? index}`}>
              {action.type} · {action.value || "(no value)"} ·{" "}
              {action.active ? "active" : "inactive"}
            </li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2>Edit rule</h2>
        <RuleForm rule={rule} groups={groups} />
      </section>
    </div>
  );
}
