"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button, Status } from "@/components/ui/primitives";
import { REASONING_EFFORTS } from "@/lib/assistant/config";
import type {
  AssistantApprovalView,
  AssistantConversationSummaryView,
  AssistantMessageView,
  AssistantSettingsView,
  AssistantToolEventView,
} from "./types";
import styles from "./assistant.module.css";

interface StreamEvent {
  type: "meta" | "status" | "tool" | "approval" | "delta" | "done" | "error";
  message?: string;
  text?: string;
  conversationId?: string;
  model?: string;
  name?: string;
  status?: string;
  summary?: string;
  approvalId?: string;
  operation?: string;
  method?: string;
  path?: string;
  query?: Record<string, string | string[]>;
  body?: unknown;
}

const SUGGESTIONS = [
  "Where did I spend the most this month?",
  "How are my budgets doing right now?",
  "Compare my income and expenses this year.",
  "Can I afford a 2,000 SEK purchase next month?",
];

function parseEvents(buffer: string): { events: StreamEvent[]; rest: string } {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events: StreamEvent[] = [];
  for (const block of blocks) {
    const line = block
      .split("\n")
      .find((candidate) => candidate.startsWith("data: "));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as StreamEvent);
    } catch {
      // Ignore a malformed provider frame.
    }
  }
  return { events, rest };
}

