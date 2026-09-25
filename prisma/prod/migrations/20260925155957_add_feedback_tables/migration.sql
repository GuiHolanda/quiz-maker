-- Migration: add_feedback_tables
-- Reporte de questao (QuestionReport) e feedback geral (Feedback). Sem foreign keys de
-- proposito: ExamQuestion nao e alterado e os registros guardam snapshot do contexto
-- (ADR-0001). Campos de triagem (status, resolutionNote, resolvedAt, notifiedAt) ja incluidos
-- para a tela de inbox do admin nao exigir nova migration.
--
-- Idempotente: IF NOT EXISTS em tabelas e indices.

-- CreateTable
CREATE TABLE IF NOT EXISTS "QuestionReport" (
    "id" TEXT NOT NULL,
    "examQuestionId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "questionText" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "sectionName" TEXT,
    "topicName" TEXT,
    "surface" TEXT NOT NULL,
    "mockExamAttemptId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "plan" TEXT,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "route" TEXT,
    "userAgent" TEXT,
    "locale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuestionReport_status_createdAt_idx" ON "QuestionReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QuestionReport_examQuestionId_idx" ON "QuestionReport"("examQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "QuestionReport_userId_examQuestionId_key" ON "QuestionReport"("userId", "examQuestionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Feedback_userId_idx" ON "Feedback"("userId");
