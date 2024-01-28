/*
  Warnings:

  - Added the required column `castIndex` to the `lichess_game_casts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "lichess_game_casts" ADD COLUMN     "castIndex" INTEGER NOT NULL;
