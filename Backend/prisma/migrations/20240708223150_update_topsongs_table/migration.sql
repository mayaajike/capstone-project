/*
  Warnings:

  - You are about to drop the column `name` on the `TopSongs` table. All the data in the column will be lost.
  - You are about to drop the column `trackId` on the `TopSongs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TopSongs" DROP COLUMN "name",
DROP COLUMN "trackId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Tracks" (
    "id" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "topSongsId" TEXT,

    CONSTRAINT "Tracks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tracks" ADD CONSTRAINT "Tracks_topSongsId_fkey" FOREIGN KEY ("topSongsId") REFERENCES "TopSongs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
