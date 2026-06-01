export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Order, WorkflowStage } from "@/lib/types";
import AppShell from "@/components/AppShell";
import OrderArchive from "@/components/OrderArchive";
import { orderWithCustomerInclude, serializeOrder } from "@/lib/customers";
import { getAppShellContext } from "@/lib/appShellData";
import { getArchiveStage } from "@/lib/workflow";

async function getPageData(): Promise<{
  archived: Order[];
  stages: WorkflowStage[];
  orderStats: Awaited<ReturnType<typeof getAppShellContext>>["orderStats"];
}> {
  const context = await getAppShellContext();
  const archiveSlug = getArchiveStage(context.stages).slug;
  const archivedRaw = await prisma.order.findMany({
    where: { status: archiveSlug },
    include: orderWithCustomerInclude,
    orderBy: { updatedAt: "desc" },
  });

  return {
    archived: archivedRaw.map(serializeOrder),
    stages: context.stages,
    orderStats: context.orderStats,
    shopSettings: context.shopSettings,
  };
}

export default async function ArchivePage() {
  let data = {
    archived: [] as Order[],
    stages: [] as WorkflowStage[],
    orderStats: { active: 0, archived: 0, urgent: 0, waitingFiles: 0 },
    shopSettings: null as Awaited<ReturnType<typeof getAppShellContext>>["shopSettings"] | null,
  };

  try {
    data = await getPageData();
  } catch (error) {
    console.error("Archive page error:", error);
  }

  return (
    <AppShell stages={data.stages} orderStats={data.orderStats} shopSettings={data.shopSettings}>
      <OrderArchive orders={data.archived} stages={data.stages} />
    </AppShell>
  );
}
