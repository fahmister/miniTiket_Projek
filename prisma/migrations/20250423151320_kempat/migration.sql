/*
  Warnings:

  - Changed the type of `expiry_points` on the `Users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "expiry_points",
ADD COLUMN     "expiry_points" TIMESTAMP(3) NOT NULL;
