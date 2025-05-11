/*
  Warnings:

  - You are about to drop the column `payment_date` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "payment_date",
ADD COLUMN     "doku_invoice" TEXT,
ADD COLUMN     "doku_payment_id" TEXT,
ADD COLUMN     "doku_payment_url" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ALTER COLUMN "payment_method" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'waiting_for_payment';
