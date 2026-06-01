export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Order } from "@/lib/types";
import AppShell from "@/components/AppShell";
import CustomerDirectory from "@/components/CustomerDirectory";
import { orderWithCustomerInclude, serializeCustomer, serializeOrder } from "@/lib/customers";
import { ensureWorkflowStages } from "@/lib/workflow";

async function getPageData(): Promise<{
  customers: ReturnType<typeof serializeCustomer>[];
  orderCounts: Record<string, number>;
  latestOrderByCustomer: Record<string, string | null>;
  orders: Order[];
  stages: Awaited<ReturnType<typeof ensureWorkflowStages>>;
}> {
  try {
    const [stages, customersRaw, ordersRaw] = await Promise.all([
      ensureWorkflowStages(),
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
      prisma.order.findMany({
        include: orderWithCustomerInclude,
        orderBy: { createdAt: "desc" },
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
      orders: ordersRaw.map(serializeOrder),
      stages,
    };
  } catch {
    return {
      customers: [],
      orderCounts: {},
      latestOrderByCustomer: {},
      orders: [],
      stages: [],
    };
  }
}

export default async function CustomersPage() {
  const { customers, orderCounts, latestOrderByCustomer, orders, stages } =
    await getPageData();

  return (
    <AppShell orders={orders} stages={stages}>
      <CustomerDirectory
        customers={customers}
        orderCounts={orderCounts}
        latestOrderByCustomer={latestOrderByCustomer}
      />
    </AppShell>
  );
}
