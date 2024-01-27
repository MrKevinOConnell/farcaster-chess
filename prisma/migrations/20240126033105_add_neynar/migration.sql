-- CreateTable
CREATE TABLE "NeynarInfo" (
    "id" TEXT NOT NULL,
    "deadline" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "signer_uuid" TEXT NOT NULL,
    "signer_approval_url" TEXT NOT NULL,
    "fid" INTEGER,
    "user_id" TEXT,

    CONSTRAINT "NeynarInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NeynarInfo_signer_uuid_key" ON "NeynarInfo"("signer_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "NeynarInfo_user_id_key" ON "NeynarInfo"("user_id");

-- AddForeignKey
ALTER TABLE "NeynarInfo" ADD CONSTRAINT "NeynarInfo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("fid") ON DELETE CASCADE ON UPDATE CASCADE;
