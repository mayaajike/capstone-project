/*
  Warnings:

  - You are about to drop the column `spotifyUri` on the `SpotifyAccount` table. All the data in the column will be lost.
  - Added the required column `spotifyUrl` to the `SpotifyAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpotifyAccount" DROP COLUMN "spotifyUri",
ADD COLUMN     "spotifyUrl" TEXT NOT NULL;
