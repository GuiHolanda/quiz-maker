-- Migration: add_mock_exam_time_source_correctness
-- Simulados redesign: limite de tempo por simulado (durationMinutes, null = livre),
-- fonte de questoes (questionSource: library | unseen | wrong), flag de envio
-- fora do prazo (MockExamAttempt.timedOut) e correcao persistida por resposta
-- (MockExamAttemptAnswer.isCorrect), que alimenta a fonte "so as que errei".
--
-- Idempotente: IF NOT EXISTS em cada coluna nova.

ALTER TABLE "MockExam" ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER;
ALTER TABLE "MockExam" ADD COLUMN IF NOT EXISTS "questionSource" TEXT NOT NULL DEFAULT 'library';
ALTER TABLE "MockExamAttempt" ADD COLUMN IF NOT EXISTS "timedOut" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MockExamAttemptAnswer" ADD COLUMN IF NOT EXISTS "isCorrect" BOOLEAN NOT NULL DEFAULT false;
