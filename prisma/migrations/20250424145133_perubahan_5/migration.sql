/*
  Warnings:

  - You are about to drop the column `is_Verified` on the `Users` table. All the data in the column will be lost.
  - You are about to alter the column `password` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `referral_code` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.
  - A unique constraint covering the columns `[referral_code]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `name` on the `Role` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'event_organizer');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('waiting_for_payment', 'waiting_for_admin', 'confirmation', 'done', 'rejected', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE "RefferalStatus" AS ENUM ('pending', 'completed', 'expired');

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "name",
ADD COLUMN     "name" "UserRole" NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "is_Verified",
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "referral_code" SET DATA TYPE VARCHAR(30);

-- CreateTable
CREATE TABLE "referral" (
    "id" SERIAL NOT NULL,
    "referred_by" TEXT NOT NULL,
    "referred_user" TEXT NOT NULL,
    "referral_code_used" VARCHAR(30) NOT NULL,
    "status" "RefferalStatus" NOT NULL DEFAULT 'pending',
    "referrer_points_awarded" INTEGER NOT NULL DEFAULT 10000,
    "referral_coupon_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_referred_user_key" ON "referral"("referred_user");

-- CreateIndex
CREATE INDEX "referral_referral_code_used_idx" ON "referral"("referral_code_used");

-- CreateIndex
CREATE UNIQUE INDEX "Users_referral_code_key" ON "Users"("referral_code");

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referred_user_fkey" FOREIGN KEY ("referred_user") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referral_coupon_id_fkey" FOREIGN KEY ("referral_coupon_id") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
