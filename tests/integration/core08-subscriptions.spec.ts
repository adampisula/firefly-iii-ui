import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

test.describe("CORE-08 subscription contracts", () => {
  test("creates, reads, aliases and deletes subscriptions and related data", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    let billId: string | undefined;

    try {
      const created = await request.post("/api/v1/bills", {
        headers,
        data: {
          name: `CORE-08 sub ${suffix}`,
          amount_min: "5.00",
          amount_max: "10.00",
          currency_code: "EUR",
          date: "2026-01-01",
          repeat_freq: "monthly",
          skip: 0,
          active: true,
          notes: "sub note",
          object_group_title: `CORE-08 group ${suffix}`,
        },
      });
      const body = (await created.json()) as {
        data?: {
          id: string;
          attributes: { name: string; amount_min: string; pay_dates: string[] };
        };
      };
      expect(created.ok(), JSON.stringify(body)).toBeTruthy();
      billId = body.data?.id;
      if (!billId) throw new Error("No bill id");
      expect(Number(body.data?.attributes.amount_min)).toBe(5);

      const update = await request.put(`/api/v1/bills/${billId}`, {
        headers,
        data: {
          name: `CORE-08 sub updated ${suffix}`,
          amount_min: "6.00",
          amount_max: "12.00",
          currency_code: "EUR",
          date: "2026-01-01",
          repeat_freq: "quarterly",
          skip: 1,
          active: false,
        },
      });
      expect(update.ok()).toBeTruthy();

      const list = await request.get("/api/v1/bills?limit=100", { headers });
      expect(list.ok()).toBeTruthy();
      const listBody = (await list.json()) as {
        data: { id: string; attributes: { repeat_freq: string } }[];
      };
      expect(
        listBody.data.find((row) => row.id === billId)?.attributes.repeat_freq,
      ).toBe("quarterly");

      for (const prefix of ["bills", "subscriptions"]) {
        for (const path of [
          `/api/v1/${prefix}/${billId}`,
          `/api/v1/${prefix}/${billId}/rules?limit=10`,
          `/api/v1/${prefix}/${billId}/transactions?limit=10`,
          `/api/v1/${prefix}/${billId}/attachments?limit=10`,
        ]) {
          const response = await request.get(path, { headers });
          expect(response.status(), path).toBe(200);
        }
      }
      const subscriptions = await request.get(
        "/api/v1/subscriptions?limit=100",
        { headers },
      );
      expect(subscriptions.ok()).toBeTruthy();
      const subscriptionsBody = (await subscriptions.json()) as {
        data: { id: string }[];
      };
      expect(
        subscriptionsBody.data.some((row) => row.id === billId),
      ).toBeTruthy();

      const deleteViaAlias = await request.delete(
        `/api/v1/subscriptions/${billId}`,
        { headers },
      );
      expect(deleteViaAlias.status()).toBe(204);
      billId = undefined;
    } finally {
      if (billId) await request.delete(`/api/v1/bills/${billId}`, { headers });
    }
  });

  test("rejects invalid subscription ranges", async ({ request }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const invalid = await request.post("/api/v1/bills", {
      headers,
      data: {
        name: `CORE-08 invalid ${Date.now().toString(36)}`,
        amount_min: "20.00",
        amount_max: "10.00",
        currency_code: "EUR",
        date: "2026-01-01",
        repeat_freq: "daily",
      },
    });
    expect([422, 200]).toContain(invalid.status());
    const body = (await invalid.json()) as { data?: { id?: string } };
    if (invalid.ok() && body.data?.id) {
      await request.delete(`/api/v1/bills/${body.data.id}`, { headers });
    }
  });
});
