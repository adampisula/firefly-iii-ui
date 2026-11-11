import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentAuth } from "@/lib/auth/service";
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

export default async function ApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const auth = await getCurrentAuth();
  const user = auth.session
    ? { email: auth.session.user.email, role: auth.session.user.role }
    : null;

  return (
    <AppShell user={user} backendPublicUrl={backendPublicUrlOrNull()}>
      {children}
    </AppShell>
  );
}
