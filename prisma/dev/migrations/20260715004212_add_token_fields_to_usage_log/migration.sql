-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CertificationSimuladoAttemptAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "attemptId" INTEGER NOT NULL,
    "simuladoQuestionId" INTEGER NOT NULL,
    "selectedOptions" TEXT NOT NULL,
    CONSTRAINT "CertificationSimuladoAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CertificationSimuladoAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CertificationSimuladoAttemptAnswer_simuladoQuestionId_fkey" FOREIGN KEY ("simuladoQuestionId") REFERENCES "CertificationSimuladoQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CertificationSimuladoAttemptAnswer" ("attemptId", "id", "selectedOptions", "simuladoQuestionId") SELECT "attemptId", "id", "selectedOptions", "simuladoQuestionId" FROM "CertificationSimuladoAttemptAnswer";
DROP TABLE "CertificationSimuladoAttemptAnswer";
ALTER TABLE "new_CertificationSimuladoAttemptAnswer" RENAME TO "CertificationSimuladoAttemptAnswer";
CREATE INDEX "CertificationSimuladoAttemptAnswer_attemptId_idx" ON "CertificationSimuladoAttemptAnswer"("attemptId");
CREATE TABLE "new_UsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UsageLog" ("action", "count", "createdAt", "id", "userId") SELECT "action", "count", "createdAt", "id", "userId" FROM "UsageLog";
DROP TABLE "UsageLog";
ALTER TABLE "new_UsageLog" RENAME TO "UsageLog";
CREATE INDEX "UsageLog_userId_idx" ON "UsageLog"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
