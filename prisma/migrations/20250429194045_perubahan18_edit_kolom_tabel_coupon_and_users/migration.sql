/*
  Warnings:

  - Added the required column `user_id` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `discount` on the `Coupon` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Percentage" AS ENUM ('Ten', 'Fifteen', 'Twenty', 'TwentyFive', 'Thirty', 'ThirtyFive', 'Forty', 'Fifty');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_used" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "user_id" INTEGER NOT NULL,
DROP COLUMN "discount",
ADD COLUMN     "discount" "Percentage" NOT NULL;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
