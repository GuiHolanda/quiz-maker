-- DropForeignKey
ALTER TABLE "Certification" DROP CONSTRAINT "Certification_userId_fkey";

-- DropForeignKey
ALTER TABLE "CertificationTopic" DROP CONSTRAINT "CertificationTopic_certificationId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_userId_fkey";

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Explanation" DROP CONSTRAINT "Explanation_answerId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExam" DROP CONSTRAINT "PublicExam_examBoardId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExam" DROP CONSTRAINT "PublicExam_userId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExamSubject" DROP CONSTRAINT "PublicExamSubject_publicExamId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExamTopic" DROP CONSTRAINT "PublicExamTopic_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExamQuestion" DROP CONSTRAINT "PublicExamQuestion_publicExamId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExamQuestion" DROP CONSTRAINT "PublicExamQuestion_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExamQuestion" DROP CONSTRAINT "PublicExamQuestion_topicId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExamQuestion" DROP CONSTRAINT "PublicExamQuestion_userId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExamOption" DROP CONSTRAINT "PublicExamOption_questionId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExamAnswer" DROP CONSTRAINT "PublicExamAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "PublicExamExplanation" DROP CONSTRAINT "PublicExamExplanation_answerId_fkey";

-- DropForeignKey
ALTER TABLE "MockExam" DROP CONSTRAINT "MockExam_publicExamId_fkey";

-- DropForeignKey
ALTER TABLE "MockExamSubjectConfig" DROP CONSTRAINT "MockExamSubjectConfig_mockExamId_fkey";

-- DropForeignKey
ALTER TABLE "MockExamQuestion" DROP CONSTRAINT "MockExamQuestion_publicExamQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "CertificationSimulado" DROP CONSTRAINT "CertificationSimulado_userId_fkey";

-- DropForeignKey
ALTER TABLE "CertificationSimuladoTopicConfig" DROP CONSTRAINT "CertificationSimuladoTopicConfig_simuladoId_fkey";

-- DropForeignKey
ALTER TABLE "CertificationSimuladoQuestion" DROP CONSTRAINT "CertificationSimuladoQuestion_simuladoId_fkey";

-- DropForeignKey
ALTER TABLE "CertificationSimuladoQuestion" DROP CONSTRAINT "CertificationSimuladoQuestion_questionId_fkey";

-- DropForeignKey
ALTER TABLE "CertificationSimuladoAttempt" DROP CONSTRAINT "CertificationSimuladoAttempt_simuladoId_fkey";

-- DropForeignKey
ALTER TABLE "CertificationSimuladoAttempt" DROP CONSTRAINT "CertificationSimuladoAttempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "CertificationSimuladoAttemptAnswer" DROP CONSTRAINT "CertificationSimuladoAttemptAnswer_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "CertificationSimuladoAttemptAnswer" DROP CONSTRAINT "CertificationSimuladoAttemptAnswer_simuladoQuestionId_fkey";

-- Clear MockExam-related rows before adding NOT NULL columns: existing rows
-- reference PublicExam records that are dropped in this migration so there
-- is no valid examId/examQuestionId to backfill. Delete in FK-safe order.
DELETE FROM "MockExamAttemptAnswer";
DELETE FROM "MockExamAttempt";
DELETE FROM "MockExamQuestion";
DELETE FROM "MockExam";

-- AlterTable
ALTER TABLE "MockExam" DROP COLUMN "publicExamId",
ADD COLUMN     "examId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MockExamQuestion" DROP COLUMN "publicExamQuestionId",
ADD COLUMN     "examQuestionId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Certification";

-- DropTable
DROP TABLE "CertificationTopic";

-- DropTable
DROP TABLE "Question";

-- DropTable
DROP TABLE "Option";

-- DropTable
DROP TABLE "Answer";

-- DropTable
DROP TABLE "Explanation";

-- DropTable
DROP TABLE "PublicExam";

-- DropTable
DROP TABLE "PublicExamSubject";

-- DropTable
DROP TABLE "PublicExamTopic";

-- DropTable
DROP TABLE "PublicExamQuestion";

-- DropTable
DROP TABLE "PublicExamOption";

-- DropTable
DROP TABLE "PublicExamAnswer";

-- DropTable
DROP TABLE "PublicExamExplanation";

-- DropTable
DROP TABLE "MockExamSubjectConfig";

-- DropTable
DROP TABLE "CertificationSimulado";

-- DropTable
DROP TABLE "CertificationSimuladoTopicConfig";

-- DropTable
DROP TABLE "CertificationSimuladoQuestion";

-- DropTable
DROP TABLE "CertificationSimuladoAttempt";

-- DropTable
DROP TABLE "CertificationSimuladoAttemptAnswer";

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "logoUrl" TEXT,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "year" INTEGER,
    "totalQuestions" INTEGER NOT NULL,
    "examDurationMinutes" INTEGER,
    "passingScore" DOUBLE PRECISION,
    "providerId" TEXT,
    "examBoardId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minQuestions" INTEGER NOT NULL,
    "maxQuestions" INTEGER NOT NULL,
    "examId" TEXT NOT NULL,

    CONSTRAINT "ExamSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamTopic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "ExamTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" SERIAL NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamOption" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ExamOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAnswer" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "correctOptions" JSONB NOT NULL,

    CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamExplanation" (
    "id" SERIAL NOT NULL,
    "answerId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockExamSectionConfig" (
    "id" SERIAL NOT NULL,
    "mockExamId" INTEGER NOT NULL,
    "sectionName" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,

    CONSTRAINT "MockExamSectionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_userId_type_name_year_key" ON "Exam"("userId", "type", "name", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSection_examId_name_key" ON "ExamSection"("examId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ExamTopic_sectionId_name_key" ON "ExamTopic"("sectionId", "name");

-- CreateIndex
CREATE INDEX "ExamQuestion_examId_idx" ON "ExamQuestion"("examId");

-- CreateIndex
CREATE INDEX "ExamQuestion_sectionId_idx" ON "ExamQuestion"("sectionId");

-- CreateIndex
CREATE INDEX "ExamQuestion_topicId_idx" ON "ExamQuestion"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAnswer_questionId_key" ON "ExamAnswer"("questionId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_examBoardId_fkey" FOREIGN KEY ("examBoardId") REFERENCES "ExamBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSection" ADD CONSTRAINT "ExamSection_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamTopic" ADD CONSTRAINT "ExamTopic_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExamTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamOption" ADD CONSTRAINT "ExamOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamExplanation" ADD CONSTRAINT "ExamExplanation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ExamAnswer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExam" ADD CONSTRAINT "MockExam_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamSectionConfig" ADD CONSTRAINT "MockExamSectionConfig_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamQuestion" ADD CONSTRAINT "MockExamQuestion_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

