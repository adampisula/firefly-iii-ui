import { expect, test, type APIRequestContext } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

async function createAccount(
  request: APIRequestContext,
  headers: Record<string, string>,
  data: Record<string, unknown>,
): Promise<string> {
  const response = await request.post("/api/v1/accounts", { headers, data });
  const body = (await response.json()) as {
    data?: { id: string };
    message?: string;
  };
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  if (!body.data?.id) throw new Error("Account response had no ID.");
  return body.data.id;
}

test.describe("CORE-02 account lifecycle contracts", () => {
  test("creates each supported type and updates/deletes safely", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    const ids: string[] = [];
    try {
      const assetId = await createAccount(request, headers, {
        name: `CORE-02 asset ${suffix}`,
        type: "asset",
        account_role: "defaultAsset",
        currency_code: "EUR",
        opening_balance: "10.00",
        opening_balance_date: "2026-01-01",
        active: true,
        include_net_worth: true,
      });
      ids.push(assetId);

      ids.push(
        await createAccount(request, headers, {
          name: `CORE-02 expense ${suffix}`,
          type: "expense",
          currency_code: "EUR",
        }),
      );
      ids.push(
        await createAccount(request, headers, {
          name: `CORE-02 revenue ${suffix}`,
          type: "revenue",
          currency_code: "EUR",
        }),
      );
      ids.push(
        await createAccount(request, headers, {
          name: `CORE-02 card ${suffix}`,
          type: "asset",
          account_role: "ccAsset",
          credit_card_type: "monthlyFull",
          monthly_payment_date: "2026-02-01",
          currency_code: "EUR",
        }),
      );
      ids.push(
        await createAccount(request, headers, {
          name: `CORE-02 loan ${suffix}`,
          type: "liability",
          liability_type: "loan",
          liability_direction: "debit",
          liability_amount: "1000",
          liability_start_date: "2026-01-01",
          interest: "4.5",
          interest_period: "yearly",
          currency_code: "EUR",
        }),
      );

      const update = await request.put(`/api/v1/accounts/${assetId}`, {
        headers,
        data: {
          name: `CORE-02 asset renamed ${suffix}`,
          notes: "updated by CORE-02",
          active: false,
          include_net_worth: false,
        },
      });
      expect(update.ok()).toBeTruthy();
      const read = await request.get(`/api/v1/accounts/${assetId}`, {
        headers,
      });
      const body = (await read.json()) as {
        data: { attributes: { name: string; notes: string; active: boolean } };
      };
      expect(body.data.attributes.name).toBe(`CORE-02 asset renamed ${suffix}`);
      expect(body.data.attributes.notes).toContain("updated by CORE-02");
      expect(body.data.attributes.active).toBe(false);

      const inactive = await request.get(
        "/api/v1/accounts?active=false&limit=100",
        { headers },
      );
      expect(inactive.ok()).toBeTruthy();
      const inactiveBody = (await inactive.json()) as {
        data: { id: string }[];
      };
      expect(inactiveBody.data.some((row) => row.id === assetId)).toBeTruthy();

      const liabilities = await request.get(
        "/api/v1/accounts?type=liability&limit=100",
        { headers },
      );
      const liabilityBody = (await liabilities.json()) as {
        data: { id: string }[];
      };
      expect(liabilityBody.data.some((row) => row.id === ids[4])).toBeTruthy();
    } finally {
      for (const id of ids) {
        await request.delete(`/api/v1/accounts/${id}`, { headers });
      }
    }
  });

  test("rejects missing conditional account fields", async ({ request }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    const invalid = [
      {
        name: `CORE-02 no role ${suffix}`,
        type: "asset",
        currency_code: "EUR",
      },
      {
        name: `CORE-02 unpaired ${suffix}`,
        type: "asset",
        account_role: "defaultAsset",
        opening_balance: "5.00",
        currency_code: "EUR",
      },
      {
        name: `CORE-02 bad card ${suffix}`,
        type: "asset",
        account_role: "ccAsset",
        credit_card_type: "monthlyFull",
        currency_code: "EUR",
      },
      {
        name: `CORE-02 bad loan ${suffix}`,
        type: "liability",
        liability_type: "bogus",
        liability_direction: "debit",
        currency_code: "EUR",
      },
    ];
    for (const payload of invalid) {
      const response = await request.post("/api/v1/accounts", {
        headers,
        data: payload,
      });
      const body = (await response.json()) as { data?: { id?: string } };
      if (response.ok() && body.data?.id) {
        await request.delete(`/api/v1/accounts/${body.data.id}`, { headers });
      }
      expect(response.status(), payload.name).toBe(422);
    }
  });
});
