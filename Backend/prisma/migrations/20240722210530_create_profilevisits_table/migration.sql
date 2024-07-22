-- CreateTable
CREATE TABLE "ProfileVisits" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "visitedId" TEXT NOT NULL,
    "visitedCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisited" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileVisits_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProfileVisits" ADD CONSTRAINT "ProfileVisits_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVisits" ADD CONSTRAINT "ProfileVisits_visitedId_fkey" FOREIGN KEY ("visitedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
