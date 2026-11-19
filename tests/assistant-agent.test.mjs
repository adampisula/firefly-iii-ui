import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

process.env.FRONTEND_PUBLIC_URL = "http://localhost:3000";
process.env.BACKEND_PUBLIC_URL = "http://localhost:8081";
process.env.BACKEND_INTERNAL_API_URL = "http://firefly:8080/api/v1";
process.env.SESSION_SECRET = "assistant-agent-test-secret-long-enough";
process.env.FRONTEND_DATA_DIR = await mkdtemp(
  path.join(tmpdir(), "firefly-assistant-agent-"),
);

const { getOwnerKey } = await import("../src/lib/user-data/owner-key.ts");
const { runAssistant } = await import("../src/lib/assistant/agent.ts");
const { appendMessage, createConversation, getConversation } =
  await import("../src/lib/assistant/store.ts");
const { decideApproval } = await import("../src/lib/assistant/approval.ts");
const { resetAssistantDbForTests } = await import("../src/lib/assistant/db.ts");

const ownerKey = getOwnerKey("agent-user");
const settings = {
  provider: "openrouter",
  baseUrl: "https://provider.example.test/api/v1",
  model: "test-model",
  reasoningEffort: "medium",
  temperature: 0.2,
  maxOutputTokens: 2048,
  writeToolsEnabled: false,
  riskyWritesEnabled: false,
  historyRetentionDays: 30,
};

function providerResponse(message, finishReason = "stop") {
  return new Response(
    JSON.stringify({
      choices: [{ message, finish_reason: finishReason }],
      usage: { total_tokens: 10 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function fakeClient(writes) {
  return {
    async request(operation, options) {
      if (operation === "summary.basic") {
        return {
          data: {
            data: {
              "balance-in-EUR": {
                monetary_value: "100.00",
                currency_code: "EUR",
                currency_decimal_places: 2,
              },
            },
          },
        };
      }
      if (operation === "piggy-banks.store") {
        writes.push(options.body);
        return { data: { data: { id: "42" } } };
      }
      throw new Error(`Unexpected operation ${operation}`);
    },
  };
}

test("agent executes a read tool and returns the final answer", async () => {
  const conversation = createConversation(ownerKey, "test", "medium", "Read");
  appendMessage(ownerKey, conversation.id, "user", "What is my balance?");
  let call = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    call += 1;
    if (call === 1) {
      return providerResponse(
        {
          content: null,
          tool_calls: [
            {
              id: "call-1",
              type: "function",
              function: {
                name: "firefly_summary",
                arguments: JSON.stringify({
                  start: "2026-01-01",
                  end: "2026-01-31",
                }),
              },
            },
          ],
        },
        "tool_calls",
      );
    }
    return providerResponse({ content: "Your balance is 100.00 EUR." });
  };
  const events = [];
  try {
    await runAssistant(
      {
        ownerKey,
        conversationId: conversation.id,
        settings,
        apiKey: "test-key",
        client: fakeClient([]),
      },
      (event) => events.push(event),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(
    events.some((event) => event.type === "tool"),
    true,
  );
  assert.equal(
    events.some((event) => event.type === "delta"),
    true,
  );
  assert.equal(
    events.some((event) => event.type === "done"),
    true,
  );
  const saved = getConversation(ownerKey, conversation.id);
  assert.equal(saved?.messages.at(-1)?.content, "Your balance is 100.00 EUR.");
});

test("agent pauses for approval before writing a piggy bank", async () => {
  const conversation = createConversation(ownerKey, "test", "medium", "Write");
  appendMessage(ownerKey, conversation.id, "user", "Create a savings goal.");
  let call = 0;
  const writes = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    call += 1;
    if (call === 1) {
      return providerResponse(
        {
          content: null,
          tool_calls: [
            {
              id: "call-write",
              type: "function",
              function: {
                name: "firefly_create_piggy_bank",
                arguments: JSON.stringify({
                  name: "Holiday",
                  targetAmount: "1000.00",
                  currencyCode: "EUR",
                  accountId: "1",
                  startDate: "2026-01-01",
                }),
              },
            },
          ],
        },
        "tool_calls",
      );
    }
    return providerResponse({ content: "Created the Holiday savings goal." });
  };
  let resolveApproval;
  const approvalSeen = new Promise((resolve) => {
    resolveApproval = resolve;
  });
  try {
    const run = runAssistant(
      {
        ownerKey,
        conversationId: conversation.id,
        settings: { ...settings, writeToolsEnabled: true },
        apiKey: "test-key",
        client: fakeClient(writes),
      },
      (event) => {
        if (event.type === "approval") resolveApproval(event.approvalId);
      },
    );
    const approvalId = await approvalSeen;
    assert.equal(writes.length, 0);
    assert.equal(
      decideApproval(ownerKey, conversation.id, approvalId, true),
      "approved",
    );
    await run;
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(writes.length, 1);
  assert.equal(writes[0].name, "Holiday");
  assert.equal(writes[0].accounts[0].account_id, "1");
});

test.after(async () => {
  resetAssistantDbForTests();
  await rm(process.env.FRONTEND_DATA_DIR, { recursive: true, force: true });
});
