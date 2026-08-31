-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MockExam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "examId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMinutes" INTEGER,
    "questionSource" TEXT NOT NULL DEFAULT 'library',
    CONSTRAINT "MockExam_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MockExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MockExam" ("createdAt", "examId", "id", "name", "userId") SELECT "createdAt", "examId", "id", "name", "userId" FROM "MockExam";
DROP TABLE "MockExam";
ALTER TABLE "new_MockExam" RENAME TO "MockExam";
CREATE TABLE "new_MockExamAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mockExamId" INTEGER NOT NULL,
    "userId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "score" INTEGER,
    "timedOut" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MockExamAttempt_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MockExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MockExamAttempt" ("finishedAt", "id", "mockExamId", "score", "startedAt", "userId") SELECT "finishedAt", "id", "mockExamId", "score", "startedAt", "userId" FROM "MockExamAttempt";
DROP TABLE "MockExamAttempt";
ALTER TABLE "new_MockExamAttempt" RENAME TO "MockExamAttempt";
CREATE TABLE "new_MockExamAttemptAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "attemptId" INTEGER NOT NULL,
    "mockExamQuestionId" INTEGER NOT NULL,
    "selectedOptions" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MockExamAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "MockExamAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MockExamAttemptAnswer_mockExamQuestionId_fkey" FOREIGN KEY ("mockExamQuestionId") REFERENCES "MockExamQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MockExamAttemptAnswer" ("attemptId", "id", "mockExamQuestionId", "selectedOptions") SELECT "attemptId", "id", "mockExamQuestionId", "selectedOptions" FROM "MockExamAttemptAnswer";
DROP TABLE "MockExamAttemptAnswer";
ALTER TABLE "new_MockExamAttemptAnswer" RENAME TO "MockExamAttemptAnswer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
