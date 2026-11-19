import { type NextRequest } from "next/server";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  ASSISTANT_DEFAULTS,
  assistantEnabled,
  isReasoningEffort,
} from "@/lib/assistant/config";
import {
  allowAssistantRequest,
  currentAssistantUser,
  sameOrigin,
} from "@/lib/assistant/http";
import {
  getProviderApiKey,
  getProviderSettings,
  appendMessage,
  createConversation,
  getConversation,
  updateConversationTitle,
} from "@/lib/assistant/store";
import { runAssistant, type AssistantEvent } from "@/lib/assistant/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const activeConversations = new Set<string>();

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return jsonError("Invalid request origin.", 403);
  if (!assistantEnabled())
    return jsonError("The assistant is disabled by AI_ASSISTANT_ENABLED.", 404);
  const user = await currentAssistantUser();
  if (!user) return jsonError("Connect an account first.", 401);
  if (!allowAssistantRequest(user.ownerKey))
    return jsonError("Assistant rate limit reached. Try again later.", 429);

  const body = (await request.json().catch(() => null)) as {
    message?: unknown;
    conversationId?: unknown;
    reasoningEffort?: unknown;
  } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return jsonError("Enter a message.", 400);
  if (message.length > 8000)
    return jsonError("Keep messages under 8,000 characters.", 400);
  const reasoningEffort =
    body?.reasoningEffort === undefined ? undefined : body.reasoningEffort;
  if (reasoningEffort !== undefined && !isReasoningEffort(reasoningEffort))
    return jsonError("Unsupported reasoning effort.", 400);

  const settings = getProviderSettings(user.ownerKey);
  if (!settings)
    return jsonError(
      "Configure an AI provider in Assistant settings first.",
      400,
    );
  const apiKey = getProviderApiKey(user.ownerKey, settings);
  if (!apiKey)
    return jsonError(
      "The saved provider key cannot be read. Re-enter it in Assistant settings.",
      400,
    );

  const sessionContext = await getSessionApiContext();
  if (!sessionContext)
    return jsonError("Connect a Firefly account first.", 401);
  if (sessionContext.compatibility.status !== "verified")
    return jsonError(
      "Financial access is blocked until the Firefly version is verified.",
      403,
    );

  let conversationId =
    typeof body?.conversationId === "string" ? body.conversationId : null;
  if (conversationId) {
    const existing = getConversation(user.ownerKey, conversationId);
    if (!existing) return jsonError("Conversation not found.", 404);
  } else {
    const created = createConversation(
      user.ownerKey,
      settings.model,
      reasoningEffort ?? settings.reasoningEffort,
      message.slice(0, 80),
    );
    conversationId = created.id;
  }

  if (activeConversations.has(conversationId))
    return jsonError("This conversation already has an active response.", 409);

  const conversation = getConversation(user.ownerKey, conversationId);
  if (!conversation) return jsonError("Conversation not found.", 404);
  if (conversation.messages.length === 0) {
    updateConversationTitle(
      user.ownerKey,
      conversationId,
      message.slice(0, 80),
    );
  }
  appendMessage(user.ownerKey, conversationId, "user", message);

  activeConversations.add(conversationId);
  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: AssistantEvent) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };
      const close = () => {
        if (closed) return;
        closed = true;
        activeConversations.delete(conversationId!);
        try {
          controller.close();
        } catch {
          // The client may already have closed the stream.
        }
      };
      request.signal.addEventListener("abort", close, { once: true });
      runAssistant(
        {
          ownerKey: user.ownerKey,
          conversationId,
          settings: {
            ...settings,
            reasoningEffort: reasoningEffort ?? settings.reasoningEffort,
          },
          apiKey,
          client: sessionContext.client,
          signal: request.signal,
        },
        send,
      )
        .catch((error: unknown) => {
          send({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "The assistant request failed.",
          });
        })
        .finally(close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export const DEFAULT_PROVIDER_MODEL = ASSISTANT_DEFAULTS.model;
