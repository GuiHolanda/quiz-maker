-- CreateTable
CREATE TABLE "FullExamJobTopic" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "savedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FullExamJobTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FullExamJobTopic_jobId_idx" ON "FullExamJobTopic"("jobId");

-- AddForeignKey
ALTER TABLE "FullExamJobTopic" ADD CONSTRAINT "FullExamJobTopic_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "FullExamJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
