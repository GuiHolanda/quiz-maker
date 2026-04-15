/*
  Warnings:

  - You are about to drop the column `questions` on the `CertificationTopic` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CertificationTopic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "maxQuestions" INTEGER NOT NULL,
    "minQuestions" INTEGER NOT NULL,
    "certificationId" INTEGER NOT NULL,
    CONSTRAINT "CertificationTopic_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CertificationTopic" ("certificationId", "id", "maxQuestions", "minQuestions", "name") SELECT "certificationId", "id", "maxQuestions", "minQuestions", "name" FROM "CertificationTopic";
DROP TABLE "CertificationTopic";
ALTER TABLE "new_CertificationTopic" RENAME TO "CertificationTopic";
CREATE UNIQUE INDEX "CertificationTopic_certificationId_name_key" ON "CertificationTopic"("certificationId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
