-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PublicExamQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "publicExamName" TEXT NOT NULL,
    "examBoardName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "difficulty" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "publicExamId" TEXT,
    "subjectId" TEXT,
    "topicId" TEXT,
    CONSTRAINT "PublicExamQuestion_publicExamId_fkey" FOREIGN KEY ("publicExamId") REFERENCES "PublicExam" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicExamQuestion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "PublicExamSubject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicExamQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "PublicExamTopic" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicExamQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PublicExamQuestion" ("correctCount", "createdAt", "difficulty", "examBoardName", "id", "publicExamName", "subject", "text", "topic", "userId") SELECT "correctCount", "createdAt", "difficulty", "examBoardName", "id", "publicExamName", "subject", "text", "topic", "userId" FROM "PublicExamQuestion";
DROP TABLE "PublicExamQuestion";
ALTER TABLE "new_PublicExamQuestion" RENAME TO "PublicExamQuestion";
CREATE INDEX "PublicExamQuestion_publicExamId_idx" ON "PublicExamQuestion"("publicExamId");
CREATE INDEX "PublicExamQuestion_subjectId_idx" ON "PublicExamQuestion"("subjectId");
CREATE INDEX "PublicExamQuestion_topicId_idx" ON "PublicExamQuestion"("topicId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Backfill publicExamId by exact (name, userId) match against PublicExam.
UPDATE "PublicExamQuestion"
SET "publicExamId" = (
  SELECT "PublicExam"."id"
  FROM "PublicExam"
  WHERE "PublicExam"."name" = "PublicExamQuestion"."publicExamName"
    AND "PublicExam"."userId" = "PublicExamQuestion"."userId"
  LIMIT 1
)
WHERE "publicExamId" IS NULL
  AND "userId" IS NOT NULL;

-- Backfill subjectId by exact (publicExamId, name) match against PublicExamSubject.
UPDATE "PublicExamQuestion"
SET "subjectId" = (
  SELECT "PublicExamSubject"."id"
  FROM "PublicExamSubject"
  WHERE "PublicExamSubject"."publicExamId" = "PublicExamQuestion"."publicExamId"
    AND "PublicExamSubject"."name" = "PublicExamQuestion"."subject"
  LIMIT 1
)
WHERE "subjectId" IS NULL
  AND "publicExamId" IS NOT NULL;

-- Backfill topicId by exact (subjectId, name) match against PublicExamTopic.
UPDATE "PublicExamQuestion"
SET "topicId" = (
  SELECT "PublicExamTopic"."id"
  FROM "PublicExamTopic"
  WHERE "PublicExamTopic"."subjectId" = "PublicExamQuestion"."subjectId"
    AND "PublicExamTopic"."name" = "PublicExamQuestion"."topic"
  LIMIT 1
)
WHERE "topicId" IS NULL
  AND "subjectId" IS NOT NULL
  AND "topic" IS NOT NULL;

