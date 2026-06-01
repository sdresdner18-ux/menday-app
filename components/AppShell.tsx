"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Order, WorkflowStage } from "@/lib/types";
import { useTheme } from "./ThemeProvider";
import NewOrderModal from "./NewOrderModal";
import SignOutButton from "./SignOutButton";
import { getArchiveStage } from "@/lib/workflow-shared";
import { isAuthConfigured } from "@/lib/auth-config";

interface Props {
  children: React.ReactNode;
  orders: Order[];
  stages?: WorkflowStage[];
}

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

export default function AppShell({ children, orders, stages = [] }: Props) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const archiveSlug = stages.length ? getArchiveStage(stages).slug : "completed";
  const waitingFilesSlug =
    stages.find((s) => s.slug === "waiting-for-files")?.slug ?? null;

  const active = orders.filter((o) => o.status !== archiveSlug).length;
  const archived = orders.filter((o) => o.status === archiveSlug).length;
  const urgent = orders.filter((o) => o.priority === "Urgent").length;
  const waitingFiles = waitingFilesSlug
    ? orders.filter((o) => o.status === waitingFilesSlug).length
    : 0;
  const authEnabled = isAuthConfigured();

  return (
    <div className="min-h-screen text-gray-900 dark:text-[var(--dm-text)]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="dm-chrome hidden w-[72px] flex-col items-center gap-2 border-r py-6 md:flex">
          <Link href="/" className="mb-6 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-amber-400 shadow-glass-sm transition-all duration-smooth ease-smooth-out group-hover:scale-105 group-hover:shadow-glow">
              <span className="text-sm font-black text-white">M</span>
            </div>
          </Link>

          <NavIcon
            href="/"
            active={pathname === "/"}
            label="Production Board"
            icon="▦"
          />
          <NavIcon
            href="/customers"
            active={pathname.startsWith("/customers")}
            label="Customers"
            icon="◎"
          />
          <NavIcon
            href="/calendar"
            active={pathname.startsWith("/calendar")}
            label="Schedule"
            icon="◷"
          />
          <NavIcon
            href="/archive"
            active={pathname.startsWith("/archive")}
            label="Past Orders"
            icon="▤"
          />
          <NavIcon
            href="/settings/workflow"
            active={pathname.startsWith("/settings/workflow")}
            label="Customize Workflow"
            icon="⚙"
          />
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="dm-chrome sticky top-0 z-40 border-b px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-amber-400">
                  <span className="text-sm font-black text-white">M</span>
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">
                    <span className="text-violet-500 dark:text-violet-400">Mendy</span>
                    <span className="text-amber-500">.</span>
                  </h1>
                  <p className="text-xs text-muted">
                    Order management
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="hidden lg:flex items-center gap-2">
                  <StatPill label="Active" value={active} accent="purple" />
                  <StatPill label="Archived" value={archived} accent="green" />
                  <StatPill label="Urgent" value={urgent} accent="red" />
                  <StatPill label="Waiting Files" value={waitingFiles} accent="yellow" />
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

                <NewOrderModal stages={stages} />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
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
