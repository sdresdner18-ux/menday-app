"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Order, WorkflowStage } from "@/lib/types";
import type { AppShellOrderStats } from "@/lib/appShellData";
import { useTheme } from "./ThemeProvider";
import NewOrderModal from "./NewOrderModal";
import SignOutButton from "./SignOutButton";
import ShopBrandMark from "./ShopBrandMark";
import { getArchiveStage } from "@/lib/workflow-shared";
import { isAuthConfigured } from "@/lib/auth-config";
import type { SerializedShopSettings } from "@/lib/shopSettings-shared";

interface Props {
  children: React.ReactNode;
  stages?: WorkflowStage[];
  orderStats?: AppShellOrderStats;
  shopSettings?: SerializedShopSettings | null;
  /** Prefer orderStats — avoids loading every order just for header counts. */
  orders?: Order[];
}

type NavItem = {
  href: string;
  label: string;
  icon: string;
  isActive: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Production Board",
    icon: "▦",
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/jobs",
    label: "Pending Jobs",
    icon: "☰",
    isActive: (pathname) => pathname.startsWith("/jobs"),
  },
  {
    href: "/customers",
    label: "Customers",
    icon: "◎",
    isActive: (pathname) => pathname.startsWith("/customers"),
  },
  {
    href: "/calendar",
    label: "Schedule",
    icon: "◷",
    isActive: (pathname) => pathname.startsWith("/calendar"),
  },
  {
    href: "/archive",
    label: "Past Orders",
    icon: "▤",
    isActive: (pathname) => pathname.startsWith("/archive"),
  },
  {
    href: "/settings/shop",
    label: "Shop Settings",
    icon: "🏪",
    isActive: (pathname) => pathname.startsWith("/settings/shop"),
  },
  {
    href: "/settings/workflow",
    label: "Customize Workflow",
    icon: "⚙",
    isActive: (pathname) => pathname.startsWith("/settings/workflow"),
  },
  {
    href: "/settings/team",
    label: "Team",
    icon: "👥",
    isActive: (pathname) => pathname.startsWith("/settings/team"),
  },
];

