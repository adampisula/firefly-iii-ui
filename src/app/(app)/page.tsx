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
import { ErrorState } from "@/components/shell/states";
import { OverviewDashboard } from "@/features/overview/overview-dashboard";

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
          <h1 style={{ fontSize: "clamp(26px, 2.5vw, 36px)", margin: "8px 0 14px", letterSpacing: "-0.025em" }}>
            Your finances, under your control.
          </h1>
          <p className="lede" style={{ fontSize: "15px", color: "var(--muted)", maxWidth: "56ch", marginBottom: "18px" }}>
            Firefly runs against your own Firefly III 6.7.9 installation.
            Connect with a personal access token to start safe, API-backed
            setup.
          </p>
          <ConnectForm backendPublicUrl={backendPublicUrl} />
        </section>

        <OverviewDashboard
          userName="Ines"
          balanceTotal="$29,253.82"
        />

        <section className="panel">
          <div className="chead">
            <div className="chead__text">
              <h2>What this frontend does not do</h2>
              <p>
                It does not execute bank payments, issue cards or share household
                finances. Identity management stays in the native Firefly backend.
              </p>
            </div>
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

  const userEmail = context.auth.session.user.email;
  const userName = userEmail ? userEmail.split("@")[0] : "Ines";
  const capitalName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <OverviewDashboard
      userName={capitalName}
      balanceTotal="$29,253.82"
    />
  );
}
