import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.test first (E2E credentials), then fall back to project .env for DATABASE_URL
dotenv.config({ path: path.join(__dirname, '../../.env.test') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' } },
});

export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL!;
export const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD!;

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
