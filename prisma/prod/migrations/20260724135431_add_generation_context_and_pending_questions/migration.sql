-- AlterTable
ALTER TABLE "FullExamJobTopic" ADD COLUMN "pendingQuestionsJson" TEXT;

-- AlterTable
ALTER TABLE "UsageLog" ADD COLUMN "refKey" TEXT;
ALTER TABLE "UsageLog" ADD COLUMN "refName" TEXT;
ALTER TABLE "UsageLog" ADD COLUMN "topicName" TEXT;
ALTER TABLE "UsageLog" ADD COLUMN "type" TEXT;
