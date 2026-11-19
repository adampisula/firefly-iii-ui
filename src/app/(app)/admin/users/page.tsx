import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import { listConfig, listUsers } from "@/features/administration-users/service";
import {
  ConfigForm,
  DeleteUser,
  UserForm,
} from "@/features/administration-users/user-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Users</p>
          <h1>Connect to manage users</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="User administration is blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let users;
  let config: { key: string; value: string }[] = [];
  try {
    users = await listUsers(context.client);
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.status === 401 || error.status === 403)
    )
      return (
        <div className="page-stack">
          <PermissionState title="Owner role required">
            <p>
              The backend rejected the user/configuration request for the
              current non-owner session. Nothing is simulated or cached.
            </p>
            <Link className="text-link" href="/security">
              Native profile/security
            </Link>
          </PermissionState>
        </div>
      );
    return (
      <ErrorState level={1} title="Users could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  try {
    config = await listConfig(context.client);
  } catch {
    config = [];
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Owner administration"
        title="Users, roles and configuration"
        lede="Owner-only user and system configuration controls. Invitation emails and manual update checks have no API and remain residual."
      />
      <section className="panel">
        <h2>Users</h2>
        {users.length === 0 ? (
          <p className="muted-note">No users returned.</p>
        ) : (
          <div className="page-stack">
            {users.map((user) => (
              <div className="panel" key={user.id}>
                <h3>{user.email}</h3>
                <p>
                  {user.role}
                  {user.blocked ? " · blocked" : ""}
                </p>
                <UserForm user={user} />
                <DeleteUser user={user} />
              </div>
            ))}
          </div>
        )}
        <h3>Create user</h3>
        <UserForm />
      </section>
      <section className="panel">
        <h2>System configuration</h2>
        {config.length === 0 ? (
          <p className="muted-note">
            Configuration keys are unavailable or empty.
          </p>
        ) : (
          <dl className="detail-list">
            {config.slice(0, 50).map((item) => (
              <div key={item.key}>
                <dt>{item.key}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <ConfigForm />
      </section>
    </div>
  );
}
