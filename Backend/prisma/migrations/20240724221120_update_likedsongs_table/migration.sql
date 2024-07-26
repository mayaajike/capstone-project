/*
  Warnings:

  - You are about to drop the `_LikedSongsToTracks` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `trackId` to the `LikedSongs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_LikedSongsToTracks" DROP CONSTRAINT "_LikedSongsToTracks_A_fkey";

-- DropForeignKey
ALTER TABLE "_LikedSongsToTracks" DROP CONSTRAINT "_LikedSongsToTracks_B_fkey";

-- AlterTable
ALTER TABLE "LikedSongs" ADD COLUMN     "trackId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_LikedSongsToTracks";

-- AddForeignKey
ALTER TABLE "LikedSongs" ADD CONSTRAINT "LikedSongs_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
