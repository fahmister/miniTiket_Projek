-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "coupon_code" TEXT,
ADD COLUMN     "point_used" INTEGER DEFAULT 0,
ADD COLUMN     "voucher_code" TEXT;
