export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Order, WorkflowStage } from "@/lib/types";
import AppShell from "@/components/AppShell";
import PendingJobsList from "@/components/PendingJobsList";
import { orderWithTeamInclude, serializeOrder } from "@/lib/customers";
import { getAppShellContext } from "@/lib/appShellData";
import { getArchiveStage } from "@/lib/workflow";

async function getPageData(): Promise<{
  orders: Order[];
  stages: WorkflowStage[];
  orderStats: Awaited<ReturnType<typeof getAppShellContext>>["orderStats"];
}> {
  const context = await getAppShellContext();
  const archiveSlug = getArchiveStage(context.stages).slug;

  let ordersRaw;
  try {
    ordersRaw = await prisma.order.findMany({
      where: { status: { not: archiveSlug } },
      include: orderWithTeamInclude,
      orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    });
  } catch {
    ordersRaw = await prisma.order.findMany({
      where: { status: { not: archiveSlug } },
      include: { customer: true },
      orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    });
  }

  return {
    orders: ordersRaw.map(serializeOrder),
    stages: context.stages,
    orderStats: context.orderStats,
    shopSettings: context.shopSettings,
  };
}

export default async function JobsPage() {
  let data = {
    orders: [] as Order[],
    stages: [] as WorkflowStage[],
    orderStats: { active: 0, archived: 0, urgent: 0, waitingFiles: 0 },
    shopSettings: null as Awaited<ReturnType<typeof getAppShellContext>>["shopSettings"] | null,
  };

  try {
    data = await getPageData();
  } catch (error) {
    console.error("Jobs page error:", error);
  }

  return (
    <AppShell stages={data.stages} orderStats={data.orderStats} shopSettings={data.shopSettings}>
      <PendingJobsList orders={data.orders} stages={data.stages} />
    </AppShell>
  );
}
