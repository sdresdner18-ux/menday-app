-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('New', 'NeedsClarification', 'WaitingForFiles', 'InProgress', 'Printing', 'Packed', 'Completed');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "quantity" INTEGER,
    "color" TEXT,
    "deadline" TIMESTAMP(3),
    "filesExpected" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'Medium',
    "status" "Status" NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
