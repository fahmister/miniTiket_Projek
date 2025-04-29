/*
  Warnings:

  - You are about to drop the column `discount` on the `Coupon` table. All the data in the column will be lost.
  - Added the required column `discount_percentage` to the `Coupon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Coupon" DROP COLUMN "discount",
ADD COLUMN     "discount_percentage" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "Percentage";

-- CreateTable
CREATE TABLE "pointTransactions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "pointTransactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pointTransactions" ADD CONSTRAINT "pointTransactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
