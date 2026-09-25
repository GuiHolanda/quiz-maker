-- CreateTable
CREATE TABLE "QuestionReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examQuestionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "questionText" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "sectionName" TEXT,
    "topicName" TEXT,
    "surface" TEXT NOT NULL,
    "mockExamAttemptId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolutionNote" TEXT,
    "resolvedAt" DATETIME,
    "notifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT,
    "plan" TEXT,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "route" TEXT,
    "userAgent" TEXT,
    "locale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "QuestionReport_status_createdAt_idx" ON "QuestionReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QuestionReport_examQuestionId_idx" ON "QuestionReport"("examQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionReport_userId_examQuestionId_key" ON "QuestionReport"("userId", "examQuestionId");

-- CreateIndex
CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

