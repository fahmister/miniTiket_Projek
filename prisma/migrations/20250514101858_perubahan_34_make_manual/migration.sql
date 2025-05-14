/*
  Warnings:

  - You are about to drop the column `doku_invoice` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `doku_payment_id` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `doku_payment_url` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Transaction_doku_invoice_key";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "doku_invoice",
DROP COLUMN "doku_payment_id",
DROP COLUMN "doku_payment_url",
ADD COLUMN     "payment_proof" TEXT;
