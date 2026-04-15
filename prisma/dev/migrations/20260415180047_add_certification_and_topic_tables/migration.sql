-- CreateTable
CREATE TABLE "Certification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CertificationTopic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "maxQuestions" INTEGER NOT NULL,
    "minQuestions" INTEGER NOT NULL,
    "questions" INTEGER,
    "certificationId" INTEGER NOT NULL,
    CONSTRAINT "CertificationTopic_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Certification_key_key" ON "Certification"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CertificationTopic_certificationId_name_key" ON "CertificationTopic"("certificationId", "name");
