export type NavStatus = "available" | "planned";

export interface NavLink {
  id: string;
  label: string;
  href: `/${string}`;
  description: string;
  task: string;
  status: NavStatus;
}

export interface NavGroup {
  id: string;
  label: string;
  links: readonly NavLink[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    links: [
      {
        id: "overview",
        label: "Overview",
        href: "/",
        description:
          "Balances, cash flow and recent activity backed by the Firefly API.",
        task: "ANA-01",
        status: "planned",
      },
    ],
  },
  {
    id: "money",
    label: "Money",
    links: [
      {
        id: "accounts",
        label: "Accounts",
        href: "/accounts",
        description:
          "Asset, expense, revenue and liability accounts with balances.",
        task: "CORE-02",
        status: "available",
      },
      {
        id: "transactions",
        label: "Transactions",
        href: "/transactions",
        description:
          "Withdrawals, deposits, transfers, splits and reconciliation.",
        task: "CORE-03",
        status: "available",
      },
      {
        id: "search",
        label: "Search",
        href: "/search",
        description:
          "Transaction search grammar and supported autocomplete families.",
        task: "CORE-01",
        status: "available",
      },
      {
        id: "budgets",
        label: "Budgets",
        href: "/budgets",
        description: "Budgets, period limits and available-budget context.",
        task: "CORE-07",
        status: "available",
      },
      {
        id: "subscriptions",
        label: "Subscriptions",
        href: "/subscriptions",
        description: "Subscriptions and bills with expected-payment timelines.",
        task: "CORE-08",
        status: "available",
      },
      {
        id: "piggy-banks",
        label: "Savings goals",
        href: "/piggy-banks",
        description: "Piggy banks, allocations and event history.",
        task: "CORE-09",
        status: "available",
      },
      {
        id: "categories",
        label: "Categories",
        href: "/categories",
        description: "Categories, tags and object groups.",
        task: "CORE-10",
        status: "available",
      },
      {
        id: "attachments",
        label: "Attachments",
        href: "/attachments",
        description: "Attachment metadata, upload, download and deletion.",
        task: "CORE-11",
        status: "available",
      },
      {
        id: "link-types",
        label: "Link types",
        href: "/link-types",
        description: "Transaction link types, directions and related journals.",
        task: "CORE-05",
        status: "available",
      },
    ],
  },
  {
    id: "automation",
    label: "Automation",
    links: [
      {
        id: "rules",
        label: "Rules",
        href: "/rules",
        description: "Rule groups, triggers, actions and testing.",
        task: "AUTO-01",
        status: "available",
      },
      {
        id: "webhooks",
        label: "Webhooks",
        href: "/webhooks",
        description: "Webhook configuration and delivery diagnostics.",
        task: "AUTO-03",
        status: "available",
      },
      {
        id: "recurrences",
        label: "Recurrences",
        href: "/recurrences",
        description: "Recurring transaction schedules and generation.",
        task: "AUTO-02",
        status: "available",
      },
      {
        id: "insights",
        label: "Insights",
        href: "/insights",
        description: "Expense, income and transfer aggregates.",
        task: "ANA-02",
        status: "available",
      },
      {
        id: "reports",
        label: "Reports",
        href: "/reports",
        description: "Report families remain residual unsupported.",
        task: "ANA-03",
        status: "available",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    links: [
      {
        id: "currencies",
        label: "Currencies",
        href: "/currencies",
        description: "Currencies, primary currency and dated exchange rates.",
        task: "SYS-01",
        status: "available",
      },
      {
        id: "preferences",
        label: "Preferences",
        href: "/preferences",
        description:
          "Locale, page size, dashboard defaults and optional fields.",
        task: "SYS-03",
        status: "available",
      },
      {
        id: "users",
        label: "Users",
        href: "/admin/users",
        description: "Owner user and system configuration controls.",
        task: "SYS-05",
        status: "available",
      },
      {
        id: "administration",
        label: "Administration",
        href: "/administration",
        description: "Administration title and primary currency.",
        task: "SYS-02",
        status: "available",
      },
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        description:
          "Appearance, connection, native account and security links.",
        task: "FND-06",
        status: "available",
      },
      {
        id: "export",
        label: "Export",
        href: "/export",
        description: "CSV exports and Data Importer handoff.",
        task: "SYS-06",
        status: "available",
      },
      {
        id: "notifications",
        label: "Notifications",
        href: "/notifications",
        description: "Native-only notification configuration (residual).",
        task: "SYS-09",
        status: "available",
      },
      {
        id: "maintenance",
        label: "Maintenance",
        href: "/maintenance",
        description: "Confirmed destructive data maintenance.",
        task: "SYS-07",
        status: "available",
      },
      {
        id: "help",
        label: "Help",
        href: "/help",
        description:
          "Version, connection diagnostics and native backend help links.",
        task: "FND-06",
        status: "available",
      },
    ],
  },
];

export const ALL_NAV_LINKS: readonly NavLink[] = NAV_GROUPS.flatMap(
  (group) => group.links,
);

export const BOTTOM_NAV_LINKS: readonly NavLink[] = ALL_NAV_LINKS.filter(
  (link) =>
    link.id === "overview" ||
    link.id === "accounts" ||
    link.id === "transactions" ||
    link.id === "planning",
);

export function findNavLinkByPath(pathname: string): NavLink | undefined {
  if (pathname === "/") return ALL_NAV_LINKS.find((link) => link.href === "/");
  return ALL_NAV_LINKS.find(
    (link) => link.href !== "/" && pathname.startsWith(link.href),
  );
}

export function findNavLinkBySegment(segment: string): NavLink | undefined {
  return ALL_NAV_LINKS.find((link) => link.href === `/${segment}`);
}

export function getNavIcon(id: string): string {
  switch (id) {
    case "overview":
      return "grid";
    case "accounts":
      return "card";
    case "transactions":
      return "swap";
    case "search":
      return "search";
    case "budgets":
      return "pie";
    case "subscriptions":
      return "repeat";
    case "piggy-banks":
      return "jar";
    case "categories":
    case "tags":
      return "tag";
    case "attachments":
      return "upload";
    case "object-groups":
      return "panel";
    case "link-types":
      return "swap";
    case "rules":
      return "bolt";
    case "webhooks":
      return "wifi";
    case "recurrences":
      return "repeat";
    case "insights":
    case "reports":
    case "exchange-rates":
      return "chart";
    case "currencies":
      return "percent";
    case "preferences":
      return "sparkle";
    case "users":
    case "admin-users":
      return "user";
    case "administration":
      return "users";
    case "settings":
      return "gear";
    case "export":
      return "download";
    case "notifications":
      return "bell";
    case "maintenance":
      return "refresh";
    case "help":
      return "help";
    default:
      return "grid";
  }
}

