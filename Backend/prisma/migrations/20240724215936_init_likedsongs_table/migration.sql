-- CreateTable
CREATE TABLE "LikedSongs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LikedSongs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LikedSongsToTracks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_LikedSongsToTracks_AB_unique" ON "_LikedSongsToTracks"("A", "B");

-- CreateIndex
CREATE INDEX "_LikedSongsToTracks_B_index" ON "_LikedSongsToTracks"("B");

-- AddForeignKey
ALTER TABLE "LikedSongs" ADD CONSTRAINT "LikedSongs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LikedSongsToTracks" ADD CONSTRAINT "_LikedSongsToTracks_A_fkey" FOREIGN KEY ("A") REFERENCES "LikedSongs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LikedSongsToTracks" ADD CONSTRAINT "_LikedSongsToTracks_B_fkey" FOREIGN KEY ("B") REFERENCES "Tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
