-- DropIndex
DROP INDEX "Certification_key_key";

-- CreateIndex
CREATE UNIQUE INDEX "Certification_userId_key_key" ON "Certification"("userId", "key");
