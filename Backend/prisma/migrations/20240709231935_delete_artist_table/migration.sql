/*
  Warnings:

  - You are about to drop the `Artist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Artist" DROP CONSTRAINT "Artist_trackId_fkey";

-- AlterTable
ALTER TABLE "Tracks" ADD COLUMN     "artist" TEXT[];

-- DropTable
DROP TABLE "Artist";
