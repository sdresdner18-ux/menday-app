import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function generateToken() {
  return randomBytes(16).toString("hex");
}

async function main() {
  const orders = await prisma.order.findMany({
    where: { trackingToken: "" },
    select: { id: true },
  });

  if (orders.length === 0) {
    console.log("All orders already have tracking tokens.");
    return;
  }

  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { trackingToken: generateToken() },
    });
  }

  console.log(`Backfilled tracking tokens for ${orders.length} order(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
