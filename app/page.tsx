export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Order, WorkflowStage } from "@/lib/types";
import AppShell from "@/components/AppShell";
import KanbanBoard from "@/components/KanbanBoard";
import AIParser from "@/components/AIParser";
import NewOrderModal from "@/components/NewOrderModal";
import { orderWithCustomerInclude, orderWithTeamInclude, serializeOrder } from "@/lib/customers";
import { getAppShellOrderStats, getCachedWorkflowStages } from "@/lib/appShellData";
import { getArchiveStage } from "@/lib/workflow";

async function getPageData(): Promise<{
  orders: Order[];
  stages: WorkflowStage[];
  orderStats: Awaited<ReturnType<typeof getAppShellOrderStats>>;
}> {
  let stages: WorkflowStage[] = [];
  let orderStats = { active: 0, archived: 0, urgent: 0, waitingFiles: 0 };

  try {
    stages = await getCachedWorkflowStages();
    orderStats = await getAppShellOrderStats(stages);
  } catch (error) {
    console.error("Failed to load workflow stages:", error);
  }

  let orders: Order[] = [];
  try {
    const ordersRaw = await prisma.order.findMany({
      include: orderWithTeamInclude,
      orderBy: { createdAt: "desc" },
    });
    orders = ordersRaw.map(serializeOrder);
  } catch (error) {
    console.error("Failed to load orders with team data:", error);
    try {
      const ordersRaw = await prisma.order.findMany({
        include: orderWithCustomerInclude,
        orderBy: { createdAt: "desc" },
      });
      orders = ordersRaw.map(serializeOrder);
    } catch (fallbackError) {
      console.error("Failed to load orders:", fallbackError);
    }
  }

  return { orders, stages, orderStats };
}

export default async function HomePage() {
  const { orders, stages, orderStats } = await getPageData();
  const archiveSlug = stages.length ? getArchiveStage(stages).slug : "completed";
  const activeOrders = orders.filter((o) => o.status !== archiveSlug);

  return (
    <AppShell stages={stages} orderStats={orderStats}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title mb-1">Production Board</p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {activeOrders.length} active order{activeOrders.length !== 1 ? "s" : ""}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NewOrderModal stages={stages} className="btn-primary" />
          <a href="/settings/workflow" className="btn-secondary text-sm">
            Customize workflow
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <KanbanBoard initialOrders={orders} stages={stages} />
        </div>
        <aside className="w-full shrink-0 xl:w-[min(100%,22rem)]">
          <AIParser />
        </aside>
      </div>
    </AppShell>
  );
}
