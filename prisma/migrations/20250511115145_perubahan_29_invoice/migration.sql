/*
  Warnings:

  - You are about to drop the column `payment_proof` on the `Transaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[doku_invoice]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "payment_proof";

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_doku_invoice_key" ON "Transaction"("doku_invoice");
