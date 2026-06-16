-- CreateTable
CREATE TABLE "MockExam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "publicExamId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MockExam_publicExamId_fkey" FOREIGN KEY ("publicExamId") REFERENCES "PublicExam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MockExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MockExamSubjectConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mockExamId" INTEGER NOT NULL,
    "subjectName" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    CONSTRAINT "MockExamSubjectConfig_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MockExamQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mockExamId" INTEGER NOT NULL,
    "publicExamQuestionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "MockExamQuestion_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MockExamQuestion_publicExamQuestionId_fkey" FOREIGN KEY ("publicExamQuestionId") REFERENCES "PublicExamQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MockExamAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mockExamId" INTEGER NOT NULL,
    "userId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "score" INTEGER,
    CONSTRAINT "MockExamAttempt_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MockExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MockExamAttemptAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "attemptId" INTEGER NOT NULL,
    "mockExamQuestionId" INTEGER NOT NULL,
    "selectedOptions" TEXT NOT NULL,
    CONSTRAINT "MockExamAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "MockExamAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MockExamAttemptAnswer_mockExamQuestionId_fkey" FOREIGN KEY ("mockExamQuestionId") REFERENCES "MockExamQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
