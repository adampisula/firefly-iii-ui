import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

test.describe("FND-06 onboarding API composition on official 6.7.9", () => {
  test("creates starting asset accounts, primary currency and dashboard defaults", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);

    const currenciesResponse = await request.get(
      "/api/v1/currencies?limit=100",
      { headers },
    );
    expect(currenciesResponse.ok()).toBeTruthy();
    const currencies = (await currenciesResponse.json()) as {
      data: { attributes: { code: string; enabled: boolean } }[];
    };
    const candidates = currencies.data.filter(
      (currency) => currency.attributes.code.length === 3,
    );
    expect(candidates.length).toBeGreaterThan(0);
    const currencyCode =
      candidates.find((currency) => currency.attributes.code === "EUR")
        ?.attributes.code ?? candidates[0].attributes.code;

    const primaryResponse = await request.post(
      `/api/v1/currencies/${currencyCode}/primary`,
      { headers },
    );
    expect(primaryResponse.ok()).toBeTruthy();
    const primaryBody = (await primaryResponse.json()) as {
      data: { attributes: { code: string; primary: boolean } };
    };
    expect(primaryBody.data.attributes.code).toBe(currencyCode);
    expect(primaryBody.data.attributes.primary).toBe(true);

    const suffix = Date.now().toString(36);
    const accounts = [
      { role: "defaultAsset", name: `FND-06 bank ${suffix}` },
      { role: "savingAsset", name: `FND-06 savings ${suffix}` },
      { role: "cashWalletAsset", name: `FND-06 cash ${suffix}` },
    ];
    const createdIds: string[] = [];

    try {
      for (const account of accounts) {
        const created = await request.post("/api/v1/accounts", {
          headers,
          data: {
            name: account.name,
            type: "asset",
            account_role: account.role,
            currency_code: currencyCode,
            include_net_worth: true,
            active: true,
          },
        });
        expect(created.ok()).toBeTruthy();
        const body = (await created.json()) as { data: { id: string } };
        expect(body.data.id).toMatch(/^\d+$/);
        createdIds.push(body.data.id);
      }

      const listResponse = await request.get("/api/v1/accounts?limit=100", {
        headers,
      });
      expect(listResponse.ok()).toBeTruthy();
      const list = (await listResponse.json()) as {
        data: { id: string; attributes: { name: string; type: string } }[];
      };
      for (const account of accounts) {
        const match = list.data.find(
          (row) => row.attributes.name === account.name,
        );
        expect(match?.attributes.type).toBe("asset");
      }

      const frontpageIds = list.data
        .filter((row) => row.attributes.type === "asset")
        .map((row) => Number(row.id))
        .filter((id) => Number.isSafeInteger(id));
      expect(frontpageIds.length).toBeGreaterThanOrEqual(accounts.length);

      const frontpage = await request.post("/api/v1/preferences", {
        headers,
        data: { name: "frontpageAccounts", data: frontpageIds },
      });
      expect(frontpage.ok()).toBeTruthy();

      const optionalFields = await request.post("/api/v1/preferences", {
        headers,
        data: {
          name: "transaction_journal_optional_fields",
          data: {
            interest_date: true,
            book_date: false,
            process_date: false,
            due_date: false,
            payment_date: false,
            invoice_date: false,
            internal_reference: false,
            notes: true,
            attachments: true,
          },
        },
      });
      expect(optionalFields.ok()).toBeTruthy();

      const preferences = await request.get("/api/v1/preferences?limit=100", {
        headers,
      });
      expect(preferences.ok()).toBeTruthy();
      const preferenceList = (await preferences.json()) as {
        data: { attributes: { name: string } }[];
      };
      const names = preferenceList.data.map((row) => row.attributes.name);
      expect(names).toContain("frontpageAccounts");
      expect(names).toContain("transaction_journal_optional_fields");
    } finally {
      for (const id of createdIds) {
        await request.delete(`/api/v1/accounts/${id}`, { headers });
      }
    }
  });

  test("rejects an invalid PAT for onboarding reads", async ({ request }) => {
    const response = await request.get("/api/v1/accounts", {
      headers: headersFor("invalid-token-fnd06"),
    });
    expect(response.status()).toBe(401);
  });
});
