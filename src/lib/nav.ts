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
        status: "planned",
      },
      {
        id: "transactions",
        label: "Transactions",
        href: "/transactions",
        description:
          "Withdrawals, deposits, transfers, splits and reconciliation.",
        task: "CORE-03",
        status: "planned",
      },
      {
        id: "search",
        label: "Search",
        href: "/search",
        description:
          "Transaction search grammar and supported autocomplete families.",
        task: "CORE-01",
        status: "planned",
      },
      {
        id: "planning",
        label: "Planning",
        href: "/planning",
        description: "Budgets, subscriptions and piggy bank goals.",
        task: "CORE-07",
        status: "planned",
      },
      {
        id: "organize",
        label: "Organize",
        href: "/organize",
        description: "Categories, tags, object groups and attachments.",
        task: "CORE-10",
        status: "planned",
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
        status: "planned",
      },
      {
        id: "recurrences",
        label: "Recurrences",
        href: "/recurrences",
        description: "Recurring transaction schedules and generation.",
        task: "AUTO-02",
        status: "planned",
      },
      {
        id: "reports",
        label: "Reports",
        href: "/reports",
        description: "Report families and API insight views.",
        task: "ANA-03",
        status: "planned",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    links: [
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
