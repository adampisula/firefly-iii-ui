import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listRuleGroups } from "@/features/rules/service";
import { RuleForm } from "@/features/rules/rule-forms";
import { ErrorState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function NewRulePage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to create rules">
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
  let groups;
  try {
    groups = await listRuleGroups(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Rule groups could not be loaded">
        <Link className="text-link" href="/rules">
          Return to rules
        </Link>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">New rule</p>
        <h1>Create rule</h1>
        <p className="lede">
          Triggers and actions use Firefly 6.7.9 rule vocabulary. Save first;
          test and execute from the rule detail.
        </p>
        <RuleForm groups={groups} />
        <p className="muted-note">
          <Link className="text-link" href="/rules">
            Back to rules
          </Link>
        </p>
      </section>
    </div>
  );
}
