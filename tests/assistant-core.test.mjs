import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

process.env.FRONTEND_PUBLIC_URL = "http://localhost:3000";
process.env.BACKEND_PUBLIC_URL = "http://localhost:8081";
process.env.BACKEND_INTERNAL_API_URL = "http://firefly:8080/api/v1";
process.env.SESSION_SECRET = "assistant-test-secret-that-is-long-enough";
process.env.FRONTEND_DATA_DIR = await mkdtemp(
  path.join(tmpdir(), "firefly-assistant-"),
);

const { getOwnerKey } = await import("../src/lib/user-data/owner-key.ts");
const { getAssistantDb, resetAssistantDbForTests } =
  await import("../src/lib/assistant/db.ts");
const { publicAssistantSettings, validateProviderBaseUrl } =
  await import("../src/lib/assistant/provider-config.ts");
const {
  appendMessage,
  createConversation,
  deleteConversation,
  getConversation,
  getProviderApiKey,
  getProviderSettings,
  listConversations,
  saveProviderSettings,
} = await import("../src/lib/assistant/store.ts");
const {
  isBlockedOperation,
  isRiskyOperation,
  availableTools,
  prepareToolCall,
} = await import("../src/lib/assistant/tools.ts");
const { decideApproval, requestApproval } =
  await import("../src/lib/assistant/approval.ts");
const { adjustPiggyAmount } = await import("../src/lib/assistant/piggy.ts");

const ownerOne = getOwnerKey("1");
const ownerTwo = getOwnerKey("2");

test("provider settings are per user and encrypt the API key", () => {
  const saved = saveProviderSettings(
    ownerOne,
    {
      baseUrl: "https://openrouter.ai/api/v1",
      model: "deepseek/deepseek-v4.1-flash-1017",
      reasoningEffort: "high",
      writeToolsEnabled: true,
    },
    "sk-or-v1-test-secret-1234",
  );
  assert.equal(saved.model, "deepseek/deepseek-v4.1-flash-1017");
  assert.equal(getProviderApiKey(ownerOne, saved), "sk-or-v1-test-secret-1234");
  assert.equal(getProviderSettings(ownerTwo), null);

  const raw = getAssistantDb()
    .prepare(
      "SELECT api_key_ciphertext FROM assistant_user_settings WHERE owner_key = ?",
    )
    .get(ownerOne);
  assert.ok(raw);
  assert.equal(
    Buffer.from(raw.api_key_ciphertext).toString("utf8").includes("sk-or-v1"),
    false,
  );
  const publicSettings = publicAssistantSettings(saved);
  assert.equal(publicSettings.configured, true);
  assert.equal(publicSettings.apiKeyHint, "••••1234");
  assert.equal(JSON.stringify(publicSettings).includes("sk-or-v1"), false);
});

test("provider URLs reject public http and metadata addresses", () => {
  assert.equal(
    validateProviderBaseUrl("https://openrouter.ai/api/v1"),
    "https://openrouter.ai/api/v1",
  );
  assert.equal(
    validateProviderBaseUrl("http://192.168.1.10:11434/v1"),
    "http://192.168.1.10:11434/v1",
  );
  assert.throws(
    () => validateProviderBaseUrl("http://example.com/v1"),
    /https/i,
  );
  assert.throws(
    () => validateProviderBaseUrl("https://169.254.169.254/latest"),
    /link-local/i,
  );
});

test("conversations are owner-scoped and cascade messages", () => {
  const conversation = createConversation(
    ownerOne,
    "test-model",
    "medium",
    "Test conversation",
  );
  appendMessage(ownerOne, conversation.id, "user", "Where is my money going?");
  appendMessage(ownerOne, conversation.id, "assistant", "Here is the summary.");

  const loaded = getConversation(ownerOne, conversation.id);
  assert.equal(loaded?.messages.length, 2);
  assert.equal(getConversation(ownerTwo, conversation.id), null);
  assert.equal(listConversations(ownerOne, 30).length, 1);
  assert.equal(listConversations(ownerTwo, 30).length, 0);

  assert.equal(deleteConversation(ownerOne, conversation.id), true);
  assert.equal(getConversation(ownerOne, conversation.id), null);
});

