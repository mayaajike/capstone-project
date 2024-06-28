/*
  Warnings:

  - Added the required column `confirmedId` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Friendship" ADD COLUMN     "confirmedId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_confirmedId_fkey" FOREIGN KEY ("confirmedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
