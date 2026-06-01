import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const order = await prisma.order.findFirst({
  select: {
    id: true,
    trackingToken: true,
    customerName: true,
    customerPhone: true,
    orderNumber: true,
    status: true,
  },
});

console.log(JSON.stringify(order, null, 2));
await prisma.$disconnect();
