import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import dotenv from 'dotenv';
import {
  E2E_CERT_LABEL,
  E2E_CERT_TOPIC,
  E2E_PUBLIC_EXAM_NAME,
  E2E_EXAM_BOARD,
  E2E_SUBJECT,
  E2E_MOCK_EXAM_NAME,
} from './support/constants';
import { cleanupUserData } from './support/db-cleanup';

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

// Seeds a certification Exam with one section and 3 questions so simulado creation
// tests have real questions in the DB without needing a real LLM call.
async function seedCertificationData(userId: string) {
  const provider = await prisma.provider.upsert({
    where: { name: 'E2E' },
    update: {},
    create: { name: 'E2E', fullName: 'E2E' },
  });

  const exam = await prisma.exam.create({
    data: {
      type: 'certification',
      name: E2E_CERT_LABEL,
      totalQuestions: 65,
      userId,
      providerId: provider.id,
      sections: {
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
    await prisma.examQuestion.create({
      data: {
        text: q.text,
        correctCount: 1,
        sectionName: E2E_CERT_TOPIC,
        examName: E2E_CERT_LABEL,
        difficulty: 'medium',
        userId,
        options: { create: Object.entries(q.options).map(([label, text]) => ({ label, text })) },
        answer: { create: { correctOptions: JSON.stringify(q.correct) } },
      },
    });
  }

  return exam;
}

// Seeds a public exam Exam with one section and 3 questions.
async function seedPublicExamData(userId: string) {
  const examBoard = await prisma.examBoard.upsert({
    where: { name: E2E_EXAM_BOARD },
    update: {},
    create: { name: E2E_EXAM_BOARD, fullName: E2E_EXAM_BOARD },
  });

  const exam = await prisma.exam.create({
    data: {
      type: 'public_exam',
      name: E2E_PUBLIC_EXAM_NAME,
      role: 'E2E Role',
      totalQuestions: 60,
      userId,
      examBoardId: examBoard.id,
      sections: {
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
    await prisma.examQuestion.create({
      data: {
        text: q.text,
        correctCount: 1,
        sectionName: E2E_SUBJECT,
        examName: E2E_PUBLIC_EXAM_NAME,
        difficulty: 'medium',
        userId,
        options: { create: Object.entries(q.options).map(([label, text]) => ({ label, text })) },
        answer: { create: { correctOptions: JSON.stringify(q.correct) } },
      },
    });
  }

  return exam;
}

// Seeds a completed MockExamAttempt so the dashboard has data to display.
// Creates a MockExam linked to the cert exam, 3 MockExamQuestions, one finished
// attempt with answers (2/3 correct → score = 67), and one section config.
async function seedCompletedMockExamAttempt(userId: string, certExamId: string) {
  const examQuestions = await prisma.examQuestion.findMany({
    where: { userId, examName: E2E_CERT_LABEL },
    include: { answer: true },
    take: 3,
  });

  const mockExam = await prisma.mockExam.create({
    data: {
      name: E2E_MOCK_EXAM_NAME,
      examId: certExamId,
      userId,
      sections: {
        create: [{ sectionName: E2E_CERT_TOPIC, questionCount: examQuestions.length }],
      },
      questions: {
        create: examQuestions.map((q, i) => ({
          examQuestionId: q.id,
          order: i,
        })),
      },
    },
    include: { questions: true },
  });

  const startedAt = new Date('2024-06-01T10:00:00Z');
  const finishedAt = new Date('2024-06-01T10:30:00Z');

  await prisma.mockExamAttempt.create({
    data: {
      mockExamId: mockExam.id,
      userId,
      startedAt,
      finishedAt,
      score: 67,
      answers: {
        create: mockExam.questions.map((mq, i) => ({
          mockExamQuestionId: mq.id,
          // Answer the first 2 correctly (matching their correctOptions), last one wrong
          selectedOptions:
            i < 2
              ? (examQuestions[i].answer?.correctOptions as string) ?? JSON.stringify(['A'])
              : JSON.stringify(['D']),
        })),
      },
    },
  });
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
  await cleanupUserData(prisma, user.id);

  // Seed cert + questions and exam + questions so simulado creation works without real LLM calls.
  const certExam = await seedCertificationData(user.id);
  await seedPublicExamData(user.id);
  // Seed a completed attempt so the dashboard has real stats to display.
  await seedCompletedMockExamAttempt(user.id, certExam.id);

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
