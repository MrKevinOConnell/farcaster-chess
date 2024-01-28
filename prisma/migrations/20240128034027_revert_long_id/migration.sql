/*
  Warnings:

  - You are about to drop the column `fullGameId` on the `lichess_game_casts` table. All the data in the column will be lost.
  - You are about to drop the column `shortId` on the `lichess_games` table. All the data in the column will be lost.
  - Added the required column `gameId` to the `lichess_game_casts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "lichess_game_casts" DROP CONSTRAINT "lichess_game_casts_fullGameId_fkey";

-- AlterTable
ALTER TABLE "lichess_game_casts" DROP COLUMN "fullGameId",
ADD COLUMN     "gameId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lichess_games" DROP COLUMN "shortId";

-- AddForeignKey
ALTER TABLE "lichess_game_casts" ADD CONSTRAINT "lichess_game_casts_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "lichess_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
