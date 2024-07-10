/*
  Warnings:

  - You are about to drop the column `trackId` on the `NowListening` table. All the data in the column will be lost.
  - You are about to drop the column `artist` on the `Tracks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "NowListening_userId_idx";

-- AlterTable
ALTER TABLE "NowListening" DROP COLUMN "trackId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Tracks" DROP COLUMN "artist",
ADD COLUMN     "nowListeningId" TEXT;

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NowListening_userId_createdAt_idx" ON "NowListening"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Tracks" ADD CONSTRAINT "Tracks_nowListeningId_fkey" FOREIGN KEY ("nowListeningId") REFERENCES "NowListening"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
