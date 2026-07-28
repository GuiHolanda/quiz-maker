import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.test first (E2E credentials), then fall back to project .env for DATABASE_URL
// Use process.cwd() — always the project root regardless of how TypeScript resolves __dirname
dotenv.config({ path: path.join(process.cwd(), '.env.test') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' } },
});

export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL!;
export const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD!;

// These constants mirror mock-data.ts — kept in sync manually.
const E2E_CERT_KEY = 'AWS-SAA-C03-E2E';
const E2E_CERT_LABEL = 'AWS Solutions Architect E2E';
const E2E_CERT_TOPIC = 'E2E Topic';
const E2E_PUBLIC_EXAM_NAME = 'Concurso E2E 2026';
const E2E_EXAM_BOARD = 'BANCA_E2E';
const E2E_SUBJECT = 'Direito E2E';

async function cleanupUserData(userId: string) {
  // Delete in dependency order — same as globalTeardown
  await prisma.certificationSimuladoAttemptAnswer.deleteMany({ where: { attempt: { userId } } });
  await prisma.certificationSimuladoAttempt.deleteMany({ where: { userId } });
  await prisma.certificationSimuladoQuestion.deleteMany({ where: { simulado: { userId } } });
  await prisma.certificationSimuladoTopicConfig.deleteMany({ where: { simulado: { userId } } });
  await prisma.certificationSimulado.deleteMany({ where: { userId } });

  await prisma.mockExamAttemptAnswer.deleteMany({ where: { attempt: { userId } } });
  await prisma.mockExamAttempt.deleteMany({ where: { userId } });
  await prisma.mockExamQuestion.deleteMany({ where: { mockExam: { userId } } });
  await prisma.mockExamSubjectConfig.deleteMany({ where: { mockExam: { userId } } });
  await prisma.mockExam.deleteMany({ where: { userId } });

  await prisma.explanation.deleteMany({ where: { answer: { question: { userId } } } });
  await prisma.answer.deleteMany({ where: { question: { userId } } });
  await prisma.option.deleteMany({ where: { question: { userId } } });
  await prisma.question.deleteMany({ where: { userId } });

  await prisma.certificationTopic.deleteMany({ where: { certification: { userId } } });
  await prisma.certification.deleteMany({ where: { userId } });

  await prisma.publicExamExplanation.deleteMany({ where: { answer: { question: { userId } } } });
  await prisma.publicExamAnswer.deleteMany({ where: { question: { userId } } });
  await prisma.publicExamOption.deleteMany({ where: { question: { userId } } });
  await prisma.publicExamQuestion.deleteMany({ where: { userId } });
  await prisma.publicExamTopic.deleteMany({ where: { subject: { publicExam: { userId } } } });
  await prisma.publicExamSubject.deleteMany({ where: { publicExam: { userId } } });
  await prisma.publicExam.deleteMany({ where: { userId } });

  await prisma.generationJobTopic.deleteMany({ where: { job: { userId } } });
  await prisma.generationJob.deleteMany({ where: { userId } });
}

// Seeds a certification with one topic and 3 questions so simulado creation tests
// have real questions in the DB without needing a real LLM call.
async function seedCertificationData(userId: string) {
  const cert = await prisma.certification.create({
    data: {
      label: E2E_CERT_LABEL,
      key: E2E_CERT_KEY,
      provider: 'E2E',
      totalQuestions: 65,
      userId,
      topics: {
        create: [{ name: E2E_CERT_TOPIC, minQuestions: 0, maxQuestions: 100 }],
      },
    },
  });

  const questions = [
    { text: 'E2E Question 1: Which service provides object storage?', options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'Lambda' }, correct: ['A'] },
    { text: 'E2E Question 2: Which service provides compute?', options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'CloudFront' }, correct: ['B'] },
    { text: 'E2E Question 3: Which service is a managed relational database?', options: { A: 'DynamoDB', B: 'Redshift', C: 'RDS', D: 'ElastiCache' }, correct: ['C'] },
  ];

  for (const q of questions) {
    await prisma.question.create({
      data: {
        text: q.text,
        correctCount: 1,
        topic: E2E_CERT_TOPIC,
        certificationTitle: E2E_CERT_LABEL,
        difficulty: 'medium',
        userId,
        options: { create: Object.entries(q.options).map(([label, text]) => ({ label, text })) },
        answer: { create: { correctOptions: JSON.stringify(q.correct) } },
      },
    });
  }

  return cert;
}

// Seeds a public exam with one subject and 3 questions.
async function seedPublicExamData(userId: string) {
  const examBoard = await prisma.examBoard.upsert({
    where: { name: E2E_EXAM_BOARD },
    update: {},
    create: { name: E2E_EXAM_BOARD, fullName: E2E_EXAM_BOARD },
  });

  const exam = await prisma.publicExam.create({
    data: {
      name: E2E_PUBLIC_EXAM_NAME,
      role: 'E2E Role',
      totalQuestions: 60,
      userId,
      examBoardId: examBoard.id,
      subjects: {
        create: [{ name: E2E_SUBJECT, minQuestions: 100, maxQuestions: 100 }],
      },
    },
  });

  const questions = [
    { text: 'E2E Concurso Question 1: O que é o princípio da legalidade?', options: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D' }, correct: ['A'] },
    { text: 'E2E Concurso Question 2: O que é isonomia?', options: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D' }, correct: ['B'] },
    { text: 'E2E Concurso Question 3: Qual é a finalidade da CF/88?', options: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D' }, correct: ['C'] },
  ];

  for (const q of questions) {
    await prisma.publicExamQuestion.create({
      data: {
        text: q.text,
        correctCount: 1,
        subject: E2E_SUBJECT,
        publicExamName: E2E_PUBLIC_EXAM_NAME,
        examBoardName: E2E_EXAM_BOARD,
        difficulty: 'medium',
        userId,
        options: { create: Object.entries(q.options).map(([label, text]) => ({ label, text })) },
        answer: { create: { correctOptions: JSON.stringify(q.correct) } },
      },
    });
  }

  return exam;
}

async function globalSetup(config: FullConfig) {
  if (!E2E_USER_EMAIL || !E2E_USER_PASSWORD) {
    throw new Error('E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.test');
  }

  const hashedPassword = await bcrypt.hash(E2E_USER_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: E2E_USER_EMAIL },
    update: {
      password: hashedPassword,
      plan: 'tester',
      emailVerified: new Date(),
    },
    create: {
      email: E2E_USER_EMAIL,
      name: 'E2E Test User',
      password: hashedPassword,
      plan: 'tester',
      emailVerified: new Date(),
    },
  });

  // Clean up any data left from a previous run (e.g. if teardown failed)
  await cleanupUserData(user.id);

  // Seed cert + questions and exam + questions so simulado creation works without real LLM calls.
  await seedCertificationData(user.id);
  await seedPublicExamData(user.id);

  await prisma.$disconnect();

  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.locator('input[type="email"]').fill(E2E_USER_EMAIL);
  await page.locator('input[type="password"]').fill(E2E_USER_PASSWORD);
  await page.getByRole('button', { name: /sign in|login|entrar/i }).click();
  await page.waitForURL(`${baseURL}/dashboard`, { timeout: 15_000 });

  const storageStatePath = path.join(__dirname, 'auth/storageState.json');
  await page.context().storageState({ path: storageStatePath });
  await browser.close();
}

export default globalSetup;
