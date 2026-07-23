/*
  Warnings:

  - Added the required column `updatedAt` to the `Certification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PublicExam` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "FullExamJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refKey" TEXT NOT NULL,
    "refName" TEXT NOT NULL,
    "examBoardName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "totalTopics" INTEGER NOT NULL,
    "doneTopics" INTEGER NOT NULL DEFAULT 0,
    "savedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FullExamJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "provider" TEXT,
    "totalQuestions" INTEGER NOT NULL,
    "examDurationMinutes" INTEGER,
    "passingScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Certification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Certification" ("examDurationMinutes", "id", "key", "label", "passingScore", "provider", "totalQuestions", "userId") SELECT "examDurationMinutes", "id", "key", "label", "passingScore", "provider", "totalQuestions", "userId" FROM "Certification";
DROP TABLE "Certification";
ALTER TABLE "new_Certification" RENAME TO "Certification";
CREATE UNIQUE INDEX "Certification_userId_key_key" ON "Certification"("userId", "key");
CREATE TABLE "new_PublicExam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "year" INTEGER,
    "totalQuestions" INTEGER NOT NULL,
    "examDurationMinutes" INTEGER,
    "passingScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "examBoardId" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "PublicExam_examBoardId_fkey" FOREIGN KEY ("examBoardId") REFERENCES "ExamBoard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PublicExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PublicExam" ("examBoardId", "examDurationMinutes", "id", "name", "passingScore", "role", "totalQuestions", "userId", "year") SELECT "examBoardId", "examDurationMinutes", "id", "name", "passingScore", "role", "totalQuestions", "userId", "year" FROM "PublicExam";
DROP TABLE "PublicExam";
ALTER TABLE "new_PublicExam" RENAME TO "PublicExam";
CREATE UNIQUE INDEX "PublicExam_userId_name_year_key" ON "PublicExam"("userId", "name", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FullExamJob_userId_idx" ON "FullExamJob"("userId");
