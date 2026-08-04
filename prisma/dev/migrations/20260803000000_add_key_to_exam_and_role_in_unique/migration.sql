-- AlterTable
ALTER TABLE "Exam" ADD COLUMN "key" TEXT;

-- DropIndex
DROP INDEX "Exam_userId_type_name_year_key";

-- CreateIndex
CREATE UNIQUE INDEX "Exam_userId_type_name_role_year_key" ON "Exam"("userId", "type", "name", "role", "year");
