import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listRuleGroups, listRules } from "@/features/rules/service";
import {
  ExpressionValidator,
  RuleGroupForm,
} from "@/features/rules/rule-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { PageHeader, Status } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Rules</p>
          <h1>Connect to manage rules</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Rules are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let groups;
  let rules;
  try {
    [groups, rules] = await Promise.all([
      listRuleGroups(context.client),
      listRules(context.client),
    ]);
  } catch {
    return (
      <ErrorState level={1} title="Rules could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rules"
        title="Rules and rule groups"
        lede="Trigger/action rules and manual execution. Rules can change financial data; execution requires explicit confirmation."
        actions={
          <Link className="button-link" href="/rules/new">
            Create rule
          </Link>
        }
      />
      <section className="panel">
        <h2>Rule groups</h2>
        {groups.length === 0 ? (
          <PermissionState title="No rule groups">
            <p>Create one below before creating a rule.</p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Rule groups"
          >
            <table className="data-table">
              <caption>Rule groups</caption>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Order</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/rules/groups/${group.id}`}
                      >
                        {group.title}
                      </Link>
                    </td>
                    <td>{group.order}</td>
                    <td>
                      <Status kind={group.active ? "success" : "neutral"}>
                        {group.active ? "Active" : "Inactive"}
                      </Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Rules</h2>
        {rules.length === 0 ? (
          <PermissionState title="No rules">
            <p>Create a rule to get started.</p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Rules"
          >
            <table className="data-table">
              <caption>Rules</caption>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Group</th>
                  <th scope="col">Moment</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <Link className="text-link" href={`/rules/${rule.id}`}>
                        {rule.title}
                      </Link>
                    </td>
                    <td>{rule.ruleGroupTitle}</td>
                    <td>{rule.trigger}</td>
                    <td>
                      <Status kind={rule.active ? "success" : "neutral"}>
                        {rule.active ? "Active" : "Inactive"}
                      </Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Create rule group</h2>
        <RuleGroupForm />
      </section>
      <section className="panel">
        <h2>Validate an action expression</h2>
        <ExpressionValidator />
      </section>
    </div>
  );
}
