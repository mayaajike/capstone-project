/*
  Warnings:

  - You are about to drop the column `topSongsId` on the `Tracks` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tracks" DROP CONSTRAINT "Tracks_topSongsId_fkey";

-- AlterTable
ALTER TABLE "Tracks" DROP COLUMN "topSongsId";

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "trackId" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TopSongsToTracks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TopSongsToTracks_AB_unique" ON "_TopSongsToTracks"("A", "B");

-- CreateIndex
CREATE INDEX "_TopSongsToTracks_B_index" ON "_TopSongsToTracks"("B");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TopSongsToTracks" ADD CONSTRAINT "_TopSongsToTracks_A_fkey" FOREIGN KEY ("A") REFERENCES "TopSongs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TopSongsToTracks" ADD CONSTRAINT "_TopSongsToTracks_B_fkey" FOREIGN KEY ("B") REFERENCES "Tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
