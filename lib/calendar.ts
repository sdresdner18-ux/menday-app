import { Order, Priority } from "./types";

export type CalendarView = "day" | "week" | "month";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return startOfDay(r);
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return startOfDay(r);
}

export function startOfWeek(d: Date): Date {
  return addDays(startOfDay(d), -startOfDay(d).getDay());
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function getMonthGrid(anchor: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(anchor));
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isPastDay(d: Date): boolean {
  return startOfDay(d).getTime() < startOfDay(new Date()).getTime();
}

export function sortOrdersByPriority(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) =>
      (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0)
  );
}

export function groupOrdersByDeadline(orders: Order[]): Map<string, Order[]> {
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    if (!order.deadline) continue;
    const key = order.deadline.slice(0, 10);
    const list = map.get(key) ?? [];
    list.push(order);
    map.set(key, list);
  }
  for (const key of Array.from(map.keys())) {
    map.set(key, sortOrdersByPriority(map.get(key) ?? []));
  }
  return map;
}

export function getOrdersForDay(
  ordersByDate: Map<string, Order[]>,
  day: Date
): Order[] {
  return ordersByDate.get(toDateKey(day)) ?? [];
}

export function getUnscheduledOrders(orders: Order[]): Order[] {
  return sortOrdersByPriority(orders.filter((o) => !o.deadline));
}

export function countDueInRange(
  ordersByDate: Map<string, Order[]>,
  start: Date,
  end: Date
): number {
  let count = 0;
  let cursor = startOfDay(start);
  const endTime = startOfDay(end).getTime();
  while (cursor.getTime() <= endTime) {
    count += getOrdersForDay(ordersByDate, cursor).length;
    cursor = addDays(cursor, 1);
  }
  return count;
}

export function countOverdue(activeOrders: Order[]): number {
  const today = startOfDay(new Date());
  return activeOrders.filter((o) => {
    if (!o.deadline) return false;
    return startOfDay(new Date(o.deadline)).getTime() < today.getTime();
  }).length;
}

export function formatDayHeading(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatWeekHeading(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth && sameYear) {
    return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  }
  if (sameYear) {
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${start.getFullYear()}`;
  }
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function formatMonthHeading(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatShortWeekday(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatShortMonthDay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function navigateDate(
  focusDate: Date,
  view: CalendarView,
  direction: -1 | 1
): Date {
  if (view === "day") return addDays(focusDate, direction);
  if (view === "week") return addDays(focusDate, direction * 7);
  return addMonths(focusDate, direction);
}

export function getViewHeading(focusDate: Date, view: CalendarView): string {
  if (view === "day") return formatDayHeading(focusDate);
  if (view === "week") {
    const days = getWeekDays(focusDate);
    return formatWeekHeading(days[0], days[6]);
  }
  return formatMonthHeading(focusDate);
}
