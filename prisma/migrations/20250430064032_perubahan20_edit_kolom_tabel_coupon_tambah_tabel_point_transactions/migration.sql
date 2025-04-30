/*
  Warnings:

  - The primary key for the `Coupon` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Coupon` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `creatAt` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referral_coupon_id` to the `referral` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "referral" DROP CONSTRAINT "referral_referral_coupon_id_fkey";

-- AlterTable
ALTER TABLE "Coupon" DROP CONSTRAINT "Coupon_pkey",
ADD COLUMN     "creatAt" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "pointTransactions" ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "referral" DROP COLUMN "referral_coupon_id",
ADD COLUMN     "referral_coupon_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referral_coupon_id_fkey" FOREIGN KEY ("referral_coupon_id") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
