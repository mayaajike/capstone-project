-- AlterTable
ALTER TABLE "User" ALTER COLUMN "accessToken" DROP NOT NULL,
ALTER COLUMN "accessToken" DROP DEFAULT,
ALTER COLUMN "refreshToken" DROP NOT NULL,
ALTER COLUMN "refreshToken" DROP DEFAULT;