const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 4);

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "purple" | "yellow" | "green" | "red";
}) {
  const dots = {
    purple: "bg-violet-500",
    yellow: "bg-amber-400",
    green: "bg-emerald-500",
    red: "bg-red-500",
  };

  return (
    <div className="glass flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-smooth ease-smooth-out hover:shadow-glass-md">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dots[accent]}`} />
      <span className="text-lg font-extrabold leading-none">{value}</span>
      <span className="text-xs font-medium text-muted">{label}</span>
    </div>
  );
}

export default function AppShell({
  children,
  stages = [],
  orderStats,
  shopSettings,
  orders = [],
}: Props) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const archiveSlug = stages.length ? getArchiveStage(stages).slug : "completed";
  const waitingFilesSlug =
    stages.find((s) => s.slug === "waiting-for-files")?.slug ?? null;

  const active =
    orderStats?.active ??
    orders.filter((o) => o.status !== archiveSlug).length;
  const archived =
    orderStats?.archived ??
    orders.filter((o) => o.status === archiveSlug).length;
  const urgent =
    orderStats?.urgent ?? orders.filter((o) => o.priority === "Urgent").length;
  const waitingFiles =
    orderStats?.waitingFiles ??
    (waitingFilesSlug
      ? orders.filter((o) => o.status === waitingFilesSlug).length
      : 0);
  const authEnabled = isAuthConfigured();
  const brandSettings: SerializedShopSettings = shopSettings ?? {
    businessName: "Mendy",
    tagline: "Order management",
    phone: null,
    email: null,
    website: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    zip: null,
    invoiceFooter: null,
    paymentLink: null,
    paymentLabel: null,
    logoDataUrl: null,
    updatedAt: new Date(0).toISOString(),
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const stats = [
    { label: "Active", value: active, accent: "purple" as const },
    { label: "Archived", value: archived, accent: "green" as const },
    { label: "Urgent", value: urgent, accent: "red" as const },
    { label: "Waiting Files", value: waitingFiles, accent: "yellow" as const },
  ];

  return (
    <div className="min-h-screen text-gray-900 dark:text-[var(--dm-text)]">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="dm-chrome hidden w-[72px] flex-col items-center gap-2 border-r py-6 lg:flex">
          <Link href="/" className="mb-6 group" title={brandSettings.businessName}>
            {brandSettings.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brandSettings.logoDataUrl}
                alt={`${brandSettings.businessName} logo`}
                className="h-11 w-11 rounded-2xl object-contain bg-white/80 p-1 transition-all duration-smooth ease-smooth-out group-hover:scale-105"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-amber-400 shadow-glass-sm transition-all duration-smooth ease-smooth-out group-hover:scale-105 group-hover:shadow-glow">
                <span className="text-sm font-black text-white">
                  {brandSettings.businessName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>

          {NAV_ITEMS.map((item) => (
            <NavIcon
              key={item.href}
              href={item.href}
              active={item.isActive(pathname)}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="dm-chrome border-b px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                  className="glass flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-all duration-smooth ease-smooth-out hover:shadow-glass-md lg:hidden"
                >
                  ☰
                </button>

                <Link href="/" className="lg:hidden">
                  <ShopBrandMark
                    settings={{
                      ...brandSettings,
                      tagline: brandSettings.tagline ?? "Order management",
                    }}
                    size="sm"
                  />
                </Link>

                <div className="hidden min-w-0 lg:block">
                  <ShopBrandMark
                    settings={{
                      ...brandSettings,
                      tagline: brandSettings.tagline ?? "Order management",
                    }}
                    size="md"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="hidden items-center gap-2 xl:flex">
                  {stats.map((stat) => (
                    <StatPill key={stat.label} {...stat} />
                  ))}
                </div>

                <button
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  title={theme === "dark" ? "Light mode" : "Dark mode"}
                  className="glass flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all duration-smooth ease-smooth-out hover:shadow-glass-md"
                >
                  {theme === "dark" ? "☀️" : "🌙"}
                </button>

                {authEnabled && <SignOutButton />}

                {pathname !== "/" && <NewOrderModal stages={stages} />}
              </div>
            </div>
          </header>

          {/* Content — extra bottom padding on mobile/tablet for tab bar */}
          <main className="flex-1 overflow-x-hidden p-4 pb-24 sm:p-6 lg:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile / tablet slide-out menu */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          />

          <div
            className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col border-r shadow-glass-lg"
            style={{
              background: "var(--dm-chrome)",
              borderColor: "var(--dm-border)",
            }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-4"
              style={{ borderColor: "var(--dm-border)" }}
            >
              <div>
                <ShopBrandMark settings={brandSettings} size="sm" showTagline={false} />
                <p className="mt-1 text-xs text-muted">Menu</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="glass flex h-10 w-10 items-center justify-center rounded-xl text-lg"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <MobileNavLink
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      active={item.isActive(pathname)}
                      onNavigate={() => setMenuOpen(false)}
                    />
                  </li>
                ))}
              </ul>
            </nav>

            <div
              className="border-t p-4"
              style={{ borderColor: "var(--dm-border)" }}
            >
              <p className="section-title mb-3">Overview</p>
              <div className="grid grid-cols-2 gap-2">
                {stats.map((stat) => (
                  <StatPill key={stat.label} {...stat} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile / tablet bottom tab bar */}
      <nav
        className="dm-chrome fixed inset-x-0 bottom-0 z-40 border-t lg:hidden"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
          borderColor: "var(--dm-border)",
        }}
        aria-label="Main navigation"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors ${
                  item.isActive(pathname)
                    ? "text-violet-600 dark:text-violet-300"
                    : "text-muted hover:text-gray-700 dark:hover:text-[var(--dm-text)]"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="truncate">{shortNavLabel(item.label)}</span>
              </Link>
            </li>
          ))}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={`flex w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors ${
                menuOpen || NAV_ITEMS.slice(4).some((item) => item.isActive(pathname))
                  ? "text-violet-600 dark:text-violet-300"
                  : "text-muted hover:text-gray-700 dark:hover:text-[var(--dm-text)]"
              }`}
            >
              <span className="text-lg leading-none">⋯</span>
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function shortNavLabel(label: string): string {
  if (label === "Production Board") return "Board";
  if (label === "Pending Jobs") return "Jobs";
  return label.split(" ")[0] ?? label;
}

function NavIcon({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg transition-all duration-smooth ease-smooth-out ${
        active
          ? "glass-elevated text-violet-600 ring-1 ring-violet-500/30 dark:text-violet-300"
          : "text-gray-400 hover:text-gray-700 hover:shadow-glass-sm dark:hover:text-gray-100"
      }`}
    >
      {icon}
    </Link>
  );
}

function MobileNavLink({
  href,
  icon,
  label,
  active,
  onNavigate,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all ${
        active
          ? "glass-elevated text-violet-600 ring-1 ring-violet-500/30 dark:text-violet-300"
          : "text-gray-600 hover:bg-white/40 dark:text-[var(--dm-text-muted)] dark:hover:bg-white/5"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
