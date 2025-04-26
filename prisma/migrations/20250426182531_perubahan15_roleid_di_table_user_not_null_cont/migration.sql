/*
  Warnings:

  - Made the column `referral_code` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "referral_code" SET NOT NULL;
