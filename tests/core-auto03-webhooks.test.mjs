import assert from "node:assert/strict";
import test from "node:test";
import {
  mapAttempts,
  mapMessages,
  mapWebhooks,
} from "../src/features/webhooks/service.ts";

test("webhook mapping preserves secret, triggers and delivery metadata", () => {
  const hooks = mapWebhooks({
    data: [
      {
        id: "1",
        attributes: {
          title: "Hook",
          url: "https://example.test",
          secret: "s",
          active: true,
          triggers: ["STORE_TRANSACTION"],
          responses: ["TRANSACTIONS"],
          deliveries: ["JSON"],
        },
      },
    ],
  });
  assert.equal(hooks[0].secret, "s");
  assert.deepEqual(hooks[0].triggers, ["STORE_TRANSACTION"]);
  assert.equal(hooks[0].deliveries[0], "JSON");
});

test("message and attempt mapping ignore malformed rows", () => {
  assert.deepEqual(
    mapMessages({
      data: [
        { id: "2", attributes: { sent: true, created_at: "2026-01-01" } },
        { attributes: {} },
      ],
    }),
    [{ id: "2", sent: true, created: "2026-01-01", updated: null }],
  );
  assert.deepEqual(
    mapAttempts({
      data: [{ id: "3", attributes: { status_code: 200, response: "ok" } }],
    })[0].statusCode,
    200,
  );
});
