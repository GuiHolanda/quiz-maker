-- AlterTable: drop flat token columns and add totalDurationMs
ALTER TABLE "UsageLog" DROP COLUMN "inputTokens";
ALTER TABLE "UsageLog" DROP COLUMN "outputTokens";
ALTER TABLE "UsageLog" ADD COLUMN "totalDurationMs" INTEGER;

-- CreateTable
CREATE TABLE "UsageLogStep" (
    "id" TEXT NOT NULL,
    "usageLogId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLogStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageLogStep_usageLogId_idx" ON "UsageLogStep"("usageLogId");

-- AddForeignKey
ALTER TABLE "UsageLogStep" ADD CONSTRAINT "UsageLogStep_usageLogId_fkey" FOREIGN KEY ("usageLogId") REFERENCES "UsageLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
