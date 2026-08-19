-- CreateTable
CREATE TABLE "AutoConfigJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "seedName" TEXT NOT NULL,
    "seedKey" TEXT,
    "seedProvider" TEXT,
    "seedBoard" TEXT,
    "seedRole" TEXT,
    "seedYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "stage" TEXT,
    "resultJson" TEXT,
    "errorMessage" TEXT,
    "errorType" TEXT,
    "usageLogId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutoConfigJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AutoConfigJob_userId_idx" ON "AutoConfigJob"("userId");

-- CreateIndex
CREATE INDEX "AutoConfigJob_status_idx" ON "AutoConfigJob"("status");
