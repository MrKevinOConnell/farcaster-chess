/*
  Warnings:

  - The primary key for the `lichess_info` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "lichess_info" DROP CONSTRAINT "lichess_info_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "lichess_info_pkey" PRIMARY KEY ("id");
