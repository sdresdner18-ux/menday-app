export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import CustomerDirectory from "@/components/CustomerDirectory";
import { serializeCustomer } from "@/lib/customers";
import { getAppShellContext } from "@/lib/appShellData";

async function getPageData() {
  const [context, customersRaw] = await Promise.all([
    getAppShellContext(),
    prisma.customer.findMany({
      include: {
        _count: { select: { orders: true } },
        orders: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const orderCounts = Object.fromEntries(
    customersRaw.map((c) => [c.id, c._count.orders])
  );
  const latestOrderByCustomer = Object.fromEntries(
    customersRaw.map((c) => [c.id, c.orders[0]?.id ?? null])
  );

  return {
    customers: customersRaw.map(serializeCustomer),
    orderCounts,
    latestOrderByCustomer,
    ...context,
  };
}

export default async function CustomersPage() {
  let data = {
    customers: [] as ReturnType<typeof serializeCustomer>[],
    orderCounts: {} as Record<string, number>,
    latestOrderByCustomer: {} as Record<string, string | null>,
    stages: [] as Awaited<ReturnType<typeof getAppShellContext>>["stages"],
    orderStats: { active: 0, archived: 0, urgent: 0, waitingFiles: 0 },
  };

  try {
    data = await getPageData();
  } catch (error) {
    console.error("Customers page error:", error);
  }

  return (
    <AppShell stages={data.stages} orderStats={data.orderStats}>
      <CustomerDirectory
        customers={data.customers}
        orderCounts={data.orderCounts}
        latestOrderByCustomer={data.latestOrderByCustomer}
      />
    </AppShell>
  );
}
