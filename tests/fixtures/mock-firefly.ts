import type { Page, Route } from "@playwright/test";
import { LOCAL_TEST_ORIGIN } from "../pw-fixtures.ts";
import {
  fixtureAbout,
  fixtureAccountsByUser,
  fixtureRecurrences,
  fixtureTransactionGroups,
  fixtureUsers,
  makeLargeTransactionPage,
} from "./firefly.ts";

export async function installFireflyMock(page: Page): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    if (new URL(request.url()).origin !== LOCAL_TEST_ORIGIN) {
      await route.fallback();
      return;
    }
    if (request.method() !== "GET") {
      await reply(route, 501, {
        code: "unsupported_mock_operation",
        message: "This operation has no deterministic mock fixture.",
      });
      return;
    }

    const url = new URL(request.url());
    const fixtureUser =
      url.searchParams.get("fixture_user") === "demo" ? "demo" : "owner";
    switch (url.pathname) {
      case "/api/v1/about":
        await reply(route, 200, fixtureAbout);
        return;
      case "/api/v1/about/user":
        await reply(route, 200, {
          data: fixtureUsers[fixtureUser === "owner" ? 0 : 1],
        });
        return;
      case "/api/v1/accounts":
        await reply(route, 200, fixtureAccountsByUser[fixtureUser]);
        return;
      case "/api/v1/transactions":
        await reply(
          route,
          200,
          url.searchParams.get("fixture_page") === "large"
            ? makeLargeTransactionPage()
            : fixtureTransactionGroups,
        );
        return;
      case "/api/v1/recurring":
        await reply(route, 200, fixtureRecurrences);
        return;
      default:
        await reply(route, 501, {
          code: "unsupported_mock_operation",
          message: "This operation has no deterministic mock fixture.",
        });
    }
  });
}

async function reply(
  route: Route,
  status: number,
  payload: unknown,
): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: { "cache-control": "no-store" },
    body: JSON.stringify(payload),
  });
}
