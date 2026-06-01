import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.deleteMany();
  const customers = await prisma.customer.deleteMany();
  const teamMembers = await prisma.teamMember.deleteMany();
  const stages = await prisma.workflowStage.count();

  console.log(`Removed ${orders.count} order(s).`);
  console.log(`Removed ${customers.count} customer(s).`);
  console.log(`Removed ${teamMembers.count} team member(s).`);
  console.log(`Kept ${stages} workflow stage(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
