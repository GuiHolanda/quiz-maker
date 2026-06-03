-- CreateTable
CREATE TABLE "ExamBoard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fullName" TEXT
);

-- CreateTable
CREATE TABLE "PublicExam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "year" INTEGER,
    "examBoardId" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "PublicExam_examBoardId_fkey" FOREIGN KEY ("examBoardId") REFERENCES "ExamBoard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PublicExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicExamSubject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "minQuestions" REAL NOT NULL,
    "maxQuestions" REAL NOT NULL,
    "publicExamId" TEXT NOT NULL,
    CONSTRAINT "PublicExamSubject_publicExamId_fkey" FOREIGN KEY ("publicExamId") REFERENCES "PublicExam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicExamTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "PublicExamTopic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "PublicExamSubject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicExamQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "publicExamName" TEXT NOT NULL,
    "examBoardName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "difficulty" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "PublicExamQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicExamOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "PublicExamOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PublicExamQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicExamAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionId" INTEGER NOT NULL,
    "correctOptions" JSONB NOT NULL,
    CONSTRAINT "PublicExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PublicExamQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicExamExplanation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "answerId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicExamExplanation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "PublicExamAnswer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamBoard_name_key" ON "ExamBoard"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicExam_userId_name_year_key" ON "PublicExam"("userId", "name", "year");

-- CreateIndex
CREATE UNIQUE INDEX "PublicExamSubject_publicExamId_name_key" ON "PublicExamSubject"("publicExamId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicExamTopic_subjectId_name_key" ON "PublicExamTopic"("subjectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicExamAnswer_questionId_key" ON "PublicExamAnswer"("questionId");
