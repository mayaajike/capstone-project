/*
  Warnings:

  - A unique constraint covering the columns `[spotifyId]` on the table `Tracks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tracks_spotifyId_key" ON "Tracks"("spotifyId");
