-- CreateTable
CREATE TABLE "FullExamJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refKey" TEXT NOT NULL,
    "refName" TEXT NOT NULL,
    "examBoardName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "totalTopics" INTEGER NOT NULL,
    "doneTopics" INTEGER NOT NULL DEFAULT 0,
    "savedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FullExamJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FullExamJob_userId_idx" ON "FullExamJob"("userId");

-- AddForeignKey
ALTER TABLE "FullExamJob" ADD CONSTRAINT "FullExamJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
