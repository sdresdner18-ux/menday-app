export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Order, WorkflowStage } from "@/lib/types";
import AppShell from "@/components/AppShell";
import ScheduleCalendar from "@/components/calendar/ScheduleCalendar";
import { orderWithCustomerInclude, serializeOrder } from "@/lib/customers";
import { ensureWorkflowStages } from "@/lib/workflow";

async function getPageData(): Promise<{
  orders: Order[];
  stages: WorkflowStage[];
  dbError: string | null;
}> {
  try {
    const [stages, ordersRaw] = await Promise.all([
      ensureWorkflowStages(),
      prisma.order.findMany({
        include: orderWithCustomerInclude,
        orderBy: { deadline: "asc" },
      }),
    ]);
    return {
      orders: ordersRaw.map(serializeOrder),
      stages,
      dbError: null,
    };
  } catch {
    return {
      orders: [],
      stages: [],
      dbError:
        "Cannot connect to the database. Update DATABASE_URL in .env and run npm run db:push.",
    };
  }
}

export default async function CalendarPage() {
  const { orders, stages, dbError } = await getPageData();

  return (
    <AppShell orders={orders} stages={stages} dbError={dbError}>
      <ScheduleCalendar orders={orders} stages={stages} />
    </AppShell>
  );
}
