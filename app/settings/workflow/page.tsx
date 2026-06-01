export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Order, WorkflowStage } from "@/lib/types";
import AppShell from "@/components/AppShell";
import WorkflowEditor from "@/components/WorkflowEditor";
import { orderWithCustomerInclude, serializeOrder } from "@/lib/customers";
import { ensureWorkflowStages } from "@/lib/workflow";

async function getPageData(): Promise<{
  stages: WorkflowStage[];
  orders: Order[];
}> {
  try {
    const [stages, ordersRaw] = await Promise.all([
      ensureWorkflowStages(),
      prisma.order.findMany({
        include: orderWithCustomerInclude,
        orderBy: { updatedAt: "desc" },
      }),
    ]);
    return {
      stages,
      orders: ordersRaw.map(serializeOrder),
    };
  } catch {
    return { stages: [], orders: [] };
  }
}

export default async function WorkflowSettingsPage() {
  const { stages, orders } = await getPageData();

  return (
    <AppShell orders={orders} stages={stages}>
      <WorkflowEditor initialStages={stages} />
    </AppShell>
  );
}
