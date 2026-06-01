export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Order, WorkflowStage } from "@/lib/types";
import AppShell from "@/components/AppShell";
import KanbanBoard from "@/components/KanbanBoard";
import AIParser from "@/components/AIParser";
import { orderWithCustomerInclude, serializeOrder } from "@/lib/customers";
import { ensureWorkflowStages, getArchiveStage } from "@/lib/workflow";

async function getPageData(): Promise<{
  orders: Order[];
  stages: WorkflowStage[];
}> {
  try {
    const [stages, ordersRaw] = await Promise.all([
      ensureWorkflowStages(),
      prisma.order.findMany({
        include: orderWithCustomerInclude,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return {
      orders: ordersRaw.map(serializeOrder),
      stages,
    };
  } catch {
    return { orders: [], stages: [] };
  }
}

export default async function HomePage() {
  const { orders, stages } = await getPageData();
  const archiveSlug = stages.length ? getArchiveStage(stages).slug : "completed";
  const activeOrders = orders.filter((o) => o.status !== archiveSlug);

  return (
    <AppShell orders={orders} stages={stages}>
      <AIParser />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title mb-1">Production Board</p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {activeOrders.length} active order{activeOrders.length !== 1 ? "s" : ""}
          </h2>
        </div>
        <a
          href="/settings/workflow"
          className="btn-secondary text-sm"
        >
          Customize workflow
        </a>
      </div>

      <KanbanBoard initialOrders={orders} stages={stages} />
    </AppShell>
  );
}
