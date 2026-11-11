import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

test.describe("AUTO-02 recurrence contracts", () => {
  test("recurrence create, read, update, transactions and delete", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    const asset = await request.post("/api/v1/accounts", {
      headers,
      data: {
        name: `AUTO-02 asset ${suffix}`,
        type: "asset",
        account_role: "defaultAsset",
        currency_code: "EUR",
      },
    });
    const assetBody = (await asset.json()) as { data?: { id: string } };
    const expense = await request.post("/api/v1/accounts", {
      headers,
      data: {
        name: `AUTO-02 expense ${suffix}`,
        type: "expense",
        currency_code: "EUR",
      },
    });
    const expenseBody = (await expense.json()) as { data?: { id: string } };
    const assetId = assetBody.data?.id;
    const expenseId = expenseBody.data?.id;
    if (!assetId || !expenseId) throw new Error("No accounts");
    let recurrenceId: string | undefined;

    try {
      const created = await request.post("/api/v1/recurrences", {
        headers,
        data: {
          type: "withdrawal",
          title: `AUTO-02 recurrence ${suffix}`,
          description: "recurring",
          first_date: "2026-01-01",
          repeat_until: "2026-12-31",
          apply_rules: true,
          active: true,
          repetitions: [{ type: "monthly", moment: "1", skip: 0, weekend: 1 }],
          transactions: [
            {
              description: `AUTO-02 payment ${suffix}`,
              amount: "10.00",
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
          ],
        },
      });
      const body = (await created.json()) as {
        data?: {
          id: string;
          attributes: {
            title: string;
            repetitions: unknown[];
            transactions: unknown[];
          };
        };
      };
      expect(created.ok(), JSON.stringify(body)).toBeTruthy();
      recurrenceId = body.data?.id;
      if (!recurrenceId) throw new Error("No recurrence id");
      expect(body.data?.attributes.repetitions.length).toBe(1);
      expect(body.data?.attributes.transactions.length).toBe(1);

      for (const path of [
        `/api/v1/recurrences/${recurrenceId}`,
        "/api/v1/recurrences?limit=100",
        `/api/v1/recurrences/${recurrenceId}/transactions?limit=10`,
      ]) {
        expect((await request.get(path, { headers })).status(), path).toBe(200);
      }

      const update = await request.put(`/api/v1/recurrences/${recurrenceId}`, {
        headers,
        data: {
          type: "withdrawal",
          title: `AUTO-02 recurrence updated ${suffix}`,
          first_date: "2026-01-01",
          apply_rules: false,
          active: false,
          repetitions: [{ type: "monthly", moment: "1", skip: 0, weekend: 1 }],
          transactions: [
            {
              description: `AUTO-02 payment ${suffix}`,
              amount: "12.00",
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
          ],
        },
      });
      expect(update.ok()).toBeTruthy();

      expect(
        (
          await request.delete(`/api/v1/recurrences/${recurrenceId}`, {
            headers,
          })
        ).status(),
      ).toBe(204);
      recurrenceId = undefined;
    } finally {
      if (recurrenceId)
        await request.delete(`/api/v1/recurrences/${recurrenceId}`, {
          headers,
        });
      await request.delete(`/api/v1/accounts/${assetId}`, { headers });
      await request.delete(`/api/v1/accounts/${expenseId}`, { headers });
    }
  });
});
