/*
  Warnings:

  - Added the required column `spotifyUri` to the `SpotifyAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpotifyAccount" ADD COLUMN     "spotifyUri" TEXT NOT NULL;