export function AssistantChat({
  initialSettings,
  initialConversations,
}: {
  initialSettings: AssistantSettingsView;
  initialConversations: AssistantConversationSummaryView[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [reasoning, setReasoning] = useState(initialSettings.reasoningEffort);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approval, setApproval] = useState<AssistantApprovalView | null>(null);
  const [toolEvents, setToolEvents] = useState<AssistantToolEventView[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const localMessageSeq = useRef(0);
  const assistantTextRef = useRef("");

  const refreshConversations = async () => {
    const response = await fetch("/api/assistant/conversations", {
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      conversations?: AssistantConversationSummaryView[];
    };
    if (payload.conversations) setConversations(payload.conversations);
  };

  const loadConversation = async (id: string) => {
    setError(null);
    setApproval(null);
    setToolEvents([]);
    const response = await fetch(`/api/assistant/conversations/${id}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as {
      conversation?: {
        id: string;
        messages: AssistantMessageView[];
      };
      error?: string;
    };
    if (!response.ok || !payload.conversation) {
      setError(payload.error ?? "Conversation could not be loaded.");
      return;
    }
    setActiveId(id);
    setMessages(payload.conversation.messages);
  };

  const newChat = () => {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setDraft("");
    setError(null);
    setApproval(null);
    setToolEvents([]);
    setStatus(null);
  };

  const deleteConversation = async (id: string) => {
    if (!window.confirm("Delete this conversation?")) return;
    const response = await fetch(`/api/assistant/conversations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("Conversation could not be deleted.");
      return;
    }
    if (activeId === id) newChat();
    setConversations((current) => current.filter((item) => item.id !== id));
  };

  const send = async (message: string) => {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setStatus("Sending...");
    setApproval(null);
    setToolEvents([]);
    setDraft("");
    let conversationId = activeId;
    const localUser: AssistantMessageView = {
      id: `local-user-${++localMessageSeq.current}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      toolEvents: [],
    };
    setMessages((current) => [...current, localUser]);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
          reasoningEffort: reasoning,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "The assistant request failed.");
      }
      if (!response.body) throw new Error("The assistant returned no stream.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      assistantTextRef.current = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseEvents(buffer);
        buffer = parsed.rest;
        for (const event of parsed.events) {
          if (event.type === "meta" && event.conversationId) {
            conversationId = event.conversationId;
            setActiveId(event.conversationId);
          } else if (event.type === "status" && event.message) {
            setStatus(event.message);
          } else if (event.type === "tool" && event.name) {
            setToolEvents((current) => [
              ...current,
              {
                name: event.name!,
                status:
                  event.status === "approved"
                    ? "approved"
                    : event.status === "denied"
                      ? "denied"
                      : event.status === "error"
                        ? "error"
                        : "read",
                summary: event.summary,
              },
            ]);
          } else if (event.type === "approval" && event.approvalId) {
            setApproval({
              approvalId: event.approvalId,
              operation: event.operation ?? "",
              method: event.method ?? "",
              path: event.path ?? "",
              query: event.query,
              body: event.body,
              summary: event.summary ?? "Write operation",
            });
            setStatus("Waiting for approval...");
          } else if (event.type === "delta" && event.text) {
            assistantTextRef.current += event.text;
            setMessages((current) => {
              const withoutDraft = current.filter(
                (item) => item.id !== "local-assistant",
              );
              return [
                ...withoutDraft,
                {
                  id: "local-assistant",
                  role: "assistant",
                  content: assistantTextRef.current,
                  createdAt: new Date().toISOString(),
                  toolEvents: [],
                },
              ];
            });
          } else if (event.type === "done") {
            setStatus(null);
            setApproval(null);
          } else if (event.type === "error") {
            setError(event.message ?? "The assistant request failed.");
            setApproval(null);
          }
        }
      }
      if (conversationId) {
        await loadConversation(conversationId);
      }
      await refreshConversations();
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(
          caught instanceof Error
            ? caught.message
            : "The assistant request failed.",
        );
      }
    } finally {
      setBusy(false);
      setStatus(null);
      abortRef.current = null;
    }
  };

  const decide = async (approve: boolean) => {
    if (!approval || !activeId) return;
    const response = await fetch("/api/assistant/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approvalId: approval.approvalId,
        conversationId: activeId,
        decision: approve ? "approve" : "deny",
      }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(payload?.error ?? "Approval could not be recorded.");
      return;
    }
    setApproval(null);
    setStatus(approve ? "Applying approved action..." : "Skipping action...");
  };

  return (
    <div className={styles.assistantLayout}>
      <aside className={styles.conversationSidebar} aria-label="Conversations">
        <div className={styles.sidebarHeader}>
          <strong>Conversations</strong>
          <Button type="button" tone="quiet" onClick={newChat}>
            New chat
          </Button>
        </div>
        {conversations.length === 0 ? (
          <p className="muted-note">No saved conversations yet.</p>
        ) : (
          <ul className={styles.conversationList}>
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  className={styles.conversationButton}
                  data-active={conversation.id === activeId || undefined}
                  onClick={() => void loadConversation(conversation.id)}
                >
                  <span>{conversation.title}</span>
                  <small>{conversation.messageCount} messages</small>
                </button>
                <Button
                  type="button"
                  tone="quiet"
                  className={styles.deleteConversation}
                  aria-label={`Delete ${conversation.title}`}
                  onClick={() => void deleteConversation(conversation.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className={styles.sidebarNote}>
          History is stored in SQLite for this Firefly user. It is plaintext on
          the server volume and expires after{" "}
          {initialSettings.historyRetentionDays} days.
        </p>
      </aside>

      <section className={styles.chatPanel} aria-label="Assistant chat">
        <div className={styles.chatHeader}>
          <div>
            <p className={styles.chatEyebrow}>Firefly Assistant</p>
            <h2>{initialSettings.model}</h2>
          </div>
          <div className={styles.chatBadges}>
            <Status
              kind={initialSettings.writeToolsEnabled ? "warning" : "neutral"}
            >
              {initialSettings.writeToolsEnabled
                ? "Writes require approval"
                : "Read-only"}
            </Status>
            <Link className="text-link" href="/assistant/settings">
              Assistant settings
            </Link>
          </div>
        </div>

        <div className={styles.transcript}>
          {messages.length === 0 ? (
            <div className={styles.welcome}>
              <h3>Ask about your actual Firefly data</h3>
              <p>
                The assistant can read accounts, transactions, budgets, bills,
                insights and savings goals. Writes are only applied after you
                approve the exact operation.
              </p>
              <div className={styles.suggestions}>
                {[
                  ...SUGGESTIONS,
                  ...(initialSettings.writeToolsEnabled
                    ? ["Create a savings goal for a holiday and add 500 SEK."]
                    : []),
                ].map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    className={styles.suggestion}
                    onClick={() => void send(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              {!initialSettings.writeToolsEnabled ? (
                <p className="muted-note">
                  Write tools are off. Enable them in Assistant settings to let
                  the assistant create savings goals or move reserved money;
                  every write still needs approval.
                </p>
              ) : null}
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={styles.message}
                data-role={message.role}
              >
                <small>{message.role === "user" ? "You" : "Assistant"}</small>
                <p>{message.content}</p>
                {message.toolEvents.length > 0 ? (
                  <ul className={styles.toolList}>
                    {message.toolEvents.map((event, index) => (
                      <li key={`${event.name}-${index}`}>
                        {event.name}: {event.status}
                        {event.summary ? ` — ${event.summary}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))
          )}

          {toolEvents.length > 0 ? (
            <div className={styles.liveTools} aria-live="polite">
              {toolEvents.map((event, index) => (
                <span key={`${event.name}-${index}`}>
                  {event.name}: {event.status}
                </span>
              ))}
            </div>
          ) : null}

          {approval ? (
            <div className={styles.approvalCard} role="alert">
              <h3>Approval required</h3>
              <p>{approval.summary}</p>
              <dl>
                <dt>Operation</dt>
                <dd>{approval.operation}</dd>
                <dt>Method / path</dt>
                <dd>
                  {approval.method} {approval.path}
                </dd>
              </dl>
              <details>
                <summary>Exact request</summary>
                <pre>
                  {JSON.stringify(
                    { query: approval.query, body: approval.body },
                    null,
                    2,
                  )}
                </pre>
              </details>
              <div className="button-row">
                <Button type="button" onClick={() => void decide(true)}>
                  Approve and apply
                </Button>
                <Button
                  type="button"
                  tone="quiet"
                  onClick={() => void decide(false)}
                >
                  Deny
                </Button>
              </div>
              <p className="muted-note">
                No Firefly data is changed until you approve this exact request.
              </p>
            </div>
          ) : null}

          {status ? <p className={styles.statusLine}>{status}</p> : null}
          {error ? <Status kind="error">{error}</Status> : null}
        </div>

        <form
          className={styles.composer}
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <label className="visually-hidden" htmlFor="assistant-message">
            Message
          </label>
          <textarea
            id="assistant-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about spending, budgets, accounts, savings goals..."
            rows={3}
            maxLength={8000}
            disabled={busy}
          />
          <div className={styles.composerFooter}>
            <label className={styles.reasoningLabel}>
              Reasoning
              <select
                className="select"
                value={reasoning}
                onChange={(event) =>
                  setReasoning(
                    event.target
                      .value as AssistantSettingsView["reasoningEffort"],
                  )
                }
                disabled={busy}
              >
                {REASONING_EFFORTS.map((effort) => (
                  <option key={effort} value={effort}>
                    {effort}
                  </option>
                ))}
              </select>
            </label>
            {busy ? (
              <Button
                type="button"
                tone="quiet"
                onClick={() => {
                  abortRef.current?.abort();
                  setStatus("Stopped.");
                }}
              >
                Stop
              </Button>
            ) : (
              <Button type="submit" disabled={!draft.trim()}>
                Send
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
