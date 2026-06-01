import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.create({
    data: {
      name: "Sarah Cohen",
      phone: "(555) 123-4567",
    },
  });

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      projectType: "Magnet",
      color: "Navy blue",
      orderNumber: "1042",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      filesExpected: false,
      status: "in-progress",
      statusHistory: {
        create: [
          {
            statusSlug: "new",
            statusLabel: "Order Received",
          },
          {
            statusSlug: "in-progress",
            statusLabel: "In Production",
          },
        ],
      },
    },
    select: {
      id: true,
      trackingToken: true,
      customerPhone: true,
    },
  });

  console.log(JSON.stringify(order, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
