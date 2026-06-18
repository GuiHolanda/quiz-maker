-- CreateTable
CREATE TABLE "CertificationSimulado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "certKey" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CertificationSimulado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CertificationSimuladoTopicConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "simuladoId" INTEGER NOT NULL,
    "topicName" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    CONSTRAINT "CertificationSimuladoTopicConfig_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "CertificationSimulado" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CertificationSimuladoQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "simuladoId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "CertificationSimuladoQuestion_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "CertificationSimulado" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CertificationSimuladoQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CertificationSimuladoAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "simuladoId" INTEGER NOT NULL,
    "userId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "score" INTEGER,
    CONSTRAINT "CertificationSimuladoAttempt_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "CertificationSimulado" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CertificationSimuladoAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CertificationSimuladoAttemptAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "attemptId" INTEGER NOT NULL,
    "simuladoQuestionId" INTEGER NOT NULL,
    "selectedOptions" TEXT NOT NULL,
    CONSTRAINT "CertificationSimuladoAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CertificationSimuladoAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CertificationSimuladoAttemptAnswer_simuladoQuestionId_fkey" FOREIGN KEY ("simuladoQuestionId") REFERENCES "CertificationSimuladoQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
