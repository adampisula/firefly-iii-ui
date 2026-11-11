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
  level = 2,
}: {
  title?: string;
  children: ReactNode;
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <section className="panel" role="alert">
      <Heading>{title}</Heading>
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
