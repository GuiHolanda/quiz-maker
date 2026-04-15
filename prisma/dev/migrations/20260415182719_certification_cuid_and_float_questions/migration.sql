/*
  Warnings:

  - The primary key for the `Certification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `CertificationTopic` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `maxQuestions` on the `CertificationTopic` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `minQuestions` on the `CertificationTopic` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL
);
INSERT INTO "new_Certification" ("id", "key", "label") SELECT "id", "key", "label" FROM "Certification";
DROP TABLE "Certification";
ALTER TABLE "new_Certification" RENAME TO "Certification";
CREATE UNIQUE INDEX "Certification_key_key" ON "Certification"("key");
CREATE TABLE "new_CertificationTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "maxQuestions" REAL NOT NULL,
    "minQuestions" REAL NOT NULL,
    "certificationId" TEXT NOT NULL,
    CONSTRAINT "CertificationTopic_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CertificationTopic" ("certificationId", "id", "maxQuestions", "minQuestions", "name") SELECT "certificationId", "id", "maxQuestions", "minQuestions", "name" FROM "CertificationTopic";
DROP TABLE "CertificationTopic";
ALTER TABLE "new_CertificationTopic" RENAME TO "CertificationTopic";
CREATE UNIQUE INDEX "CertificationTopic_certificationId_name_key" ON "CertificationTopic"("certificationId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
