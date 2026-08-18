-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "customQuotaOverride", "email", "emailVerified", "id", "image", "name", "password", "periodStartDate", "plan", "questionsGeneratedThisPeriod", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus") SELECT "createdAt", "customQuotaOverride", "email", "emailVerified", "id", "image", "name", "password", "periodStartDate", "plan", "questionsGeneratedThisPeriod", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
