import { redirect } from "next/navigation";
import { ConnectForm } from "@/features/onboarding/connect-form";
import { loadOnboardingState } from "@/features/onboarding/service";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getServerEnvironment } from "@/lib/server-env";
import { ErrorState } from "@/components/shell/states";
import { EmptyState, PageHeader, Status } from "@/components/ui/primitives";
import { rangeFromKey } from "@/features/analysis/service";
import { OverviewDashboard } from "@/features/overview/overview-dashboard";
import { loadOverview } from "@/features/overview/service";

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

function requestedRange(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "this-month";
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getSessionApiContext().catch(() => null);
  const backendPublicUrl = backendPublicUrlOrNull();

  if (!context) {
    return (
      <div className="page-stack">
        <PageHeader
          eyebrow="Connect your account"
          title="Your finances, under your control."
          lede="Firefly runs against your own Firefly III 6.7.9 installation. Connect with a personal access token to see real balances, activity, budgets and reports. No sample balances are shown."
        />
        <section className="panel">
          <ConnectForm backendPublicUrl={backendPublicUrl} />
        </section>
        <section className="panel">
          <h2>What this frontend does not do</h2>
          <p>
            It does not execute bank payments, issue cards or share household
            finances. Identity management stays in the native Firefly backend.
          </p>
          <div className="button-row">
            <Status kind="neutral">API-backed</Status>
            <Status kind="neutral">Separate native identity</Status>
            <Status kind="neutral">Decimal amounts preserved</Status>
          </div>
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

  const rangeKey = requestedRange((await searchParams).range);
  const range = rangeFromKey(rangeKey);
  let overview;
  try {
    overview = await loadOverview(context.client, range);
  } catch {
    return (
      <ErrorState title="Overview could not be loaded">
        <p>Check the connection and try again.</p>
        <EmptyState title="No financial data was changed">
          This view only reads the existing Firefly API.
        </EmptyState>
      </ErrorState>
    );
  }

  return (
    <OverviewDashboard
      data={overview}
      userEmail={context.auth.session.user.email}
    />
  );
}
