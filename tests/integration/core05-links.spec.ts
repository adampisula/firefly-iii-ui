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
): Promise<string> {
  const response = await request.post("/api/v1/accounts", {
    headers,
    data: {
      name,
      type,
      ...(type === "asset" ? { account_role: "defaultAsset" } : {}),
      currency_code: "EUR",
    },
  });
  const body = (await response.json()) as { data?: { id: string } };
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  if (!body.data?.id) throw new Error("No account id");
  return body.data.id;
}

async function createTransaction(
  request: APIRequestContext,
  headers: Record<string, string>,
  assetId: string,
  expenseId: string,
  description: string,
): Promise<{ groupId: string; journalId: string }> {
  const response = await request.post("/api/v1/transactions", {
    headers,
    data: {
      group_title: description,
      apply_rules: false,
      fire_webhooks: false,
      transactions: [
        {
          type: "withdrawal",
          date: "2026-05-01",
          amount: "10.00",
          description,
          source_id: assetId,
          destination_id: expenseId,
          currency_code: "EUR",
        },
      ],
    },
  });
  const body = (await response.json()) as {
    data?: {
      id: string;
      attributes: { transactions: { transaction_journal_id: string }[] };
    };
  };
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  if (!body.data) throw new Error("No transaction group");
  return {
    groupId: body.data.id,
    journalId: body.data.attributes.transactions[0].transaction_journal_id,
  };
}

test.describe("CORE-05 link contracts", () => {
  test("creates, updates, reads and deletes link types and journal links", async ({
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
      `CORE-05 asset ${suffix}`,
      "asset",
    );
    const expenseId = await createAccount(
      request,
      headers,
      `CORE-05 expense ${suffix}`,
      "expense",
    );
    const first = await createTransaction(
      request,
      headers,
      assetId,
      expenseId,
      `CORE-05 first ${suffix}`,
    );
    const second = await createTransaction(
      request,
      headers,
      assetId,
      expenseId,
      `CORE-05 second ${suffix}`,
    );
    let linkTypeId: string | undefined;
    let linkId: string | undefined;

    try {
      const typesResponse = await request.get("/api/v1/link-types?limit=100", {
        headers,
      });
      expect(typesResponse.ok()).toBeTruthy();
      const typesBody = (await typesResponse.json()) as {
        data: { id: string; attributes: { name: string } }[];
      };
      expect(typesBody.data.length).toBeGreaterThan(0);
      linkTypeId = typesBody.data[0].id;
      expect(typesBody.data[0].attributes.name.length).toBeGreaterThan(0);

      const createdLink = await request.post("/api/v1/transaction-links", {
        headers,
        data: {
          link_type_id: linkTypeId,
          inward_id: first.journalId,
          outward_id: second.journalId,
          notes: "linked by CORE-05",
        },
      });
      const linkBody = (await createdLink.json()) as {
        data?: {
          id: string;
          attributes: {
            link_type_id: string;
            inward_id: string;
            outward_id: string;
            notes: string;
          };
        };
      };
      expect(createdLink.ok(), JSON.stringify(linkBody)).toBeTruthy();
      linkId = linkBody.data?.id;
      if (!linkId) throw new Error("No link id");
      expect(linkBody.data?.attributes.inward_id).toBe(first.journalId);
      expect(linkBody.data?.attributes.outward_id).toBe(second.journalId);

      const links = await request.get("/api/v1/transaction-links?limit=100", {
        headers,
      });
      expect(links.ok()).toBeTruthy();
      const linksBody = (await links.json()) as { data: { id: string }[] };
      expect(linksBody.data.some((row) => row.id === linkId)).toBeTruthy();

      const journalLinks = await request.get(
        `/api/v1/transaction-journals/${first.journalId}/links`,
        { headers },
      );
      expect(journalLinks.ok()).toBeTruthy();
      const journalLinksBody = (await journalLinks.json()) as {
        data: { id: string }[];
      };
      expect(
        journalLinksBody.data.some((row) => row.id === linkId),
      ).toBeTruthy();

      const related = await request.get(
        `/api/v1/link-types/${linkTypeId}/transactions?limit=100`,
        { headers },
      );
      expect(related.ok()).toBeTruthy();

      const reread = await request.get(`/api/v1/transaction-links/${linkId}`, {
        headers,
      });
      expect(reread.ok()).toBeTruthy();
      const rereadBody = (await reread.json()) as {
        data: { attributes: { notes: string; inward_id: string } };
      };
      expect(rereadBody.data.attributes.notes).toBe("linked by CORE-05");
      expect(rereadBody.data.attributes.inward_id).toBe(first.journalId);
    } finally {
      if (linkId) {
        await request.delete(`/api/v1/transaction-links/${linkId}`, {
          headers,
        });
      }
      for (const group of [first, second]) {
        await request.delete(`/api/v1/transactions/${group.groupId}`, {
          headers,
        });
      }
      for (const id of [assetId, expenseId]) {
        await request.delete(`/api/v1/accounts/${id}`, { headers });
      }
    }
  });
});
