import Link from "next/link";
import { redirect } from "next/navigation";
import { ConnectForm } from "@/features/onboarding/connect-form";
import { loadOnboardingState } from "@/features/onboarding/service";
import {
  getChart,
  getSummary,
  rangeFromKey,
} from "@/features/analysis/service";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getServerEnvironment } from "@/lib/server-env";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { MoneyDisplay, Status } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

function backendPublicUrlOrNull(): string | null {
  try {
    return getServerEnvironment()
      .backendPublicUrl.toString()
      .replace(/\/$/, "");
  } catch {
    return null;
  }
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawRange = Array.isArray(resolved.range)
    ? resolved.range[0]
    : resolved.range;
  const range = rangeFromKey(rawRange);
  const context = await getSessionApiContext().catch(() => null);
  const backendPublicUrl = backendPublicUrlOrNull();

  if (!context) {
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Connect your account</p>
          <h1>Your finances, under your control.</h1>
          <p className="lede">
            Firefly runs against your own Firefly III 6.7.9 installation.
            Connect with a personal access token to start safe, API-backed
            setup.
          </p>
          <ConnectForm backendPublicUrl={backendPublicUrl} />
        </section>
        <section className="panel">
          <h2>What this frontend does not do</h2>
          <p>
            It does not execute bank payments, issue cards or share household
            finances. Identity management stays in the native Firefly backend.
          </p>
        </section>
      </div>
    );
  }

  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState title="Financial access is blocked">
        <p>
          This session could not verify Firefly III 6.7.9
          {context.compatibility.backendVersion
            ? ` (detected ${context.compatibility.backendVersion})`
            : ""}
          . Financial screens stay unavailable until the exact supported backend
          version is verified. Native identity and help links remain available
          in the account menu.
        </p>
        <p className="muted-note">
          Disconnect and reconnect after confirming the backend version, or ask
          your administrator for help.
        </p>
      </ErrorState>
    );
  }

  let state;
  try {
    state = await loadOnboardingState(context.client);
  } catch {
    return (
      <ErrorState title="Accounts could not be loaded">
        <p>
          The frontend reached Firefly but could not read your accounts. Check
          the connection and try again.
        </p>
      </ErrorState>
    );
  }

  if (!state.configured) {
    redirect("/setup");
  }

  const assetCount = state.accounts.filter(
    (account) => account.type === "asset",
  ).length;
  const role = context.auth.session.user.role;

  const [summary, balanceChart, accountChart, budgetChart, categoryChart] =
    await Promise.all([
      getSummary(context.client, range.start, range.end).catch(() => ({})),
      getChart(
        context.client,
        "chart.balance.balance",
        range.start,
        range.end,
      ).catch(() => []),
      getChart(
        context.client,
        "chart.account.overview",
        range.start,
        range.end,
      ).catch(() => []),
      getChart(
        context.client,
        "chart.budget.overview",
        range.start,
        range.end,
      ).catch(() => []),
      getChart(
        context.client,
        "chart.category.overview",
        range.start,
        range.end,
      ).catch(() => []),
    ]);
  const summaryEntries = Object.entries(summary);

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Overview</p>
        <h1>Setup complete</h1>
        <p className="lede">
          Your Firefly account is connected and the starting accounts exist.
          Account balances, cash flow and transaction views arrive with the
          supported financial workflow tasks.
        </p>
        <p>
          <Status kind="success">Connected</Status>{" "}
          <Status kind="neutral">
            {assetCount} asset {assetCount === 1 ? "account" : "accounts"}
          </Status>
        </p>
        <div className="button-row">
          <Link className="button-link" href="/accounts">
            Open accounts
          </Link>
          <Link className="text-link" href="/settings">
            Connection and appearance settings
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>Financial dashboard · {range.label}</h2>
        <p className="muted-note">
          Period {range.start} to {range.end}. Change the shell date range to
          update this dashboard. Values are backend-authoritative.
        </p>
        {summaryEntries.length === 0 ? (
          <p className="muted-note">
            No summary values reported for this period.
          </p>
        ) : (
          <dl className="detail-list">
            {summaryEntries.map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>
                  <MoneyDisplay
                    amount={value.value}
                    currency={value.currencyCode}
                    decimalPlaces={value.decimalPlaces}
                  />
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {[
        ["Balance history", balanceChart],
        ["Account overview", accountChart],
        ["Budget overview", budgetChart],
        ["Category overview", categoryChart],
      ].map(([title, points]) => (
        <section className="panel" key={String(title)}>
          <h2>{String(title)}</h2>
          {Array.isArray(points) && points.length > 0 ? (
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label={String(title)}
            >
              <table className="data-table">
                <caption>{String(title)}</caption>
                <thead>
                  <tr>
                    <th scope="col">Label</th>
                    <th scope="col">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    points as {
                      label: string;
                      value: string;
                      currencyCode: string;
                      decimalPlaces: number;
                    }[]
                  ).map((point) => (
                    <tr key={`${String(title)}-${point.label}`}>
                      <td>{point.label}</td>
                      <td>
                        <MoneyDisplay
                          amount={point.value}
                          currency={point.currencyCode}
                          decimalPlaces={point.decimalPlaces}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted-note">
              No chart data reported for this period.
            </p>
          )}
        </section>
      ))}

      <section className="panel">
        <h2>Supported now</h2>
        <ul>
          <li>Secure per-user session connection and disconnect.</li>
          <li>
            First-run creation of three asset accounts and primary currency.
          </li>
          <li>
            Appearance, date range and privacy controls in the application
            shell.
          </li>
          <li>Trusted links to native profile, token and MFA management.</li>
        </ul>
      </section>

      {role ? (
        <section className="panel">
          <h2>Backend role</h2>
          <p>
            Your Firefly role is <strong>{role}</strong>. Administration-only
            settings appear only where the backend API accepts that role.
          </p>
        </section>
      ) : (
        <PermissionState title="No administration role reported">
          <p>
            The backend did not report a role for this user, so owner-only
            settings remain hidden. Native profile and security links are still
            available in the account menu.
          </p>
        </PermissionState>
      )}
    </div>
  );
}
