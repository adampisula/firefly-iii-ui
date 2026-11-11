import { expect, test } from "./pw-fixtures.ts";
import { installFireflyMock } from "./fixtures/mock-firefly.ts";

test("deterministic Firefly fixtures isolate users and cover financial shapes", async ({
  page,
}) => {
  await installFireflyMock(page);
  await page.goto("/");

  const responses = await page.evaluate(async () => {
    const [
      about,
      ownerAccounts,
      demoAccounts,
      transactions,
      largePage,
      recurring,
    ] = await Promise.all([
      fetch("/api/v1/about"),
      fetch("/api/v1/accounts?fixture_user=owner"),
      fetch("/api/v1/accounts?fixture_user=demo"),
      fetch("/api/v1/transactions"),
      fetch("/api/v1/transactions?fixture_page=large"),
      fetch("/api/v1/recurring"),
    ]);
    return {
      about: await about.json(),
      ownerAccounts: await ownerAccounts.json(),
      demoAccounts: await demoAccounts.json(),
      transactions: await transactions.json(),
      largePage: await largePage.json(),
      recurring: await recurring.json(),
      cacheControl: about.headers.get("cache-control"),
    };
  });

  expect(responses.about.data.version).toBe("6.7.9");
  expect(responses.cacheControl).toBe("no-store");
  expect(responses.ownerAccounts.data).toHaveLength(3);
  expect(responses.demoAccounts.data).toHaveLength(1);
  expect(responses.ownerAccounts.data[1].attributes.type).toBe("liability");
  expect(responses.ownerAccounts.data[2].attributes.active).toBe(false);
  expect(responses.transactions.data[0].attributes.transactions).toHaveLength(
    3,
  );
  expect(
    responses.transactions.data[0].attributes.transactions[1],
  ).toMatchObject({
    transaction_journal_id: "9002",
    amount: "0.125",
    currency_decimal_places: 3,
    reconciled: true,
  });
  expect(
    responses.transactions.data[0].attributes.transactions[0],
  ).toMatchObject({
    foreign_amount: "12.345",
    pc_amount: "123456789012345.67",
  });
  expect(responses.largePage.data).toHaveLength(100);
  expect(responses.recurring.data[0].attributes.active).toBe(true);
});

test("mock mode blocks unsupported writes and all external browser requests", async ({
  page,
}) => {
  await installFireflyMock(page);
  await page.goto("/");

  const results = await page.evaluate(async () => {
    const write = await fetch("/api/v1/transactions", { method: "POST" });
    const unsupported = await fetch("/api/v1/currencies/cer");
    const external = await fetch("https://example.com").then(
      () => "unexpected-success",
      (error: Error) => error.name,
    );
    return {
      writeStatus: write.status,
      writeBody: await write.json(),
      unsupportedStatus: unsupported.status,
      external,
    };
  });

  expect(results.writeStatus).toBe(501);
  expect(results.writeBody.code).toBe("unsupported_mock_operation");
  expect(results.unsupportedStatus).toBe(501);
  expect(results.external).toBe("TypeError");
});
