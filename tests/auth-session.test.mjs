import assert from "node:assert/strict";
import test from "node:test";
import { decryptSession, encryptSession } from "../src/lib/auth/session.ts";

test("encryptSession and decryptSession round-trip correctly", () => {
  const sessionData = {
    identity: "session-123",
    user: {
      id: "1",
      email: "user@example.com",
      role: "owner",
      blocked: false,
    },
    authType: "pat",
    patToken: "sample-token-abc",
    createdAt: 1700000000000,
  };

  const encrypted = encryptSession(sessionData);
  assert.equal(typeof encrypted, "string");
  assert.notEqual(encrypted, JSON.stringify(sessionData));
  assert.ok(!encrypted.includes("user@example.com"));
  assert.ok(!encrypted.includes("sample-token-abc"));

  const decrypted = decryptSession(encrypted);
  assert.deepEqual(decrypted, sessionData);
});

test("decryptSession safely returns null on malformed or tampered token", () => {
  assert.equal(decryptSession(""), null);
  assert.equal(decryptSession("short"), null);
  assert.equal(decryptSession("invalid-base64-payload-not-real"), null);

  const valid = encryptSession({
    identity: "id",
    user: { id: "1", email: "a@b.com", role: null, blocked: false },
    authType: "pat",
    createdAt: Date.now(),
  });
  // Tamper with the ciphertext
  const tampered = valid.slice(0, -4) + "XXXX";
  assert.equal(decryptSession(tampered), null);
});
