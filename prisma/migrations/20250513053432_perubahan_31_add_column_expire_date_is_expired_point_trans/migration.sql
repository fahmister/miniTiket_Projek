-- AlterTable
ALTER TABLE "PointTransactions" ADD COLUMN     "expiry_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_expired" BOOLEAN NOT NULL DEFAULT false;
