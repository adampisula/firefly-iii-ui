import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

test.describe("QA-01 supported cross-domain journey", () => {
  test("accounts -> transaction/splits -> classification/budget/subscription -> rule/recurrence -> export", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    const ids: Record<string, string | undefined> = {};
    let groupId: string | undefined;

    try {
      const asset = await request.post("/api/v1/accounts", {
        headers,
        data: {
          name: `QA asset ${suffix}`,
          type: "asset",
          account_role: "defaultAsset",
          currency_code: "EUR",
        },
      });
      ids.asset = ((await asset.json()) as { data?: { id: string } }).data?.id;
      const revenue = await request.post("/api/v1/accounts", {
        headers,
        data: {
          name: `QA revenue ${suffix}`,
          type: "revenue",
          currency_code: "EUR",
        },
      });
      ids.revenue = (
        (await revenue.json()) as { data?: { id: string } }
      ).data?.id;
      const expense = await request.post("/api/v1/accounts", {
        headers,
        data: {
          name: `QA expense ${suffix}`,
          type: "expense",
          currency_code: "EUR",
        },
      });
      ids.expense = (
        (await expense.json()) as { data?: { id: string } }
      ).data?.id;
      expect(ids.asset && ids.revenue && ids.expense).toBeTruthy();

      const category = await request.post("/api/v1/categories", {
        headers,
        data: { name: `QA category ${suffix}` },
      });
      ids.category = (
        (await category.json()) as { data?: { id: string } }
      ).data?.id;
      const budget = await request.post("/api/v1/budgets", {
        headers,
        data: { name: `QA budget ${suffix}` },
      });
      ids.budget = (
        (await budget.json()) as { data?: { id: string } }
      ).data?.id;
      const subscription = await request.post("/api/v1/bills", {
        headers,
        data: {
          name: `QA sub ${suffix}`,
          amount_min: "5.00",
          amount_max: "10.00",
          currency_code: "EUR",
          date: "2026-01-01",
          repeat_freq: "monthly",
        },
      });
      ids.subscription = (
        (await subscription.json()) as { data?: { id: string } }
      ).data?.id;

      const tx = await request.post("/api/v1/transactions", {
        headers,
        data: {
          group_title: `QA group ${suffix}`,
          apply_rules: false,
          fire_webhooks: false,
          transactions: [
            {
              type: "withdrawal",
              date: "2026-06-10",
              amount: "10.00",
              description: `QA split one ${suffix}`,
              source_id: ids.asset,
              destination_id: ids.expense,
              currency_code: "EUR",
              category_id: ids.category ? Number(ids.category) : undefined,
              budget_id: ids.budget ? Number(ids.budget) : undefined,
              bill_id: ids.subscription ? Number(ids.subscription) : undefined,
              tags: ["qa-journey"],
            },
            {
              type: "withdrawal",
              date: "2026-06-10",
              amount: "4.00",
              description: `QA split two ${suffix}`,
              source_id: ids.asset,
              destination_id: ids.expense,
              currency_code: "EUR",
            },
          ],
        },
      });
      const txBody = (await tx.json()) as {
        data?: {
          id: string;
          attributes: { transactions: { transaction_journal_id: string }[] };
        };
      };
      expect(tx.ok(), JSON.stringify(txBody)).toBeTruthy();
      groupId = txBody.data?.id;
      expect(txBody.data?.attributes.transactions.length).toBe(2);

      const groupRead = await request.get(`/api/v1/transactions/${groupId}`, {
        headers,
      });
      expect(groupRead.ok()).toBeTruthy();
      const budgetRead = await request.get(
        `/api/v1/budgets/${ids.budget}?start=2026-06-01&end=2026-06-30`,
        { headers },
      );
      expect(budgetRead.ok()).toBeTruthy();
      const subscriptionRead = await request.get(
        `/api/v1/bills/${ids.subscription}`,
        { headers },
      );
      expect(subscriptionRead.ok()).toBeTruthy();
      const search = await request.get(
        `/api/v1/search/transactions?query=${encodeURIComponent('tag:"qa-journey"')}`,
        { headers },
      );
      expect(search.ok()).toBeTruthy();

      const group = await request.post("/api/v1/rule-groups", {
        headers,
        data: { title: `QA group rule ${suffix}`, active: true, order: 1 },
      });
      ids.ruleGroup = (
        (await group.json()) as { data?: { id: string } }
      ).data?.id;
      const rule = await request.post("/api/v1/rules", {
        headers,
        data: {
          title: `QA rule ${suffix}`,
          rule_group_id: Number(ids.ruleGroup),
          trigger: "manual-activation",
          active: true,
          triggers: [
            {
              type: "description_contains",
              value: "qa-no-match",
              active: true,
              stop_processing: false,
            },
          ],
          actions: [
            {
              type: "set_description",
              value: "qa",
              active: true,
              stop_processing: false,
            },
          ],
        },
      });
      ids.rule = ((await rule.json()) as { data?: { id: string } }).data?.id;

      const recurrence = await request.post("/api/v1/recurrences", {
        headers,
        data: {
          type: "withdrawal",
          title: `QA recurrence ${suffix}`,
          first_date: "2026-01-01",
          apply_rules: false,
          active: true,
          repetitions: [{ type: "monthly", moment: "1", skip: 0, weekend: 1 }],
          transactions: [
            {
              description: `QA recurring ${suffix}`,
              amount: "10.00",
              source_id: ids.asset,
              destination_id: ids.expense,
              currency_code: "EUR",
            },
          ],
        },
      });
      ids.recurrence = (
        (await recurrence.json()) as { data?: { id: string } }
      ).data?.id;

      for (const resource of [
        "accounts",
        "transactions",
        "budgets",
        "categories",
        "tags",
        "bills",
      ]) {
        const exported = await request.get(`/api/v1/data/export/${resource}`, {
          headers,
        });
        expect(exported.status(), resource).toBe(200);
      }
    } finally {
      if (groupId)
        await request.delete(`/api/v1/transactions/${groupId}`, { headers });
      if (ids.recurrence)
        await request.delete(`/api/v1/recurrences/${ids.recurrence}`, {
          headers,
        });
      if (ids.rule)
        await request.delete(`/api/v1/rules/${ids.rule}`, { headers });
      if (ids.ruleGroup)
        await request.delete(`/api/v1/rule-groups/${ids.ruleGroup}`, {
          headers,
        });
      if (ids.subscription)
        await request.delete(`/api/v1/bills/${ids.subscription}`, { headers });
      if (ids.budget)
        await request.delete(`/api/v1/budgets/${ids.budget}`, { headers });
      if (ids.category)
        await request.delete(`/api/v1/categories/${ids.category}`, { headers });
      for (const key of ["asset", "revenue", "expense"])
        if (ids[key])
          await request.delete(`/api/v1/accounts/${ids[key]}`, { headers });
    }
  });
});
