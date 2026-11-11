import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

test.describe("CORE-09 piggy-bank contracts", () => {
  test("creates, allocates, reads and deletes a savings goal", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    const accountResponse = await request.post("/api/v1/accounts", {
      headers,
      data: {
        name: `CORE-09 account ${suffix}`,
        type: "asset",
        account_role: "defaultAsset",
        currency_code: "EUR",
      },
    });
    const accountBody = (await accountResponse.json()) as {
      data?: { id: string };
    };
    expect(accountResponse.ok(), JSON.stringify(accountBody)).toBeTruthy();
    const accountId = accountBody.data?.id;
    if (!accountId) throw new Error("No account id");
    const revenueResponse = await request.post("/api/v1/accounts", {
      headers,
      data: {
        name: `CORE-09 revenue ${suffix}`,
        type: "revenue",
        currency_code: "EUR",
      },
    });
    const revenueBody = (await revenueResponse.json()) as {
      data?: { id: string };
    };
    expect(revenueResponse.ok(), JSON.stringify(revenueBody)).toBeTruthy();
    const revenueId = revenueBody.data?.id;
    if (!revenueId) throw new Error("No revenue id");
    const deposit = await request.post("/api/v1/transactions", {
      headers,
      data: {
        group_title: `CORE-09 deposit ${suffix}`,
        apply_rules: false,
        fire_webhooks: false,
        transactions: [
          {
            type: "deposit",
            date: "2026-02-01",
            amount: "1000.00",
            description: `CORE-09 deposit ${suffix}`,
            source_id: revenueId,
            destination_id: accountId,
            currency_code: "EUR",
          },
        ],
      },
    });
    const depositBody = (await deposit.json()) as { data?: { id: string } };
    expect(deposit.ok(), JSON.stringify(depositBody)).toBeTruthy();
    const depositId = depositBody.data?.id;
    let piggyId: string | undefined;

    try {
      const created = await request.post("/api/v1/piggy-banks", {
        headers,
        data: {
          name: `CORE-09 goal ${suffix}`,
          target_amount: "1000.00",
          transaction_currency_code: "EUR",
          start_date: "2026-01-01",
          target_date: "2026-12-31",
          notes: "goal note",
          accounts: [{ account_id: accountId, current_amount: "0" }],
        },
      });
      const body = (await created.json()) as {
        data?: {
          id: string;
          attributes: {
            name: string;
            accounts: { id: string; current_amount: string }[];
          };
        };
      };
      expect(created.ok(), JSON.stringify(body)).toBeTruthy();
      piggyId = body.data?.id;
      if (!piggyId) throw new Error("No piggy id");
      expect(Number(body.data?.attributes.accounts[0].current_amount)).toBe(0);

      const update = await request.put(`/api/v1/piggy-banks/${piggyId}`, {
        headers,
        data: {
          name: `CORE-09 goal updated ${suffix}`,
          target_amount: "1200.00",
          transaction_currency_code: "EUR",
          start_date: "2026-01-01",
          target_date: "2026-12-31",
        },
      });
      const updateBody = (await update.json()) as { message?: string };
      expect(update.ok(), JSON.stringify(updateBody)).toBeTruthy();
      const read = await request.get(`/api/v1/piggy-banks/${piggyId}`, {
        headers,
      });
      const readBody = (await read.json()) as {
        data: {
          attributes: {
            current_amount: string;
            accounts: { current_amount: string }[];
          };
        };
      };
      expect(Number(readBody.data.attributes.current_amount)).toBe(0);

      for (const path of [
        `/api/v1/piggy-banks/${piggyId}/events?limit=10`,
        `/api/v1/piggy-banks/${piggyId}/accounts`,
        `/api/v1/piggy-banks/${piggyId}/attachments?limit=10`,
        "/api/v1/piggy-banks?limit=100",
      ]) {
        const response = await request.get(path, { headers });
        expect(response.status(), path).toBe(200);
      }

      const deletePiggy = await request.delete(
        `/api/v1/piggy-banks/${piggyId}`,
        { headers },
      );
      expect(deletePiggy.status()).toBe(204);
      piggyId = undefined;
    } finally {
      if (piggyId)
        await request.delete(`/api/v1/piggy-banks/${piggyId}`, { headers });
      if (depositId)
        await request.delete(`/api/v1/transactions/${depositId}`, { headers });
      await request.delete(`/api/v1/accounts/${revenueId}`, { headers });
      await request.delete(`/api/v1/accounts/${accountId}`, { headers });
    }
  });
});
