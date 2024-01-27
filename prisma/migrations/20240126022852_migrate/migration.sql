/*
  Warnings:

  - You are about to drop the column `isVerified` on the `lichess_info` table. All the data in the column will be lost.
  - You are about to drop the column `lichessId` on the `lichess_info` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `lichess_info` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `lichess_info` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `lichess_info` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userFid]` on the table `lichess_info` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userFid` to the `lichess_info` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `lichess_info` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "lichess_info" DROP CONSTRAINT "lichess_info_userId_fkey";

-- DropIndex
DROP INDEX "lichess_info_lichessId_key";

-- DropIndex
DROP INDEX "lichess_info_userId_key";

-- AlterTable
ALTER TABLE "lichess_info" DROP COLUMN "isVerified",
DROP COLUMN "lichessId",
DROP COLUMN "rating",
DROP COLUMN "title",
DROP COLUMN "userId",
ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "expiresIn" INTEGER,
ADD COLUMN     "tokenType" TEXT,
ADD COLUMN     "userFid" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "lichess_info_id_seq";

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("fid");

-- CreateIndex
CREATE UNIQUE INDEX "lichess_info_userFid_key" ON "lichess_info"("userFid");

-- AddForeignKey
ALTER TABLE "lichess_info" ADD CONSTRAINT "lichess_info_userFid_fkey" FOREIGN KEY ("userFid") REFERENCES "users"("fid") ON DELETE RESTRICT ON UPDATE CASCADE;
