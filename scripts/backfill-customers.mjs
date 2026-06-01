import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function findOrCreateCustomer(name, phone) {
  const trimmedName = name.trim();
  const phoneValue = phone?.trim() || null;

  if (phoneValue) {
    const byPhone = await prisma.customer.findFirst({
      where: { phone: phoneValue },
    });
    if (byPhone) {
      return prisma.customer.update({
        where: { id: byPhone.id },
        data: { name: trimmedName },
      });
    }
  }

  const byName = await prisma.customer.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: "insensitive",
      },
    },
  });

  if (byName) {
    if (phoneValue && !byName.phone) {
      return prisma.customer.update({
        where: { id: byName.id },
        data: { phone: phoneValue },
      });
    }
    return byName;
  }

  return prisma.customer.create({
    data: {
      name: trimmedName,
      phone: phoneValue,
    },
  });
}

async function main() {
  const orders = await prisma.order.findMany({
    where: { customerId: null },
  });

  for (const order of orders) {
    const customer = await findOrCreateCustomer(
      order.customerName,
      order.customerPhone
    );

    await prisma.order.update({
      where: { id: order.id },
      data: { customerId: customer.id },
    });

    console.log(`Linked order ${order.id} → customer ${customer.name}`);
  }

  console.log(`Backfilled ${orders.length} order(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
