/*
  Warnings:

  - You are about to drop the column `gameId` on the `lichess_game_casts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `lichess_games` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullGameId` to the `lichess_game_casts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shortId` to the `lichess_games` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "lichess_game_casts" DROP CONSTRAINT "lichess_game_casts_gameId_fkey";

-- AlterTable
ALTER TABLE "lichess_game_casts" DROP COLUMN "gameId",
ADD COLUMN     "fullGameId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lichess_games" ADD COLUMN     "shortId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "lichess_games_id_key" ON "lichess_games"("id");

-- AddForeignKey
ALTER TABLE "lichess_game_casts" ADD CONSTRAINT "lichess_game_casts_fullGameId_fkey" FOREIGN KEY ("fullGameId") REFERENCES "lichess_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
