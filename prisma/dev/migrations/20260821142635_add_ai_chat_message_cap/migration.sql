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
    "aiChatMessagesThisPeriod" INTEGER NOT NULL DEFAULT 0,
    "periodStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "customQuotaOverride" INTEGER,
    "bonusQuestions" INTEGER NOT NULL DEFAULT 0,
    "sprintExpiresAt" DATETIME,
    "referralCode" TEXT,
    "referredByUserId" TEXT,
    "referralActivatedAt" DATETIME,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("autoConfigThisPeriod", "bonusQuestions", "createdAt", "customQuotaOverride", "email", "emailVerified", "id", "image", "name", "password", "periodStartDate", "plan", "questionsGeneratedThisPeriod", "referralActivatedAt", "referralCode", "referredByUserId", "sprintExpiresAt", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "utmCampaign", "utmMedium", "utmSource") SELECT "autoConfigThisPeriod", "bonusQuestions", "createdAt", "customQuotaOverride", "email", "emailVerified", "id", "image", "name", "password", "periodStartDate", "plan", "questionsGeneratedThisPeriod", "referralActivatedAt", "referralCode", "referredByUserId", "sprintExpiresAt", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "utmCampaign", "utmMedium", "utmSource" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
