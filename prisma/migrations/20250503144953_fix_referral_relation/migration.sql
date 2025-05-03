/*
  Warnings:

  - The `referred_by` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_referred_by_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "referred_by",
ADD COLUMN     "referred_by" INTEGER;

-- CreateIndex
CREATE INDEX "users_referred_by_idx" ON "users"("referred_by");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
