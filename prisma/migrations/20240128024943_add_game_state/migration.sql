-- CreateTable
CREATE TABLE "lichess_games" (
    "id" TEXT NOT NULL,
    "farcasterThreadHash" TEXT NOT NULL,
    "gameStatus" TEXT,
    "gameResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lichess_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lichess_game_casts" (
    "id" TEXT NOT NULL,
    "userFid" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lichess_game_casts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lichess_game_casts" ADD CONSTRAINT "lichess_game_casts_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "lichess_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
