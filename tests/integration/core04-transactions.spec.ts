import { expect, test, type APIRequestContext } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

async function createAccount(
  request: APIRequestContext,
  headers: Record<string, string>,
  name: string,
  type: "asset" | "expense" | "revenue",
  currency = "EUR",
): Promise<string> {
  const response = await request.post("/api/v1/accounts", {
    headers,
    data: {
      name,
      type,
      ...(type === "asset" ? { account_role: "defaultAsset" } : {}),
      currency_code: currency,
    },
  });
  const body = (await response.json()) as { data?: { id: string } };
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  if (!body.data?.id) throw new Error("No account id");
  return body.data.id;
}

interface GroupResponse {
  data: {
    id: string;
    attributes: {
      transactions: {
        transaction_journal_id: string;
        amount: string;
        description: string;
        foreign_amount: string | null;
        tags: string[];
        notes: string | null;
        internal_reference: string | null;
      }[];
    };
  };
}

test.describe("CORE-04 safe transaction editing", () => {
  test("creates all types, preserves splits, adds/removes and deletes", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    const assetId = await createAccount(
      request,
      headers,
      `CORE-04 asset ${suffix}`,
      "asset",
    );
    const asset2Id = await createAccount(
      request,
      headers,
      `CORE-04 asset2 ${suffix}`,
      "asset",
    );
    const expenseId = await createAccount(
      request,
      headers,
      `CORE-04 expense ${suffix}`,
      "expense",
      "USD",
    );
    const revenueId = await createAccount(
      request,
      headers,
      `CORE-04 revenue ${suffix}`,
      "revenue",
    );
    const groupIds: string[] = [];

    try {
      const withdrawal = await request.post("/api/v1/transactions", {
        headers,
        data: {
          group_title: `CORE-04 withdrawal ${suffix}`,
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              type: "withdrawal",
              date: "2026-04-10",
              amount: "10.00",
              description: `split one ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
              foreign_amount: "11.00",
              foreign_currency_code: "USD",
              tags: ["core04", suffix],
              notes: "split note",
              internal_reference: "ref-1",
            },
            {
              type: "withdrawal",
              date: "2026-04-10",
              amount: "5.00",
              description: `split two ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
          ],
        },
      });
      const withdrawalBody = (await withdrawal.json()) as GroupResponse;
      expect(withdrawal.ok(), JSON.stringify(withdrawalBody)).toBeTruthy();
      groupIds.push(withdrawalBody.data.id);
      const journals = withdrawalBody.data.attributes.transactions;
      expect(journals).toHaveLength(2);
      expect(
        journals.every(
          (journal) =>
            journal.transaction_journal_id !== withdrawalBody.data.id,
        ),
      ).toBeTruthy();
      const tagged = journals.find((journal) =>
        journal.description.includes("split one"),
      );
      expect(tagged?.tags).toContain("core04");
      expect(tagged?.notes).toBe("split note");
      expect(tagged?.internal_reference).toBe("ref-1");

      const deposit = await request.post("/api/v1/transactions", {
        headers,
        data: {
          group_title: `CORE-04 deposit ${suffix}`,
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              type: "deposit",
              date: "2026-04-11",
              amount: "20.00",
              description: `deposit ${suffix}`,
              source_id: revenueId,
              destination_id: assetId,
              currency_code: "EUR",
            },
          ],
        },
      });
      const depositBody = (await deposit.json()) as GroupResponse;
      expect(deposit.ok(), JSON.stringify(depositBody)).toBeTruthy();
      groupIds.push(depositBody.data.id);

      const transfer = await request.post("/api/v1/transactions", {
        headers,
        data: {
          group_title: `CORE-04 transfer ${suffix}`,
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              type: "transfer",
              date: "2026-04-12",
              amount: "7.00",
              description: `transfer ${suffix}`,
              source_id: assetId,
              destination_id: asset2Id,
              currency_code: "EUR",
            },
          ],
        },
      });
      const transferBody = (await transfer.json()) as GroupResponse;
      expect(transfer.ok(), JSON.stringify(transferBody)).toBeTruthy();
      groupIds.push(transferBody.data.id);

      const groupId = withdrawalBody.data.id;
      const [first, second] = journals;
      const update = await request.put(`/api/v1/transactions/${groupId}`, {
        headers,
        data: {
          group_title: `CORE-04 withdrawal updated ${suffix}`,
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              transaction_journal_id: first.transaction_journal_id,
              type: "withdrawal",
              date: "2026-04-10",
              amount: "12.00",
              description: `split one updated ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
              tags: ["core04", suffix],
              notes: "split note",
              internal_reference: "ref-1",
            },
            {
              transaction_journal_id: second.transaction_journal_id,
              type: "withdrawal",
              date: "2026-04-10",
              amount: "5.00",
              description: `split two updated ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
          ],
        },
      });
      expect(update.ok()).toBeTruthy();

      const addSplit = await request.put(`/api/v1/transactions/${groupId}`, {
        headers,
        data: {
          group_title: `CORE-04 withdrawal updated ${suffix}`,
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              transaction_journal_id: first.transaction_journal_id,
              type: "withdrawal",
              date: "2026-04-10",
              amount: "12.00",
              description: `split one updated ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
            {
              transaction_journal_id: second.transaction_journal_id,
              type: "withdrawal",
              date: "2026-04-10",
              amount: "5.00",
              description: `split two updated ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
            {
              type: "withdrawal",
              date: "2026-04-10",
              amount: "3.00",
              description: `split three ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
          ],
        },
      });
      expect(addSplit.ok()).toBeTruthy();

      const afterAdd = await request.get(`/api/v1/transactions/${groupId}`, {
        headers,
      });
      const afterAddBody = (await afterAdd.json()) as GroupResponse;
      expect(afterAddBody.data.attributes.transactions).toHaveLength(3);
      const idsAfterAdd = afterAddBody.data.attributes.transactions.map(
        (journal) => journal.transaction_journal_id,
      );
      expect(new Set(idsAfterAdd).size).toBe(3);

      const removeSplit = await request.put(`/api/v1/transactions/${groupId}`, {
        headers,
        data: {
          group_title: `CORE-04 withdrawal updated ${suffix}`,
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              transaction_journal_id: first.transaction_journal_id,
              type: "withdrawal",
              date: "2026-04-10",
              amount: "12.00",
              description: `split one updated ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
            {
              transaction_journal_id: idsAfterAdd[2],
              type: "withdrawal",
              date: "2026-04-10",
              amount: "3.00",
              description: `split three ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
          ],
        },
      });
      expect(removeSplit.ok()).toBeTruthy();

      const deleteJournal = await request.delete(
        `/api/v1/transaction-journals/${idsAfterAdd[2]}`,
        { headers },
      );
      expect(deleteJournal.status()).toBe(204);
      const afterJournalDelete = await request.get(
        `/api/v1/transactions/${groupId}`,
        { headers },
      );
      const afterJournalDeleteBody =
        (await afterJournalDelete.json()) as GroupResponse;
      expect(afterJournalDeleteBody.data.attributes.transactions).toHaveLength(
        1,
      );
      expect(
        afterJournalDeleteBody.data.attributes.transactions[0]
          .transaction_journal_id,
      ).toBe(first.transaction_journal_id);
    } finally {
      for (const id of groupIds) {
        await request.delete(`/api/v1/transactions/${id}`, { headers });
      }
      for (const id of [assetId, asset2Id, expenseId, revenueId]) {
        await request.delete(`/api/v1/accounts/${id}`, { headers });
      }
    }
  });
});
