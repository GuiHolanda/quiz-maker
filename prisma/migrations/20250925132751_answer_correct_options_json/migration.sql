/*
  Warnings:

  - You are about to alter the column `correctOptions` on the `Answer` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to drop the column `estimatedTime` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `numQuestions` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `qid` on the `Question` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Answer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionId" INTEGER NOT NULL,
    "correctOptions" JSONB NOT NULL,
    "explanations" TEXT NOT NULL,
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Answer" ("correctOptions", "explanations", "id", "questionId") SELECT "correctOptions", "explanations", "id", "questionId" FROM "Answer";
DROP TABLE "Answer";
ALTER TABLE "new_Answer" RENAME TO "Answer";
CREATE UNIQUE INDEX "Answer_questionId_key" ON "Answer"("questionId");
CREATE TABLE "new_Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "topicSubarea" TEXT,
    "difficulty" TEXT NOT NULL,
    "topic" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Question" ("correctCount", "createdAt", "difficulty", "id", "text", "topic", "topicSubarea") SELECT "correctCount", "createdAt", "difficulty", "id", "text", "topic", "topicSubarea" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
