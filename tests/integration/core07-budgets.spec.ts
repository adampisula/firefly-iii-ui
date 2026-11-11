import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

test.describe("CORE-07 budget contracts", () => {
  test("budget, limit and read-only available resources", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    let budgetId: string | undefined;
    let limitId: string | undefined;

    try {
      const created = await request.post("/api/v1/budgets", {
        headers,
        data: {
          name: `CORE-07 budget ${suffix}`,
          active: true,
          auto_budget_type: "reset",
          auto_budget_amount: "100.00",
          auto_budget_period: "monthly",
          auto_budget_currency_code: "EUR",
          notes: "budget note",
        },
      });
      const createdBody = (await created.json()) as {
        data?: {
          id: string;
          attributes: { name: string; auto_budget_type: string };
        };
      };
      expect(created.ok(), JSON.stringify(createdBody)).toBeTruthy();
      budgetId = createdBody.data?.id;
      if (!budgetId) throw new Error("No budget id");
      expect(createdBody.data?.attributes.name).toBe(
        `CORE-07 budget ${suffix}`,
      );
      expect(createdBody.data?.attributes.auto_budget_type).toBe("reset");

      const update = await request.put(`/api/v1/budgets/${budgetId}`, {
        headers,
        data: {
          name: `CORE-07 budget updated ${suffix}`,
          active: false,
          auto_budget_type: "rollover",
          auto_budget_amount: "50.00",
          auto_budget_period: "monthly",
          auto_budget_currency_code: "EUR",
        },
      });
      expect(update.ok()).toBeTruthy();

      const list = await request.get(
        "/api/v1/budgets?limit=100&start=2026-01-01&end=2026-12-31",
        { headers },
      );
      expect(list.ok()).toBeTruthy();
      const listBody = (await list.json()) as {
        data: {
          id: string;
          attributes: { auto_budget_type: string; spent: unknown[] };
        }[];
      };
      const listed = listBody.data.find((row) => row.id === budgetId);
      expect(listed?.attributes.auto_budget_type).toBe("rollover");
      expect(Array.isArray(listed?.attributes.spent)).toBeTruthy();

      const limit = await request.post(`/api/v1/budgets/${budgetId}/limits`, {
        headers,
        data: {
          start: "2026-06-01",
          end: "2026-06-30",
          amount: "120.00",
          currency_code: "EUR",
        },
      });
      const limitBody = (await limit.json()) as {
        data?: {
          id: string;
          attributes: { amount: string; budget_id: string };
        };
      };
      expect(limit.ok(), JSON.stringify(limitBody)).toBeTruthy();
      limitId = limitBody.data?.id;
      if (!limitId) throw new Error("No limit id");
      expect(Number(limitBody.data?.attributes.amount)).toBe(120);
      expect(limitBody.data?.attributes.budget_id).toBe(budgetId);

      const duplicate = await request.post(
        `/api/v1/budgets/${budgetId}/limits`,
        {
          headers,
          data: {
            start: "2026-06-01",
            end: "2026-06-30",
            amount: "10.00",
            currency_code: "EUR",
          },
        },
      );
      expect(duplicate.status()).toBe(422);

      const limits = await request.get(
        `/api/v1/budgets/${budgetId}/limits?limit=100`,
        { headers },
      );
      expect(limits.ok()).toBeTruthy();
      const limitsBody = (await limits.json()) as { data: { id: string }[] };
      expect(limitsBody.data.some((row) => row.id === limitId)).toBeTruthy();

      const showLimit = await request.get(
        `/api/v1/budgets/${budgetId}/limits/${limitId}`,
        { headers },
      );
      expect(showLimit.ok()).toBeTruthy();

      const updateLimit = await request.put(
        `/api/v1/budgets/${budgetId}/limits/${limitId}`,
        {
          headers,
          data: {
            start: "2026-06-01",
            end: "2026-06-30",
            amount: "150.00",
            currency_code: "EUR",
          },
        },
      );
      expect(updateLimit.ok()).toBeTruthy();

      for (const path of [
        `/api/v1/budgets/${budgetId}/transactions?limit=10`,
        `/api/v1/budgets/${budgetId}/limits/${limitId}/transactions?limit=10`,
        "/api/v1/budgets/transactions-without-budget?limit=10",
        "/api/v1/available-budgets?limit=10",
        "/api/v1/budget-limits?limit=10",
      ]) {
        const response = await request.get(path, { headers });
        expect(response.status(), path).toBe(200);
      }

      const deleteLimit = await request.delete(
        `/api/v1/budgets/${budgetId}/limits/${limitId}`,
        { headers },
      );
      expect(deleteLimit.status()).toBe(204);
      limitId = undefined;
    } finally {
      if (limitId && budgetId) {
        await request.delete(`/api/v1/budgets/${budgetId}/limits/${limitId}`, {
          headers,
        });
      }
      if (budgetId) {
        await request.delete(`/api/v1/budgets/${budgetId}`, { headers });
      }
    }
  });
});
