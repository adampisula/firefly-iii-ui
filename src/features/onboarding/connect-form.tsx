"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorSummary, TextField } from "@/components/ui/primitives";

export function ConnectForm({
  backendPublicUrl,
}: {
  backendPublicUrl: string | null;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function connect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setWorking(true);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pat: token }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "The token could not be verified.");
        return;
      }
      setToken("");
      router.refresh();
    } catch {
      setError("The frontend could not reach its own connection handler.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={connect}>
      <p>
        Connect your own Firefly III account with a personal access token. The
        token is kept server-side in an encrypted, HttpOnly session cookie and
        is never written to browser storage or the client bundle.
      </p>
      {error ? <ErrorSummary errors={[{ id: "pat", message: error }]} /> : null}
      <TextField
        id="pat"
        label="Personal access token"
        type="text"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        required
        autoComplete="off"
        hint="Create a token in your Firefly profile. It is sent only to this frontend's server handler."
      />
      <div className="button-row">
        <Button type="submit" disabled={working || token.trim().length === 0}>
          {working ? "Verifying..." : "Connect account"}
        </Button>
        {backendPublicUrl ? (
          <a
            className="text-link"
            href={`${backendPublicUrl}/profile/oauth`}
            rel="noreferrer"
          >
            Create a token in the native Firefly profile
          </a>
        ) : (
          <span className="muted-note">
            Native token links require BACKEND_PUBLIC_URL.
          </span>
        )}
      </div>
      <p className="muted-note">
        Native login, registration, password reset, MFA and profile security
        stay on your Firefly backend and use a separate backend session.
      </p>
    </form>
  );
}
