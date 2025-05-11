-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expired_at" TIMESTAMP(3),
ADD COLUMN     "payment_proof" TEXT,
ALTER COLUMN "payment_date" DROP NOT NULL;
