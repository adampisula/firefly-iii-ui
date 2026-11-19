"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  ALL_NAV_LINKS,
  BOTTOM_NAV_LINKS,
  NAV_GROUPS,
  findNavLinkByPath,
  getNavIcon,
} from "@/lib/nav";
import type { AppearanceSettings } from "@/lib/appearance";
import {
  applyAppearance,
  clearAppearanceCache,
  getAppearanceServerSnapshot,
  getAppearanceSnapshot,
  hydrateAppearanceFromServer,
  saveAppearance,
  subscribeDisplayPreferences,
  writeAppearance,
} from "@/lib/appearance-store";
import { Button, Dialog, Status } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { AppearanceControls } from "@/components/appearance/appearance-controls";
import { usePrivacy } from "./privacy-context";
import styles from "./shell.module.css";

export interface ShellUser {
  email: string;
  role: string | null;
}

export interface AppShellProps {
  user: ShellUser | null;
  backendPublicUrl: string | null;
  children: ReactNode;
}

const DATE_RANGES = [
  { value: "this-month", label: "This month" },
  { value: "last-30-days", label: "Last 30 days" },
  { value: "year-to-date", label: "Year to date" },
  { value: "all", label: "All time" },
] as const;

function DateRangeSelector() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const current = params.get("range") ?? "this-month";

  return (
    <label className={styles.dateRange}>
      <span className={styles.dateRangeLabel}>Date range</span>
      <select
        className={styles.dateSelect}
        aria-label="Date range"
        value={current}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          if (event.target.value === "all") next.delete("range");
          else next.set("range", event.target.value);
          const query = next.toString();
          router.replace(query ? `${pathname}?${query}` : pathname, {
            scroll: false,
          });
        }}
      >
        {DATE_RANGES.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AppearanceDialog({
  open,
  onOpenChange,
  settings,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppearanceSettings;
  onChange: (settings: AppearanceSettings) => void;
}) {
  return (
    <Dialog open={open} title="Appearance" onOpenChange={onOpenChange}>
      <AppearanceControls settings={settings} onChange={onChange} compact />
    </Dialog>
  );
}

function UserMenu({
  user,
  backendPublicUrl,
}: {
  user: ShellUser | null;
  backendPublicUrl: string | null;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  const disconnect = async () => {
    setWorking(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      clearAppearanceCache();
      router.refresh();
    } finally {
      setWorking(false);
    }
  };

  const initials = user ? user.email.slice(0, 2).toUpperCase() : "FF";

  return (
    <details className={styles.userMenu}>
      <summary
        className={styles.userMenuSummary}
        aria-label="Account and native navigation"
      >
        <span className={styles.userMenuAvatar} aria-hidden="true">
          {initials}
        </span>
      </summary>
      <div className={styles.userMenuDropdown}>
        <p className={styles.userMenuHeader}>
          <strong>{user ? user.email : "Not connected"}</strong>
          <br />
          <span className={styles.userMenuRole}>
            {user
              ? (user.role ?? "Connected session")
              : "Connect to use Firefly"}
          </span>
        </p>
        <p className={styles.userMenuNote}>
          Firefly runs in English. Identity, security and token controls stay on
          the native backend and use a separate session.
        </p>
        {backendPublicUrl ? (
          <ul className={styles.userMenuLinks}>
            <li>
              <a href={`${backendPublicUrl}/profile`}>Native profile</a>
            </li>
            <li>
              <a href={`${backendPublicUrl}/profile/oauth`}>
                Native tokens and OAuth
              </a>
            </li>
            <li>
              <a href={`${backendPublicUrl}/mfa/index`}>
                Native multi-factor settings
              </a>
            </li>
          </ul>
        ) : (
          <p className={styles.userMenuNote}>
            Native account links are unavailable until BACKEND_PUBLIC_URL is
            configured.
          </p>
        )}
        <div className={styles.userMenuActions}>
          {user ? (
            <Button
              type="button"
              tone="quiet"
              disabled={working}
              onClick={disconnect}
            >
              {working ? "Disconnecting..." : "Disconnect this browser"}
            </Button>
          ) : (
            <Link className={styles.menuLinkButton} href="/">
              Connect account
            </Link>
          )}
        </div>
      </div>
    </details>
  );
}

export function AppShell({ user, backendPublicUrl, children }: AppShellProps) {
  const pathname = usePathname();
  const { privacy, setPrivacy } = usePrivacy();
  const settings = useSyncExternalStore(
    subscribeDisplayPreferences,
    getAppearanceSnapshot,
    getAppearanceServerSnapshot,
  );
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState<`/${string}` | null>(null);

  useEffect(() => {
    queueMicrotask(() => setPendingHref(null));
  }, [pathname]);

  useEffect(() => {
    if (user) {
      void hydrateAppearanceFromServer();
      return;
    }
    const current = getAppearanceSnapshot();
    if (current.background.hasImage) {
      writeAppearance({
        ...current,
        background: {
          hasImage: false,
          updatedAt: null,
          url: null,
          mime: null,
        },
      });
    }
  }, [user]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (settings.theme !== "system") return;
    const listener = () => applyAppearance(settings);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [settings]);

  const updateSettings = (next: AppearanceSettings) => {
    if (user) void saveAppearance(next);
    else writeAppearance(next);
  };

  const activeLink = findNavLinkByPath(pathname);
  const pageTitle = activeLink?.label ?? "Firefly";
  const pendingReached =
    pendingHref === null ||
    (pendingHref === "/" ? pathname === "/" : pathname.startsWith(pendingHref));
  const activeHref = pendingHref && !pendingReached ? pendingHref : pathname;
  const isActive = (href: `/${string}`) =>
    href === "/" ? activeHref === "/" : activeHref.startsWith(href);

  const nav = NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.map((link) => ({
      ...link,
      active: isActive(link.href),
    })),
  }));

  const userInitials = user ? user.email.slice(0, 2).toUpperCase() : "FF";
  const userName = user ? user.email.split("@")[0] : "Not connected";
  const userSub = user ? (user.role ?? "Connected") : "Connect an account";

  return (
    <div className={styles.frame}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <div
        className={styles.slab}
        data-rail-collapsed={railCollapsed || undefined}
      >
        <aside className={styles.rail} aria-label="Primary navigation">
          <div className={styles.railTop}>
            <Link className={styles.railBrand} href="/">
              <span className={styles.brandMark} aria-hidden="true">
                <Icon name="grid" size={22} />
              </span>
              <div className={styles.brandText}>
                <b className={styles.brandTitle}>Firefly</b>
                <small className={styles.brandSubtitle}>Personal finance</small>
              </div>
            </Link>
            <button
              className={styles.railFold}
              type="button"
              aria-label={railCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!railCollapsed}
              onClick={() => setRailCollapsed((c) => !c)}
            >
              <Icon name="panel" size={18} />
            </button>
          </div>

          <nav className={styles.railNav}>
            {nav.map((group) => (
              <div className={styles.navGroup} key={group.id}>
                <p className={styles.navGroupLabel}>{group.label}</p>
                <ul className={styles.navList}>
                  {group.links.map((link) => (
                    <li key={link.id}>
                      <Link
                        className={styles.navLink}
                        href={link.href}
                        aria-current={link.active ? "page" : undefined}
                        data-active={link.active || undefined}
                        data-planned={link.status === "planned" || undefined}
                        title={link.description}
                        aria-description={link.description}
                        onClick={() => setPendingHref(link.href)}
                      >
                        <span className={styles.navMark} aria-hidden="true">
                          <Icon name={getNavIcon(link.id)} size={18} />
                        </span>
                        <span className={styles.navLabel}>{link.label}</span>
                        {link.status === "planned" && !link.active ? (
                          <span className={styles.navPlanned}>Soon</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className={styles.userProfile}>
            <span className={styles.userAvatar} aria-hidden="true">
              {userInitials}
            </span>
            <div className={styles.userText}>
              <b>{userName}</b>
              <small>{userSub}</small>
            </div>
            <UserMenu user={user} backendPublicUrl={backendPublicUrl} />
          </div>
        </aside>

        <div className={styles.stage}>
          <header className={styles.mobileHeader}>
            <Link className={styles.mobileBrand} href="/">
              <span className={styles.brandMark} aria-hidden="true">
                <Icon name="grid" size={18} />
              </span>
              <span>Firefly</span>
            </Link>
            <div className={styles.mobileHeaderActions}>
              <Link
                className={styles.iconLink}
                href="/search"
                aria-label="Search"
              >
                <Icon name="search" size={18} />
              </Link>
              <button
                className={styles.iconButton}
                type="button"
                aria-pressed={privacy}
                aria-label={privacy ? "Show amounts" : "Hide amounts"}
                onClick={() => setPrivacy(!privacy)}
              >
                <Icon name={privacy ? "eye" : "eyeoff"} size={18} />
              </button>
              <button
                className={styles.iconButton}
                type="button"
                aria-label="Appearance"
                onClick={() => setAppearanceOpen(true)}
              >
                <Icon
                  name={settings.theme === "dark" ? "sun" : "moon"}
                  size={18}
                />
              </button>
              <UserMenu user={user} backendPublicUrl={backendPublicUrl} />
            </div>
          </header>

          <header className={styles.topbar}>
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <ol className={styles.breadcrumbList}>
                <li>
                  <Link href="/">Firefly</Link>
                </li>
                <li aria-current="page" title={activeLink?.description}>
                  {pageTitle}
                </li>
              </ol>
            </nav>

            <Link
              className={styles.searchPill}
              href="/search"
              aria-label="Search"
            >
              <Icon name="search" size={18} />
              <span>Search transactions, accounts, pages</span>
              <kbd className={styles.kbd}>⌘K</kbd>
            </Link>

            <div className={styles.topbarTools}>
              <Suspense
                fallback={<span className={styles.dateRangeFallback} />}
              >
                <DateRangeSelector />
              </Suspense>

              <Link
                className={styles.accentCircleBtn}
                href="/transactions/new"
                aria-label="New transaction"
              >
                <Icon name="plus" size={20} />
              </Link>

              <button
                className={styles.circleBtn}
                type="button"
                aria-label="Appearance"
                onClick={() => setAppearanceOpen(true)}
              >
                <Icon
                  name={settings.theme === "dark" ? "sun" : "moon"}
                  size={18}
                />
              </button>

              <button
                className={styles.circleBtn}
                type="button"
                aria-pressed={privacy}
                aria-label={privacy ? "Show amounts" : "Hide amounts"}
                onClick={() => setPrivacy(!privacy)}
              >
                <Icon name={privacy ? "eye" : "eyeoff"} size={18} />
              </button>

              <Link
                className={styles.circleBtn}
                href="/notifications"
                aria-label="Notifications"
              >
                <Icon name="bell" size={18} />
              </Link>

              <div className={styles.topbarSep} />

              <UserMenu user={user} backendPublicUrl={backendPublicUrl} />
            </div>
          </header>

          <main className={styles.main} id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>

      <nav className={styles.bottomNav} aria-label="Frequent destinations">
        {BOTTOM_NAV_LINKS.map((link) => (
          <Link
            className={styles.bottomLink}
            key={link.id}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
            data-active={isActive(link.href) || undefined}
            title={link.description}
            aria-description={link.description}
            onClick={() => setPendingHref(link.href)}
          >
            <span className={styles.navMark} aria-hidden="true">
              <Icon name={getNavIcon(link.id)} size={18} />
            </span>
            <span>{link.label}</span>
          </Link>
        ))}
        <button
          className={styles.bottomLink}
          type="button"
          onClick={() => setMoreOpen(true)}
        >
          <span className={styles.navMark} aria-hidden="true">
            <Icon name="plus" size={18} />
          </span>
          <span>More</span>
        </button>
      </nav>

      <AppearanceDialog
        open={appearanceOpen}
        onOpenChange={setAppearanceOpen}
        settings={settings}
        onChange={updateSettings}
      />

      <Dialog open={moreOpen} title="All sections" onOpenChange={setMoreOpen}>
        <div className={styles.moreGroups}>
          {NAV_GROUPS.map((group) => (
            <section key={group.id}>
              <h3 className={styles.moreGroupTitle}>{group.label}</h3>
              <ul className={styles.moreList}>
                {group.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      className={styles.moreLink}
                      href={link.href}
                      title={link.description}
                      aria-description={link.description}
                      onClick={() => {
                        setPendingHref(link.href);
                        setMoreOpen(false);
                      }}
                    >
                      <span>{link.label}</span>
                      {link.status === "planned" ? (
                        <Status kind="neutral">Soon</Status>
                      ) : null}
                    </Link>
                    <p className={styles.moreDescription}>{link.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className={styles.userMenuNote}>
          Sections marked Soon are not simulated with financial data. Available
          pages read the existing Firefly API.
        </p>
      </Dialog>

      <span className={styles.srOnly} aria-live="polite">
        {privacy ? "Amounts are hidden" : "Amounts are visible"}
      </span>
    </div>
  );
}

export const ALL_SHELL_NAV = ALL_NAV_LINKS;
