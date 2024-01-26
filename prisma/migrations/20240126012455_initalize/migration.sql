-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "fid" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "bio" TEXT,
    "displayName" TEXT NOT NULL,
    "pfpUrl" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lichess_info" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "lichessId" TEXT NOT NULL,
    "rating" INTEGER,
    "title" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lichess_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_fid_key" ON "users"("fid");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "lichess_info_userId_key" ON "lichess_info"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lichess_info_lichessId_key" ON "lichess_info"("lichessId");

-- AddForeignKey
ALTER TABLE "lichess_info" ADD CONSTRAINT "lichess_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
