-- CreateTable
CREATE TABLE "QuestionPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "providerId" TEXT,
    "examBoardId" TEXT,
    "sectionName" TEXT NOT NULL,
    "topicName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionPool_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QuestionPool_examBoardId_fkey" FOREIGN KEY ("examBoardId") REFERENCES "ExamBoard" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPool_type_providerId_examBoardId_sectionName_topicName_key" ON "QuestionPool"("type", "providerId", "examBoardId", "sectionName", "topicName");

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ExamQuestion" ADD COLUMN "poolId" TEXT;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "QuestionPool" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
