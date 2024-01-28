-- AlterTable
ALTER TABLE "lichess_games" ADD COLUMN     "completedFen" TEXT,
ADD COLUMN     "playerOneLichessName" TEXT,
ADD COLUMN     "playerTwoLichessName" TEXT;
