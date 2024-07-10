/*
  Warnings:

  - You are about to drop the column `nowListeningId` on the `Tracks` table. All the data in the column will be lost.
  - You are about to drop the `NowListening` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NowListening" DROP CONSTRAINT "NowListening_userId_fkey";

-- DropForeignKey
ALTER TABLE "Tracks" DROP CONSTRAINT "Tracks_nowListeningId_fkey";

-- AlterTable
ALTER TABLE "Tracks" DROP COLUMN "nowListeningId";

-- DropTable
DROP TABLE "NowListening";
