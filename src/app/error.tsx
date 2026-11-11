"use client";

import { englishMessages } from "@/lib/i18n/messages";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page" role="alert">
      <h1>{englishMessages.loadFailure}</h1>
      <p>{englishMessages.loadFailureDescription}</p>
      <button onClick={reset} type="button">
        {englishMessages.retry}
      </button>
    </main>
  );
}
