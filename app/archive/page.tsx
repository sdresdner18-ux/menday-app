export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Order, WorkflowStage } from "@/lib/types";
import AppShell from "@/components/AppShell";
import OrderArchive from "@/components/OrderArchive";
import { orderWithCustomerInclude, serializeOrder } from "@/lib/customers";
import { ensureWorkflowStages, getArchiveStage } from "@/lib/workflow";

async function getPageData(): Promise<{
  archived: Order[];
  orders: Order[];
  stages: WorkflowStage[];
  dbError: string | null;
}> {
  try {
    const [stages, ordersRaw] = await Promise.all([
      ensureWorkflowStages(),
      prisma.order.findMany({
        include: orderWithCustomerInclude,
        orderBy: { updatedAt: "desc" },
      }),
    ]);
    const orders = ordersRaw.map(serializeOrder);
    const archiveSlug = getArchiveStage(stages).slug;
    return {
      archived: orders.filter((o) => o.status === archiveSlug),
      orders,
      stages,
      dbError: null,
    };
  } catch {
    return {
      archived: [],
      orders: [],
      stages: [],
      dbError:
        "Cannot connect to the database. Update DATABASE_URL in .env and run npm run db:push.",
    };
  }
}

export default async function ArchivePage() {
  const { archived, orders, stages, dbError } = await getPageData();

  return (
    <AppShell orders={orders} stages={stages} dbError={dbError}>
      <OrderArchive orders={archived} stages={stages} />
    </AppShell>
  );
}
