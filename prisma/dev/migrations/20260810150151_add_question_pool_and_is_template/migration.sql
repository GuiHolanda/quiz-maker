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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "year" INTEGER,
    "key" TEXT,
    "totalQuestions" INTEGER NOT NULL,
    "examDurationMinutes" INTEGER,
    "passingScore" REAL,
    "providerId" TEXT,
    "examBoardId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Exam_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exam_examBoardId_fkey" FOREIGN KEY ("examBoardId") REFERENCES "ExamBoard" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Exam" ("createdAt", "examBoardId", "examDurationMinutes", "id", "key", "name", "passingScore", "providerId", "role", "totalQuestions", "type", "updatedAt", "userId", "year") SELECT "createdAt", "examBoardId", "examDurationMinutes", "id", "key", "name", "passingScore", "providerId", "role", "totalQuestions", "type", "updatedAt", "userId", "year" FROM "Exam";
DROP TABLE "Exam";
ALTER TABLE "new_Exam" RENAME TO "Exam";
CREATE UNIQUE INDEX "Exam_userId_type_name_role_year_key" ON "Exam"("userId", "type", "name", "role", "year");
CREATE TABLE "new_ExamQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "sectionName" TEXT NOT NULL,
    "topicName" TEXT,
    "examId" TEXT,
    "sectionId" TEXT,
    "topicId" TEXT,
    "userId" TEXT,
    "poolId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExamQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExamQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExamTopic" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExamQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamQuestion_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "QuestionPool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ExamQuestion" ("correctCount", "createdAt", "difficulty", "examId", "examName", "id", "sectionId", "sectionName", "text", "topicId", "topicName", "userId") SELECT "correctCount", "createdAt", "difficulty", "examId", "examName", "id", "sectionId", "sectionName", "text", "topicId", "topicName", "userId" FROM "ExamQuestion";
DROP TABLE "ExamQuestion";
ALTER TABLE "new_ExamQuestion" RENAME TO "ExamQuestion";
CREATE INDEX "ExamQuestion_examId_idx" ON "ExamQuestion"("examId");
CREATE INDEX "ExamQuestion_sectionId_idx" ON "ExamQuestion"("sectionId");
CREATE INDEX "ExamQuestion_topicId_idx" ON "ExamQuestion"("topicId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPool_type_providerId_examBoardId_sectionName_topicName_key" ON "QuestionPool"("type", "providerId", "examBoardId", "sectionName", "topicName");
