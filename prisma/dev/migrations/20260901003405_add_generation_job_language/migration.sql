-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GenerationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refKey" TEXT NOT NULL,
    "refName" TEXT NOT NULL,
    "examBoardName" TEXT,
    "language" TEXT NOT NULL DEFAULT 'pt',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "savedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GenerationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GenerationJob" ("createdAt", "examBoardName", "id", "refKey", "refName", "savedCount", "status", "type", "updatedAt", "userId") SELECT "createdAt", "examBoardName", "id", "refKey", "refName", "savedCount", "status", "type", "updatedAt", "userId" FROM "GenerationJob";
DROP TABLE "GenerationJob";
ALTER TABLE "new_GenerationJob" RENAME TO "GenerationJob";
CREATE INDEX "GenerationJob_userId_idx" ON "GenerationJob"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
