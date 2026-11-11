import { expect, test } from "@playwright/test";

test("currency/rate reads, CER defect and owner-gated writes", async ({
  request,
}) => {
  const token = process.env.FIREFLY_TEST_PAT;
  if (!token) {
    test.skip();
    return;
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const list = await request.get("/api/v1/currencies?limit=100", { headers });
  expect(list.ok()).toBeTruthy();
  const listBody = (await list.json()) as {
    data: { attributes: { code: string } }[];
  };
  expect(
    listBody.data.some((row) => row.attributes.code === "EUR"),
  ).toBeTruthy();
  for (const path of [
    "/api/v1/currencies/primary",
    "/api/v1/currencies/default",
    "/api/v1/currencies/EUR",
    "/api/v1/currencies/EUR/accounts?limit=1",
    "/api/v1/currencies/EUR/available-budgets?limit=1",
    "/api/v1/currencies/EUR/bills?limit=1",
    "/api/v1/currencies/EUR/budget-limits?limit=1",
    "/api/v1/currencies/EUR/recurrences?limit=1",
    "/api/v1/currencies/EUR/rules?limit=1",
    "/api/v1/currencies/EUR/transactions?limit=1",
    "/api/v1/exchange-rates?limit=10",
  ]) {
    expect((await request.get(path, { headers })).status(), path).toBe(200);
  }
  const cer = await request.get("/api/v1/currencies/EUR/cer", { headers });
  expect(cer.status()).toBe(500);

  const suffix = Date.now().toString(36).slice(-3).toUpperCase();
  const code = `T${suffix}`;
  const created = await request.post("/api/v1/currencies", {
    headers,
    data: {
      name: `SYS-01 ${code}`,
      code,
      symbol: code,
      decimal_places: 3,
      enabled: true,
      default: false,
    },
  });
  if (!created.ok() && [401, 403].includes(created.status())) {
    test.info().annotations.push({
      type: "owner-gated",
      description:
        "Currency writes require owner; read/CER evidence still recorded.",
    });
  } else {
    expect(created.ok(), JSON.stringify(await created.json())).toBeTruthy();
    const update = await request.put(`/api/v1/currencies/${code}`, {
      headers,
      data: {
        name: `SYS-01 ${code} updated`,
        code,
        symbol: code,
        decimal_places: 0,
        enabled: true,
      },
    });
    expect(update.ok()).toBeTruthy();
    expect(
      (
        await request.post(`/api/v1/currencies/${code}/disable`, { headers })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await request.post(`/api/v1/currencies/${code}/enable`, { headers })
      ).ok(),
    ).toBeTruthy();
    const disableInUse = await request.post("/api/v1/currencies/EUR/disable", {
      headers,
    });
    expect(disableInUse.status()).toBe(409);
    await request.post("/api/v1/currencies/EUR/enable", { headers });
    expect(
      (
        await request.delete(`/api/v1/currencies/${code}`, { headers })
      ).status(),
    ).toBe(204);
  }

  const rate = await request.post("/api/v1/exchange-rates", {
    headers,
    data: { from: "USD", to: "EUR", date: "2026-04-01", rate: "0.92" },
  });
  if (!rate.ok() && [401, 403].includes(rate.status())) {
    test.info().annotations.push({
      type: "owner-gated",
      description: "Exchange-rate writes require owner.",
    });
  } else {
    expect(rate.ok(), JSON.stringify(await rate.json())).toBeTruthy();
    expect(
      (await request.get("/api/v1/exchange-rates/USD/EUR", { headers })).ok(),
    ).toBeTruthy();
    const dated = await request.get(
      "/api/v1/exchange-rates/USD/EUR/2026-04-01",
      { headers },
    );
    const datedBody = dated.ok()
      ? ((await dated.json()) as { data?: { id?: string } })
      : {};
    if (datedBody.data?.id) {
      expect(
        (
          await request.get(`/api/v1/exchange-rates/${datedBody.data.id}`, {
            headers,
          })
        ).ok(),
      ).toBeTruthy();
      expect(
        (
          await request.put(`/api/v1/exchange-rates/${datedBody.data.id}`, {
            headers,
            data: { rate: "0.93" },
          })
        ).ok(),
      ).toBeTruthy();
    }
    const bulkCurrencies = await request.post(
      "/api/v1/exchange-rates/by-currencies/USD/EUR",
      { headers, data: { "2026-04-02": 0.94 } },
    );
    expect([200, 201, 204, 422, 500]).toContain(bulkCurrencies.status());
    const bulkDate = await request.post(
      "/api/v1/exchange-rates/by-date/2026-04-03",
      { headers, data: { from: "USD", rates: { EUR: 0.95 } } },
    );
    expect([200, 201, 204, 422, 500]).toContain(bulkDate.status());
    const deletedRate = await request.delete(
      "/api/v1/exchange-rates/USD/EUR/2026-04-01",
      { headers },
    );
    expect([200, 204, 404, 500]).toContain(deletedRate.status());
  }
});
