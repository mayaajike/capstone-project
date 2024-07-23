/*
  Warnings:

  - Added the required column `albumCover` to the `Tracks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tracks" ADD COLUMN     "albumCover" TEXT NOT NULL;
