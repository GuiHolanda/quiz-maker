-- CreateIndex
CREATE INDEX "CertificationSimulado_userId_idx" ON "CertificationSimulado"("userId");

-- CreateIndex
CREATE INDEX "CertificationSimuladoAttempt_simuladoId_idx" ON "CertificationSimuladoAttempt"("simuladoId");

-- CreateIndex
CREATE INDEX "CertificationSimuladoAttempt_userId_idx" ON "CertificationSimuladoAttempt"("userId");

-- CreateIndex
CREATE INDEX "CertificationSimuladoAttemptAnswer_attemptId_idx" ON "CertificationSimuladoAttemptAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "CertificationSimuladoQuestion_simuladoId_idx" ON "CertificationSimuladoQuestion"("simuladoId");

-- CreateIndex
CREATE INDEX "CertificationSimuladoTopicConfig_simuladoId_idx" ON "CertificationSimuladoTopicConfig"("simuladoId");
