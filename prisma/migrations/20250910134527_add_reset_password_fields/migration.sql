/*
  Warnings:

  - You are about to drop the column `resetTokenExp` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "resetTokenExp",
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);
