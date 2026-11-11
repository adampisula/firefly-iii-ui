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
  type: "asset" | "expense",
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

test.describe("CORE-03 transaction read contracts", () => {
  test("lists groups and reads group, journal, links, attachments and piggy events", async ({
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
      `CORE-03 asset ${suffix}`,
      "asset",
    );
    const expenseId = await createAccount(
      request,
      headers,
      `CORE-03 expense ${suffix}`,
      "expense",
      "USD",
    );
    let groupId: string | undefined;

    try {
      const create = await request.post("/api/v1/transactions", {
        headers,
        data: {
          group_title: `CORE-03 group ${suffix}`,
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              type: "withdrawal",
              date: "2026-03-15T00:00:00+00:00",
              amount: "10.00",
              description: `CORE-03 split one ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
              foreign_amount: "11.00",
              foreign_currency_code: "USD",
            },
            {
              type: "withdrawal",
              date: "2026-03-15T00:00:00+00:00",
              amount: "5.00",
              description: `CORE-03 split two ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
          ],
        },
      });
      const created = (await create.json()) as {
        data: {
          id: string;
          attributes: {
            group_title: string;
            transactions: {
              transaction_journal_id: string;
              foreign_amount: string;
              foreign_currency_code: string;
            }[];
          };
        };
      };
      expect(create.ok(), JSON.stringify(created)).toBeTruthy();
      groupId = created.data.id;
      const journals = created.data.attributes.transactions;
      expect(journals).toHaveLength(2);
      expect(created.data.attributes.group_title).toContain("CORE-03 group");
      expect(journals[0].transaction_journal_id).not.toBe(groupId);
      if (journals[0].foreign_amount) {
        expect(Number(journals[0].foreign_amount)).toBe(11);
      }
      if (journals[0].foreign_currency_code) {
        expect(journals[0].foreign_currency_code).toBe("USD");
      }

      const list = await request.get(
        "/api/v1/transactions?type=withdrawal&start=2026-03-01&end=2026-03-31&limit=100",
        { headers },
      );
      expect(list.ok()).toBeTruthy();
      const listBody = (await list.json()) as {
        data: { id: string; attributes: { transactions: unknown[] } }[];
        meta?: { pagination?: { current_page?: number } };
      };
      const listed = listBody.data.find((row) => row.id === groupId);
      expect(listed?.attributes.transactions.length).toBe(2);
      expect(listBody.meta?.pagination?.current_page).toBe(1);

      const group = await request.get(`/api/v1/transactions/${groupId}`, {
        headers,
      });
      expect(group.ok()).toBeTruthy();
      const groupBody = (await group.json()) as {
        data: {
          attributes: {
            transactions: {
              transaction_journal_id: string;
              source_name: string;
              destination_name: string;
              foreign_amount: string;
              foreign_currency_code: string;
            }[];
          };
        };
      };
      expect(groupBody.data.attributes.transactions).toHaveLength(2);
      expect(groupBody.data.attributes.transactions[0].source_name).toContain(
        "CORE-03 asset",
      );
      const foreignJournal = groupBody.data.attributes.transactions.find(
        (journal) => journal.foreign_currency_code === "USD",
      );
      expect(Number(foreignJournal?.foreign_amount)).toBe(11);

      const journalId = journals[0].transaction_journal_id;
      const journal = await request.get(
        `/api/v1/transaction-journals/${journalId}`,
        { headers },
      );
      expect(journal.ok()).toBeTruthy();
      const journalBody = (await journal.json()) as {
        data: { id: string; attributes: { transactions: unknown[] } };
      };
      expect(journalBody.data.id).toBe(groupId);
      expect(journalBody.data.attributes.transactions.length).toBe(2);

      for (const path of [
        `/api/v1/transaction-journals/${journalId}/links`,
        `/api/v1/transactions/${groupId}/attachments`,
        `/api/v1/transactions/${groupId}/piggy-bank-events`,
      ]) {
        const response = await request.get(path, { headers });
        expect(response.status(), path).toBe(200);
        const body = (await response.json()) as { data: unknown[] };
        expect(Array.isArray(body.data), path).toBeTruthy();
      }
    } finally {
      if (groupId) {
        await request.delete(`/api/v1/transactions/${groupId}`, { headers });
      }
      await request.delete(`/api/v1/accounts/${assetId}`, { headers });
      await request.delete(`/api/v1/accounts/${expenseId}`, { headers });
    }
  });
});
