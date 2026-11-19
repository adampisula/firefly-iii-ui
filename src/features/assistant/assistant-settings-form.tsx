"use client";

import { useState } from "react";
import type { AssistantSettingsView } from "./types";
import { REASONING_EFFORTS } from "@/lib/assistant/config";
import { Button, Status } from "@/components/ui/primitives";
import styles from "./assistant.module.css";

interface ModelOption {
  id: string;
  name: string;
  supportsTools: boolean;
  supportsReasoning: boolean;
}

export function AssistantSettingsForm({
  initial,
}: {
  initial: AssistantSettingsView;
}) {
  const [settings, setSettings] = useState(initial);
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = <Key extends keyof AssistantSettingsView>(
    key: Key,
    value: AssistantSettingsView[Key],
  ) => setSettings((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/assistant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          baseUrl: settings.baseUrl,
          model: settings.model,
          reasoningEffort: settings.reasoningEffort,
          temperature: settings.temperature,
          maxOutputTokens: settings.maxOutputTokens,
          writeToolsEnabled: settings.writeToolsEnabled,
          riskyWritesEnabled: settings.riskyWritesEnabled,
          historyRetentionDays: settings.historyRetentionDays,
          ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        }),
      });
      const payload = (await response.json()) as {
        settings?: AssistantSettingsView;
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error ?? "Settings were not saved.");
      if (payload.settings) setSettings(payload.settings);
      setApiKey("");
      setMessage("Assistant settings saved.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Settings were not saved.",
      );
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/assistant/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: settings.baseUrl,
          model: settings.model,
          ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        }),
      });
      const payload = (await response.json()) as {
        models?: ModelOption[];
        message?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error ?? "Connection test failed.");
      setModels(payload.models ?? []);
      setMessage(payload.message ?? "Provider connection succeeded.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Connection test failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove the saved provider URL, model and API key?"))
      return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/assistant/settings", {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error("Provider configuration was not removed.");
      setSettings({ ...initial, configured: false, apiKeyHint: null });
      setApiKey("");
      setMessage("Provider configuration removed.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not remove configuration.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className={styles.settingsForm}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className={styles.formGrid}>
        <div className="field-group">
          <label className="field-label" htmlFor="assistant-provider">
            Provider
          </label>
          <select
            className="select"
            id="assistant-provider"
            value={settings.provider}
            onChange={(event) => update("provider", event.target.value)}
          >
            <option value="openrouter">OpenRouter</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="assistant-base-url">
            Base URL
          </label>
          <input
            className="select"
            id="assistant-base-url"
            value={settings.baseUrl}
            onChange={(event) => update("baseUrl", event.target.value)}
            placeholder="https://openrouter.ai/api/v1"
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="assistant-model">
            Model
          </label>
          <input
            className="select"
            id="assistant-model"
            value={settings.model}
            onChange={(event) => update("model", event.target.value)}
            list="assistant-model-options"
            required
          />
          <datalist id="assistant-model-options">
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </datalist>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="assistant-api-key">
            API key{" "}
            {settings.configured ? `(saved ${settings.apiKeyHint})` : ""}
          </label>
          <input
            className="select"
            id="assistant-api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={
              settings.configured
                ? "Leave blank to keep the saved key"
                : "Enter API key"
            }
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="assistant-reasoning">
            Default reasoning effort
          </label>
          <select
            className="select"
            id="assistant-reasoning"
            value={settings.reasoningEffort}
            onChange={(event) =>
              update(
                "reasoningEffort",
                event.target.value as AssistantSettingsView["reasoningEffort"],
              )
            }
          >
            {REASONING_EFFORTS.map((effort) => (
              <option key={effort} value={effort}>
                {effort}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="assistant-temperature">
            Temperature
          </label>
          <input
            className="select"
            id="assistant-temperature"
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={settings.temperature}
            onChange={(event) =>
              update("temperature", Number(event.target.value))
            }
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="assistant-max-tokens">
            Max output tokens
          </label>
          <input
            className="select"
            id="assistant-max-tokens"
            type="number"
            min={256}
            max={8192}
            step={128}
            value={settings.maxOutputTokens}
            onChange={(event) =>
              update("maxOutputTokens", Number(event.target.value))
            }
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="assistant-retention">
            History retention (days)
          </label>
          <input
            className="select"
            id="assistant-retention"
            type="number"
            min={1}
            max={365}
            value={settings.historyRetentionDays}
            onChange={(event) =>
              update("historyRetentionDays", Number(event.target.value))
            }
          />
        </div>
      </div>

      <div className={styles.toggleGrid}>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.writeToolsEnabled}
            onChange={(event) =>
              update("writeToolsEnabled", event.target.checked)
            }
          />
          <span>Enable write tools (every write still needs approval)</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.riskyWritesEnabled}
            onChange={(event) =>
              update("riskyWritesEnabled", event.target.checked)
            }
            disabled={!settings.writeToolsEnabled}
          />
          <span>
            Allow risky writes such as transaction rewrites and deletes
          </span>
        </label>
      </div>

      <p className="muted-note">
        The API key is encrypted with a server-side key derived from
        SESSION_SECRET. It is never returned to the browser. Chat history is
        stored in SQLite on the server volume.
      </p>

      {error ? <Status kind="warning">{error}</Status> : null}
      {message ? <Status kind="success">{message}</Status> : null}

      <div className="button-row">
        <Button type="submit" disabled={busy}>
          Save settings
        </Button>
        <Button
          type="button"
          tone="quiet"
          disabled={busy}
          onClick={() => void test()}
        >
          Test connection
        </Button>
        <Button
          type="button"
          tone="quiet"
          disabled={busy}
          onClick={() => void remove()}
        >
          Remove configuration
        </Button>
      </div>
    </form>
  );
}
