-- Migration: add_question_format
-- Adds the question format (option label set + semantics) to Exam and ExamQuestion.
--
-- Exam.questionFormat  — what to generate for this exam.
-- ExamQuestion.format  — what this question actually is. Denormalized on purpose:
--                        ExamQuestion.examId is ON DELETE SET NULL, so a question
--                        outlives its exam and must still render and score correctly.
--                        Pooled questions are also shared across users and exams.
--
-- Backfill: every row that exists today was generated with the hardcoded A–E prompt,
-- so the 'mc_5' default is exactly right for the legacy data — no data migration needed.
--
-- Idempotent: IF NOT EXISTS on both columns.

ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "questionFormat" TEXT NOT NULL DEFAULT 'mc_5';

ALTER TABLE "ExamQuestion" ADD COLUMN IF NOT EXISTS "format" TEXT NOT NULL DEFAULT 'mc_5';
