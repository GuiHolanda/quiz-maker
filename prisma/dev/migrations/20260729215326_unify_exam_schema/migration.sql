-- DropIndex
DROP INDEX "Answer_questionId_key";

-- DropIndex
DROP INDEX "Certification_userId_key_key";

-- DropIndex
DROP INDEX "CertificationSimulado_userId_idx";

-- DropIndex
DROP INDEX "CertificationSimuladoAttempt_userId_idx";

-- DropIndex
DROP INDEX "CertificationSimuladoAttempt_simuladoId_idx";

-- DropIndex
DROP INDEX "CertificationSimuladoAttemptAnswer_attemptId_idx";

-- DropIndex
DROP INDEX "CertificationSimuladoQuestion_simuladoId_idx";

-- DropIndex
DROP INDEX "CertificationSimuladoTopicConfig_simuladoId_idx";

-- DropIndex
DROP INDEX "CertificationTopic_certificationId_name_key";

-- DropIndex
DROP INDEX "PublicExam_userId_name_year_key";

-- DropIndex
DROP INDEX "PublicExamAnswer_questionId_key";

-- DropIndex
DROP INDEX "PublicExamQuestion_topicId_idx";

-- DropIndex
DROP INDEX "PublicExamQuestion_subjectId_idx";

-- DropIndex
DROP INDEX "PublicExamQuestion_publicExamId_idx";

-- DropIndex
DROP INDEX "PublicExamSubject_publicExamId_name_key";

-- DropIndex
DROP INDEX "PublicExamTopic_subjectId_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Answer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Certification";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CertificationSimulado";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CertificationSimuladoAttempt";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CertificationSimuladoAttemptAnswer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CertificationSimuladoQuestion";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CertificationSimuladoTopicConfig";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CertificationTopic";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Explanation";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MockExamSubjectConfig";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Option";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PublicExam";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PublicExamAnswer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PublicExamExplanation";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PublicExamOption";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PublicExamQuestion";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PublicExamSubject";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PublicExamTopic";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Question";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "logoUrl" TEXT
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "year" INTEGER,
    "totalQuestions" INTEGER NOT NULL,
    "examDurationMinutes" INTEGER,
    "passingScore" REAL,
    "providerId" TEXT,
    "examBoardId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Exam_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exam_examBoardId_fkey" FOREIGN KEY ("examBoardId") REFERENCES "ExamBoard" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "minQuestions" INTEGER NOT NULL,
    "maxQuestions" INTEGER NOT NULL,
    "examId" TEXT NOT NULL,
    CONSTRAINT "ExamSection_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    CONSTRAINT "ExamTopic_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExamQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExamQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ExamTopic" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExamQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "ExamOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionId" INTEGER NOT NULL,
    "correctOptions" JSONB NOT NULL,
    CONSTRAINT "ExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamExplanation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "answerId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamExplanation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ExamAnswer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MockExamSectionConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mockExamId" INTEGER NOT NULL,
    "sectionName" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    CONSTRAINT "MockExamSectionConfig_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MockExam" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "examId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MockExam_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MockExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MockExam" ("createdAt", "id", "name", "userId") SELECT "createdAt", "id", "name", "userId" FROM "MockExam";
DROP TABLE "MockExam";
ALTER TABLE "new_MockExam" RENAME TO "MockExam";
CREATE TABLE "new_MockExamQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mockExamId" INTEGER NOT NULL,
    "examQuestionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "MockExamQuestion_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MockExamQuestion_examQuestionId_fkey" FOREIGN KEY ("examQuestionId") REFERENCES "ExamQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MockExamQuestion" ("id", "mockExamId", "order") SELECT "id", "mockExamId", "order" FROM "MockExamQuestion";
DROP TABLE "MockExamQuestion";
ALTER TABLE "new_MockExamQuestion" RENAME TO "MockExamQuestion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

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

