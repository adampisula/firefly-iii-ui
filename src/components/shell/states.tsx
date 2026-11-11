import type { ReactNode } from "react";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="panel" role="status" aria-live="polite">
      <p className="eyebrow">Working</p>
      <p>{label}...</p>
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function ErrorState({
  title = "Something went wrong",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel" role="alert">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function PermissionState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Permission required</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
