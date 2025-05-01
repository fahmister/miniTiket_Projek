/*
  Warnings:

  - The `creatAt` column on the `Coupon` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `pointTransactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pointTransactions" DROP CONSTRAINT "pointTransactions_userId_fkey";

-- AlterTable
ALTER TABLE "Coupon" ALTER COLUMN "current_usage" SET DEFAULT 0,
DROP COLUMN "creatAt",
ADD COLUMN     "creatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "pointTransactions";

-- CreateTable
CREATE TABLE "PointTransactions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PointTransactions" ADD CONSTRAINT "PointTransactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
