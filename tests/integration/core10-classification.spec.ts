import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

test.describe("CORE-10 classification contracts", () => {
  test("category, tag and object-group lifecycle with special characters", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    let categoryId: string | undefined;
    let tagName: string | undefined;
    let objectGroupId: string | undefined;
    let budgetId: string | undefined;

    try {
      const category = await request.post("/api/v1/categories", {
        headers,
        data: { name: `CORE-10 category ${suffix}`, notes: "note" },
      });
      const categoryBody = (await category.json()) as {
        data?: { id: string; attributes: { name: string } };
      };
      expect(category.ok(), JSON.stringify(categoryBody)).toBeTruthy();
      categoryId = categoryBody.data?.id;
      if (!categoryId) throw new Error("No category id");
      const categoryUpdate = await request.put(
        `/api/v1/categories/${categoryId}`,
        { headers, data: { name: `CORE-10 category updated ${suffix}` } },
      );
      expect(categoryUpdate.ok()).toBeTruthy();
      for (const path of [
        `/api/v1/categories/${categoryId}`,
        `/api/v1/categories/${categoryId}/transactions?limit=10`,
        `/api/v1/categories/${categoryId}/attachments?limit=10`,
      ]) {
        expect((await request.get(path, { headers })).status(), path).toBe(200);
      }

      tagName = `CORE-10 tag ✓ ${suffix}`;
      const tag = await request.post("/api/v1/tags", {
        headers,
        data: { tag: tagName, description: "tag description" },
      });
      const tagBody = (await tag.json()) as {
        data?: { id: string; attributes: { tag: string } };
      };
      expect(tag.ok(), JSON.stringify(tagBody)).toBeTruthy();
      const renamedTag = `${tagName} renamed`;
      const tagUpdate = await request.put(
        `/api/v1/tags/${encodeURIComponent(tagName)}`,
        { headers, data: { tag: renamedTag, description: "updated" } },
      );
      expect(tagUpdate.ok()).toBeTruthy();
      for (const path of [
        `/api/v1/tags/${encodeURIComponent(renamedTag)}`,
        `/api/v1/tags/${encodeURIComponent(renamedTag)}/transactions?limit=10`,
        `/api/v1/tags/${encodeURIComponent(renamedTag)}/attachments?limit=10`,
      ]) {
        expect((await request.get(path, { headers })).status(), path).toBe(200);
      }

      const budget = await request.post("/api/v1/budgets", {
        headers,
        data: {
          name: `CORE-10 group source ${suffix}`,
          object_group_title: `CORE-10 group ${suffix}`,
        },
      });
      const budgetBody = (await budget.json()) as {
        data?: { id: string; attributes: { object_group_id: string } };
      };
      expect(budget.ok(), JSON.stringify(budgetBody)).toBeTruthy();
      budgetId = budgetBody.data?.id;
      const groupsResponse = await request.get(
        "/api/v1/object-groups?limit=100",
        { headers },
      );
      const groupsBody = (await groupsResponse.json()) as {
        data: { id: string; attributes: { title: string } }[];
      };
      objectGroupId = groupsBody.data.find(
        (row) => row.attributes.title === `CORE-10 group ${suffix}`,
      )?.id;
      expect(groupsResponse.ok()).toBeTruthy();
      if (objectGroupId) {
        const groupUpdate = await request.put(
          `/api/v1/object-groups/${objectGroupId}`,
          {
            headers,
            data: { title: `CORE-10 group updated ${suffix}`, order: 3 },
          },
        );
        expect(groupUpdate.ok()).toBeTruthy();
        for (const path of [
          `/api/v1/object-groups/${objectGroupId}`,
          `/api/v1/object-groups/${objectGroupId}/piggy-banks?limit=10`,
          `/api/v1/object-groups/${objectGroupId}/bills?limit=10`,
        ]) {
          expect((await request.get(path, { headers })).status(), path).toBe(
            200,
          );
        }
      }
      expect(
        (
          await request.delete(
            `/api/v1/tags/${encodeURIComponent(renamedTag)}`,
            { headers },
          )
        ).status(),
      ).toBe(204);
      tagName = undefined;
      expect(
        (
          await request.delete(`/api/v1/categories/${categoryId}`, { headers })
        ).status(),
      ).toBe(204);
      categoryId = undefined;
      if (objectGroupId) {
        expect(
          (
            await request.delete(`/api/v1/object-groups/${objectGroupId}`, {
              headers,
            })
          ).status(),
        ).toBe(204);
        objectGroupId = undefined;
      }
    } finally {
      if (tagName)
        await request.delete(`/api/v1/tags/${encodeURIComponent(tagName)}`, {
          headers,
        });
      if (categoryId)
        await request.delete(`/api/v1/categories/${categoryId}`, { headers });
      if (objectGroupId)
        await request.delete(`/api/v1/object-groups/${objectGroupId}`, {
          headers,
        });
      if (budgetId)
        await request.delete(`/api/v1/budgets/${budgetId}`, { headers });
    }
  });
});
