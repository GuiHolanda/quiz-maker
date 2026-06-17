-- CreateTable: Certification
CREATE TABLE "public"."Certification" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT,
    "provider" TEXT,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CertificationTopic
CREATE TABLE "public"."CertificationTopic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxQuestions" DOUBLE PRECISION NOT NULL,
    "minQuestions" DOUBLE PRECISION NOT NULL,
    "certificationId" TEXT NOT NULL,

    CONSTRAINT "CertificationTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable: User
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "questionsGeneratedThisPeriod" INTEGER NOT NULL DEFAULT 0,
    "periodStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lemonSqueezyCustomerId" TEXT,
    "lemonSqueezySubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Account
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Session
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VerificationToken
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable: UsageLog
CREATE TABLE "public"."UsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- AddColumn: Question.userId
ALTER TABLE "public"."Question" ADD COLUMN "userId" TEXT;

-- CreateTable: ExamBoard
CREATE TABLE "public"."ExamBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT,

    CONSTRAINT "ExamBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PublicExam
CREATE TABLE "public"."PublicExam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "year" INTEGER,
    "examBoardId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "PublicExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PublicExamSubject
CREATE TABLE "public"."PublicExamSubject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minQuestions" DOUBLE PRECISION NOT NULL,
    "maxQuestions" DOUBLE PRECISION NOT NULL,
    "publicExamId" TEXT NOT NULL,

    CONSTRAINT "PublicExamSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PublicExamTopic
CREATE TABLE "public"."PublicExamTopic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "PublicExamTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PublicExamQuestion
CREATE TABLE "public"."PublicExamQuestion" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "publicExamName" TEXT NOT NULL,
    "examBoardName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "difficulty" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "PublicExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PublicExamOption
CREATE TABLE "public"."PublicExamOption" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "PublicExamOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PublicExamAnswer
CREATE TABLE "public"."PublicExamAnswer" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "correctOptions" JSONB NOT NULL,

    CONSTRAINT "PublicExamAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PublicExamExplanation
CREATE TABLE "public"."PublicExamExplanation" (
    "id" SERIAL NOT NULL,
    "answerId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicExamExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MockExam
CREATE TABLE "public"."MockExam" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "publicExamId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MockExamSubjectConfig
CREATE TABLE "public"."MockExamSubjectConfig" (
    "id" SERIAL NOT NULL,
    "mockExamId" INTEGER NOT NULL,
    "subjectName" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,

    CONSTRAINT "MockExamSubjectConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MockExamQuestion
CREATE TABLE "public"."MockExamQuestion" (
    "id" SERIAL NOT NULL,
    "mockExamId" INTEGER NOT NULL,
    "publicExamQuestionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MockExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MockExamAttempt
CREATE TABLE "public"."MockExamAttempt" (
    "id" SERIAL NOT NULL,
    "mockExamId" INTEGER NOT NULL,
    "userId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "score" INTEGER,

    CONSTRAINT "MockExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MockExamAttemptAnswer
CREATE TABLE "public"."MockExamAttemptAnswer" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "mockExamQuestionId" INTEGER NOT NULL,
    "selectedOptions" TEXT NOT NULL,

    CONSTRAINT "MockExamAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certification_key_key" ON "public"."Certification"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CertificationTopic_certificationId_name_key" ON "public"."CertificationTopic"("certificationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "UsageLog_userId_idx" ON "public"."UsageLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBoard_name_key" ON "public"."ExamBoard"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicExam_userId_name_year_key" ON "public"."PublicExam"("userId", "name", "year");

-- CreateIndex
CREATE UNIQUE INDEX "PublicExamSubject_publicExamId_name_key" ON "public"."PublicExamSubject"("publicExamId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicExamTopic_subjectId_name_key" ON "public"."PublicExamTopic"("subjectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicExamAnswer_questionId_key" ON "public"."PublicExamAnswer"("questionId");

-- AddForeignKey
ALTER TABLE "public"."Certification" ADD CONSTRAINT "Certification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificationTopic" ADD CONSTRAINT "CertificationTopic_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "public"."Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageLog" ADD CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicExam" ADD CONSTRAINT "PublicExam_examBoardId_fkey" FOREIGN KEY ("examBoardId") REFERENCES "public"."ExamBoard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicExam" ADD CONSTRAINT "PublicExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicExamSubject" ADD CONSTRAINT "PublicExamSubject_publicExamId_fkey" FOREIGN KEY ("publicExamId") REFERENCES "public"."PublicExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicExamTopic" ADD CONSTRAINT "PublicExamTopic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."PublicExamSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicExamOption" ADD CONSTRAINT "PublicExamOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."PublicExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicExamAnswer" ADD CONSTRAINT "PublicExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."PublicExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicExamExplanation" ADD CONSTRAINT "PublicExamExplanation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "public"."PublicExamAnswer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicExamQuestion" ADD CONSTRAINT "PublicExamQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MockExam" ADD CONSTRAINT "MockExam_publicExamId_fkey" FOREIGN KEY ("publicExamId") REFERENCES "public"."PublicExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MockExam" ADD CONSTRAINT "MockExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MockExamSubjectConfig" ADD CONSTRAINT "MockExamSubjectConfig_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "public"."MockExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MockExamQuestion" ADD CONSTRAINT "MockExamQuestion_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "public"."MockExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MockExamQuestion" ADD CONSTRAINT "MockExamQuestion_publicExamQuestionId_fkey" FOREIGN KEY ("publicExamQuestionId") REFERENCES "public"."PublicExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MockExamAttempt" ADD CONSTRAINT "MockExamAttempt_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "public"."MockExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MockExamAttempt" ADD CONSTRAINT "MockExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MockExamAttemptAnswer" ADD CONSTRAINT "MockExamAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."MockExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MockExamAttemptAnswer" ADD CONSTRAINT "MockExamAttemptAnswer_mockExamQuestionId_fkey" FOREIGN KEY ("mockExamQuestionId") REFERENCES "public"."MockExamQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
