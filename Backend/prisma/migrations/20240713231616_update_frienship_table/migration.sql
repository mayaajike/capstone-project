/*
  Warnings:

  - You are about to drop the column `confirmed` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedId` on the `Friendship` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_confirmedId_fkey";

-- AlterTable
ALTER TABLE "Friendship" DROP COLUMN "confirmed",
DROP COLUMN "confirmedId",
ADD COLUMN     "confirmedFriendshipsId" TEXT;

-- CreateTable
CREATE TABLE "ConfirmedFriendship" (
    "id" TEXT NOT NULL,
    "friendshipId" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,

    CONSTRAINT "ConfirmedFriendship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfirmedFriendship_friendshipId_key" ON "ConfirmedFriendship"("friendshipId");

-- AddForeignKey
ALTER TABLE "ConfirmedFriendship" ADD CONSTRAINT "ConfirmedFriendship_friendshipId_fkey" FOREIGN KEY ("friendshipId") REFERENCES "Friendship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfirmedFriendship" ADD CONSTRAINT "ConfirmedFriendship_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfirmedFriendship" ADD CONSTRAINT "ConfirmedFriendship_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
