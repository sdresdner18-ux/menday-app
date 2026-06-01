import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.$executeRawUnsafe(`
    UPDATE "Order"
    SET status = 'InProgress'
    WHERE status = 'Printing'
  `);
  console.log(`Moved ${orders} order(s) from Printing to In Progress.`);

  const history = await prisma.$executeRawUnsafe(`
    UPDATE "StatusHistory"
    SET status = 'InProgress'
    WHERE status = 'Printing'
  `);
  console.log(`Updated ${history} status history row(s) from Printing to In Progress.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
