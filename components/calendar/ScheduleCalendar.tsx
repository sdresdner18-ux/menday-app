"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Order, WorkflowStage } from "@/lib/types";
import CalendarOrderChip from "./CalendarOrderChip";
import {
  CalendarView,
  countDueInRange,
  countOverdue,
  formatShortWeekday,
  getMonthGrid,
  getOrdersForDay,
  getUnscheduledOrders,
  getViewHeading,
  getWeekDays,
  groupOrdersByDeadline,
  isPastDay,
  isSameDay,
  isSameMonth,
  isToday,
  navigateDate,
  startOfDay,
  toDateKey,
} from "@/lib/calendar";
import { getArchiveStage } from "@/lib/workflow-shared";

interface Props {
  orders: Order[];
  stages: WorkflowStage[];
}

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export default function ScheduleCalendar({ orders, stages }: Props) {
  const archiveSlug = stages.length ? getArchiveStage(stages).slug : "completed";
  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== archiveSlug),
    [orders, archiveSlug]
  );
  const ordersByDate = useMemo(
    () => groupOrdersByDeadline(activeOrders),
    [activeOrders]
  );
  const unscheduled = useMemo(
    () => getUnscheduledOrders(activeOrders),
    [activeOrders]
  );

  const [view, setView] = useState<CalendarView>("month");
  const [focusDate, setFocusDate] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
    startOfDay(new Date())
  );

  const today = startOfDay(new Date());
  const dueToday = getOrdersForDay(ordersByDate, today).length;
  const overdue = countOverdue(activeOrders);
  const weekDays = getWeekDays(focusDate);
  const dueThisWeek = countDueInRange(ordersByDate, weekDays[0], weekDays[6]);
  const heading = getViewHeading(focusDate, view);
  const selectedOrders = selectedDate
    ? getOrdersForDay(ordersByDate, selectedDate)
    : [];

  function goToday() {
    const now = startOfDay(new Date());
    setFocusDate(now);
    setSelectedDate(now);
  }

  function shift(direction: -1 | 1) {
    setFocusDate((d) => navigateDate(d, view, direction));
  }

  function pickDay(day: Date) {
    setSelectedDate(day);
    setFocusDate(day);
    if (view === "month") {
      // keep month view but highlight selection
    }
  }

  function openDayView(day: Date) {
    setFocusDate(day);
    setSelectedDate(day);
    setView("day");
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{
          borderColor: "var(--dm-border)",
          background:
            "linear-gradient(135deg, color-mix(in srgb, #8b5cf6 8%, var(--dm-surface)) 0%, color-mix(in srgb, #f59e0b 6%, var(--dm-inset)) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-title mb-2">Schedule</p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your production calendar
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Every completion date at a glance. Plan your day, week, or month around
              what actually needs to ship.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Due today" value={dueToday} accent="#8b5cf6" />
            <StatCard
              label="Overdue"
              value={overdue}
              accent={overdue > 0 ? "#ef4444" : "#71717a"}
              alert={overdue > 0}
            />
            <StatCard label="This week" value={dueThisWeek} accent="#f59e0b" />
            <StatCard label="No date set" value={unscheduled.length} accent="#06b6d4" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => shift(-1)} className="btn-secondary px-3 py-2">
            ←
          </button>
          <button type="button" onClick={goToday} className="btn-secondary px-4 py-2 text-sm font-bold">
            Today
          </button>
          <button type="button" onClick={() => shift(1)} className="btn-secondary px-3 py-2">
            →
          </button>
          <h3 className="ml-1 text-lg font-extrabold tracking-tight sm:text-xl">{heading}</h3>
        </div>

        <div
          className="flex rounded-2xl border p-1"
          style={{ borderColor: "var(--dm-border)", background: "var(--dm-inset)" }}
        >
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-smooth ease-smooth-out ${
                view === v.id
                  ? "bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-glass-sm"
                  : "text-muted hover:text-[var(--dm-text)]"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {view === "month" && (
            <MonthView
              focusDate={focusDate}
              ordersByDate={ordersByDate}
              selectedDate={selectedDate}
              onSelectDay={pickDay}
              onOpenDay={openDayView}
            />
          )}
          {view === "week" && (
            <WeekView
              focusDate={focusDate}
              ordersByDate={ordersByDate}
              selectedDate={selectedDate}
              onSelectDay={pickDay}
            />
          )}
          {view === "day" && (
            <DayView
              day={focusDate}
              orders={getOrdersForDay(ordersByDate, focusDate)}
              stages={stages}
            />
          )}
        </div>

        {/* Side panel */}
        <aside className="space-y-4">
          <DayDetailPanel
            date={selectedDate}
            orders={selectedOrders}
            stages={stages}
            onOpenDay={() => selectedDate && openDayView(selectedDate)}
          />

          {unscheduled.length > 0 && (
            <div className="glass-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-sm font-extrabold">Unscheduled</h4>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-muted"
                  style={{ background: "var(--dm-inset)" }}
                >
                  {unscheduled.length}
                </span>
              </div>
              <p className="mb-3 text-xs text-muted">
                Active orders without a completion date yet.
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {unscheduled.slice(0, 8).map((order) => (
                  <CalendarOrderChip
                    key={order.id}
                    order={order}
                    stages={stages}
                    compact
                  />
                ))}
              </div>
              {unscheduled.length > 8 && (
                <p className="mt-2 text-center text-[11px] text-muted">
                  +{unscheduled.length - 8} more
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  alert,
}: {
  label: string;
  value: number;
  accent: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 backdrop-blur-sm ${
        alert ? "ring-1 ring-red-500/30" : ""
      }`}
      style={{
        borderColor: "var(--dm-border)",
        background: "color-mix(in srgb, var(--dm-surface) 75%, transparent)",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p
        className="mt-1 text-2xl font-black tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </p>
    </div>
  );
}

function MonthView({
  focusDate,
  ordersByDate,
  selectedDate,
  onSelectDay,
  onOpenDay,
}: {
  focusDate: Date;
  ordersByDate: Map<string, Order[]>;
  selectedDate: Date | null;
  onSelectDay: (d: Date) => void;
  onOpenDay: (d: Date) => void;
}) {
  const days = getMonthGrid(focusDate);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="glass-card overflow-hidden">
      <div
        className="grid grid-cols-7 border-b text-center text-[10px] font-bold uppercase tracking-wider text-muted"
        style={{ borderColor: "var(--dm-border)" }}
      >
        {weekdays.map((d) => (
          <div key={d} className="px-2 py-3">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayOrders = getOrdersForDay(ordersByDate, day);
          const inMonth = isSameMonth(day, focusDate);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const today = isToday(day);
          const past = isPastDay(day) && dayOrders.length > 0;

          return (
            <button
              key={toDateKey(day)}
              type="button"
              onClick={() => onSelectDay(day)}
              onDoubleClick={() => onOpenDay(day)}
              className={`group min-h-[100px] border-b border-r p-2 text-left transition-colors sm:min-h-[120px] ${
                selected ? "ring-2 ring-inset ring-violet-500/40" : ""
              } ${!inMonth ? "opacity-40" : ""}`}
              style={{
                borderColor: "var(--dm-border)",
                background: selected
                  ? "color-mix(in srgb, #8b5cf6 6%, var(--dm-surface))"
                  : today
                    ? "color-mix(in srgb, #8b5cf6 4%, var(--dm-inset))"
                    : "transparent",
              }}
            >
              <div className="mb-1.5 flex items-center justify-between gap-1">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                    today
                      ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-glass-sm"
                      : ""
                  }`}
                >
                  {day.getDate()}
                </span>
                {dayOrders.length > 0 && (
                  <span className="text-[10px] font-bold text-violet-500 dark:text-violet-300">
                    {dayOrders.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: `color-mix(in srgb, ${
                        order.priority === "Urgent"
                          ? "#ef4444"
                          : order.priority === "High"
                            ? "#f59e0b"
                            : "#8b5cf6"
                      } 14%, var(--dm-inset))`,
                      color: "var(--dm-text)",
                    }}
                  >
                    {order.customerName}
                  </div>
                ))}
                {dayOrders.length > 3 && (
                  <p className="text-[10px] font-bold text-muted">
                    +{dayOrders.length - 3} more
                  </p>
                )}
              </div>

              {past && (
                <span className="mt-1 inline-block text-[9px] font-bold uppercase text-red-500">
                  Overdue
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  focusDate,
  ordersByDate,
  selectedDate,
  onSelectDay,
}: {
  focusDate: Date;
  ordersByDate: Map<string, Order[]>;
  selectedDate: Date | null;
  onSelectDay: (d: Date) => void;
}) {
  const days = getWeekDays(focusDate);

  return (
    <div className="glass-card overflow-hidden">
      <div className="grid grid-cols-7 divide-x" style={{ borderColor: "var(--dm-border)" }}>
        {days.map((day) => {
          const dayOrders = getOrdersForDay(ordersByDate, day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const today = isToday(day);

          return (
            <div
              key={toDateKey(day)}
              className={`flex min-h-[420px] flex-col ${
                selected ? "ring-2 ring-inset ring-violet-500/30" : ""
              }`}
              style={{
                background: today
                  ? "color-mix(in srgb, #8b5cf6 5%, transparent)"
                  : undefined,
              }}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className="border-b px-2 py-3 text-center transition-colors hover:bg-violet-500/5"
                style={{ borderColor: "var(--dm-border)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  {formatShortWeekday(day)}
                </p>
                <p
                  className={`mt-1 text-lg font-black ${
                    today ? "text-violet-500 dark:text-violet-300" : ""
                  }`}
                >
                  {day.getDate()}
                </p>
              </button>

              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {dayOrders.length === 0 ? (
                  <p className="py-8 text-center text-[11px] text-muted">Clear</p>
                ) : (
                  dayOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="block truncate rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-glass-sm"
                      style={{
                        borderColor: "var(--dm-border)",
                        borderLeftWidth: 3,
                        borderLeftColor:
                          order.priority === "Urgent"
                            ? "#ef4444"
                            : order.priority === "High"
                              ? "#f59e0b"
                              : "#8b5cf6",
                        background: "var(--dm-inset)",
                      }}
                    >
                      {order.customerName}
                      <span className="mt-0.5 block truncate text-[10px] font-medium text-muted">
                        {order.projectType}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({
  day,
  orders,
  stages,
}: {
  day: Date;
  orders: Order[];
  stages: WorkflowStage[];
}) {
  const today = isToday(day);
  const past = isPastDay(day);

  return (
    <div className="space-y-4">
      <div
        className="glass-card overflow-hidden"
        style={{
          background: today
            ? "linear-gradient(180deg, color-mix(in srgb, #8b5cf6 8%, var(--dm-surface)) 0%, var(--dm-surface) 100%)"
            : undefined,
        }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: "var(--dm-border)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {today ? "Today" : past ? "Past due window" : "Upcoming"}
          </p>
          <h3 className="mt-1 text-2xl font-extrabold">
            {orders.length} order{orders.length !== 1 ? "s" : ""} due
          </h3>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-amber-400/20 text-3xl">
              ✦
            </div>
            <p className="text-lg font-extrabold">Nothing due this day</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Your schedule is open. Drag orders on the board or set completion dates to
              fill this day.
            </p>
            <Link href="/" className="btn-primary mt-6">
              Go to production board
            </Link>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {orders.map((order) => (
              <CalendarOrderChip key={order.id} order={order} stages={stages} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DayDetailPanel({
  date,
  orders,
  stages,
  onOpenDay,
}: {
  date: Date | null;
  orders: Order[];
  stages: WorkflowStage[];
  onOpenDay: () => void;
}) {
  if (!date) return null;

  const today = isToday(date);
  const label = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="glass-card sticky top-24 p-4">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {today ? "Today" : "Selected day"}
          </p>
          <h4 className="text-lg font-extrabold">{label}</h4>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-black tabular-nums"
          style={{
            background: "color-mix(in srgb, #8b5cf6 12%, var(--dm-inset))",
            color: "#8b5cf6",
          }}
        >
          {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No orders due</p>
      ) : (
        <div className="max-h-[360px] space-y-2 overflow-y-auto">
          {orders.map((order) => (
            <CalendarOrderChip key={order.id} order={order} stages={stages} compact />
          ))}
        </div>
      )}

      <button type="button" onClick={onOpenDay} className="btn-secondary mt-4 w-full text-sm">
        Open day view
      </button>
    </div>
  );
}
