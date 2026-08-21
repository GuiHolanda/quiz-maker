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
    "bonusQuestionsConsumed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UsageLog" ("action", "count", "createdAt", "id", "refKey", "refName", "topicName", "totalDurationMs", "type", "userId") SELECT "action", "count", "createdAt", "id", "refKey", "refName", "topicName", "totalDurationMs", "type", "userId" FROM "UsageLog";
DROP TABLE "UsageLog";
ALTER TABLE "new_UsageLog" RENAME TO "UsageLog";
CREATE INDEX "UsageLog_userId_idx" ON "UsageLog"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "questionsGeneratedThisPeriod" INTEGER NOT NULL DEFAULT 0,
    "autoConfigThisPeriod" INTEGER NOT NULL DEFAULT 0,
    "periodStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "customQuotaOverride" INTEGER,
    "bonusQuestions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("autoConfigThisPeriod", "createdAt", "customQuotaOverride", "email", "emailVerified", "id", "image", "name", "password", "periodStartDate", "plan", "questionsGeneratedThisPeriod", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus") SELECT "autoConfigThisPeriod", "createdAt", "customQuotaOverride", "email", "emailVerified", "id", "image", "name", "password", "periodStartDate", "plan", "questionsGeneratedThisPeriod", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
