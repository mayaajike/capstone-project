-- DropForeignKey
ALTER TABLE "ConfirmedFriendship" DROP CONSTRAINT "ConfirmedFriendship_friendshipId_fkey";

-- AddForeignKey
ALTER TABLE "ConfirmedFriendship" ADD CONSTRAINT "ConfirmedFriendship_friendshipId_fkey" FOREIGN KEY ("friendshipId") REFERENCES "Friendship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
