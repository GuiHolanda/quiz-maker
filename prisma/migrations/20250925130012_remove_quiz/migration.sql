/*
  Warnings:

  - You are about to drop the `Quiz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `quizId` on the `Question` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Quiz";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "qid" INTEGER NOT NULL,
    "topic" TEXT,
    "numQuestions" INTEGER,
    "text" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "topicSubarea" TEXT,
    "difficulty" TEXT NOT NULL,
    "estimatedTime" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Question" ("correctCount", "difficulty", "estimatedTime", "id", "qid", "text", "topicSubarea") SELECT "correctCount", "difficulty", "estimatedTime", "id", "qid", "text", "topicSubarea" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
