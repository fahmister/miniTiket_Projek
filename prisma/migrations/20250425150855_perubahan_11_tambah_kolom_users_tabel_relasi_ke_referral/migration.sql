/*
  Warnings:

  - Made the column `referral_code` on table `Users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "referred_by" VARCHAR(30),
ALTER COLUMN "referral_code" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "Users"("referral_code") ON DELETE SET NULL ON UPDATE CASCADE;
