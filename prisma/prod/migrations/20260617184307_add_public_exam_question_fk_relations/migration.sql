-- AlterTable
ALTER TABLE "PublicExamQuestion" ADD COLUMN "publicExamId" TEXT;
ALTER TABLE "PublicExamQuestion" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "PublicExamQuestion" ADD COLUMN "topicId" TEXT;

-- CreateIndex
CREATE INDEX "PublicExamQuestion_publicExamId_idx" ON "PublicExamQuestion"("publicExamId");
CREATE INDEX "PublicExamQuestion_subjectId_idx" ON "PublicExamQuestion"("subjectId");
CREATE INDEX "PublicExamQuestion_topicId_idx" ON "PublicExamQuestion"("topicId");

-- Backfill publicExamId from (publicExamName, userId) -> PublicExam.id.
-- Drift-tolerant: matches on NFC + lowercase + collapsed whitespace.
UPDATE "PublicExamQuestion" q
SET "publicExamId" = e."id"
FROM "PublicExam" e
WHERE q."userId" IS NOT NULL
  AND e."userId" = q."userId"
  AND lower(regexp_replace(trim(both from normalize(e."name", NFC)), '\s+', ' ', 'g'))
    = lower(regexp_replace(trim(both from normalize(q."publicExamName", NFC)), '\s+', ' ', 'g'))
  AND q."publicExamId" IS NULL;

-- Backfill subjectId from (publicExamId, subject) -> PublicExamSubject.id (drift-tolerant).
UPDATE "PublicExamQuestion" q
SET "subjectId" = s."id"
FROM "PublicExamSubject" s
WHERE q."publicExamId" IS NOT NULL
  AND s."publicExamId" = q."publicExamId"
  AND lower(regexp_replace(trim(both from normalize(s."name", NFC)), '\s+', ' ', 'g'))
    = lower(regexp_replace(trim(both from normalize(q."subject", NFC)), '\s+', ' ', 'g'))
  AND q."subjectId" IS NULL;

-- Backfill topicId from (subjectId, topic) -> PublicExamTopic.id (drift-tolerant).
UPDATE "PublicExamQuestion" q
SET "topicId" = t."id"
FROM "PublicExamTopic" t
WHERE q."subjectId" IS NOT NULL
  AND q."topic" IS NOT NULL
  AND t."subjectId" = q."subjectId"
  AND lower(regexp_replace(trim(both from normalize(t."name", NFC)), '\s+', ' ', 'g'))
    = lower(regexp_replace(trim(both from normalize(q."topic", NFC)), '\s+', ' ', 'g'))
  AND q."topicId" IS NULL;

-- After backfill, also rewrite the denormalized snapshot columns to match
-- the canonical PublicExamSubject/Topic/Exam name. This eliminates the
-- pre-existing drift that caused the production "0 disponíveis" bug
-- without needing a separate backfill script run.
UPDATE "PublicExamQuestion" q
SET "subject" = s."name"
FROM "PublicExamSubject" s
WHERE q."subjectId" IS NOT NULL
  AND s."id" = q."subjectId"
  AND q."subject" <> s."name";

UPDATE "PublicExamQuestion" q
SET "topic" = t."name"
FROM "PublicExamTopic" t
WHERE q."topicId" IS NOT NULL
  AND t."id" = q."topicId"
  AND q."topic" IS DISTINCT FROM t."name";

UPDATE "PublicExamQuestion" q
SET "publicExamName" = e."name"
FROM "PublicExam" e
WHERE q."publicExamId" IS NOT NULL
  AND e."id" = q."publicExamId"
  AND q."publicExamName" <> e."name";

-- AddForeignKey
ALTER TABLE "PublicExamQuestion"
  ADD CONSTRAINT "PublicExamQuestion_publicExamId_fkey"
  FOREIGN KEY ("publicExamId") REFERENCES "PublicExam"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PublicExamQuestion"
  ADD CONSTRAINT "PublicExamQuestion_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "PublicExamSubject"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PublicExamQuestion"
  ADD CONSTRAINT "PublicExamQuestion_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "PublicExamTopic"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
