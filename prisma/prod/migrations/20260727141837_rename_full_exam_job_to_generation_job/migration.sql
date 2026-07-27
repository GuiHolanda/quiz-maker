-- DropTable
DROP TABLE "FullExamJobTopic";

-- DropTable
DROP TABLE "FullExamJob";

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refKey" TEXT NOT NULL,
    "refName" TEXT NOT NULL,
    "examBoardName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "savedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJobTopic" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "savedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "pendingQuestionsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJobTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerationJob_userId_idx" ON "GenerationJob"("userId");

-- CreateIndex
CREATE INDEX "GenerationJobTopic_jobId_idx" ON "GenerationJobTopic"("jobId");

-- CreateIndex
CREATE INDEX "GenerationJobTopic_status_idx" ON "GenerationJobTopic"("status");

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJobTopic" ADD CONSTRAINT "GenerationJobTopic_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
