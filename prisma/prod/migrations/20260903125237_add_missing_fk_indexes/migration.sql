-- Migration: add_missing_fk_indexes
-- Postgres nao cria indice em foreign key automaticamente. As migrations anteriores
-- indexaram apenas ExamQuestion.examId/sectionId/topicId; toda a familia MockExam*,
-- ExamOption.questionId, ExamExplanation.answerId e ExamQuestion.userId ficaram sem.
-- Os modelos antigos (CertificationSimuladoAttempt, CertificationSimuladoQuestion...)
-- tinham esses indices e eles se perderam no rename para MockExam*.
--
-- O caso mais caro: /api/billing/usage roda examQuestion.count({ where: { userId } }),
-- um seq scan na maior tabela, em todo carregamento de pagina do workspace (UsageProvider
-- esta no layout).
--
-- Idempotente: IF NOT EXISTS em todos os indices. Em uma tabela grande, CREATE INDEX pega
-- lock de escrita — nesse caso, crie antes manualmente com CREATE INDEX CONCURRENTLY
-- (mesmo nome), e esta migration vira no-op. CONCURRENTLY nao pode rodar aqui porque o
-- migrate deploy envolve o arquivo em transacao.

CREATE INDEX IF NOT EXISTS "ExamQuestion_userId_idx" ON "ExamQuestion"("userId");
CREATE INDEX IF NOT EXISTS "ExamQuestion_poolId_idx" ON "ExamQuestion"("poolId");
CREATE INDEX IF NOT EXISTS "ExamQuestion_userId_examName_sectionName_idx" ON "ExamQuestion"("userId", "examName", "sectionName");

CREATE INDEX IF NOT EXISTS "ExamOption_questionId_idx" ON "ExamOption"("questionId");
CREATE INDEX IF NOT EXISTS "ExamExplanation_answerId_idx" ON "ExamExplanation"("answerId");

CREATE INDEX IF NOT EXISTS "UsageLog_userId_createdAt_idx" ON "UsageLog"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "MockExam_userId_idx" ON "MockExam"("userId");
CREATE INDEX IF NOT EXISTS "MockExam_examId_idx" ON "MockExam"("examId");
CREATE INDEX IF NOT EXISTS "MockExamSectionConfig_mockExamId_idx" ON "MockExamSectionConfig"("mockExamId");
CREATE INDEX IF NOT EXISTS "MockExamQuestion_mockExamId_idx" ON "MockExamQuestion"("mockExamId");
CREATE INDEX IF NOT EXISTS "MockExamQuestion_examQuestionId_idx" ON "MockExamQuestion"("examQuestionId");
CREATE INDEX IF NOT EXISTS "MockExamAttempt_userId_finishedAt_idx" ON "MockExamAttempt"("userId", "finishedAt");
CREATE INDEX IF NOT EXISTS "MockExamAttempt_mockExamId_idx" ON "MockExamAttempt"("mockExamId");
CREATE INDEX IF NOT EXISTS "MockExamAttemptAnswer_attemptId_idx" ON "MockExamAttemptAnswer"("attemptId");
CREATE INDEX IF NOT EXISTS "MockExamAttemptAnswer_mockExamQuestionId_idx" ON "MockExamAttemptAnswer"("mockExamQuestionId");
