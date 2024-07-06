/*
  Warnings:

  - Added the required column `name` to the `TopSongs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TopSongs" ADD COLUMN     "name" TEXT NOT NULL;
