/*
  Warnings:

  - You are about to drop the column `imager_url` on the `Event` table. All the data in the column will be lost.
  - Added the required column `image_url` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "imager_url",
ADD COLUMN     "image_url" TEXT NOT NULL;
