/*
  Warnings:

  - Added the required column `is_Verified` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "is_Verified" BOOLEAN NOT NULL;
