/*
  Warnings:

  - You are about to drop the column `inputTokens` on the `UsageLog` table. All the data in the column will be lost.
  - You are about to drop the column `outputTokens` on the `UsageLog` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "UsageLogStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usageLogId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageLogStep_usageLogId_fkey" FOREIGN KEY ("usageLogId") REFERENCES "UsageLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "totalDurationMs" INTEGER,
    "refName" TEXT,
    "refKey" TEXT,
    "type" TEXT,
    "topicName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UsageLog" ("action", "count", "createdAt", "id", "refKey", "refName", "topicName", "type", "userId") SELECT "action", "count", "createdAt", "id", "refKey", "refName", "topicName", "type", "userId" FROM "UsageLog";
DROP TABLE "UsageLog";
ALTER TABLE "new_UsageLog" RENAME TO "UsageLog";
CREATE INDEX "UsageLog_userId_idx" ON "UsageLog"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "UsageLogStep_usageLogId_idx" ON "UsageLogStep"("usageLogId");
