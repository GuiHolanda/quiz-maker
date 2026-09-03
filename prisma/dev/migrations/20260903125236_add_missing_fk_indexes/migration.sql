-- CreateIndex
CREATE INDEX "ExamExplanation_answerId_idx" ON "ExamExplanation"("answerId");

-- CreateIndex
CREATE INDEX "ExamOption_questionId_idx" ON "ExamOption"("questionId");

-- CreateIndex
CREATE INDEX "ExamQuestion_userId_idx" ON "ExamQuestion"("userId");

-- CreateIndex
CREATE INDEX "ExamQuestion_poolId_idx" ON "ExamQuestion"("poolId");

-- CreateIndex
CREATE INDEX "ExamQuestion_userId_examName_sectionName_idx" ON "ExamQuestion"("userId", "examName", "sectionName");

-- CreateIndex
CREATE INDEX "MockExam_userId_idx" ON "MockExam"("userId");

-- CreateIndex
CREATE INDEX "MockExam_examId_idx" ON "MockExam"("examId");

-- CreateIndex
CREATE INDEX "MockExamAttempt_userId_finishedAt_idx" ON "MockExamAttempt"("userId", "finishedAt");

-- CreateIndex
CREATE INDEX "MockExamAttempt_mockExamId_idx" ON "MockExamAttempt"("mockExamId");

-- CreateIndex
CREATE INDEX "MockExamAttemptAnswer_attemptId_idx" ON "MockExamAttemptAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "MockExamAttemptAnswer_mockExamQuestionId_idx" ON "MockExamAttemptAnswer"("mockExamQuestionId");

-- CreateIndex
CREATE INDEX "MockExamQuestion_mockExamId_idx" ON "MockExamQuestion"("mockExamId");

-- CreateIndex
CREATE INDEX "MockExamQuestion_examQuestionId_idx" ON "MockExamQuestion"("examQuestionId");

-- CreateIndex
CREATE INDEX "MockExamSectionConfig_mockExamId_idx" ON "MockExamSectionConfig"("mockExamId");

-- CreateIndex
CREATE INDEX "UsageLog_userId_createdAt_idx" ON "UsageLog"("userId", "createdAt");
