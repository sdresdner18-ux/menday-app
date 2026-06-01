export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Order, WorkflowStage } from "@/lib/types";
import AppShell from "@/components/AppShell";
import ScheduleCalendar from "@/components/calendar/ScheduleCalendar";
import { orderWithCustomerInclude, serializeOrder } from "@/lib/customers";
import { getAppShellContext } from "@/lib/appShellData";

async function getPageData(): Promise<{
  orders: Order[];
  stages: WorkflowStage[];
  orderStats: Awaited<ReturnType<typeof getAppShellContext>>["orderStats"];
}> {
  const [context, ordersRaw] = await Promise.all([
    getAppShellContext(),
    prisma.order.findMany({
      include: orderWithCustomerInclude,
      orderBy: { deadline: "asc" },
    }),
  ]);
  return {
    orders: ordersRaw.map(serializeOrder),
    stages: context.stages,
    orderStats: context.orderStats,
  };
}

export default async function CalendarPage() {
  let data = {
    orders: [] as Order[],
    stages: [] as WorkflowStage[],
    orderStats: { active: 0, archived: 0, urgent: 0, waitingFiles: 0 },
  };

  try {
    data = await getPageData();
  } catch (error) {
    console.error("Calendar page error:", error);
  }

  return (
    <AppShell stages={data.stages} orderStats={data.orderStats}>
      <ScheduleCalendar orders={data.orders} stages={data.stages} />
    </AppShell>
  );
}