test("tool policy blocks destructive operations and gates writes", () => {
  assert.equal(isBlockedOperation("data.destroy"), true);
  assert.equal(isBlockedOperation("configuration.index"), true);
  assert.equal(isBlockedOperation("accounts.index"), false);
  assert.equal(isRiskyOperation("transactions.delete"), true);
  assert.equal(isRiskyOperation("accounts.index"), false);

  const readOnly = availableTools({
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "test",
    reasoningEffort: "medium",
    temperature: 0.2,
    maxOutputTokens: 2048,
    writeToolsEnabled: false,
    riskyWritesEnabled: false,
    historyRetentionDays: 30,
  });
  assert.equal(
    readOnly.some((tool) => tool.kind === "write"),
    false,
  );
  assert.equal(
    readOnly.some((tool) => tool.name === "firefly_create_piggy_bank"),
    false,
  );

  const writes = availableTools({
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "test",
    reasoningEffort: "medium",
    temperature: 0.2,
    maxOutputTokens: 2048,
    writeToolsEnabled: true,
    riskyWritesEnabled: false,
    historyRetentionDays: 30,
  });
  assert.equal(
    writes.some((tool) => tool.name === "firefly_create_piggy_bank"),
    true,
  );
  assert.equal(
    writes.some((tool) => tool.name === "firefly_request_write"),
    true,
  );
});

test("piggy amounts use exact decimal arithmetic", () => {
  assert.equal(adjustPiggyAmount("500.00", "25.50", 2, "add"), "525.50");
  assert.equal(adjustPiggyAmount("500.00", "25.50", 2, "remove"), "474.50");
  assert.equal(adjustPiggyAmount("0.000", "0.001", 3, "add"), "0.001");
  assert.throws(
    () => adjustPiggyAmount("10.00", "10.01", 2, "remove"),
    /enough reserved/i,
  );
  assert.throws(() => adjustPiggyAmount("10.00", "0", 2, "add"), /positive/i);
});

test("piggy add preserves other account allocations and exact amounts", async () => {
  const client = {
    async request(operation) {
      assert.equal(operation, "piggy-banks.show");
      return {
        data: {
          data: {
            id: "piggy-1",
            attributes: {
              name: "Holiday",
              target_amount: "1000.00",
              start_date: "2026-01-01",
              accounts: [
                {
                  id: "account-1",
                  name: "Cash",
                  current_amount: "100.00",
                  currency_code: "EUR",
                  currency_decimal_places: 2,
                },
                {
                  id: "account-2",
                  name: "Bank",
                  current_amount: "50.00",
                  currency_code: "EUR",
                  currency_decimal_places: 2,
                },
              ],
            },
          },
        },
      };
    },
  };
  const prepared = await prepareToolCall(
    "firefly_add_piggy_money",
    { piggyBankId: "piggy-1", accountId: "account-1", amount: "25.50" },
    {
      client,
      settings: {
        provider: "openrouter",
        baseUrl: "https://openrouter.ai/api/v1",
        model: "test",
        reasoningEffort: "medium",
        temperature: 0.2,
        maxOutputTokens: 2048,
        writeToolsEnabled: true,
        riskyWritesEnabled: false,
        historyRetentionDays: 30,
      },
    },
  );
  assert.equal(prepared.kind, "write");
  assert.equal(prepared.write.operation, "piggy-banks.update");
  assert.deepEqual(prepared.write.body.accounts, [
    { account_id: "account-1", current_amount: "125.50" },
    { account_id: "account-2", current_amount: "50.00" },
  ]);
});

test("approval decisions are one-time and owner-bound", async () => {
  const conversation = createConversation(ownerOne, "model", "low", "Approval");
  const pending = requestApproval(ownerOne, conversation.id);
  assert.equal(
    decideApproval(ownerTwo, conversation.id, pending.approvalId, true),
    null,
  );
  assert.equal(
    decideApproval(ownerOne, conversation.id, pending.approvalId, true),
    "approved",
  );
  assert.equal(
    decideApproval(ownerOne, conversation.id, pending.approvalId, false),
    null,
  );
  assert.equal(await pending.decision, "approved");
});

test.after(async () => {
  resetAssistantDbForTests();
  await rm(process.env.FRONTEND_DATA_DIR, { recursive: true, force: true });
});
