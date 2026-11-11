import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

test.describe("AUTO-01 rule contracts", () => {
  test("rule group, rule CRUD, test and expression validation", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    let groupId: string | undefined;
    let ruleId: string | undefined;

    try {
      const group = await request.post("/api/v1/rule-groups", {
        headers,
        data: {
          title: `AUTO-01 group ${suffix}`,
          description: "group",
          active: true,
          order: 1,
        },
      });
      const groupBody = (await group.json()) as {
        data?: { id: string; attributes: { title: string } };
      };
      expect(group.ok(), JSON.stringify(groupBody)).toBeTruthy();
      groupId = groupBody.data?.id;
      if (!groupId) throw new Error("No group id");

      const rule = await request.post("/api/v1/rules", {
        headers,
        data: {
          title: `AUTO-01 rule ${suffix}`,
          description: "rule",
          rule_group_id: Number(groupId),
          trigger: "manual-activation",
          strict: false,
          stop_processing: false,
          active: true,
          triggers: [
            {
              type: "description_contains",
              value: "auto01-no-match",
              active: true,
              stop_processing: false,
            },
          ],
          actions: [
            {
              type: "set_description",
              value: "matched",
              active: true,
              stop_processing: false,
            },
          ],
        },
      });
      const ruleBody = (await rule.json()) as {
        data?: {
          id: string;
          attributes: {
            title: string;
            triggers: unknown[];
            actions: unknown[];
          };
        };
      };
      expect(rule.ok(), JSON.stringify(ruleBody)).toBeTruthy();
      ruleId = ruleBody.data?.id;
      if (!ruleId) throw new Error("No rule id");
      expect(ruleBody.data?.attributes.triggers.length).toBe(1);
      expect(ruleBody.data?.attributes.actions.length).toBe(1);

      for (const path of [
        `/api/v1/rules/${ruleId}`,
        "/api/v1/rules?limit=100",
        "/api/v1/rule-groups?limit=100",
        `/api/v1/rule-groups/${groupId}`,
        `/api/v1/rule-groups/${groupId}/rules?limit=100`,
      ]) {
        expect((await request.get(path, { headers })).status(), path).toBe(200);
      }

      const testRule = await request.get(`/api/v1/rules/${ruleId}/test`, {
        headers,
      });
      expect([200, 422]).toContain(testRule.status());
      const expression = await request.get(
        `/api/v1/rules/validate-expression?expression=${encodeURIComponent('"x" = "x"')}`,
        { headers },
      );
      expect([200, 422]).toContain(expression.status());

      const update = await request.put(`/api/v1/rules/${ruleId}`, {
        headers,
        data: {
          title: `AUTO-01 rule updated ${suffix}`,
          rule_group_id: Number(groupId),
          trigger: "manual-activation",
          active: false,
          triggers: [
            {
              type: "description_contains",
              value: "auto01-no-match",
              active: true,
              stop_processing: false,
            },
          ],
          actions: [
            {
              type: "set_description",
              value: "matched",
              active: true,
              stop_processing: false,
            },
          ],
        },
      });
      expect(update.ok()).toBeTruthy();

      expect(
        (await request.delete(`/api/v1/rules/${ruleId}`, { headers })).status(),
      ).toBe(204);
      ruleId = undefined;
      expect(
        (
          await request.delete(`/api/v1/rule-groups/${groupId}`, { headers })
        ).status(),
      ).toBe(204);
      groupId = undefined;
    } finally {
      if (ruleId) await request.delete(`/api/v1/rules/${ruleId}`, { headers });
      if (groupId)
        await request.delete(`/api/v1/rule-groups/${groupId}`, { headers });
    }
  });
});
