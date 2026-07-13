-- CreateTable: CertificationSimulado
CREATE TABLE "public"."CertificationSimulado" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "certKey" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CertificationSimulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CertificationSimuladoTopicConfig
CREATE TABLE "public"."CertificationSimuladoTopicConfig" (
    "id" SERIAL NOT NULL,
    "simuladoId" INTEGER NOT NULL,
    "topicName" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    CONSTRAINT "CertificationSimuladoTopicConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CertificationSimuladoQuestion
CREATE TABLE "public"."CertificationSimuladoQuestion" (
    "id" SERIAL NOT NULL,
    "simuladoId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "CertificationSimuladoQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CertificationSimuladoAttempt
CREATE TABLE "public"."CertificationSimuladoAttempt" (
    "id" SERIAL NOT NULL,
    "simuladoId" INTEGER NOT NULL,
    "userId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "score" INTEGER,
    CONSTRAINT "CertificationSimuladoAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CertificationSimuladoAttemptAnswer
CREATE TABLE "public"."CertificationSimuladoAttemptAnswer" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "simuladoQuestionId" INTEGER NOT NULL,
    "selectedOptions" TEXT NOT NULL,
    CONSTRAINT "CertificationSimuladoAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CertificationSimulado_userId_idx" ON "public"."CertificationSimulado"("userId");
CREATE INDEX "CertificationSimuladoTopicConfig_simuladoId_idx" ON "public"."CertificationSimuladoTopicConfig"("simuladoId");
CREATE INDEX "CertificationSimuladoQuestion_simuladoId_idx" ON "public"."CertificationSimuladoQuestion"("simuladoId");
CREATE INDEX "CertificationSimuladoAttempt_simuladoId_idx" ON "public"."CertificationSimuladoAttempt"("simuladoId");
CREATE INDEX "CertificationSimuladoAttempt_userId_idx" ON "public"."CertificationSimuladoAttempt"("userId");
CREATE INDEX "CertificationSimuladoAttemptAnswer_attemptId_idx" ON "public"."CertificationSimuladoAttemptAnswer"("attemptId");

-- AddForeignKey
ALTER TABLE "public"."CertificationSimulado" ADD CONSTRAINT "CertificationSimulado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CertificationSimuladoTopicConfig" ADD CONSTRAINT "CertificationSimuladoTopicConfig_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "public"."CertificationSimulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CertificationSimuladoQuestion" ADD CONSTRAINT "CertificationSimuladoQuestion_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "public"."CertificationSimulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CertificationSimuladoQuestion" ADD CONSTRAINT "CertificationSimuladoQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."CertificationSimuladoAttempt" ADD CONSTRAINT "CertificationSimuladoAttempt_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "public"."CertificationSimulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CertificationSimuladoAttempt" ADD CONSTRAINT "CertificationSimuladoAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CertificationSimuladoAttemptAnswer" ADD CONSTRAINT "CertificationSimuladoAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."CertificationSimuladoAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CertificationSimuladoAttemptAnswer" ADD CONSTRAINT "CertificationSimuladoAttemptAnswer_simuladoQuestionId_fkey" FOREIGN KEY ("simuladoQuestionId") REFERENCES "public"."CertificationSimuladoQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
