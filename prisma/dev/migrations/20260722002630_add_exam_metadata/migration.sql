/*
  Warnings:

  - Added the required column `totalQuestions` to the `Certification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalQuestions` to the `PublicExam` table without a default value. This is not possible if the table is not empty.

*/
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
    "userId" TEXT,
    CONSTRAINT "Certification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Certification" ("id", "key", "label", "provider", "userId", "totalQuestions") SELECT "id", "key", "label", "provider", "userId", 0 FROM "Certification";
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
    "examBoardId" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "PublicExam_examBoardId_fkey" FOREIGN KEY ("examBoardId") REFERENCES "ExamBoard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PublicExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PublicExam" ("examBoardId", "id", "name", "role", "userId", "year", "totalQuestions") SELECT "examBoardId", "id", "name", "role", "userId", "year", 0 FROM "PublicExam";
DROP TABLE "PublicExam";
ALTER TABLE "new_PublicExam" RENAME TO "PublicExam";
CREATE UNIQUE INDEX "PublicExam_userId_name_year_key" ON "PublicExam"("userId", "name", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
