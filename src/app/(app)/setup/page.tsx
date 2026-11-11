import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupForm } from "@/features/onboarding/setup-form";
import { loadOnboardingState } from "@/features/onboarding/service";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ErrorState } from "@/components/shell/states";
import { getServerEnvironment } from "@/lib/server-env";

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

export default async function SetupPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context) redirect("/");

  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState title="Financial setup is blocked">
        <p>
          This session could not verify Firefly III 6.7.9. Reconnect after
          checking the backend version. Native identity and help links remain
          available.
        </p>
        <Link className="text-link" href="/">
          Return to connection
        </Link>
      </ErrorState>
    );
  }

  let state;
  try {
    state = await loadOnboardingState(context.client);
  } catch {
    return (
      <ErrorState title="Setup details could not be loaded">
        <p>
          Firefly did not return the currencies and accounts needed for setup.
          Check the connection and reload.
        </p>
      </ErrorState>
    );
  }

  if (state.configured) redirect("/");

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">First-run setup</p>
        <h1>Create your starting accounts</h1>
        <p className="lede">
          Choose your primary currency and name three asset accounts. This uses
          supported Firefly API operations and never simulates balances.
        </p>
        <SetupForm
          currencies={state.currencies}
          backendPublicUrl={backendPublicUrlOrNull()}
        />
      </section>
      <section className="panel">
        <h2>What happens next</h2>
        <p>
          Firefly enables the chosen currency and sets it as primary for your
          administration. The three asset accounts are created with zero opening
          balances and become the default accounts on your overview.
        </p>
        <p className="muted-note">
          You can rename accounts and add more later. Statements, transactions
          and reconciliation require the financial workflow tasks and are not
          fabricated here.
        </p>
      </section>
    </div>
  );
}
