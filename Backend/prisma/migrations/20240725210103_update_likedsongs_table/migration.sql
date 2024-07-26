-- DropForeignKey
ALTER TABLE "ProfileVisits" DROP CONSTRAINT "ProfileVisits_visitedId_fkey";

-- DropForeignKey
ALTER TABLE "ProfileVisits" DROP CONSTRAINT "ProfileVisits_visitorId_fkey";

-- AddForeignKey
ALTER TABLE "ProfileVisits" ADD CONSTRAINT "ProfileVisits_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVisits" ADD CONSTRAINT "ProfileVisits_visitedId_fkey" FOREIGN KEY ("visitedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
