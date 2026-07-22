-- AlterTable
ALTER TABLE "Certification" ADD COLUMN "totalQuestions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "examDurationMinutes" INTEGER,
ADD COLUMN "passingScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PublicExam" ADD COLUMN "totalQuestions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "examDurationMinutes" INTEGER,
ADD COLUMN "passingScore" DOUBLE PRECISION;
