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
} from "@/lib/nav";
import type { AppearanceSettings } from "@/lib/appearance";
import {
  applyAppearance,
  getAppearanceServerSnapshot,
  getAppearanceSnapshot,
  subscribeDisplayPreferences,
  writeAppearance,
} from "@/lib/appearance-store";
import { Button, Dialog, Status } from "@/components/ui/primitives";
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
      <div className={styles.appearanceForm}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="appearance-theme">
            Theme
          </label>
          <select
            className={styles.select}
            id="appearance-theme"
            value={settings.theme}
            onChange={(event) =>
              onChange({
                ...settings,
                theme: event.target.value as AppearanceSettings["theme"],
              })
            }
          >
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="appearance-frost">
            Glass frost: {Math.round(settings.frost * 100)}%
          </label>
          <input
            className={styles.range}
            id="appearance-frost"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.frost}
            onChange={(event) =>
              onChange({ ...settings, frost: Number(event.target.value) })
            }
          />
          <p className={styles.fieldHint}>
            Frost changes surface translucency only. Text contrast is preserved
            at both extremes.
          </p>
        </div>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={settings.reducedTransparency}
            onChange={(event) =>
              onChange({
                ...settings,
                reducedTransparency: event.target.checked,
              })
            }
          />
          <span>Use opaque surfaces (reduced transparency)</span>
        </label>
        <p className={styles.fieldHint}>
          Appearance preferences are stored in this browser only. Financial data
          is never stored in browser storage.
        </p>
      </div>
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

  async function disconnect() {
    setWorking(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } finally {
      setWorking(false);
      router.refresh();
    }
  }

  return (
    <details className={styles.userMenu}>
      <summary className={styles.userMenuSummary}>
        <span className={styles.avatar} aria-hidden="true">
          {user ? user.email.slice(0, 1).toUpperCase() : "F"}
        </span>
        <span className={styles.userMenuText}>
          {user ? user.email : "Not connected"}
        </span>
      </summary>
      <div className={styles.userMenuPanel}>
        {user ? (
          <p className={styles.userMenuMeta}>
            Connected as {user.email}
            {user.role ? ` (${user.role})` : ""}
          </p>
        ) : (
          <p className={styles.userMenuMeta}>
            No Firefly account is connected in this browser session.
          </p>
        )}
        <p className={styles.userMenuNote}>
          Firefly profile, password, MFA, security and token management live in
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

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (settings.theme !== "system") return;
    const listener = () => applyAppearance(settings);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [settings]);

  const updateSettings = (next: AppearanceSettings) => {
    writeAppearance(next);
  };

  const activeLink = findNavLinkByPath(pathname);
  const pageTitle = activeLink?.label ?? "Firefly";
  const isActive = (href: `/${string}`) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.map((link) => ({
      ...link,
      active: isActive(link.href),
    })),
  }));

  return (
    <div className={styles.frame}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <aside className={styles.rail} aria-label="Primary navigation">
        <Link className={styles.railBrand} href="/">
          <span className={styles.brandMark} aria-hidden="true">
            F
          </span>
          <span className={styles.brandName}>Firefly</span>
        </Link>
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
                    >
                      <span className={styles.navMark} aria-hidden="true">
                        {link.label.slice(0, 1)}
                      </span>
                      <span className={styles.navLabel}>{link.label}</span>
                      {link.status === "planned" ? (
                        <span className={styles.navPlanned}>Soon</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <p className={styles.railFooter}>
          Firefly III 6.7.9
          <br />
          Secure frontend
        </p>
      </aside>

      <div className={styles.body}>
        <header className={styles.mobileHeader}>
          <Link className={styles.mobileBrand} href="/">
            <span className={styles.brandMark} aria-hidden="true">
              F
            </span>
            <span>Firefly</span>
          </Link>
          <div className={styles.mobileHeaderActions}>
            <Link className={styles.iconLink} href="/search">
              Search
            </Link>
            <button
              className={styles.iconButton}
              type="button"
              aria-pressed={privacy}
              onClick={() => setPrivacy(!privacy)}
            >
              {privacy ? "Show amounts" : "Hide amounts"}
            </button>
            <button
              className={styles.iconButton}
              type="button"
              onClick={() => setAppearanceOpen(true)}
            >
              Appearance
            </button>
          </div>
        </header>

        <header className={styles.topbar}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <ol>
              <li>
                <Link href="/">Firefly</Link>
              </li>
              <li aria-current="page">{pageTitle}</li>
            </ol>
          </nav>
          <div className={styles.topbarActions}>
            <Suspense fallback={<span className={styles.dateRangeFallback} />}>
              <DateRangeSelector />
            </Suspense>
            <Link className={styles.iconLink} href="/search">
              Search
            </Link>
            <button
              className={styles.iconButton}
              type="button"
              aria-pressed={privacy}
              onClick={() => setPrivacy(!privacy)}
            >
              {privacy ? "Show amounts" : "Hide amounts"}
            </button>
            <button
              className={styles.iconButton}
              type="button"
              onClick={() => setAppearanceOpen(true)}
            >
              Appearance
            </button>
            <UserMenu user={user} backendPublicUrl={backendPublicUrl} />
          </div>
        </header>

        <main className={styles.main} id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>

      <nav className={styles.bottomNav} aria-label="Frequent destinations">
        {BOTTOM_NAV_LINKS.map((link) => (
          <Link
            className={styles.bottomLink}
            key={link.id}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
            data-active={isActive(link.href) || undefined}
          >
            <span className={styles.navMark} aria-hidden="true">
              {link.label.slice(0, 1)}
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
            +
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
                      onClick={() => setMoreOpen(false)}
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
          Sections marked Soon are planned domain work and do not show simulated
          financial data.
        </p>
      </Dialog>

      <span className={styles.srOnly} aria-live="polite">
        {privacy ? "Amounts are hidden" : "Amounts are visible"}
      </span>
    </div>
  );
}

export const ALL_SHELL_NAV = ALL_NAV_LINKS;
