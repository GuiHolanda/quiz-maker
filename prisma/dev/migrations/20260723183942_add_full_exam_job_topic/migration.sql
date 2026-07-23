-- CreateTable
CREATE TABLE "FullExamJobTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "savedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FullExamJobTopic_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "FullExamJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FullExamJobTopic_jobId_idx" ON "FullExamJobTopic"("jobId");
